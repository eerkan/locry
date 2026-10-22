import { type VaultColor, isVaultColor } from '../vault/vault-registry';
import type { BackupRecord } from './backup-format';

/**
 * The vault's name and color travel inside the encrypted backup as this pseudo-record, so a
 * restore on another device can show the same name. It is never written to the store.
 */
export const PROFILE_RECORD = 'vault-profile';

export interface ProfileValue {
  name: string;
  color: VaultColor;
  updatedAt?: string;
}

/** Name and color stored in a backup; backups made before multiple vaults have none. */
export function backupProfile(records: BackupRecord[]): ProfileValue {
  const value = records.find((r) => r.type === PROFILE_RECORD)?.value as Partial<ProfileValue> | undefined;
  return {
    name: typeof value?.name === 'string' ? value.name.slice(0, 60) : '',
    color: isVaultColor(value?.color) ? value.color : 'blue',
    updatedAt: typeof value?.updatedAt === 'string' ? value.updatedAt : undefined,
  };
}
