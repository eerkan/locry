import { DOCUMENT, Injectable, computed, inject, signal } from '@angular/core';
import { PreferencesService } from '../preferences.service';
import {
  CHAT_MODELS,
  type ChatDtype,
  type ChatMessage,
  type ChatModelSpec,
  type ChatWorkerRequest,
  type ChatWorkerResponse,
} from './chat-protocol';

export type ChatModelStatus = 'off' | 'loading' | 'ready' | 'error' | 'unsupported';

interface Pending {
  onToken: (piece: string) => void;
  resolve: (text: string) => void;
  reject: (error: Error) => void;
}

/** Runs the chosen small language model in a Web Worker on WebGPU. */
@Injectable({ providedIn: 'root' })
export class ChatModelService {
  private readonly document = inject(DOCUMENT);
  private readonly prefs = inject(PreferencesService);
  readonly spec = computed(() => CHAT_MODELS[this.prefs.askModel()]);

  private worker: Worker | null = null;
  private loaded: ChatModelSpec | null = null;
  private readyPromise: Promise<void> | null = null;
  private nextId = 1;
  private readonly pending = new Map<number, Pending>();
  private readonly fileProgress = signal<Record<string, { loaded: number; total: number }>>({});

  private readonly _status = signal<ChatModelStatus>('off');
  private readonly _error = signal<string | null>(null);
  private readonly _dtype = signal<ChatDtype | null>(null);
  readonly status = this._status.asReadonly();
  readonly error = this._error.asReadonly();
  /** Weights in use: 16-bit where the GPU supports them. */
  readonly dtype = this._dtype.asReadonly();

  /** Download progress across model files, 0..1. */
  readonly progress = computed(() => {
    const files = Object.values(this.fileProgress());
    const total = files.reduce((sum, f) => sum + f.total, 0);
    return total ? files.reduce((sum, f) => sum + f.loaded, 0) / total : 0;
  });

  /** Loads the chosen model (downloaded once, then from the browser cache). */
  start(): Promise<void> {
    const spec = this.spec();
    if (this.readyPromise && this.loaded?.id === spec.id) return this.readyPromise;
    if (this.readyPromise) this.stop();
    this.loaded = spec;
    this._status.set('loading');
    this._error.set(null);
    this.fileProgress.set({});
    this.worker = new Worker(new URL('./chat.worker', import.meta.url), { type: 'module' });

    this.readyPromise = new Promise<void>((resolve, reject) => {
      this.worker!.addEventListener('message', ({ data }: MessageEvent<ChatWorkerResponse>) => {
        switch (data.type) {
          case 'progress':
            this.fileProgress.update((files) => ({ ...files, [data.file]: { loaded: data.loaded, total: data.total } }));
            break;
          case 'ready':
            this._dtype.set(data.dtype);
            this._status.set('ready');
            resolve();
            break;
          case 'token':
            this.pending.get(data.id)?.onToken(data.text);
            break;
          case 'done':
            this.pending.get(data.id)?.resolve(data.text);
            this.pending.delete(data.id);
            break;
          case 'error':
            if (data.id !== undefined) {
              this.pending.get(data.id)?.reject(new Error(data.message));
              this.pending.delete(data.id);
            } else {
              this.fail(data.message, data.unsupported ? 'unsupported' : 'error');
              reject(new Error(data.message));
            }
        }
      });
      this.worker!.addEventListener('error', (event) => {
        this.fail(event.message || 'Worker failed', 'error');
        reject(new Error(event.message));
      });
    });

    this.post({ type: 'init', model: spec, wasmPaths: new URL('ort/', this.document.baseURI).href });
    return this.readyPromise;
  }

  /** Stops the worker and frees the model's memory (and anything it still holds of the notes). */
  stop(): void {
    this.worker?.terminate();
    this.worker = null;
    this.readyPromise = null;
    this.loaded = null;
    for (const { reject } of this.pending.values()) reject(new Error('Model stopped'));
    this.pending.clear();
    this._status.set('off');
  }

  /** Streams an answer: `onToken` gets each new piece, the promise the whole text. */
  generate(messages: ChatMessage[], onToken: (piece: string) => void, maxNewTokens = 512): Promise<string> {
    if (this._status() !== 'ready') return Promise.reject(new Error('Model not ready'));
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { onToken, resolve, reject });
      this.post({ type: 'generate', id, messages, maxNewTokens });
    });
  }

  /** Stops the answer being written; what was generated so far is kept. */
  interrupt(): void {
    this.post({ type: 'interrupt' });
  }

  private post(message: ChatWorkerRequest): void {
    this.worker?.postMessage(message);
  }

  private fail(message: string, status: 'error' | 'unsupported'): void {
    this._status.set(status);
    this._error.set(message);
    this.worker?.terminate();
    this.worker = null;
    this.readyPromise = null;
    this.loaded = null;
  }
}
