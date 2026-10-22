import { Injectable, inject } from '@angular/core';
import { EncryptedStore } from '../storage/encrypted-store.service';
import { LOCAL_ONLY_TYPES, TOMBSTONE_TYPE } from '../sync/sync-records';
import { PROFILE_RECORD, type ProfileValue, backupProfile } from './vault-profile';
import { type ReAuth, VaultService } from '../vault/vault.service';
import { type BackupRecord, type SealedBackup, createBackup, openBackup, readBackup } from './backup-format';
import { SnapshotMerger } from '../sync/snapshot-merger';

export type RestoreMode = 'merge' | 'replace';

export interface RestoreSummary {
  /** Records written from the backup. */
  restored: number;
  /** Records skipped because the local copy was newer (merge only). */
  keptLocal: number;
  /** Count of restored records per type, e.g. `{ note: 3, task: 5 }`. */
  byType: Record<string, number>;
}

/** A backup that has been decrypted and is ready to be applied. */
export interface OpenedBackup {
  backup: SealedBackup;
  key: CryptoKey;
  records: BackupRecord[];
}

export type BackupUnlock = { method: 'current' } | ReAuth;

@Injectable({ providedIn: 'root' })
export class BackupService {
  private readonly vault = inject(VaultService);
  private readonly store = inject(EncryptedStore);
  private readonly merger = inject(SnapshotMerger);

  /** Creates a compressed, encrypted `.locry` file of everything in the vault. */
  async export(): Promise<Uint8Array<ArrayBuffer>> {
    const header = this.vault.header();
    if (!header) throw new Error('No vault');
    // Vectors and sync bookkeeping stay on the device. Tombstones are included so that merging
    // this backup on another device deletes what was deleted here; restoring ignores them.
    const records = (await this.store.exportAll()).filter((r) => !LOCAL_ONLY_TYPES.has(r.type));
    const profile = this.vault.activeVault();
    if (profile) {
      const value: ProfileValue = { name: profile.name, color: profile.color, updatedAt: profile.updatedAt };
      records.push({ type: PROFILE_RECORD, id: PROFILE_RECORD, value });
    }
    const file = await createBackup(header, this.vault.requireKey(), records);
    // Another device may restore or merge this file: its content is now "published", which
    // later merges compare against to tell this device's own new edits apart.
    await this.markPublished();
    return file;
  }

  /** Parses a file without decrypting it. Throws `BackupError` for anything that is not a backup. */
  read(file: Uint8Array<ArrayBuffer>): SealedBackup {
    return readBackup(file);
  }

  /** Whether the backup was made from the vault on this device (so the current key opens it). */
  isFromThisVault(backup: SealedBackup): boolean {
    return backup.header.vault.vaultId === this.vault.header()?.vaultId && this.vault.isUnlocked();
  }

  /**
   * Decrypts a backup. Backups of this vault open with the current key; others need one of
   * the backup's own passkeys or its recovery key.
   */
  async open(backup: SealedBackup, unlock: BackupUnlock): Promise<OpenedBackup> {
    const header = backup.header.vault;
    const key =
      unlock.method === 'current'
        ? this.vault.requireKey()
        : unlock.method === 'passkey'
          ? await this.vault.openWithPasskey(header)
          : await this.vault.openWithRecoveryKey(header, unlock.recoveryKey);
    return { backup, key, records: await openBackup(backup, key) };
  }

  /** Applies an opened backup to the unlocked vault. */
  async restore(opened: OpenedBackup, mode: RestoreMode): Promise<RestoreSummary> {
    const incoming = contentRecords(opened.records);
    let toWrite = incoming;
    let keptLocal = 0;

    if (mode === 'merge') {
      const local = new Map((await this.store.exportAll()).map((r) => [r.id, r]));
      toWrite = incoming.filter((record) => {
        const existing = local.get(record.id);
        if (!existing || existing.type !== record.type || isNewer(record.value, existing.value)) return true;
        // Identical copies are skipped silently; only count records where the local one is newer.
        if (isNewer(existing.value, record.value)) keptLocal++;
        return false;
      });
    }

    await this.store.importAll(toWrite, mode === 'replace');
    return { restored: toWrite.length, keptLocal, byType: countByType(toWrite) };
  }

  /**
   * Restore from the lock screen. A vault that is not on this device yet is added (same key
   * slots, so the same passkeys and recovery key keep working); if it already is, it is
   * opened and the backup is merged into it.
   */
  async restoreAsVault(opened: OpenedBackup): Promise<RestoreSummary & { merged: boolean }> {
    const header = opened.backup.header.vault;
    if (this.vault.hasVault(header.vaultId)) {
      await this.vault.unlockWithKey(header.vaultId, opened.key);
      return { ...(await this.restore(opened, 'merge')), merged: true };
    }
    const records = contentRecords(opened.records);
    await this.vault.adoptVault(header, opened.key, backupProfile(opened.records));
    await this.store.importAll(records, true);
    // The restored state also exists on the device that made the backup: a known common state.
    await this.markPublished();
    return { restored: records.length, keptLocal: 0, byType: countByType(records), merged: false };
  }

  private async markPublished(): Promise<void> {
    const state = await this.merger.loadState();
    this.merger.published(state, await this.merger.localEntries());
    await this.merger.saveState(state);
  }
}

/** Last-writer-wins on `updatedAt`; records without timestamps keep the local copy. */
function isNewer(incoming: unknown, existing: unknown): boolean {
  const a = (incoming as { updatedAt?: unknown })?.updatedAt;
  const b = (existing as { updatedAt?: unknown })?.updatedAt;
  return typeof a === 'string' && typeof b === 'string' && a > b;
}

/** Notes, tasks and lists; a sync snapshot used as a backup also carries tombstones. */
function contentRecords(records: BackupRecord[]): BackupRecord[] {
  return records.filter((r) => r.type !== PROFILE_RECORD && r.type !== TOMBSTONE_TYPE && !LOCAL_ONLY_TYPES.has(r.type));
}

function countByType(records: BackupRecord[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const record of records) counts[record.type] = (counts[record.type] ?? 0) + 1;
  return counts;
}

export { PROFILE_RECORD, type ProfileValue, backupProfile } from './vault-profile';
