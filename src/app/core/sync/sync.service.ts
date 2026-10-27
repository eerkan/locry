import { DOCUMENT, DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { toast } from '@spartan-ng/brain/sonner';
import { BACKUP_FORMAT_VERSION, createBackup, openBackup, readBackup } from '../backup/backup-format';
import { toBase64Url, utf8Encode } from '../crypto/bytes';
import type { DriveApi, DriveFile } from '../drive/drive-api';
import { DriveService, isSyncFile } from '../drive/drive.service';
import { DriveError } from '../drive/google-auth';
import { PreferencesService } from '../preferences.service';
import { EncryptedStore } from '../storage/encrypted-store.service';
import { VaultService } from '../vault/vault.service';
import { deviceId, deviceName } from './device';
import type { SyncEntry } from './merge';
import { SnapshotMerger } from './snapshot-merger';

export { deviceName } from './device';

/** Waits this long after a local change before syncing, so typing does not upload every second. */
const CHANGE_DEBOUNCE_MS = 30_000;
const PERIODIC_MS = 5 * 60_000;
/** Returning to the tab syncs again when the last sync is older than this. */
const FOCUS_MIN_GAP_MS = 60_000;

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
  private readonly merger = inject(SnapshotMerger);

  private readonly _status = signal<SyncStatus>('off');
  private readonly _lastSyncAt = signal<string | null>(null);
  private readonly _devices = signal<SyncDevice[]>([]);
  private readonly _lastError = signal<string | null>(null);
  private running: Promise<SyncSummary | null> | null = null;
  private again = false;
  /** Local changes not uploaded yet (the debounce timer is still waiting). */
  private pending = false;
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
      this.pending = true;
      untracked(() => this.schedule(CHANGE_DEBOUNCE_MS));
    });

    // A token renewed (on a click, or after unlocking with a kept token): sync what waited for it.
    effect(() => {
      if (this.drive.connected()) untracked(() => this._status() === 'needsAuth' && this.schedule(0));
    });

    const onVisible = () => {
      if (this.document.visibilityState === 'hidden') {
        // Phones suspend hidden pages, so the debounce timer may never fire: upload now.
        if (this.pending) void this.syncNow();
        return;
      }
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
    this.pending = false;
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
        this.pending = true;
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

  private run(api: DriveApi): Promise<SyncSummary> {
    return this.merger.exclusive(async () => {
      const vaultId = this.vault.header()!.vaultId;
      const key = this.vault.requireKey();
      const files = (await api.list()).filter((f) => isSyncFile(f) && f.appProperties['locryVaultId'] === vaultId);
      const own = files.find((f) => f.appProperties['locryDeviceId'] === this.deviceId);
      const state = await this.merger.loadState();
      const summary: SyncSummary = { received: 0, conflicts: 0, uploaded: false };

      for (const file of files) {
        const from = { deviceId: file.appProperties['locryDeviceId'] ?? file.id, at: file.modifiedTime };
        if (file === own || !this.merger.isNew(state, from.deviceId, from.at)) continue;
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
        const merged = await this.merger.merge(state, from, sealed.header.vault, records);
        summary.received += merged.received;
        summary.conflicts += merged.conflicts;
      }

      await this.merger.expireTombstones();
      const current = await this.merger.localEntries();
      const profile = this.merger.profileRecord();
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
      this.merger.published(state, current);
      state.lastSyncAt = new Date().toISOString();
      await this.merger.saveState(state);
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
    });
  }

  private async loadLastSync(): Promise<void> {
    try {
      this._lastSyncAt.set((await this.merger.loadState()).lastSyncAt);
    } catch {
      this._lastSyncAt.set(null);
    }
  }
}

/** Order-independent hash of what would be uploaded. */
async function contentHash(parts: unknown[]): Promise<string> {
  const [slots, removed, profile, entries] = parts as [unknown, unknown, unknown, SyncEntry[]];
  const sorted = [...entries].sort((a, b) => a.id.localeCompare(b.id));
  const digest = await crypto.subtle.digest('SHA-256', utf8Encode(JSON.stringify([slots, removed, profile, sorted])));
  return toBase64Url(new Uint8Array(digest));
}
