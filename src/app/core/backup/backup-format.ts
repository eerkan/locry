import { concatBytes, fromBase64Url, randomBytes, toBase64Url, utf8Decode, utf8Encode } from '../crypto/bytes';
import { gunzip, gzip } from '../crypto/compression';
import { type VaultHeader, isVaultHeader } from '../vault/vault-header';

/**
 * `.locry` backup file layout:
 *
 *   "LOCRY"  (5 bytes, magic)
 *   version  (1 byte)
 *   length   (4 bytes, big-endian length of the header JSON)
 *   header   (UTF-8 JSON: the vault's key slots, so the backup can be opened on another device)
 *   payload  (AES-256-GCM ciphertext of gzip(JSON(records)), keyed by the vault key)
 *
 * The exact header bytes are the AES-GCM additional data, so any change to the header
 * (for example swapping key slots) makes decryption fail.
 */
const MAGIC = utf8Encode('LOCRY');
export const BACKUP_FORMAT_VERSION = 1;
const PREFIX_BYTES = MAGIC.length + 1 + 4;
const MAX_HEADER_BYTES = 1024 * 1024;

export const BACKUP_FILE_EXTENSION = '.locry';
export const BACKUP_MIME_TYPE = 'application/octet-stream';

/** One decrypted record, as stored in the encrypted store. */
export interface BackupRecord {
  type: string;
  id: string;
  value: unknown;
}

export interface BackupHeader {
  format: typeof BACKUP_FORMAT_VERSION;
  createdAt: string;
  vault: VaultHeader;
  iv: string;
}

interface BackupPayload {
  records: BackupRecord[];
}

/** A parsed backup whose payload has not been decrypted yet. */
export interface SealedBackup {
  header: BackupHeader;
  headerBytes: Uint8Array<ArrayBuffer>;
  ciphertext: Uint8Array<ArrayBuffer>;
}

export type BackupErrorCode = 'notBackup' | 'unsupportedVersion' | 'corrupted' | 'wrongKey';

export class BackupError extends Error {
  constructor(
    readonly code: BackupErrorCode,
    cause?: unknown,
  ) {
    super(`Backup error: ${code}`, { cause });
  }
}

/** Serializes, compresses and encrypts records into a `.locry` file. */
export async function createBackup(
  vault: VaultHeader,
  vaultKey: CryptoKey,
  records: BackupRecord[],
): Promise<Uint8Array<ArrayBuffer>> {
  const compressed = await gzip(utf8Encode(JSON.stringify({ records } satisfies BackupPayload)));
  // The IV must be in the header (it is the AAD), so generate it up front.
  const iv = randomBytes(12);
  const header: BackupHeader = {
    format: BACKUP_FORMAT_VERSION,
    createdAt: new Date().toISOString(),
    vault,
    iv: toBase64Url(iv),
  };
  const headerBytes = utf8Encode(JSON.stringify(header));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: headerBytes }, vaultKey, compressed),
  );

  const length = new Uint8Array(4);
  new DataView(length.buffer).setUint32(0, headerBytes.length);
  return concatBytes(MAGIC, new Uint8Array([BACKUP_FORMAT_VERSION]), length, headerBytes, ciphertext);
}

/** Parses the unencrypted parts of a backup file. */
export function readBackup(file: Uint8Array<ArrayBuffer>): SealedBackup {
  if (file.length < PREFIX_BYTES || !MAGIC.every((byte, i) => file[i] === byte)) {
    throw new BackupError('notBackup');
  }
  if (file[MAGIC.length] !== BACKUP_FORMAT_VERSION) throw new BackupError('unsupportedVersion');

  const length = new DataView(file.buffer, file.byteOffset + MAGIC.length + 1, 4).getUint32(0);
  if (length > MAX_HEADER_BYTES || PREFIX_BYTES + length > file.length) throw new BackupError('corrupted');

  const headerBytes = file.slice(PREFIX_BYTES, PREFIX_BYTES + length);
  let header: BackupHeader;
  try {
    header = JSON.parse(utf8Decode(headerBytes)) as BackupHeader;
  } catch (error) {
    throw new BackupError('corrupted', error);
  }
  if (header.format !== BACKUP_FORMAT_VERSION || !isVaultHeader(header.vault) || typeof header.iv !== 'string') {
    throw new BackupError('corrupted');
  }
  return { header, headerBytes, ciphertext: file.slice(PREFIX_BYTES + length) };
}

/** Decrypts and inflates the records of a parsed backup with its vault key. */
export async function openBackup(backup: SealedBackup, vaultKey: CryptoKey): Promise<BackupRecord[]> {
  let compressed: Uint8Array<ArrayBuffer>;
  try {
    compressed = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: fromBase64Url(backup.header.iv), additionalData: backup.headerBytes },
        vaultKey,
        backup.ciphertext,
      ),
    );
  } catch (error) {
    throw new BackupError('wrongKey', error);
  }
  try {
    const payload = JSON.parse(utf8Decode(await gunzip(compressed))) as BackupPayload;
    if (!Array.isArray(payload.records)) throw new Error('records missing');
    return payload.records.filter(
      (r) => r && typeof r.type === 'string' && typeof r.id === 'string' && r.value !== undefined,
    );
  } catch (error) {
    throw new BackupError('corrupted', error);
  }
}

/** `locry-backup-2026-10-22.locry`, or `locry-backup-2026-10-22-1357.locry` with the time. */
export function backupFileName(date = new Date(), withTime = false): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = withTime ? `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}` : '';
  return `locry-backup-${day}${time}${BACKUP_FILE_EXTENSION}`;
}
