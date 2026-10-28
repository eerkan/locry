import { DestroyRef, Injectable, effect, inject, signal, untracked } from '@angular/core';
import { LANGUAGE_TAGS, type Lang } from '../languages';
import { PreferencesService } from '../preferences.service';
import { VaultService } from '../vault/vault.service';

export type ReadAloudState = 'idle' | 'speaking' | 'paused';

/** Utterances this long or shorter: Chrome stops long ones after about 15 seconds. */
const CHUNK_CHARS = 220;

/** Splits text into sentence-sized pieces of at most `max` characters (longer words stay whole). */
export function speechChunks(text: string, max = CHUNK_CHARS): string[] {
  const sentences = text.replace(/\s+/g, ' ').trim().match(/[^.!?。！？؟\n]+[.!?。！？؟]*\s*/g) ?? [];
  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    for (const part of sentence.length > max ? splitWords(sentence, max) : [sentence]) {
      if (current && (current + part).length > max) {
        chunks.push(current.trim());
        current = '';
      }
      current += part;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function splitWords(sentence: string, max: number): string[] {
  const parts: string[] = [];
  let current = '';
  for (const word of sentence.split(/(?<=\s)/)) {
    if (current && (current + word).length > max) {
      parts.push(current);
      current = '';
    }
    current += word;
  }
  return current ? [...parts, current] : parts;
}

/**
 * Reads text aloud with the browser's speech synthesis, using only voices that run on this
 * device (`localService`): Chrome's "Google" voices are synthesized on Google's servers, so
 * they are left out and nothing of a note leaves the device.
 */
@Injectable({ providedIn: 'root' })
export class ReadAloudService {
  private readonly prefs = inject(PreferencesService);
  private readonly vault = inject(VaultService);
  private readonly synth = typeof speechSynthesis === 'undefined' ? null : speechSynthesis;

  private readonly _voices = signal<SpeechSynthesisVoice[]>([]);
  private readonly _state = signal<ReadAloudState>('idle');
  private readonly _owner = signal<string | null>(null);
  /** On-device voices, any language. */
  readonly voices = this._voices.asReadonly();
  readonly state = this._state.asReadonly();
  /** What is being read (a note id), so only its button shows it. */
  readonly owner = this._owner.asReadonly();
  readonly supported = !!this.synth;
  private run = 0;

  constructor() {
    if (this.synth) {
      const load = () => this._voices.set(this.synth!.getVoices().filter((v) => v.localService));
      load();
      this.synth.addEventListener('voiceschanged', load);
      inject(DestroyRef).onDestroy(() => this.synth?.removeEventListener('voiceschanged', load));
    }
    // Nothing keeps reading a note once the vault locks.
    effect(() => {
      if (!this.vault.isUnlocked()) untracked(() => this.stop());
    });
  }

  /** On-device voices for a language, the system's default first. */
  voicesFor(lang: Lang): SpeechSynthesisVoice[] {
    const tag = LANGUAGE_TAGS[lang].toLowerCase();
    const base = tag.split('-')[0];
    return this._voices()
      .filter((v) => v.lang.toLowerCase().replace('_', '-').split('-')[0] === base)
      .sort((a, b) => Number(b.default) - Number(a.default) || Number(b.lang.toLowerCase() === tag) - Number(a.lang.toLowerCase() === tag));
  }

  /** The chosen voice if it speaks this language, else the language's first on-device voice. */
  voiceFor(lang: Lang): SpeechSynthesisVoice | null {
    const voices = this.voicesFor(lang);
    return voices.find((v) => v.voiceURI === this.prefs.readVoice()) ?? voices[0] ?? null;
  }

  /** Starts reading; false when this device has no voice for the language. */
  speak(text: string, lang: Lang, owner: string): boolean {
    if (!this.synth) return false;
    const voice = this.voiceFor(lang);
    if (!voice) return false;
    this.stop();
    const chunks = speechChunks(text);
    if (!chunks.length) return true;
    const run = ++this.run;
    this._owner.set(owner);
    this._state.set('speaking');
    chunks.forEach((chunk, i) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = this.prefs.readRate();
      if (i === chunks.length - 1) utterance.addEventListener('end', () => run === this.run && this.reset());
      utterance.addEventListener('error', (e) => {
        if (run === this.run && e.error !== 'interrupted' && e.error !== 'canceled') this.reset();
      });
      this.synth!.speak(utterance);
    });
    return true;
  }

  pause(): void {
    if (this._state() !== 'speaking') return;
    this.synth?.pause();
    this._state.set('paused');
  }

  resume(): void {
    if (this._state() !== 'paused') return;
    this.synth?.resume();
    this._state.set('speaking');
  }

  stop(): void {
    this.run++;
    this.synth?.cancel();
    this.reset();
  }

  private reset(): void {
    this._state.set('idle');
    this._owner.set(null);
  }
}
