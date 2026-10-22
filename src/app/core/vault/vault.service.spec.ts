import { TestBed } from '@angular/core/testing';
import { IDBFactory } from 'fake-indexeddb';
import { randomBytes } from '../crypto/bytes';
import { EncryptedStore } from '../storage/encrypted-store.service';
import { LocryDb } from '../storage/locry-db';
import { type PasskeyAssertion, PasskeyClient } from './passkey';
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
    expect(await db.getHeader()).toBeUndefined();
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
});
