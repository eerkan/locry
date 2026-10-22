import { Injectable } from '@angular/core';
import { type DBSchema, type IDBPDatabase, openDB } from 'idb';
import { LEGACY_DB_NAME } from '../storage/locry-db';

export const VAULT_COLORS = ['slate', 'red', 'orange', 'amber', 'green', 'teal', 'blue', 'violet', 'pink'] as const;
export type VaultColor = (typeof VAULT_COLORS)[number];

/**
 * What the lock screen knows about a vault before it is unlocked. Stored in plaintext:
 * only the name and color are visible; the vault's content stays encrypted in its own database.
 */
export interface VaultProfile {
  /** Same as the header's `vaultId`. */
  id: string;
  /** Empty for vaults that never got a name (shown with a default label). */
  name: string;
  color: VaultColor;
  /** IndexedDB database holding the vault's header and records. */
  dbName: string;
  createdAt: string;
  /** Position in the vault list (order of adding to this device). */
  order: number;
}

interface RegistrySchema extends DBSchema {
  vaults: { key: string; value: VaultProfile };
  meta: { key: string; value: unknown };
}

const REGISTRY_DB_NAME = 'locry-vaults';

export function vaultDbName(vaultId: string): string {
  return `locry-vault-${vaultId}`;
}

export function isVaultColor(value: unknown): value is VaultColor {
  return (VAULT_COLORS as readonly unknown[]).includes(value);
}

/** The list of vaults on this device, in its own small IndexedDB database. */
@Injectable({ providedIn: 'root' })
export class VaultRegistry {
  private dbPromise?: Promise<IDBPDatabase<RegistrySchema>>;

  private db(): Promise<IDBPDatabase<RegistrySchema>> {
    this.dbPromise ??= openDB<RegistrySchema>(REGISTRY_DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore('vaults', { keyPath: 'id' });
        db.createObjectStore('meta');
      },
    });
    return this.dbPromise;
  }

  async list(): Promise<VaultProfile[]> {
    const vaults = await (await this.db()).getAll('vaults');
    return vaults.sort((a, b) => a.order - b.order);
  }

  async put(profile: VaultProfile): Promise<void> {
    await (await this.db()).put('vaults', profile);
  }

  async delete(id: string): Promise<void> {
    await (await this.db()).delete('vaults', id);
  }

  /** Whether the single-vault database of earlier versions was already looked at. */
  async legacyChecked(): Promise<boolean> {
    return (await (await this.db()).get('meta', 'legacy-checked')) === true;
  }

  async markLegacyChecked(): Promise<void> {
    await (await this.db()).put('meta', true, 'legacy-checked');
  }

  /** The database name earlier versions used for their only vault. */
  readonly legacyDbName = LEGACY_DB_NAME;

  close(): void {
    this.dbPromise?.then((db) => db.close());
    this.dbPromise = undefined;
  }
}
