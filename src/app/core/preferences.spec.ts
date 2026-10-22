import { TestBed } from '@angular/core/testing';
import { IDBFactory } from 'fake-indexeddb';
import { randomBytes } from './crypto/bytes';
import { PreferencesService } from './preferences.service';
import { LocryDb } from './storage/locry-db';
import { PasskeyClient } from './vault/passkey';
import { VaultRegistry } from './vault/vault-registry';
import { VaultService } from './vault/vault.service';

const prf = randomBytes(32);
const passkeys = {
  register: async () => ({ credentialId: 'c', prfOutput: new Uint8Array(prf) }),
  assert: async () => ({ credentialId: 'c', prfOutput: new Uint8Array(prf) }),
};

describe('PreferencesService embedding model', () => {
  async function boot(): Promise<{ vault: VaultService; prefs: PreferencesService }> {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: PasskeyClient, useValue: passkeys }] });
    const vault = TestBed.inject(VaultService);
    await vault.init();
    return { vault, prefs: TestBed.inject(PreferencesService) };
  }

  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
    localStorage.clear();
  });

  afterEach(() => {
    TestBed.inject(LocryDb).close();
    TestBed.inject(VaultRegistry).close();
  });

  it('uses EmbeddingGemma for new vaults', async () => {
    const { vault, prefs } = await boot();
    await vault.completeSetup(await vault.prepareVault('Mac'));
    expect(prefs.embeddingModel()).toBe('embeddinggemma');
    prefs.setSemanticSearch(true);
    expect([...prefs.embeddingModelsInUse()]).toEqual(['embeddinggemma']);
  });

  it('keeps e5-small for vaults that turned smart search on before models were selectable', async () => {
    const first = await boot();
    await first.vault.completeSetup(await first.vault.prepareVault('Mac'));
    const id = first.vault.activeVault()!.id;
    TestBed.inject(LocryDb).close();
    TestBed.inject(VaultRegistry).close();
    localStorage.setItem('locry.preferences', JSON.stringify({ vaults: { [id]: { semanticSearch: true } } }));

    const { prefs } = await boot();
    expect(prefs.embeddingModel()).toBe('e5-small');
    prefs.setEmbeddingModel('bge-m3');
    expect(prefs.embeddingModel()).toBe('bge-m3');
    expect([...prefs.embeddingModelsInUse()]).toEqual(['bge-m3']);
  });
});
