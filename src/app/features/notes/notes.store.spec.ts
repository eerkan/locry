import { TestBed } from '@angular/core/testing';
import { IDBFactory } from 'fake-indexeddb';
import { randomBytes } from '../../core/crypto/bytes';
import { LocryDb } from '../../core/storage/locry-db';
import { PasskeyClient } from '../../core/vault/passkey';
import { VaultService } from '../../core/vault/vault.service';
import { NotesStore } from './notes.store';

const prfOutput = randomBytes(32);
const fakePasskeys = {
  register: async () => ({ credentialId: 'cred', prfOutput: new Uint8Array(prfOutput) }),
  assert: async () => ({ credentialId: 'cred', prfOutput: new Uint8Array(prfOutput) }),
};

async function until(condition: () => boolean): Promise<void> {
  for (let i = 0; i < 50 && !condition(); i++) await new Promise((r) => setTimeout(r, 10));
  if (!condition()) throw new Error('condition not met');
}

describe('NotesStore', () => {
  let vault: VaultService;
  let notes: NotesStore;

  beforeEach(async () => {
    globalThis.indexedDB = new IDBFactory();
    TestBed.configureTestingModule({ providers: [{ provide: PasskeyClient, useValue: fakePasskeys }] });
    vault = TestBed.inject(VaultService);
    notes = TestBed.inject(NotesStore);
    await vault.init();
    await vault.completeSetup(await vault.prepareVault('Test'));
    TestBed.tick();
    await until(() => notes.loaded());
  });

  afterEach(() => TestBed.inject(LocryDb).close());

  it('creates, updates and sorts notes with pinned first', async () => {
    const a = await notes.create({ title: 'A' });
    await new Promise((r) => setTimeout(r, 5));
    const b = await notes.create({ title: 'B' });
    expect(notes.notes().map((n) => n.title)).toEqual(['B', 'A']);

    await notes.update(a.id, { pinned: true });
    expect(notes.notes().map((n) => n.title)).toEqual(['A', 'B']);
    expect(notes.byId(b.id)?.title).toBe('B');
  });

  it('collects unique sorted tags', async () => {
    await notes.create({ tags: ['şey', 'b'] });
    await notes.create({ tags: ['b', 'a'] });
    expect(notes.allTags()).toEqual(['a', 'b', 'şey']);
  });

  it('keeps notes created while the collection is still loading', async () => {
    await notes.create({ title: 'Önceden' });
    vault.lock();
    TestBed.tick();
    await vault.unlockWithPasskey();
    TestBed.tick(); // starts loading from the database
    await notes.create({ title: 'Yüklenirken' });
    await until(() => notes.loaded());
    await new Promise((r) => setTimeout(r, 50));
    expect(notes.notes().map((n) => n.title).sort()).toEqual(['Yüklenirken', 'Önceden']);
  });

  it('wipes decrypted notes on lock and reloads them on unlock', async () => {
    const note = await notes.create({ title: 'Gizli', content: 'içerik' });
    vault.lock();
    TestBed.tick();
    expect(notes.notes()).toEqual([]);
    expect(notes.loaded()).toBe(false);

    await vault.unlockWithPasskey();
    TestBed.tick();
    await until(() => notes.loaded());
    expect(notes.byId(note.id)?.content).toBe('içerik');
  });

  it('keeps the latest of rapid consecutive saves', async () => {
    const note = await notes.create();
    await Promise.all([1, 2, 3, 4, 5].map((n) => notes.update(note.id, { content: `v${n}` })));

    vault.lock();
    TestBed.tick();
    await vault.unlockWithPasskey();
    TestBed.tick();
    await until(() => notes.loaded());
    expect(notes.byId(note.id)?.content).toBe('v5');
  });

  it('removes notes', async () => {
    const note = await notes.create({ title: 'x' });
    await notes.remove(note.id);
    expect(notes.byId(note.id)).toBeUndefined();
  });
});
