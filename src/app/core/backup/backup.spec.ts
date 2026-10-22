import { TestBed } from '@angular/core/testing';
import { IDBFactory } from 'fake-indexeddb';
import { importAesKey } from '../crypto/aead';
import { randomBytes, utf8Decode } from '../crypto/bytes';
import { gunzip, gzip } from '../crypto/compression';
import { EncryptedStore } from '../storage/encrypted-store.service';
import { LocryDb } from '../storage/locry-db';
import { type PasskeyAssertion, PasskeyClient, type PasskeyRegistration } from '../vault/passkey';
import { passkeySlotsFor } from '../vault/vault-header';
import { VaultService } from '../vault/vault.service';
import { BackupError, createBackup, openBackup, readBackup } from './backup-format';
import { BackupService } from './backup.service';

/** A set of fake authenticators: each registration creates a new credential with its own PRF secret. */
class FakeAuthenticators {
  private readonly secrets = new Map<string, Uint8Array<ArrayBuffer>>();
  /** Which credential the next assertion uses; defaults to the first one registered. */
  use: string | null = null;
  /** Site new passkeys are created for (simulates using Locry on another address). */
  site = 'localhost';
  registered: string[] = [];

  async register(options: { excludeCredentialIds?: string[] }): Promise<PasskeyRegistration> {
    const id = `cred-${this.secrets.size + 1}`;
    if (options.excludeCredentialIds?.includes(id)) throw new Error('duplicate');
    this.secrets.set(id, randomBytes(32));
    this.registered.push(id);
    return { credentialId: id, rpId: this.site, prfOutput: new Uint8Array(this.secrets.get(id)!) };
  }

  async assert(options: { credentialIds: string[] }): Promise<PasskeyAssertion> {
    const id = this.use ?? this.registered[0];
    if (!options.credentialIds.includes(id)) throw new Error('not allowed');
    return { credentialId: id, prfOutput: new Uint8Array(this.secrets.get(id)!) };
  }
}

describe('compression', () => {
  it('round-trips and actually compresses repetitive data', async () => {
    const data = new TextEncoder().encode('locry '.repeat(1000));
    const compressed = await gzip(data);
    expect(compressed.length).toBeLessThan(data.length / 10);
    // Compare as plain arrays: the stream result comes from another realm's Uint8Array.
    expect(Array.from(await gunzip(compressed))).toEqual(Array.from(data));
  });
});

describe('backup format', () => {
  const vault = {
    version: 1 as const,
    vaultId: 'vault-1',
    prfSalt: 'salt',
    createdAt: '2026-01-01T00:00:00.000Z',
    keySlots: [],
    check: { iv: 'a', ct: 'b' },
  };
  const records = [
    { type: 'note', id: 'n1', value: { title: 'Gizli başlık', content: 'x'.repeat(5000) } },
    { type: 'task', id: 't1', value: { title: 'Görev' } },
  ];

  it('round-trips records and hides their content', async () => {
    const key = await importAesKey(randomBytes(32));
    const file = await createBackup(vault, key, records);
    expect(utf8Decode(file)).not.toContain('Gizli');
    // 5000 repeated chars compress well below their size.
    expect(file.length).toBeLessThan(2000);

    const parsed = readBackup(file);
    expect(parsed.header.vault.vaultId).toBe('vault-1');
    expect(await openBackup(parsed, key)).toEqual(records);
  });

  it('rejects a wrong key', async () => {
    const file = await createBackup(vault, await importAesKey(randomBytes(32)), records);
    await expect(openBackup(readBackup(file), await importAesKey(randomBytes(32)))).rejects.toMatchObject({
      code: 'wrongKey',
    });
  });

  it('detects tampering with the header', async () => {
    const key = await importAesKey(randomBytes(32));
    const parsed = readBackup(await createBackup(vault, key, records));
    const tampered = { ...parsed, headerBytes: new TextEncoder().encode(utf8Decode(parsed.headerBytes).replace('vault-1', 'vault-2')) };
    await expect(openBackup(tampered, key)).rejects.toBeInstanceOf(BackupError);
  });

  it('detects tampering with the payload', async () => {
    const key = await importAesKey(randomBytes(32));
    const file = await createBackup(vault, key, records);
    file[file.length - 5] ^= 1;
    await expect(openBackup(readBackup(file), key)).rejects.toMatchObject({ code: 'wrongKey' });
  });

  it('rejects files that are not backups', () => {
    expect(() => readBackup(new TextEncoder().encode('hello world, not a backup'))).toThrow(
      expect.objectContaining({ code: 'notBackup' }),
    );
    const bad = new TextEncoder().encode('LOCRY\u0009....');
    expect(() => readBackup(bad)).toThrow(expect.objectContaining({ code: 'unsupportedVersion' }));
  });
});

describe('vault management and restore', () => {
  let authenticators: FakeAuthenticators;

  async function boot(): Promise<{ vault: VaultService; store: EncryptedStore; backups: BackupService }> {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: PasskeyClient, useValue: authenticators }] });
    const vault = TestBed.inject(VaultService);
    await vault.init();
    return { vault, store: TestBed.inject(EncryptedStore), backups: TestBed.inject(BackupService) };
  }

  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
    authenticators = new FakeAuthenticators();
  });

  afterEach(() => TestBed.inject(LocryDb).close());

  it('adds, renames and removes passkeys, keeping at least one', async () => {
    const { vault } = await boot();
    await vault.completeSetup(await vault.prepareVault('MacBook'));

    await vault.addPasskey('iPhone', { method: 'passkey' });
    expect(vault.passkeySlots().map((s) => s.label)).toEqual(['MacBook', 'iPhone']);

    // The new passkey unlocks the vault on its own.
    vault.lock();
    authenticators.use = 'cred-2';
    await vault.unlockWithPasskey();
    expect(vault.isUnlocked()).toBe(true);

    await vault.renamePasskey(vault.passkeySlots()[1].id, 'iPhone 17');
    await vault.removePasskey(vault.passkeySlots()[0].id);
    expect(vault.passkeySlots().map((s) => s.label)).toEqual(['iPhone 17']);
    await expect(vault.removePasskey(vault.passkeySlots()[0].id)).rejects.toMatchObject({ code: 'lastPasskey' });

    // The removed passkey no longer opens the vault.
    vault.lock();
    authenticators.use = 'cred-1';
    await expect(vault.unlockWithPasskey()).rejects.toThrow();
  });

  it('adds a passkey after unlocking with the recovery key', async () => {
    const { vault } = await boot();
    const pending = await vault.prepareVault('Lost laptop');
    await vault.completeSetup(pending);
    vault.lock();
    await vault.unlockWithRecoveryKey(pending.recoveryKey);

    await expect(vault.addPasskey('New', { method: 'recovery', recoveryKey: 'wrong' })).rejects.toMatchObject({
      code: 'invalidRecoveryKey',
    });
    await vault.addPasskey('New', { method: 'recovery', recoveryKey: pending.recoveryKey });
    expect(vault.passkeySlots()).toHaveLength(2);
  });

  it('rotates the recovery key only when committed', async () => {
    const { vault } = await boot();
    const setup = await vault.prepareVault('Mac');
    await vault.completeSetup(setup);

    const rotation = await vault.prepareRecoveryKey({ method: 'passkey' });
    vault.lock();
    await vault.unlockWithRecoveryKey(setup.recoveryKey); // old key still valid

    await vault.commitRecoveryKey(rotation);
    vault.lock();
    await expect(vault.unlockWithRecoveryKey(setup.recoveryKey)).rejects.toMatchObject({ code: 'wrongRecoveryKey' });
    await vault.unlockWithRecoveryKey(rotation.recoveryKey);
    expect(vault.isUnlocked()).toBe(true);
  });

  it('merges a backup, keeping newer local edits', async () => {
    const { vault, store, backups } = await boot();
    await vault.completeSetup(await vault.prepareVault('Mac'));
    await store.put('note', 'a', { title: 'A v1', updatedAt: '2026-01-01' });
    await store.put('note', 'b', { title: 'B v1', updatedAt: '2026-01-01' });
    const file = await backups.export();

    await store.put('note', 'a', { title: 'A v2 (local, newer)', updatedAt: '2026-02-01' });
    await store.delete('b');
    await store.put('note', 'c', { title: 'C local only', updatedAt: '2026-02-01' });

    const opened = await backups.open(backups.read(file), { method: 'current' });
    const summary = await backups.restore(opened, 'merge');
    expect(summary).toEqual({ restored: 1, keptLocal: 1, byType: { note: 1 } });
    expect((await store.list<{ title: string }>('note')).map((n) => n.title).sort()).toEqual([
      'A v2 (local, newer)',
      'B v1',
      'C local only',
    ]);
  });

  it('replaces everything with a backup', async () => {
    const { vault, store, backups } = await boot();
    await vault.completeSetup(await vault.prepareVault('Mac'));
    await store.put('note', 'a', { title: 'from backup' });
    const file = await backups.export();
    await store.put('note', 'z', { title: 'added later' });

    const revision = store.revision();
    await backups.restore(await backups.open(backups.read(file), { method: 'current' }), 'replace');
    expect((await store.list<{ title: string }>('note')).map((n) => n.title)).toEqual(['from backup']);
    expect(store.revision()).toBe(revision + 1);
  });

  it('restores a backup on a new device with the synced passkey or the recovery key', async () => {
    const first = await boot();
    const setup = await first.vault.prepareVault('Mac');
    await first.vault.completeSetup(setup);
    await first.store.put('task', 't1', { title: 'Taşınacak görev' });
    const file = await first.backups.export();
    TestBed.inject(LocryDb).close();

    // New device: empty database, but the passkey syncs (same fake authenticators).
    globalThis.indexedDB = new IDBFactory();
    const second = await boot();
    expect(second.vault.status()).toBe('empty');
    const backup = second.backups.read(file);
    await expect(second.backups.open(backup, { method: 'recovery', recoveryKey: 'nope' })).rejects.toMatchObject({
      code: 'invalidRecoveryKey',
    });
    const opened = await second.backups.open(backup, { method: 'passkey' });
    await second.backups.restoreAsNewVault(opened);
    expect(second.vault.status()).toBe('unlocked');
    expect(await second.store.get('task', 't1')).toEqual({ title: 'Taşınacak görev' });

    // Same vault id and slots: the original recovery key opens it after a reload.
    second.vault.lock();
    await second.vault.unlockWithRecoveryKey(setup.recoveryKey);
    expect(second.vault.header()?.vaultId).toBe(first.vault.header()?.vaultId);
  });

  it('records the site of each passkey and only uses passkeys of the current site', async () => {
    const { vault } = await boot();
    await vault.completeSetup(await vault.prepareVault('Mac'));
    expect(vault.passkeySlots()[0].rpId).toBe(vault.rpId);
    expect(vault.localPasskeySlots()).toHaveLength(1);
  });

  it('restores a backup made on another site with the recovery key, then adds a passkey here', async () => {
    // Vault created on a public domain.
    authenticators.site = 'locry.example.com';
    const first = await boot();
    const setup = await first.vault.prepareVault('Phone');
    await first.vault.completeSetup(setup);
    await first.store.put('note', 'n1', { title: 'Domainden gelen not' });
    const file = await first.backups.export();
    TestBed.inject(LocryDb).close();

    // Restored on localhost: the backup's passkeys cannot work here.
    globalThis.indexedDB = new IDBFactory();
    authenticators.site = 'localhost';
    const second = await boot();
    const backup = second.backups.read(file);
    await expect(second.backups.open(backup, { method: 'passkey' })).rejects.toMatchObject({ code: 'noPasskeyForSite' });
    await second.backups.restoreAsNewVault(await second.backups.open(backup, { method: 'recovery', recoveryKey: setup.recoveryKey }));
    expect(await second.store.get('note', 'n1')).toEqual({ title: 'Domainden gelen not' });
    expect(second.vault.localPasskeySlots()).toEqual([]);

    second.vault.lock();
    await expect(second.vault.unlockWithPasskey()).rejects.toMatchObject({ code: 'noPasskeyForSite' });
    await second.vault.unlockWithRecoveryKey(setup.recoveryKey);
    await second.vault.addPasskey('Mac', { method: 'recovery', recoveryKey: setup.recoveryKey });
    expect(second.vault.localPasskeySlots().map((s) => s.rpId)).toEqual(['localhost']);

    second.vault.lock();
    authenticators.use = second.vault.localPasskeySlots()[0].credentialId!;
    await second.vault.unlockWithPasskey();
    expect(second.vault.isUnlocked()).toBe(true);
  });

  it('treats passkey slots without a site as localhost (created before sites were recorded)', async () => {
    const { vault } = await boot();
    await vault.completeSetup(await vault.prepareVault('Mac'));
    const header = vault.header()!;
    const legacy = { ...header, keySlots: header.keySlots.map(({ rpId: _rpId, ...slot }) => slot) };
    expect(passkeySlotsFor(legacy, 'localhost')).toHaveLength(1);
    expect(passkeySlotsFor(legacy, 'locry.example.com')).toHaveLength(0);
  });
});
