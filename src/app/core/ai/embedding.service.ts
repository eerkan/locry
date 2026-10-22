import { DOCUMENT, Injectable, InjectionToken, type Signal, computed, inject, signal } from '@angular/core';
import { EMBEDDING_MODEL, type EmbeddingKind, type WorkerRequest, type WorkerResponse } from './embedding-protocol';

export type EmbedderStatus = 'off' | 'loading' | 'ready' | 'error';

/** What the index and search need from an embedding model (faked in tests). */
export interface Embedder {
  readonly status: Signal<EmbedderStatus>;
  readonly model: string;
  embed(texts: string[], kind: EmbeddingKind): Promise<Float32Array[]>;
}

export const EMBEDDER = new InjectionToken<Embedder>('EMBEDDER', {
  providedIn: 'root',
  factory: () => inject(EmbeddingService),
});

const BATCH_SIZE = 8;

/** Runs the embedding model in a Web Worker so the UI never blocks on inference. */
@Injectable({ providedIn: 'root' })
export class EmbeddingService implements Embedder {
  private readonly document = inject(DOCUMENT);
  readonly model = EMBEDDING_MODEL;

  private worker: Worker | null = null;
  private nextId = 1;
  private readonly pending = new Map<number, { resolve: (v: Float32Array[]) => void; reject: (e: Error) => void }>();
  private readonly fileProgress = signal<Record<string, { loaded: number; total: number }>>({});
  private readyPromise: Promise<void> | null = null;

  private readonly _status = signal<EmbedderStatus>('off');
  private readonly _error = signal<string | null>(null);
  readonly status = this._status.asReadonly();
  readonly error = this._error.asReadonly();

  /** Download progress across model files, 0..1. */
  readonly progress = computed(() => {
    const files = Object.values(this.fileProgress());
    const total = files.reduce((sum, f) => sum + f.total, 0);
    return total ? files.reduce((sum, f) => sum + f.loaded, 0) / total : 0;
  });

  /** Starts the worker and loads the model (downloaded once, then served from the browser cache). */
  start(): Promise<void> {
    if (this.readyPromise) return this.readyPromise;
    this._status.set('loading');
    this._error.set(null);
    this.fileProgress.set({});
    this.worker = new Worker(new URL('./embedding.worker', import.meta.url), { type: 'module' });

    this.readyPromise = new Promise<void>((resolve, reject) => {
      this.worker!.addEventListener('message', ({ data }: MessageEvent<WorkerResponse>) => {
        switch (data.type) {
          case 'progress':
            this.fileProgress.update((files) => ({ ...files, [data.file]: { loaded: data.loaded, total: data.total } }));
            break;
          case 'ready':
            this._status.set('ready');
            resolve();
            break;
          case 'result':
            this.pending.get(data.id)?.resolve(data.vectors);
            this.pending.delete(data.id);
            break;
          case 'error':
            if (data.id !== undefined) {
              this.pending.get(data.id)?.reject(new Error(data.message));
              this.pending.delete(data.id);
            } else {
              this.fail(data.message);
              reject(new Error(data.message));
            }
        }
      });
      this.worker!.addEventListener('error', (event) => {
        this.fail(event.message || 'Worker failed');
        reject(new Error(event.message));
      });
    });

    const wasmPaths = new URL('ort/', this.document.baseURI).href;
    this.post({ type: 'init', model: this.model, wasmPaths });
    return this.readyPromise;
  }

  /** Stops the worker and frees the model's memory. */
  stop(): void {
    this.worker?.terminate();
    this.worker = null;
    this.readyPromise = null;
    for (const { reject } of this.pending.values()) reject(new Error('Embedding stopped'));
    this.pending.clear();
    this._status.set('off');
  }

  async embed(texts: string[], kind: EmbeddingKind): Promise<Float32Array[]> {
    if (this._status() !== 'ready') throw new Error('Model not ready');
    const prefixed = texts.map((t) => `${kind}: ${t}`);
    const out: Float32Array[] = [];
    for (let i = 0; i < prefixed.length; i += BATCH_SIZE) {
      out.push(...(await this.request(prefixed.slice(i, i + BATCH_SIZE))));
    }
    return out;
  }

  private request(texts: string[]): Promise<Float32Array[]> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.post({ type: 'embed', id, texts });
    });
  }

  private post(message: WorkerRequest): void {
    this.worker?.postMessage(message);
  }

  private fail(message: string): void {
    this._status.set('error');
    this._error.set(message);
    this.worker?.terminate();
    this.worker = null;
    this.readyPromise = null;
  }
}
