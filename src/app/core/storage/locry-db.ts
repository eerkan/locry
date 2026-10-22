import { Injectable } from '@angular/core';
import { type DBSchema, type IDBPDatabase, deleteDB, openDB } from 'idb';
import type { SealedBox } from '../crypto/aead';
import type { VaultHeader } from '../vault/vault-header';

/** An encrypted record as stored on disk. Only `id` and `type` are in plaintext. */
export interface StoredRecord {
  id: string;
  type: string;
  box: SealedBox;
}

interface LocrySchema extends DBSchema {
  meta: {
    key: 'vault-header';
    value: VaultHeader;
  };
  records: {
    key: string;
    value: StoredRecord;
    indexes: { type: string };
  };
}

/** Database of the single vault in versions before multiple vaults; kept as that vault's database. */
export const LEGACY_DB_NAME = 'locry';
const DB_VERSION = 1;

/** The active vault's database. Every vault has its own; {@link use} switches between them. */
@Injectable({ providedIn: 'root' })
export class LocryDb {
  private dbPromise?: Promise<IDBPDatabase<LocrySchema>>;
  private name: string | null = null;

  /** Points all further calls at another vault's database. */
  use(name: string): void {
    if (name === this.name) return;
    this.close();
    this.name = name;
  }

  /** Closes and deletes a vault's database. */
  async deleteDatabase(name: string): Promise<void> {
    if (name === this.name) {
      this.close();
      this.name = null;
    }
    await deleteDB(name);
  }

  /** Reads the header of any vault database without switching to it. */
  async peekHeader(name: string): Promise<VaultHeader | undefined> {
    const db = await openSchema(name);
    try {
      return await db.get('meta', 'vault-header');
    } finally {
      db.close();
    }
  }

  db(): Promise<IDBPDatabase<LocrySchema>> {
    if (!this.name) return Promise.reject(new Error('No vault database selected'));
    this.dbPromise ??= openSchema(this.name);
    return this.dbPromise;
  }

  async getHeader(): Promise<VaultHeader | undefined> {
    return (await this.db()).get('meta', 'vault-header');
  }

  async putHeader(header: VaultHeader): Promise<void> {
    await (await this.db()).put('meta', header, 'vault-header');
  }

  async getRecord(id: string): Promise<StoredRecord | undefined> {
    return (await this.db()).get('records', id);
  }

  async getRecordsByType(type: string): Promise<StoredRecord[]> {
    return (await this.db()).getAllFromIndex('records', 'type', type);
  }

  async putRecord(record: StoredRecord): Promise<void> {
    await (await this.db()).put('records', record);
  }

  async deleteRecord(id: string): Promise<void> {
    await (await this.db()).delete('records', id);
  }

  async getAllRecords(): Promise<StoredRecord[]> {
    return (await this.db()).getAll('records');
  }

  /** Writes records in one transaction; with `replace`, existing records are removed first. */
  async writeRecords(records: StoredRecord[], replace: boolean): Promise<void> {
    const tx = (await this.db()).transaction('records', 'readwrite');
    if (replace) await tx.store.clear();
    await Promise.all([...records.map((record) => tx.store.put(record)), tx.done]);
  }

  close(): void {
    this.dbPromise?.then((db) => db.close());
    this.dbPromise = undefined;
  }
}

function openSchema(name: string): Promise<IDBPDatabase<LocrySchema>> {
  return openDB<LocrySchema>(name, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore('meta');
      const records = db.createObjectStore('records', { keyPath: 'id' });
      records.createIndex('type', 'type');
    },
  });
}
