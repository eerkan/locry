import { Injectable, Injector, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import type { BackupRecord } from '../backup/backup-format';
import { PROFILE_RECORD, type ProfileValue, backupProfile } from '../backup/vault-profile';
import { EncryptedStore } from '../storage/encrypted-store.service';
import type { VaultHeader } from '../vault/vault-header';
import { VaultService } from '../vault/vault.service';
import { type SyncEntry, mergeEntries, versionOf } from './merge';
import { LOCAL_ONLY_TYPES, SYNC_STATE_TYPE, isTombstone } from './sync-records';

/** Tombstones older than this are dropped; devices offline for longer may bring records back. */
const TOMBSTONE_TTL_MS = 90 * 24 * 3600_000;

/** The latest state of another device this device merged (from its sync snapshot or a backup). */
export interface RemoteState {
  /** When that state was written (Drive file time); older files of that device are skipped. */
  at: string;
  /** Version per record id in that state. */
  versions: Record<string, string>;
}

/** What this device knows about the others, kept encrypted in the vault (not synced). */
export interface SyncState {
  /** Version per record id as of the last time this device published its state. */
  published: Record<string, string>;
  /** Per other device id. */
  remotes: Record<string, RemoteState>;
  /** Hash of the content last uploaded as this device's sync snapshot. */
  uploadedHash: string | null;
  lastSyncAt: string | null;
}

export interface MergeSummary {
  /** Records taken from the other device. */
  received: number;
  /** Conflict copies created. */
  conflicts: number;
}

const EMPTY_STATE: SyncState = { published: {}, remotes: {}, uploadedHash: null, lastSyncAt: null };

/**
 * Merges what another device wrote (a sync snapshot or a Drive backup) into the open vault,
 * with one three-way merge and one shared record of what was agreed. Sync and backups both
 * go through here, one at a time, so neither works from stale state.
 */
@Injectable({ providedIn: 'root' })
export class SnapshotMerger {
  private readonly vault = inject(VaultService);
  private readonly store = inject(EncryptedStore);
  /** Translations are only needed for conflict copies; resolved then. */
  private readonly injector = inject(Injector);
  private queue: Promise<unknown> = Promise.resolve();

  /** Runs `task` after any other merge work has finished. */
  exclusive<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(task);
    this.queue = run.catch(() => undefined);
    return run;
  }

  async loadState(): Promise<SyncState> {
    // Earlier versions kept a single `base`: what this device had published.
    const stored = await this.store.get<Partial<SyncState> & { base?: Record<string, string> }>(
      SYNC_STATE_TYPE,
      SYNC_STATE_TYPE,
    );
    return {
      published: { ...(stored?.published ?? stored?.base) },
      remotes: { ...stored?.remotes },
      uploadedHash: stored?.uploadedHash ?? EMPTY_STATE.uploadedHash,
      lastSyncAt: stored?.lastSyncAt ?? EMPTY_STATE.lastSyncAt,
    };
  }

  /** Whether a file another device wrote at `at` is newer than what was merged from it. */
  isNew(state: SyncState, deviceId: string, at: string): boolean {
    const known = state.remotes[deviceId];
    return !known || at > known.at;
  }

  async saveState(state: SyncState): Promise<void> {
    await this.store.put(SYNC_STATE_TYPE, SYNC_STATE_TYPE, state);
  }

  /** Notes, tasks, lists and tombstones of the open vault. */
  async localEntries(): Promise<SyncEntry[]> {
    return (await this.store.exportAll()).filter((r) => isSynced(r.type));
  }

  /**
   * Merges a state another device wrote at `at`: key slot changes, the vault's name, and every
   * record (see `mergeEntries`). Records what was merged from that device in `state`.
   */
  async merge(
    state: SyncState,
    from: { deviceId: string; at: string },
    header: VaultHeader,
    records: BackupRecord[],
  ): Promise<MergeSummary> {
    await this.vault.mergeHeader(header);
    await this.mergeProfile(records);
    const result = mergeEntries(
      await this.localEntries(),
      records.filter((r) => isSynced(r.type)),
      { remote: state.remotes[from.deviceId]?.versions, published: state.published },
      (loser) => this.conflictCopy(loser),
    );
    await this.store.applySync([...result.writes, ...result.copies]);
    state.remotes[from.deviceId] = { at: from.at, versions: result.remoteVersions };
    return { received: result.writes.length, conflicts: result.copies.length };
  }

  /** Drops tombstones old enough that every device has seen them. */
  async expireTombstones(): Promise<void> {
    const expired = (await this.localEntries())
      .filter((e) => isTombstone(e.value) && Date.now() - Date.parse(e.value.deletedAt) > TOMBSTONE_TTL_MS)
      .map((e) => e.id);
    if (expired.length) await this.store.applySync([], expired);
  }

  /** After publishing `entries` (as a sync snapshot or a backup), that is what this device agrees on. */
  published(state: SyncState, entries: SyncEntry[]): void {
    state.published = Object.fromEntries(entries.map((e) => [e.id, versionOf(e)]));
  }

  /** The vault's name and color, as the pseudo-record carried in snapshots and backups. */
  profileRecord(): SyncEntry | null {
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
    const transloco = this.injector.get(TranslocoService);
    const suffix = transloco.translate('sync.conflictSuffix');
    return {
      type: 'note',
      id,
      value: {
        ...note,
        id,
        title: `${note.title || transloco.translate('pages.notes.untitled')} (${suffix})`,
        pinned: false,
        updatedAt: new Date().toISOString(),
      },
    };
  }
}

function isSynced(type: string): boolean {
  return !LOCAL_ONLY_TYPES.has(type) && type !== PROFILE_RECORD;
}
