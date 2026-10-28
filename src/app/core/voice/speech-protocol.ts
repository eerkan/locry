/**
 * Speech recognition models for dictation: OpenAI's Whisper (MIT), run in the browser through
 * Transformers.js. Audio never leaves the device and is not kept: it is transcribed, then
 * dropped. Every model covers all of the app's languages.
 */
export type SpeechModelId = 'whisper-base' | 'whisper-small' | 'whisper-large-v3-turbo';

/** Weight formats used here (a subset of what Transformers.js accepts). */
export type WeightFormat = 'fp32' | 'q8' | 'q4' | 'q4f16';
/** Weights per model file, by device. */
export type SpeechDtype = Record<'encoder_model' | 'decoder_model_merged', WeightFormat>;

export interface SpeechModelSpec {
  id: SpeechModelId;
  /** Hugging Face repository (ONNX export for Transformers.js). */
  repo: string;
  name: string;
  /** On WebGPU; null when the model is too slow without it. */
  gpu: { dtype: SpeechDtype; downloadMb: number };
  cpu: { dtype: SpeechDtype; downloadMb: number } | null;
}

export const SPEECH_MODELS: Record<SpeechModelId, SpeechModelSpec> = {
  // Smallest; for phones without WebGPU. Makes more mistakes (in Turkish, for one).
  'whisper-base': {
    id: 'whisper-base',
    repo: 'onnx-community/whisper-base',
    name: 'Whisper Base',
    gpu: { dtype: { encoder_model: 'fp32', decoder_model_merged: 'q4' }, downloadMb: 206 },
    cpu: { dtype: { encoder_model: 'q8', decoder_model_merged: 'q8' }, downloadMb: 77 },
  },
  // The default: accurate in every app language (Turkish trial: word for word), ~1 s per sentence
  // on WebGPU. A 4-bit encoder halves the download with no loss in that trial.
  'whisper-small': {
    id: 'whisper-small',
    repo: 'onnx-community/whisper-small',
    name: 'Whisper Small',
    gpu: { dtype: { encoder_model: 'q4', decoder_model_merged: 'q4' }, downloadMb: 299 },
    cpu: { dtype: { encoder_model: 'q8', decoder_model_merged: 'q8' }, downloadMb: 249 },
  },
  // Close to the large model's accuracy; needs a GPU with 16-bit support.
  'whisper-large-v3-turbo': {
    id: 'whisper-large-v3-turbo',
    repo: 'onnx-community/whisper-large-v3-turbo',
    name: 'Whisper Large v3 Turbo',
    gpu: { dtype: { encoder_model: 'q4f16', decoder_model_merged: 'q4f16' }, downloadMb: 563 },
    cpu: null,
  },
};

export const SPEECH_MODEL_IDS = Object.keys(SPEECH_MODELS) as SpeechModelId[];
export const DEFAULT_SPEECH_MODEL: SpeechModelId = 'whisper-small';

export function isSpeechModelId(value: unknown): value is SpeechModelId {
  return typeof value === 'string' && value in SPEECH_MODELS;
}

export type SpeechDevice = 'webgpu' | 'wasm';

export type SpeechWorkerRequest =
  | { type: 'init'; model: SpeechModelSpec; wasmPaths: string }
  | { type: 'transcribe'; id: number; audio: Float32Array; language: string | null };

export type SpeechWorkerResponse =
  | { type: 'progress'; file: string; loaded: number; total: number }
  | { type: 'ready'; device: SpeechDevice }
  | { type: 'done'; id: number; text: string }
  | { type: 'error'; id?: number; message: string; unsupported?: boolean };

/** Whisper's sample rate. */
export const SPEECH_SAMPLE_RATE = 16_000;

/** Tidies a transcript: Whisper marks silence and noise with bracketed tags. */
export function cleanTranscript(text: string): string {
  return text
    .replace(/\[(?:BLANK_AUDIO|MUSIC|NOISE|SILENCE|Music|Silence)[^\]]*\]|\((?:music|silence|noise)[^)]*\)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
