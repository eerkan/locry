import { Injectable, inject, signal } from '@angular/core';
import { open, seal } from '../crypto/aead';
import { utf8Decode, utf8Encode } from '../crypto/bytes';
import { LOCAL_ONLY_TYPES, TOMBSTONE_TYPE, type TombstoneValue } from '../sync/sync-records';
import { VaultService } from '../vault/vault.service';
import { LocryDb } from './locry-db';

/**
 * Typed, encrypted key-value records on top of IndexedDB. Each record is serialized to JSON
 * and sealed with the vault key; the AAD binds the ciphertext to its type and id.
 */
@Injectable({ providedIn: 'root' })
export class EncryptedStore {
  private readonly db = inject(LocryDb);
  private readonly vault = inject(VaultService);
  private readonly _revision = signal(0);
  private readonly _changes = signal(0);

  /** Bumped after bulk changes (restore, sync) so in-memory collections reload. */
  readonly revision = this._revision.asReadonly();
  /** Bumped after every local change to synced data; the sync engine listens to it. */
  readonly changes = this._changes.asReadonly();

  async put<T>(type: string, id: string, value: T): Promise<void> {
    const box = await seal(this.vault.requireKey(), utf8Encode(JSON.stringify(value)), aad(type, id));
    await this.db.putRecord({ id, type, box });
    if (!LOCAL_ONLY_TYPES.has(type)) this._changes.update((n) => n + 1);
  }

  async get<T>(type: string, id: string): Promise<T | undefined> {
    const record = await this.db.getRecord(id);
    if (!record || record.type !== type) return undefined;
    return this.decrypt<T>(record.type, record.id, record.box);
  }

  async list<T>(type: string): Promise<T[]> {
    const records = await this.db.getRecordsByType(type);
    return Promise.all(records.map((r) => this.decrypt<T>(r.type, r.id, r.box)));
  }

  /**
   * Deletes a record. Synced types leave a tombstone so other devices delete it too;
   * local-only types are removed outright.
   */
  async remove(type: string, id: string): Promise<void> {
    if (LOCAL_ONLY_TYPES.has(type)) return this.db.deleteRecord(id);
    const tombstone: TombstoneValue = { type, deletedAt: new Date().toISOString() };
    await this.put(TOMBSTONE_TYPE, id, tombstone);
  }

  /** Removes a record without leaving a tombstone. */
  async delete(id: string): Promise<void> {
    await this.db.deleteRecord(id);
  }

  /** Every record, decrypted. */
  async exportAll(): Promise<{ type: string; id: string; value: unknown }[]> {
    const records = await this.db.getAllRecords();
    return Promise.all(
      records.map(async (r) => ({ type: r.type, id: r.id, value: await this.decrypt<unknown>(r.type, r.id, r.box) })),
    );
  }

  /**
   * Encrypts and writes many records in a single transaction, then notifies collections.
   * With `replace`, all existing records are removed in the same transaction.
   */
  async importAll(records: { type: string; id: string; value: unknown }[], replace: boolean): Promise<void> {
    const key = this.vault.requireKey();
    const sealed = await Promise.all(
      records.map(async (r) => ({
        id: r.id,
        type: r.type,
        box: await seal(key, utf8Encode(JSON.stringify(r.value)), aad(r.type, r.id)),
      })),
    );
    await this.db.writeRecords(sealed, replace);
    this._revision.update((n) => n + 1);
  }

  /** Writes changes received from another device in one transaction, then notifies collections. */
  async applySync(writes: { type: string; id: string; value: unknown }[], deletes: string[] = []): Promise<void> {
    if (!writes.length && !deletes.length) return;
    const key = this.vault.requireKey();
    const sealed = await Promise.all(
      writes.map(async (r) => ({
        id: r.id,
        type: r.type,
        box: await seal(key, utf8Encode(JSON.stringify(r.value)), aad(r.type, r.id)),
      })),
    );
    await this.db.writeRecords(sealed, false, deletes);
    this._revision.update((n) => n + 1);
  }

  private async decrypt<T>(type: string, id: string, box: Parameters<typeof open>[1]): Promise<T> {
    const plaintext = await open(this.vault.requireKey(), box, aad(type, id));
    return JSON.parse(utf8Decode(plaintext)) as T;
  }
}

function aad(type: string, id: string): string {
  return `locry:v1:record:${type}:${id}`;
}
