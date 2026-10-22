import { deriveAesKey, importAesKey, open, seal } from './aead';
import { fromBase64Url, randomBytes, toBase64Url, utf8Decode, utf8Encode } from './bytes';
import { formatRecoveryKey, generateRecoveryKey, parseRecoveryKey } from './recovery-key';

describe('bytes', () => {
  it('round-trips base64url', () => {
    const bytes = randomBytes(37);
    expect(fromBase64Url(toBase64Url(bytes))).toEqual(bytes);
    expect(toBase64Url(bytes)).not.toMatch(/[+/=]/);
  });
});

describe('aead', () => {
  it('seals and opens with matching key and AAD', async () => {
    const key = await importAesKey(randomBytes(32));
    const box = await seal(key, utf8Encode('merhaba dünya'), 'ctx');
    expect(utf8Decode(await open(key, box, 'ctx'))).toBe('merhaba dünya');
  });

  it('uses a fresh IV for every seal', async () => {
    const key = await importAesKey(randomBytes(32));
    const a = await seal(key, utf8Encode('same'), 'ctx');
    const b = await seal(key, utf8Encode('same'), 'ctx');
    expect(a.iv).not.toBe(b.iv);
    expect(a.ct).not.toBe(b.ct);
  });

  it('rejects a different AAD', async () => {
    const key = await importAesKey(randomBytes(32));
    const box = await seal(key, utf8Encode('secret'), 'note:1');
    await expect(open(key, box, 'note:2')).rejects.toThrow();
  });

  it('rejects a different key', async () => {
    const box = await seal(await importAesKey(randomBytes(32)), utf8Encode('secret'), 'ctx');
    await expect(open(await importAesKey(randomBytes(32)), box, 'ctx')).rejects.toThrow();
  });

  it('derives the same key for the same inputs only', async () => {
    const ikm = randomBytes(32);
    const salt = randomBytes(16);
    const box = await seal(await deriveAesKey(ikm, salt, 'info'), utf8Encode('x'), 'ctx');
    await expect(open(await deriveAesKey(ikm, salt, 'info'), box, 'ctx')).resolves.toBeTruthy();
    await expect(open(await deriveAesKey(ikm, salt, 'other'), box, 'ctx')).rejects.toThrow();
  });
});

describe('recovery key', () => {
  it('formats as dash-separated groups and parses back', () => {
    const key = generateRecoveryKey();
    const formatted = formatRecoveryKey(key);
    expect(formatted).toMatch(/^([0-9A-HJKMNP-TV-Z]{4}-)+[0-9A-HJKMNP-TV-Z]{1,4}$/);
    expect(parseRecoveryKey(formatted)).toEqual(key);
  });

  it('tolerates case, whitespace, missing dashes and look-alike letters', () => {
    const key = generateRecoveryKey();
    const formatted = formatRecoveryKey(key);
    const messy = ` ${formatted.toLowerCase().replace(/-/g, ' ').replace(/0/g, 'o').replace(/1/g, 'l')} `;
    expect(parseRecoveryKey(messy)).toEqual(key);
  });

  it('rejects typos via the checksum', () => {
    const formatted = formatRecoveryKey(generateRecoveryKey());
    const swapped = formatted[0] === 'A' ? 'B' : 'A';
    expect(parseRecoveryKey(swapped + formatted.slice(1))).toBeNull();
  });

  it('rejects malformed input', () => {
    expect(parseRecoveryKey('')).toBeNull();
    expect(parseRecoveryKey('ABCD-EFGH')).toBeNull();
    expect(parseRecoveryKey('UUUU')).toBeNull();
  });
});
