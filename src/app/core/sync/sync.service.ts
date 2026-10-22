import { DOCUMENT, DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { toast } from '@spartan-ng/brain/sonner';
import { BACKUP_FORMAT_VERSION, createBackup, openBackup, readBackup } from '../backup/backup-format';
import { PROFILE_RECORD, type ProfileValue, backupProfile } from '../backup/backup.service';
import { toBase64Url, utf8Encode } from '../crypto/bytes';
import type { DriveApi, DriveFile } from '../drive/drive-api';
import { DriveService, isSyncFile } from '../drive/drive.service';
import { DriveError } from '../drive/google-auth';
import { PreferencesService } from '../preferences.service';
import { EncryptedStore } from '../storage/encrypted-store.service';
import { VaultService } from '../vault/vault.service';
import { type SyncEntry, mergeEntries, versionOf } from './merge';
import { LOCAL_ONLY_TYPES, SYNC_STATE_TYPE, isTombstone } from './sync-records';

/** Waits this long after a local change before syncing, so typing does not upload every second. */
const CHANGE_DEBOUNCE_MS = 30_000;
const PERIODIC_MS = 5 * 60_000;
/** Returning to the tab syncs again when the last sync is older than this. */
const FOCUS_MIN_GAP_MS = 60_000;
/** Tombstones older than this are dropped; devices offline for longer may bring records back. */
const TOMBSTONE_TTL_MS = 90 * 24 * 3600_000;
const DEVICE_ID_KEY = 'locry.device-id';

export type SyncStatus = 'off' | 'idle' | 'syncing' | 'needsAuth' | 'error';

/** Another device (or this one) that keeps a snapshot of this vault in Drive. */
export interface SyncDevice {
  deviceId: string;
  name: string;
  modifiedTime: string;
  self: boolean;
}

export interface SyncSummary {
  /** Records taken from other devices. */
  received: number;
  /** Conflict copies created. */
  conflicts: number;
  uploaded: boolean;
}

/** What this device last agreed with the others, kept encrypted in the vault (not synced). */
interface SyncState {
  /** Version per record id as of the last sync. */
  base: Record<string, string>;
  /** `modifiedTime` of other devices' snapshots already merged, by Drive file id. */
  seen: Record<string, string>;
  /** Hash of the content last uploaded, to skip unchanged uploads. */
  uploadedHash: string | null;
  lastSyncAt: string | null;
}

const EMPTY_STATE: SyncState = { base: {}, seen: {}, uploadedHash: null, lastSyncAt: null };

/**
 * Keeps a vault in sync between devices through Google Drive, without a server.
 *
 * Every device writes its own encrypted snapshot of the vault (same format as a backup, plus
 * tombstones) to the app-data folder and merges the snapshots of the other devices. Only one
 * device ever writes a given file, so there are no write races. Google sees file names,
 * sizes and times, never content. Runs only while the app is open and the vault unlocked.
 */
@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly drive = inject(DriveService);
  private readonly vault = inject(VaultService);
  private readonly store = inject(EncryptedStore);
  private readonly prefs = inject(PreferencesService);
  private readonly transloco = inject(TranslocoService);
  private readonly document = inject(DOCUMENT);

  private readonly _status = signal<SyncStatus>('off');
  private readonly _lastSyncAt = signal<string | null>(null);
  private readonly _devices = signal<SyncDevice[]>([]);
  private readonly _lastError = signal<string | null>(null);
  private running: Promise<SyncSummary | null> | null = null;
  private again = false;
  private timer?: ReturnType<typeof setTimeout>;

  readonly enabled = computed(() => this.prefs.sync() && this.drive.configured());
  readonly status = computed<SyncStatus>(() => (this.enabled() && this.vault.isUnlocked() ? this._status() : 'off'));
  readonly lastSyncAt = this._lastSyncAt.asReadonly();
  readonly devices = this._devices.asReadonly();
  /** Translation key of the last error, if the last sync failed. */
  readonly lastError = this._lastError.asReadonly();
  readonly deviceId = deviceId();

  constructor() {
    effect(() => {
      const active = this.enabled() && this.vault.isUnlocked();
      this.vault.activeVault();
      untracked(() => {
        this._devices.set([]);
        this._lastError.set(null);
        if (!active) {
          clearTimeout(this.timer);
          this._status.set('off');
          return;
        }
        this._status.set(this.drive.hasValidToken() ? 'idle' : 'needsAuth');
        void this.loadLastSync();
        this.schedule(1000);
      });
    });

    let seenChanges = this.store.changes();
    effect(() => {
      const changes = this.store.changes();
      if (changes === seenChanges) return;
      seenChanges = changes;
      untracked(() => this.schedule(CHANGE_DEBOUNCE_MS));
    });

    const onVisible = () => {
      if (this.document.visibilityState !== 'visible') return;
      const last = this._lastSyncAt();
      if (!last || Date.now() - Date.parse(last) > FOCUS_MIN_GAP_MS) this.schedule(0);
    };
    this.document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(() => this.schedule(0), PERIODIC_MS);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(interval);
      clearTimeout(this.timer);
      this.document.removeEventListener('visibilitychange', onVisible);
    });
  }

  /** Turns sync on for the open vault and runs it once (from a click, so Google may ask). */
  async enable(): Promise<SyncSummary | null> {
    this.prefs.setSync(true);
    return this.syncNow({ interactive: true });
  }

  disable(): void {
    this.prefs.setSync(false);
  }

  /**
   * Syncs now. Background runs (`interactive: false`) never open the Google popup; without a
   * valid token the status becomes `needsAuth` and the UI offers a button instead.
   */
  async syncNow(options: { interactive: boolean } = { interactive: false }): Promise<SyncSummary | null> {
    if (!this.enabled() || !this.vault.isUnlocked()) return null;
    if (this.running) {
      this.again = true;
      return this.running;
    }
    if (!options.interactive && !this.drive.hasValidToken()) {
      this._status.set('needsAuth');
      return null;
    }
    this.running = this.drive
      .withApi(options.interactive, (api) => {
        this._status.set('syncing');
        return this.run(api);
      })
      .then((summary) => {
        this._status.set('idle');
        this._lastError.set(null);
        // Interactive runs announce the result themselves.
        if (!options.interactive && summary.conflicts) {
          toast.warning(this.transloco.translate('sync.conflicts', { count: summary.conflicts }), { duration: 10_000 });
        }
        return summary;
      })
      .catch((error: unknown) => {
        if (error instanceof DriveError && error.code === 'unauthorized') {
          this._status.set('needsAuth');
        } else {
          console.error(error);
          this._status.set('error');
          this._lastError.set(error instanceof DriveError ? `errors.drive.${error.code}` : 'sync.failed');
        }
        if (options.interactive) throw error;
        return null;
      })
      .finally(() => {
        this.running = null;
        if (this.again) {
          this.again = false;
          this.schedule(0);
        }
      });
    return this.running;
  }

  private schedule(delay: number): void {
    if (!this.enabled() || !this.vault.isUnlocked()) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.syncNow(), delay);
  }

  private async run(api: DriveApi): Promise<SyncSummary> {
    const vaultId = this.vault.header()!.vaultId;
    const key = this.vault.requireKey();
    const files = (await api.list()).filter((f) => isSyncFile(f) && f.appProperties['locryVaultId'] === vaultId);
    const own = files.find((f) => f.appProperties['locryDeviceId'] === this.deviceId);
    const state = await this.loadState();
    const summary: SyncSummary = { received: 0, conflicts: 0, uploaded: false };

    for (const file of files) {
      if (file === own || state.seen[file.id] === file.modifiedTime) continue;
      let records;
      let sealed;
      try {
        sealed = readBackup(await api.download(file.id));
        if (sealed.header.vault.vaultId !== vaultId) continue;
        records = await openBackup(sealed, key);
      } catch (error) {
        // A snapshot this key cannot open (corrupted or tampered with): leave it alone.
        if (error instanceof DriveError) throw error;
        console.warn('Skipping unreadable sync snapshot', file.id, error);
        continue;
      }
      await this.vault.mergeHeader(sealed.header.vault);
      await this.mergeProfile(records);

      const result = mergeEntries(
        await this.localEntries(),
        records.filter((r) => isSynced(r.type)),
        state.base,
        (loser) => this.conflictCopy(loser),
      );
      await this.store.applySync([...result.writes, ...result.copies]);
      state.base = result.base;
      state.seen[file.id] = file.modifiedTime;
      summary.received += result.writes.length;
      summary.conflicts += result.copies.length;
    }

    const expired = (await this.localEntries())
      .filter((e) => isTombstone(e.value) && Date.now() - Date.parse(e.value.deletedAt) > TOMBSTONE_TTL_MS)
      .map((e) => e.id);
    if (expired.length) await this.store.applySync([], expired);

    const current = await this.localEntries();
    const profile = this.profileRecord();
    const header = this.vault.header()!;
    const hash = await contentHash([header.keySlots, header.removedSlotIds, profile, current]);
    let ownFile: DriveFile | undefined = own;
    if (!own || hash !== state.uploadedHash) {
      const content = await createBackup(header, key, profile ? [...current, profile] : current);
      const properties = {
        locrySync: '1',
        locryVaultId: vaultId,
        locryDeviceId: this.deviceId,
        locryDevice: deviceName(),
        locryFormat: String(BACKUP_FORMAT_VERSION),
      };
      ownFile = own
        ? await api.update(own.id, content, properties)
        : await api.upload(`locry-sync-${vaultId.slice(0, 8)}-${this.deviceId.slice(0, 8)}.locry`, content, properties);
      state.uploadedHash = hash;
      summary.uploaded = true;
    }

    // Everything published now is what this device agrees on.
    state.base = Object.fromEntries(current.map((e) => [e.id, versionOf(e)]));
    for (const id of Object.keys(state.seen)) if (!files.some((f) => f.id === id)) delete state.seen[id];
    state.lastSyncAt = new Date().toISOString();
    await this.store.put(SYNC_STATE_TYPE, SYNC_STATE_TYPE, state);
    this._lastSyncAt.set(state.lastSyncAt);
    this._devices.set(
      files
        .map((f) => (f === own ? ownFile! : f))
        .map((f) => ({
          deviceId: f.appProperties['locryDeviceId'] ?? '',
          name: f.appProperties['locryDevice'] ?? '',
          modifiedTime: f.modifiedTime,
          self: f.appProperties['locryDeviceId'] === this.deviceId,
        }))
        .concat(own ? [] : [{ deviceId: this.deviceId, name: deviceName(), modifiedTime: ownFile!.modifiedTime, self: true }]),
    );
    return summary;
  }

  private async localEntries(): Promise<SyncEntry[]> {
    return (await this.store.exportAll()).filter((r) => isSynced(r.type));
  }

  private async loadState(): Promise<SyncState> {
    const stored = await this.store.get<SyncState>(SYNC_STATE_TYPE, SYNC_STATE_TYPE);
    return { ...EMPTY_STATE, ...stored, base: { ...stored?.base }, seen: { ...stored?.seen } };
  }

  private async loadLastSync(): Promise<void> {
    try {
      this._lastSyncAt.set((await this.loadState()).lastSyncAt);
    } catch {
      this._lastSyncAt.set(null);
    }
  }

  private profileRecord(): SyncEntry | null {
    const profile = this.vault.activeVault();
    if (!profile) return null;
    const value: ProfileValue = { name: profile.name, color: profile.color, updatedAt: profile.updatedAt };
    return { type: PROFILE_RECORD, id: PROFILE_RECORD, value };
  }

  /** Takes the vault's name and color from another device when they were changed there later. */
  private async mergeProfile(records: SyncEntry[]): Promise<void> {
    if (!records.some((r) => r.type === PROFILE_RECORD)) return;
    const remote = backupProfile(records);
    const local = this.vault.activeVault();
    if (!local || !remote.updatedAt || (local.updatedAt && local.updatedAt >= remote.updatedAt)) return;
    await this.vault.updateProfile(local.id, remote);
  }

  /** Keeps the losing side of a note edited on two devices as a separate note. */
  private conflictCopy(loser: SyncEntry): SyncEntry | null {
    if (loser.type !== 'note') return null;
    const note = loser.value as { title?: string; pinned?: boolean };
    const id = crypto.randomUUID();
    const suffix = this.transloco.translate('sync.conflictSuffix');
    return {
      type: 'note',
      id,
      value: {
        ...note,
        id,
        title: `${note.title || this.transloco.translate('pages.notes.untitled')} (${suffix})`,
        pinned: false,
        updatedAt: new Date().toISOString(),
      },
    };
  }
}

function isSynced(type: string): boolean {
  return !LOCAL_ONLY_TYPES.has(type) && type !== PROFILE_RECORD;
}

/** Order-independent hash of what would be uploaded. */
async function contentHash(parts: unknown[]): Promise<string> {
  const [slots, removed, profile, entries] = parts as [unknown, unknown, unknown, SyncEntry[]];
  const sorted = [...entries].sort((a, b) => a.id.localeCompare(b.id));
  const digest = await crypto.subtle.digest('SHA-256', utf8Encode(JSON.stringify([slots, removed, profile, sorted])));
  return toBase64Url(new Uint8Array(digest));
}

/** A random id for this browser, shared by all vaults on it. */
function deviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

/** A short, human label such as "Mac · Chrome", shown in the device list. */
export function deviceName(userAgent = navigator.userAgent): string {
  const os = /iPhone/.test(userAgent)
    ? 'iPhone'
    : /iPad/.test(userAgent)
      ? 'iPad'
      : /Android/.test(userAgent)
        ? 'Android'
        : /Mac OS X|Macintosh/.test(userAgent)
          ? 'Mac'
          : /Windows/.test(userAgent)
            ? 'Windows'
            : /Linux/.test(userAgent)
              ? 'Linux'
              : '';
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /Firefox\//.test(userAgent)
      ? 'Firefox'
      : /Chrome\//.test(userAgent)
        ? 'Chrome'
        : /Safari\//.test(userAgent)
          ? 'Safari'
          : '';
  return [os, browser].filter(Boolean).join(' · ') || 'Browser';
}
