import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IDBFactory } from 'fake-indexeddb';
import { NotesStore } from '../../features/notes/notes.store';
import { TasksStore } from '../../features/tasks/tasks.store';
import { BackupService } from '../backup/backup.service';
import { openBackup, readBackup } from '../backup/backup-format';
import { randomBytes } from '../crypto/bytes';
import { PreferencesService } from '../preferences.service';
import { EncryptedStore } from '../storage/encrypted-store.service';
import { LocryDb } from '../storage/locry-db';
import { PasskeyClient } from '../vault/passkey';
import { VaultService } from '../vault/vault.service';
import { EMBEDDING_RECORD_TYPE, chunkDoc, decodeVector, encodeVector, markdownToText } from './documents';
import { EMBEDDER, type Embedder } from './embedding.service';
import { SearchService, keywordScore, relevanceScale, snippet } from './search.service';
import { SemanticIndexService } from './semantic-index.service';

/**
 * Deterministic stand-in for the model. Similarity is 0.78 + 0.22 x (word overlap cosine),
 * mimicking the narrow band measured for e5: unrelated ~0.78, related ~0.85+.
 */
class FakeEmbedder implements Embedder {
  readonly status = signal<'ready'>('ready');
  readonly model = 'fake-model';
  calls: string[][] = [];

  async embed(texts: string[]): Promise<Float32Array[]> {
    this.calls.push(texts);
    return texts.map((text) => {
      const words = new Float32Array(383);
      for (const word of text.toLocaleLowerCase('tr').split(/[^\p{L}\d]+/u).filter((w) => w.length > 2)) {
        let h = 0;
        for (const ch of word) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
        words[h % 383] += 1;
      }
      const norm = Math.hypot(...words) || 1;
      const v = new Float32Array(384);
      v[0] = Math.sqrt(0.78);
      for (let i = 0; i < 383; i++) v[i + 1] = (Math.sqrt(0.22) * words[i]) / norm;
      return v;
    });
  }
}

describe('documents', () => {
  it('strips Markdown to plain text', () => {
    expect(markdownToText('# Başlık\n\n- [x] **görev** ve [bağlantı](https://x.y)\n\n```js\nconst a = 1;\n```')).toBe(
      'Başlık\n\ngörev ve bağlantı\n\nconst a = 1;',
    );
  });

  it('chunks long text and prefixes each chunk with the title', () => {
    const body = Array.from({ length: 30 }, (_, i) => `Paragraf ${i} ${'kelime '.repeat(10)}`).join('\n\n');
    const chunks = chunkDoc({ title: 'Uzun not', body });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.startsWith('Uzun not\n') && c.length <= 600 + 'Uzun not\n'.length)).toBe(true);
    expect(chunkDoc({ title: 'Sadece başlık', body: '' })).toEqual(['Sadece başlık']);
    expect(chunkDoc({ title: '', body: '' })).toEqual([]);
  });

  it('round-trips vectors through base64', () => {
    const v = new Float32Array([0.1, -0.5, 3.25]);
    expect(Array.from(decodeVector(encodeVector(v)))).toEqual(Array.from(v));
  });
});

describe('scoring', () => {
  it('weighs title matches above body matches', () => {
    expect(keywordScore({ title: 'Market listesi', body: '' }, ['market'])).toBe(1);
    expect(keywordScore({ title: 'Liste', body: 'market' }, ['market'])).toBe(0.7);
    expect(keywordScore({ title: 'Liste', body: '' }, ['market'])).toBe(0);
  });

  it('only matches very short terms at the start of a word', () => {
    expect(keywordScore({ title: 'Kitap listesi', body: 'alisveris' }, ['is'])).toBe(0);
    expect(keywordScore({ title: 'Is gorusmesi', body: '' }, ['is'])).toBe(1);
    expect(keywordScore({ title: 'Yeni (is) planı', body: '' }, ['is'])).toBe(1);
  });

  it('judges relevance against the query\'s own score distribution', () => {
    // Measured with the real model for "egzersiz": only the right note stands out.
    const sims = [0.839, 0.83, 0.825, 0.81, 0.81, 0.807, 0.804, 0.793];
    const relevance = relevanceScale(sims, 1.2, 0.84);
    expect(sims.filter((s) => relevance(s) >= 1)).toEqual([0.839]);
    // Too few documents for statistics: absolute floor.
    const few = relevanceScale([0.83, 0.86], 1.2, 0.84);
    expect([few(0.83) >= 1, few(0.86) >= 1]).toEqual([false, true]);
  });

  it('builds a snippet around the first match', () => {
    const body = `${'a '.repeat(100)}Işık ayarları burada ${'b '.repeat(100)}`;
    const s = snippet({ body }, ['isik']);
    expect(s).toContain('Işık ayarları');
    expect(s.startsWith('…') && s.endsWith('…')).toBe(true);
  });
});

describe('semantic index and search', () => {
  let embedder: FakeEmbedder;
  let notes: NotesStore;
  let tasks: TasksStore;
  let index: SemanticIndexService;
  let search: SearchService;
  let store: EncryptedStore;

  async function settle(): Promise<void> {
    for (let i = 0; i < 100; i++) {
      TestBed.tick();
      await new Promise((r) => setTimeout(r, 10));
      if (notes.loaded() && tasks.loaded() && !index.indexing()) {
        await index.reindex();
        return;
      }
    }
  }

  beforeEach(async () => {
    globalThis.indexedDB = new IDBFactory();
    localStorage.clear();
    embedder = new FakeEmbedder();
    const prf = randomBytes(32);
    TestBed.configureTestingModule({
      providers: [
        { provide: EMBEDDER, useValue: embedder },
        {
          provide: PasskeyClient,
          useValue: {
            register: async () => ({ credentialId: 'c', prfOutput: new Uint8Array(prf) }),
            assert: async () => ({ credentialId: 'c', prfOutput: new Uint8Array(prf) }),
          },
        },
      ],
    });
    TestBed.inject(PreferencesService).setSemanticSearch(true);
    const vault = TestBed.inject(VaultService);
    notes = TestBed.inject(NotesStore);
    tasks = TestBed.inject(TasksStore);
    index = TestBed.inject(SemanticIndexService);
    search = TestBed.inject(SearchService);
    store = TestBed.inject(EncryptedStore);
    await vault.init();
    await vault.completeSetup(await vault.prepareVault('Mac'));
    await settle();
  });

  afterEach(() => TestBed.inject(LocryDb).close());

  it('embeds new documents, re-embeds only changed ones and drops deleted ones', async () => {
    const a = await notes.create({ title: 'Tatil planı', content: 'Antalya otel rezervasyonu ve uçak bileti' });
    await notes.create({ title: 'Fizik', content: 'Kuantum dalga fonksiyonu' });
    await tasks.createTask('Faturayı öde');
    await settle();
    expect(index.vectors().size).toBe(3);
    const embeddedTexts = embedder.calls.flat().length;

    await notes.update(a.id, { content: 'Antalya otel rezervasyonu, uçak bileti ve araç kiralama' });
    await settle();
    expect(embedder.calls.flat().length).toBe(embeddedTexts + 1);

    await notes.remove(a.id);
    await settle();
    expect(index.vectors().size).toBe(2);
    // Stored vectors are encrypted like everything else.
    expect((await store.list(EMBEDDING_RECORD_TYPE)).length).toBe(2);
  });

  it('finds documents by keyword and by meaning', async () => {
    await notes.create({ title: 'Yaz planı', content: 'Antalya otel rezervasyonu ve uçak bileti al' });
    await notes.create({ title: 'Fizik', content: 'Kuantum dalga fonksiyonu' });
    await tasks.createTask('Otel faturasını öde');
    await settle();

    const byKeyword = await search.search('kuantum');
    expect(byKeyword[0].doc.title).toBe('Fizik');
    expect(byKeyword[0].matchedBy).toBe('both');

    // No keyword in common with the title; found through shared words in the body.
    const byMeaning = await search.search('rezervasyonu bileti', { kind: 'note' });
    expect(byMeaning.map((r) => r.doc.title)).toEqual(['Yaz planı']);

    expect((await search.search('otel', { kind: 'task' })).map((r) => r.doc.title)).toEqual(['Otel faturasını öde']);
    expect(await search.search('   ')).toEqual([]);
  });

  it('falls back to keyword search when semantic search is off', async () => {
    await index.disable();
    await notes.create({ title: 'Toplantı', content: 'Sunum hazırla' });
    await settle();
    expect(index.vectors().size).toBe(0);
    const results = await search.search('sunum');
    expect(results.map((r) => [r.doc.title, r.matchedBy])).toEqual([['Toplantı', 'keyword']]);
  });

  it('suggests similar notes', async () => {
    const a = await notes.create({ title: 'Antalya tatili', content: 'otel rezervasyonu plaj deniz' });
    await notes.create({ title: 'Bodrum tatili', content: 'otel rezervasyonu plaj tekne' });
    await notes.create({ title: 'Vergi', content: 'beyanname muhasebe' });
    await settle();
    expect(search.similarNotes(a.id).map((r) => r.doc.title)).toEqual(['Bodrum tatili']);
  });

  it('leaves vectors out of backups', async () => {
    await notes.create({ title: 'Not', content: 'içerik' });
    await settle();
    expect(index.vectors().size).toBe(1);
    const backups = TestBed.inject(BackupService);
    const file = await backups.export();
    const records = await openBackup(readBackup(file), TestBed.inject(VaultService).requireKey());
    expect(records.map((r) => r.type)).toEqual(['note']);
  });
});
