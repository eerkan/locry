import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { noteExcerpt } from '../../features/notes/note';
import { NotesStore } from '../../features/notes/notes.store';
import { TasksStore } from '../../features/tasks/tasks.store';
import { PreferencesService } from '../preferences.service';
import { injectEncryptedCollection } from '../storage/encrypted-collection';
import { VaultService } from '../vault/vault.service';
import {
  EMBEDDING_RECORD_TYPE,
  type SearchDoc,
  chunkDoc, chunksHash, decodeVector, docKey, encodeVector, markdownToText } from './documents';
import { EMBEDDER, EmbeddingService } from './embedding.service';

/** Stored (encrypted) vectors for one document. */
export interface EmbeddingRecord {
  id: string;
  hash: string;
  model: string;
  vectors: string[];
}

const REINDEX_DELAY_MS = 800;

/**
 * Keeps an encrypted vector index of notes and tasks in sync with their content. Only the
 * documents whose text changed are re-embedded; vectors of deleted documents are removed.
 */
@Injectable({ providedIn: 'root' })
export class SemanticIndexService {
  private readonly prefs = inject(PreferencesService);
  private readonly vault = inject(VaultService);
  private readonly notes = inject(NotesStore);
  private readonly tasks = inject(TasksStore);
  private readonly embedder = inject(EMBEDDER);
  private readonly collection = injectEncryptedCollection<EmbeddingRecord>(EMBEDDING_RECORD_TYPE);

  private timer?: ReturnType<typeof setTimeout>;
  private running = false;
  private rerun = false;

  private readonly _indexing = signal<{ done: number; total: number } | null>(null);
  /** Progress while (re)embedding documents; null when idle. */
  readonly indexing = this._indexing.asReadonly();
  readonly enabled = computed(() => this.prefs.semanticSearch());
  readonly ready = computed(() => this.enabled() && this.embedder.status() === 'ready');

  /** Every searchable document, derived from the decrypted notes and tasks. */
  readonly docs = computed<SearchDoc[]>(() => [
    ...this.notes.notes().map((n) => ({
      kind: 'note' as const,
      id: n.id,
      title: n.title,
      body: markdownToText(n.content) || noteExcerpt(n),
      updatedAt: n.updatedAt,
      inactive: n.archived,
    })),
    ...this.tasks.tasks().map((t) => ({
      kind: 'task' as const,
      id: t.id,
      title: t.title,
      body: [t.notes, ...t.subtasks.map((s) => s.title)].filter(Boolean).join('\n'),
      updatedAt: t.updatedAt,
      inactive: t.done,
    })),
  ]);

  /** Decoded vectors per document key, for search. */
  readonly vectors = computed(() => {
    const model = this.embedder.model;
    const map = new Map<string, Float32Array[]>();
    for (const record of this.collection.items()) {
      if (record.model === model) map.set(record.id, record.vectors.map(decodeVector));
    }
    return map;
  });

  constructor() {
    // Run the model only while it is wanted and the vault is open.
    effect(() => {
      const wanted = this.enabled() && this.vault.isUnlocked();
      const embedder = this.embedder;
      untracked(() => {
        if (!(embedder instanceof EmbeddingService)) return;
        if (wanted) void embedder.start().catch((error) => console.error(error));
        else embedder.stop();
      });
    });

    // Re-index shortly after any change to notes, tasks or the stored index.
    effect(() => {
      if (!this.ready() || !this.collection.loaded() || !this.notes.loaded() || !this.tasks.loaded()) return;
      this.docs();
      untracked(() => this.schedule());
    });
  }

  enable(): void {
    this.prefs.setSemanticSearch(true);
  }

  /** Turns semantic search off and deletes the stored vectors. */
  async disable(): Promise<void> {
    this.prefs.setSemanticSearch(false);
    await this.collection.remove(...this.collection.items().map((r) => r.id));
  }

  /** Drops all vectors and embeds everything again. */
  async rebuild(): Promise<void> {
    await this.collection.remove(...this.collection.items().map((r) => r.id));
    this.schedule(0);
  }

  private schedule(delay = REINDEX_DELAY_MS): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.reindex(), delay);
  }

  /** Brings the index in line with the current documents. Safe to call concurrently. */
  async reindex(): Promise<void> {
    if (this.running) {
      this.rerun = true;
      return;
    }
    this.running = true;
    try {
      do {
        this.rerun = false;
        await this.syncOnce();
      } while (this.rerun && this.ready());
    } catch (error) {
      console.error('Indexing failed', error);
    } finally {
      this.running = false;
      this._indexing.set(null);
    }
  }

  private async syncOnce(): Promise<void> {
    const model = this.embedder.model;
    const docs = this.docs();
    const wanted = new Set(docs.map(docKey));

    // Remove vectors of documents that no longer exist.
    const orphans = this.collection.items().filter((r) => !wanted.has(r.id)).map((r) => r.id);
    if (orphans.length) await this.collection.remove(...orphans);

    const work: { key: string; chunks: string[]; hash: string }[] = [];
    for (const doc of docs) {
      const chunks = chunkDoc(doc);
      const hash = await chunksHash(model, chunks);
      if (this.collection.byId(docKey(doc))?.hash !== hash) work.push({ key: docKey(doc), chunks, hash });
    }
    if (!work.length) return;

    this._indexing.set({ done: 0, total: work.length });
    for (const [i, item] of work.entries()) {
      if (!this.ready()) return;
      const vectors = item.chunks.length ? await this.embedder.embed(item.chunks, 'passage') : [];
      await this.collection.put({ id: item.key, hash: item.hash, model, vectors: vectors.map(encodeVector) });
      this._indexing.set({ done: i + 1, total: work.length });
    }
  }
}
