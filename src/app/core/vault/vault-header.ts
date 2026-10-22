import { type SealedBox, deriveAesKey, importAesKey, open, seal } from '../crypto/aead';
import { fromBase64Url, randomBytes, toBase64Url, utf8Decode, utf8Encode, wipe } from '../crypto/bytes';

export const VAULT_FORMAT_VERSION = 1;
const VAULT_KEY_BYTES = 32;
const CHECK_PLAINTEXT = 'locry-vault-check';

export type KeySlotKind = 'passkey' | 'recovery';

/** The vault key, wrapped (encrypted) under a key-encryption key derived from one unlock method. */
export interface KeySlot {
  id: string;
  kind: KeySlotKind;
  /** Passkey credential id (base64url), only for `passkey` slots. */
  credentialId?: string;
  /**
   * Site (WebAuthn relying party) the passkey belongs to, e.g. "localhost" or
   * "locry.example.com". A passkey only works on its own site. Slots created before this
   * field existed have none and were all made on localhost.
   */
  rpId?: string;
  label: string;
  createdAt: string;
  wrappedKey: SealedBox;
}

/**
 * Everything needed to unlock a vault. Holds no plaintext: the vault key only appears
 * wrapped inside key slots, and `check` lets us confirm a successful unwrap.
 */
export interface VaultHeader {
  version: typeof VAULT_FORMAT_VERSION;
  vaultId: string;
  /** Input to the WebAuthn PRF extension; the same for every passkey of this vault. */
  prfSalt: string;
  createdAt: string;
  keySlots: KeySlot[];
  check: SealedBox;
}

/** Freshly generated vault key material. `raw` must be wiped once all slots are created. */
export interface NewVaultKey {
  raw: Uint8Array<ArrayBuffer>;
  key: CryptoKey;
}

export async function generateVaultKey(): Promise<NewVaultKey> {
  const raw = randomBytes(VAULT_KEY_BYTES);
  return { raw, key: await importAesKey(raw) };
}

export function newVaultId(): string {
  return toBase64Url(randomBytes(16));
}

export function newPrfSalt(): string {
  return toBase64Url(randomBytes(32));
}

/** Key-encryption key for a passkey slot, from the authenticator's PRF output. */
export function passkeyKek(prfOutput: BufferSource, vaultId: string): Promise<CryptoKey> {
  return deriveAesKey(prfOutput, fromBase64Url(vaultId), 'locry/kek/passkey/v1');
}

/** Key-encryption key for the recovery slot. The recovery key is 256 random bits, so HKDF suffices. */
export function recoveryKek(recoveryKey: BufferSource, vaultId: string): Promise<CryptoKey> {
  return deriveAesKey(recoveryKey, fromBase64Url(vaultId), 'locry/kek/recovery/v1');
}

function slotAad(vaultId: string, slotId: string): string {
  return `locry:v1:keyslot:${vaultId}:${slotId}`;
}

function checkAad(vaultId: string): string {
  return `locry:v1:check:${vaultId}`;
}

export async function createKeySlot(
  vaultId: string,
  vaultKeyRaw: Uint8Array<ArrayBuffer>,
  kek: CryptoKey,
  slot: Omit<KeySlot, 'id' | 'createdAt' | 'wrappedKey'>,
): Promise<KeySlot> {
  const id = toBase64Url(randomBytes(8));
  return {
    ...slot,
    id,
    createdAt: new Date().toISOString(),
    wrappedKey: await seal(kek, vaultKeyRaw, slotAad(vaultId, id)),
  };
}

export async function createCheck(vaultId: string, vaultKey: CryptoKey): Promise<SealedBox> {
  return seal(vaultKey, utf8Encode(CHECK_PLAINTEXT), checkAad(vaultId));
}

/**
 * Unwraps the vault key from a slot and verifies it against the header check value.
 * Throws if the KEK is wrong or the header was tampered with.
 */
export async function unwrapVaultKey(header: VaultHeader, slot: KeySlot, kek: CryptoKey): Promise<CryptoKey> {
  const raw = await unwrapVaultKeyRaw(header, slot, kek);
  try {
    return await importAesKey(raw);
  } finally {
    wipe(raw);
  }
}

/**
 * Like {@link unwrapVaultKey} but returns the raw key bytes, needed to wrap the key into a
 * new slot. The caller must wipe the result.
 */
export async function unwrapVaultKeyRaw(
  header: VaultHeader,
  slot: KeySlot,
  kek: CryptoKey,
): Promise<Uint8Array<ArrayBuffer>> {
  const raw = await open(kek, slot.wrappedKey, slotAad(header.vaultId, slot.id));
  try {
    const key = await importAesKey(raw);
    const check = await open(key, header.check, checkAad(header.vaultId));
    if (utf8Decode(check) !== CHECK_PLAINTEXT) throw new Error('Vault check mismatch');
    return raw;
  } catch (error) {
    wipe(raw);
    throw error;
  }
}

/** Whether `key` is this header's vault key (it opens the check value). */
export async function verifyVaultKey(header: VaultHeader, key: CryptoKey): Promise<boolean> {
  try {
    return utf8Decode(await open(key, header.check, checkAad(header.vaultId))) === CHECK_PLAINTEXT;
  } catch {
    return false;
  }
}

/** Site a passkey slot belongs to; older slots without the field were created on localhost. */
export function slotRpId(slot: KeySlot): string {
  return slot.rpId ?? 'localhost';
}

/** Passkey slots that can be used on the given site. */
export function passkeySlotsFor(header: VaultHeader, rpId: string): KeySlot[] {
  return header.keySlots.filter((s) => s.kind === 'passkey' && s.credentialId && slotRpId(s) === rpId);
}

/** Distinct sites of a header's passkeys, for messages like "these passkeys belong to …". */
export function passkeySites(header: VaultHeader): string[] {
  return [...new Set(header.keySlots.filter((s) => s.kind === 'passkey').map(slotRpId))];
}

export function isVaultHeader(value: unknown): value is VaultHeader {
  const h = value as VaultHeader;
  return (
    !!h &&
    h.version === VAULT_FORMAT_VERSION &&
    typeof h.vaultId === 'string' &&
    typeof h.prfSalt === 'string' &&
    Array.isArray(h.keySlots) &&
    !!h.check
  );
}
