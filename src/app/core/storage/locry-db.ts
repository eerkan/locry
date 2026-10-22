import { Injectable } from '@angular/core';
import { type DBSchema, type IDBPDatabase, openDB } from 'idb';
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

export const DB_NAME = 'locry';
const DB_VERSION = 1;

@Injectable({ providedIn: 'root' })
export class LocryDb {
  private dbPromise?: Promise<IDBPDatabase<LocrySchema>>;

  db(): Promise<IDBPDatabase<LocrySchema>> {
    this.dbPromise ??= openDB<LocrySchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore('meta');
        const records = db.createObjectStore('records', { keyPath: 'id' });
        records.createIndex('type', 'type');
      },
    });
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
