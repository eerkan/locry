import { concatBytes, randomBytes } from './bytes';

/** Crockford Base32 alphabet: no I, L, O, U to avoid transcription mistakes. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const KEY_BYTES = 32;
const CHECKSUM_BYTES = 2;
const GROUP_SIZE = 4;

/** Generates a 256-bit recovery key. */
export function generateRecoveryKey(): Uint8Array<ArrayBuffer> {
  return randomBytes(KEY_BYTES);
}

/**
 * Formats a recovery key as grouped Crockford Base32 with a 16-bit checksum,
 * e.g. `7K3M-Q9XA-...`. The checksum lets the UI reject typos before trying to unlock.
 */
export function formatRecoveryKey(key: Uint8Array): string {
  if (key.length !== KEY_BYTES) throw new Error('Invalid recovery key length');
  const encoded = encodeBase32(concatBytes(key, checksum(key)));
  return encoded.match(new RegExp(`.{1,${GROUP_SIZE}}`, 'g'))!.join('-');
}

/** Parses user input back into key bytes. Returns null on malformed input or checksum mismatch. */
export function parseRecoveryKey(input: string): Uint8Array<ArrayBuffer> | null {
  const normalized = input
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
  if (!/^[0-9A-HJKMNP-TV-Z]+$/.test(normalized)) return null;

  const decoded = decodeBase32(normalized);
  if (!decoded || decoded.length !== KEY_BYTES + CHECKSUM_BYTES) return null;

  const key = decoded.slice(0, KEY_BYTES);
  const expected = checksum(key);
  if (decoded[KEY_BYTES] !== expected[0] || decoded[KEY_BYTES + 1] !== expected[1]) return null;
  return key;
}

/** Splits a formatted recovery key into its groups (used for the confirmation step). */
export function recoveryKeyGroups(formatted: string): string[] {
  return formatted.split('-');
}

function checksum(data: Uint8Array): Uint8Array {
  // Fletcher-16: enough to catch typos; integrity is guaranteed by AES-GCM anyway.
  let a = 0;
  let b = 0;
  for (const byte of data) {
    a = (a + byte) % 255;
    b = (b + a) % 255;
  }
  return new Uint8Array([b, a]);
}

function encodeBase32(data: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of data) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function decodeBase32(input: string): Uint8Array<ArrayBuffer> | null {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of input) {
    const index = ALPHABET.indexOf(char);
    if (index === -1) return null;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}
