import { fromBase64Url, randomBytes, toBase64Url, utf8Encode } from './bytes';

const IV_BYTES = 12;

/** AES-GCM ciphertext with its IV, both base64url encoded so it can be stored as JSON. */
export interface SealedBox {
  iv: string;
  ct: string;
}

/** Imports raw bytes as a non-extractable AES-256-GCM key. */
export function importAesKey(raw: BufferSource): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

/** Derives a non-extractable AES-256-GCM key from high-entropy input keying material. */
export async function deriveAesKey(
  ikm: BufferSource,
  salt: BufferSource,
  info: string,
): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt, info: utf8Encode(info) },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypts with AES-256-GCM. `aad` binds the ciphertext to its context (record type and id),
 * so a ciphertext copied into another slot fails to decrypt.
 */
export async function seal(key: CryptoKey, plaintext: BufferSource, aad: string): Promise<SealedBox> {
  const iv = randomBytes(IV_BYTES);
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: utf8Encode(aad) },
    key,
    plaintext,
  );
  return { iv: toBase64Url(iv), ct: toBase64Url(ct) };
}

/** Decrypts a {@link SealedBox}. Throws if the key, AAD or ciphertext do not match. */
export async function open(key: CryptoKey, box: SealedBox, aad: string): Promise<Uint8Array<ArrayBuffer>> {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64Url(box.iv), additionalData: utf8Encode(aad) },
    key,
    fromBase64Url(box.ct),
  );
  return new Uint8Array(plaintext);
}
