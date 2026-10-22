import { TestBed } from '@angular/core/testing';
import { IDBFactory } from 'fake-indexeddb';
import { deleteDB } from 'idb';
import { randomBytes } from '../crypto/bytes';
import { EncryptedStore } from '../storage/encrypted-store.service';
import { LocryDb } from '../storage/locry-db';
import { type PasskeyAssertion, PasskeyClient } from './passkey';
import { LEGACY_DB_NAME } from '../storage/locry-db';
import { VaultRegistry } from './vault-registry';
import { VaultService } from './vault.service';

/** Simulates one authenticator: a fixed credential id and a fixed PRF output. */
class FakePasskeyClient {
  private readonly prfOutput = randomBytes(32);
  nextAssertion: PasskeyAssertion | null = null;

  async register() {
    return { credentialId: 'cred-1', prfOutput: new Uint8Array(this.prfOutput) };
  }

  async assert() {
    const next = this.nextAssertion;
    this.nextAssertion = null;
    return next ?? { credentialId: 'cred-1', prfOutput: new Uint8Array(this.prfOutput) };
  }
}

const authenticator = new FakePasskeyClient();

function configure(): void {
  TestBed.configureTestingModule({ providers: [{ provide: PasskeyClient, useValue: authenticator }] });
}

describe('VaultService', () => {
  let vault: VaultService;
  let store: EncryptedStore;
  let db: LocryDb;

  beforeEach(async () => {
    globalThis.indexedDB = new IDBFactory();
    configure();
    vault = TestBed.inject(VaultService);
    store = TestBed.inject(EncryptedStore);
    db = TestBed.inject(LocryDb);
    await vault.init();
  });

  afterEach(() => {
    db.close();
  });

  async function createVault(): Promise<string> {
    const pending = await vault.prepareVault('Test');
    await vault.completeSetup(pending);
    return pending.recoveryKey;
  }

  it('starts empty and does not persist anything before setup completes', async () => {
    expect(vault.status()).toBe('empty');
    await vault.prepareVault('Test');
    expect(vault.vaults()).toEqual([]);
    expect((await indexedDB.databases()).map((d) => d.name)).not.toContain(expect.stringMatching(/^locry-vault-/));
    expect(vault.status()).toBe('empty');
  });

  it('creates a vault with a passkey slot and a recovery slot', async () => {
    await createVault();
    expect(vault.status()).toBe('unlocked');
    const header = await db.getHeader();
    expect(header?.keySlots.map((s) => s.kind)).toEqual(['passkey', 'recovery']);
  });

  it('encrypts records at rest and reads them back', async () => {
    await createVault();
    await store.put('note', 'n1', { title: 'Gizli not', body: 'çok gizli içerik' });

    const raw = await db.getRecord('n1');
    expect(JSON.stringify(raw)).not.toContain('Gizli');
    expect(await store.get('note', 'n1')).toEqual({ title: 'Gizli not', body: 'çok gizli içerik' });
    expect(await store.list('note')).toHaveLength(1);
  });

  it('refuses to read records while locked', async () => {
    await createVault();
    await store.put('note', 'n1', { title: 'x' });
    vault.lock();
    expect(vault.status()).toBe('locked');
    await expect(store.get('note', 'n1')).rejects.toThrow('locked');
  });

  it('unlocks with the passkey after locking', async () => {
    await createVault();
    await store.put('note', 'n1', { title: 'x' });
    vault.lock();
    await vault.unlockWithPasskey();
    expect(await store.get('note', 'n1')).toEqual({ title: 'x' });
  });

  it('unlocks with the recovery key after a fresh start', async () => {
    const recoveryKey = await createVault();
    await store.put('note', 'n1', { title: 'x' });

    // Simulate a page reload: new service instances over the same database.
    TestBed.resetTestingModule();
    configure();
    const reloaded = TestBed.inject(VaultService);
    await reloaded.init();
    expect(reloaded.status()).toBe('locked');

    await reloaded.unlockWithRecoveryKey(recoveryKey.toLowerCase());
    expect(await TestBed.inject(EncryptedStore).get('note', 'n1')).toEqual({ title: 'x' });
  });

  it('reports malformed and wrong recovery keys distinctly', async () => {
    await createVault();
    vault.lock();
    await expect(vault.unlockWithRecoveryKey('not a key')).rejects.toMatchObject({ code: 'invalidRecoveryKey' });

    const other = await vault.prepareVault('Other');
    await expect(vault.unlockWithRecoveryKey(other.recoveryKey)).rejects.toMatchObject({
      code: 'wrongRecoveryKey',
    });
    expect(vault.status()).toBe('locked');
  });

  it('rejects a passkey that has no slot in this vault', async () => {
    await createVault();
    vault.lock();
    authenticator.nextAssertion = { credentialId: 'stranger', prfOutput: randomBytes(32) };
    await expect(vault.unlockWithPasskey()).rejects.toMatchObject({ code: 'unknownPasskey' });
  });

  describe('multiple vaults', () => {
    async function reload(): Promise<VaultService> {
      db.close();
      TestBed.inject(VaultRegistry).close();
      TestBed.resetTestingModule();
      configure();
      const reloaded = TestBed.inject(VaultService);
      await reloaded.init();
      return reloaded;
    }

    it('keeps each vault in its own database and switches through the lock screen', async () => {
      await vault.completeSetup(await vault.prepareVault('Mac', { name: 'Kişisel' }));
      await store.put('note', 'personal', { title: 'Kişisel not' });
      vault.lock();

      await vault.completeSetup(await vault.prepareVault('Mac', { name: 'İş', color: 'green' }));
      expect(vault.vaults().map((v) => [v.name, v.color])).toEqual([
        ['Kişisel', 'blue'],
        ['İş', 'green'],
      ]);
      expect(vault.activeVault()?.name).toBe('İş');
      expect(await store.list('note')).toEqual([]);
      await store.put('note', 'work', { title: 'İş notu' });

      const personal = vault.vaults()[0];
      await vault.select(personal.id);
      expect(vault.status()).toBe('locked');
      expect(vault.consumeLockDestination()).toBe('/unlock');
      expect(vault.header()?.vaultId).toBe(personal.id);
      await vault.unlockWithPasskey();
      expect((await store.list<{ title: string }>('note')).map((n) => n.title)).toEqual(['Kişisel not']);
    });

    it('remembers the last selected vault after a reload', async () => {
      await vault.completeSetup(await vault.prepareVault('Mac', { name: 'A' }));
      vault.lock();
      await vault.completeSetup(await vault.prepareVault('Mac', { name: 'B' }));
      await vault.select(vault.vaults()[0].id);

      const reloaded = await reload();
      expect(reloaded.vaults().map((v) => v.name)).toEqual(['A', 'B']);
      expect(reloaded.activeVault()?.name).toBe('A');
      expect(reloaded.status()).toBe('locked');
    });

    it('renames a vault', async () => {
      await vault.completeSetup(await vault.prepareVault('Mac', { name: 'Eski' }));
      await vault.updateProfile(vault.activeVault()!.id, { name: '  Yeni  ', color: 'pink' });
      const reloaded = await reload();
      expect(reloaded.activeVault()).toMatchObject({ name: 'Yeni', color: 'pink' });
    });

    it('lists the database of the single-vault version as a vault', async () => {
      const pending = await vault.prepareVault('Mac');
      db.use(LEGACY_DB_NAME);
      await db.putHeader(pending.header);
      // As on the first start after the update: no vault list yet.
      TestBed.inject(VaultRegistry).close();
      await deleteDB('locry-vaults');

      const reloaded = await reload();
      expect(reloaded.vaults()).toEqual([expect.objectContaining({ id: pending.header.vaultId, dbName: LEGACY_DB_NAME, name: '' })]);
      expect(reloaded.status()).toBe('locked');
      await reloaded.unlockWithRecoveryKey(pending.recoveryKey);
      expect(reloaded.isUnlocked()).toBe(true);
    });

    it('deletes a vault and its database after re-authentication', async () => {
      await vault.completeSetup(await vault.prepareVault('Mac', { name: 'Kalacak' }));
      vault.lock();
      const doomed = await vault.prepareVault('Mac', { name: 'Silinecek' });
      await vault.completeSetup(doomed);
      await store.put('note', 'n1', { title: 'x' });

      await expect(vault.deleteVault({ method: 'recovery', recoveryKey: 'wrong' })).rejects.toMatchObject({
        code: 'invalidRecoveryKey',
      });
      await vault.deleteVault({ method: 'recovery', recoveryKey: doomed.recoveryKey });
      expect(vault.vaults().map((v) => v.name)).toEqual(['Kalacak']);
      expect(vault.activeVault()?.name).toBe('Kalacak');
      expect(vault.status()).toBe('locked');
      expect(vault.consumeLockDestination()).toBe('/');
      const names = (await indexedDB.databases()).map((d) => d.name);
      expect(names).not.toContain(`locry-vault-${doomed.header.vaultId}`);

      await vault.unlockWithPasskey();
      await vault.deleteVault({ method: 'passkey' });
      expect(vault.status()).toBe('empty');
      expect(vault.vaults()).toEqual([]);
    });
  });
});
