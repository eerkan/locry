import { DOCUMENT, DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { pruneModelCache } from '../ai/model-cache';
import { PreferencesService } from '../preferences.service';
import { VaultService } from '../vault/vault.service';
import {
  SPEECH_MODELS,
  SPEECH_SAMPLE_RATE,
  type SpeechDevice,
  type SpeechModelId,
  type SpeechWorkerRequest,
  type SpeechWorkerResponse,
  cleanTranscript,
} from './speech-protocol';

/** Long enough for a note, short enough to transcribe quickly; the button stops there. */
export const MAX_RECORDING_MS = 3 * 60_000;

export type DictationState = 'idle' | 'loading' | 'recording' | 'transcribing';
export type DictationError = 'microphone' | 'unsupported' | 'model' | 'empty' | 'failed';

export class DictationFailure extends Error {
  constructor(readonly code: DictationError, cause?: unknown) {
    super(`Dictation failed: ${code}`, { cause });
  }
}

/**
 * Dictation with Whisper, entirely on this device: the microphone is recorded in memory,
 * converted to 16 kHz audio, transcribed in a Web Worker and then dropped. Nothing is stored
 * or sent anywhere; the model is downloaded once from Hugging Face. One recording at a time.
 */
@Injectable({ providedIn: 'root' })
export class DictationService {
  private readonly document = inject(DOCUMENT);
  private readonly prefs = inject(PreferencesService);
  private readonly vault = inject(VaultService);

  private worker: Worker | null = null;
  private loadedModel: SpeechModelId | null = null;
  private ready: Promise<void> | null = null;
  private nextId = 1;
  private readonly pending = new Map<number, { resolve: (text: string) => void; reject: (error: Error) => void }>();
  private readonly fileProgress = signal<Record<string, { loaded: number; total: number }>>({});

  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private finished?: (blob: Blob | null) => void;

  private readonly _state = signal<DictationState>('idle');
  private readonly _device = signal<SpeechDevice | null>(null);
  private readonly _startedAt = signal<number | null>(null);
  /** Which control started the recording, so only that one shows it. */
  private readonly _owner = signal<string | null>(null);
  readonly state = this._state.asReadonly();
  readonly device = this._device.asReadonly();
  readonly startedAt = this._startedAt.asReadonly();
  readonly owner = this._owner.asReadonly();
  readonly enabled = computed(() => this.prefs.speechEnabled());
  readonly spec = computed(() => SPEECH_MODELS[this.prefs.speechModel()]);
  /** Model download progress, 0..1. */
  readonly progress = computed(() => {
    const files = Object.values(this.fileProgress());
    const total = files.reduce((sum, f) => sum + f.total, 0);
    return total ? files.reduce((sum, f) => sum + f.loaded, 0) / total : 0;
  });
  readonly supported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

  constructor() {
    // Locking stops any recording and frees the model's memory.
    effect(() => {
      if (!this.vault.isUnlocked()) untracked(() => this.shutdown());
    });
    inject(DestroyRef).onDestroy(() => this.shutdown());
  }

  /** Starts recording (from a click: the browser asks for the microphone the first time). */
  async start(owner: string): Promise<void> {
    if (this._state() !== 'idle') return;
    if (!this.supported) throw new DictationFailure('unsupported');
    this._owner.set(owner);
    if (!this.prefs.speechEnabled()) this.prefs.setVoice({ speechEnabled: true });
    // Load the model while the user speaks; recording does not wait for it.
    void this.load().catch(() => undefined);
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (error) {
      this.reset();
      throw new DictationFailure('microphone', error);
    }
    this.chunks = [];
    this.recorder = new MediaRecorder(this.stream);
    this.recorder.addEventListener('dataavailable', (e) => e.data.size && this.chunks.push(e.data));
    this.recorder.addEventListener('stop', () => {
      const blob = this.chunks.length ? new Blob(this.chunks, { type: this.recorder?.mimeType }) : null;
      this.chunks = [];
      this.finished?.(blob);
    });
    this.recorder.start(1000);
    this._startedAt.set(Date.now());
    this._state.set('recording');
  }

  /** Stops recording and returns the transcript (empty audio fails with `empty`). */
  async stop(): Promise<string> {
    if (this._state() !== 'recording' || !this.recorder) return '';
    const blob = await new Promise<Blob | null>((resolve) => {
      this.finished = resolve;
      if (this.recorder!.state === 'recording') this.recorder!.stop();
      else resolve(null);
    });
    this.releaseMicrophone();
    this._state.set('transcribing');
    try {
      if (!blob) throw new DictationFailure('empty');
      const audio = await decode(blob);
      if (!audio.length || isSilent(audio)) throw new DictationFailure('empty');
      try {
        await this.load();
      } catch (error) {
        throw new DictationFailure(this.loadError === 'unsupported' ? 'unsupported' : 'model', error);
      }
      const text = cleanTranscript(await this.transcribe(audio));
      if (!text) throw new DictationFailure('empty');
      return text;
    } catch (error) {
      throw error instanceof DictationFailure ? error : new DictationFailure('failed', error);
    } finally {
      this.reset();
    }
  }

  /** Drops the recording without transcribing it. */
  cancel(): void {
    this.finished = undefined;
    if (this.recorder?.state === 'recording') this.recorder.stop();
    this.releaseMicrophone();
    this.reset();
  }

  /** Switches the model; the next dictation downloads it if needed. */
  async setModel(id: SpeechModelId): Promise<void> {
    this.prefs.setVoice({ speechModel: id });
    this.stopWorker();
    await pruneModelCache(this.prefs.modelReposInUse()).catch((error) => console.error(error));
  }

  /** Turns dictation off and deletes the downloaded model. */
  async disable(): Promise<void> {
    this.shutdown();
    this.prefs.setVoice({ speechEnabled: false });
    await pruneModelCache(this.prefs.modelReposInUse()).catch((error) => console.error(error));
  }

  private loadError: 'unsupported' | 'error' | null = null;

  private load(): Promise<void> {
    const spec = this.spec();
    if (this.ready && this.loadedModel === spec.id) return this.ready;
    this.stopWorker();
    this.loadedModel = spec.id;
    this.loadError = null;
    this.fileProgress.set({});
    const worker = new Worker(new URL('./speech.worker', import.meta.url), { type: 'module' });
    this.worker = worker;
    if (this._state() === 'idle') this._state.set('loading');
    this.ready = new Promise<void>((resolve, reject) => {
      worker.addEventListener('message', ({ data }: MessageEvent<SpeechWorkerResponse>) => {
        switch (data.type) {
          case 'progress':
            this.fileProgress.update((files) => ({ ...files, [data.file]: { loaded: data.loaded, total: data.total } }));
            break;
          case 'ready':
            this._device.set(data.device);
            if (this._state() === 'loading') this._state.set('idle');
            resolve();
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
              this.loadError = data.unsupported ? 'unsupported' : 'error';
              this.stopWorker();
              if (this._state() === 'loading') this._state.set('idle');
              reject(new Error(data.message));
            }
        }
      });
      worker.addEventListener('error', (event) => {
        this.loadError = 'error';
        this.stopWorker();
        reject(new Error(event.message || 'Worker failed'));
      });
    });
    this.post({ type: 'init', model: spec, wasmPaths: new URL('ort/', this.document.baseURI).href });
    return this.ready;
  }

  private transcribe(audio: Float32Array): Promise<string> {
    const id = this.nextId++;
    const lang = this.prefs.dictationLang();
    const language = lang === 'auto' ? null : lang === 'interface' ? this.prefs.lang() : lang;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker!.postMessage({ type: 'transcribe', id, audio, language } satisfies SpeechWorkerRequest, [audio.buffer]);
    });
  }

  private post(message: SpeechWorkerRequest): void {
    this.worker?.postMessage(message);
  }

  private releaseMicrophone(): void {
    for (const track of this.stream?.getTracks() ?? []) track.stop();
    this.stream = null;
    this.recorder = null;
  }

  private reset(): void {
    this._state.set('idle');
    this._startedAt.set(null);
    this._owner.set(null);
  }

  private stopWorker(): void {
    this.worker?.terminate();
    this.worker = null;
    this.ready = null;
    this.loadedModel = null;
    for (const { reject } of this.pending.values()) reject(new Error('Model stopped'));
    this.pending.clear();
  }

  private shutdown(): void {
    this.cancel();
    this.stopWorker();
  }
}

/** Decodes the recording and resamples it to Whisper's 16 kHz mono. */
async function decode(blob: Blob): Promise<Float32Array> {
  const context = new AudioContext({ sampleRate: SPEECH_SAMPLE_RATE });
  try {
    const buffer = await context.decodeAudioData(await blob.arrayBuffer());
    if (buffer.numberOfChannels === 1) return buffer.getChannelData(0);
    const mono = new Float32Array(buffer.length);
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const channel = buffer.getChannelData(c);
      for (let i = 0; i < mono.length; i++) mono[i] += channel[i] / buffer.numberOfChannels;
    }
    return mono;
  } finally {
    void context.close();
  }
}

/** Nothing louder than a whisper of noise: Whisper would invent words for it. */
export function isSilent(audio: Float32Array, threshold = 0.01): boolean {
  let peak = 0;
  for (let i = 0; i < audio.length; i++) peak = Math.max(peak, Math.abs(audio[i]));
  return peak < threshold;
}
