/**
 * Small language models for "Ask your notes". All run in the browser on WebGPU through
 * Transformers.js, are downloaded only when the user turns the feature on, and support the
 * app's languages to some degree (Gemma 3 1B is the weakest outside English).
 */
export type ChatModelId = 'qwen3-0.6b' | 'apertus-0.5b' | 'gemma3-1b';

export interface ChatModelSpec {
  id: ChatModelId;
  /** Hugging Face repository (ONNX export for Transformers.js). */
  repo: string;
  name: string;
  /** Download size in MB: 16-bit weights where the GPU supports them, else 32-bit (`q4`). */
  downloadMb: { q4f16: number; q4: number };
  license: string;
  /** Extra variables for the model's chat template. */
  templateOptions?: Record<string, unknown>;
  /** Decoding settings; answers from notes want little creativity. */
  generation: GenerationOptions;
}

export interface GenerationOptions {
  do_sample: boolean;
  temperature?: number;
  top_p?: number;
  repetition_penalty: number;
}

/** Deterministic and focused: the answer should repeat what the notes say. */
const GREEDY: GenerationOptions = { do_sample: false, repetition_penalty: 1.1 };

export const CHAT_MODELS: Record<ChatModelId, ChatModelSpec> = {
  // 100+ languages, including every interface language. Thinking mode off: answers come
  // straight away instead of after a long hidden reasoning block.
  'qwen3-0.6b': {
    id: 'qwen3-0.6b',
    repo: 'onnx-community/Qwen3-0.6B-ONNX',
    name: 'Qwen3 0.6B',
    downloadMb: { q4f16: 570, q4: 919 },
    license: 'Apache 2.0',
    templateOptions: { enable_thinking: false },
    generation: GREEDY,
  },
  // Swiss AI (EPFL, ETH): fully open training data, 1,800+ languages.
  'apertus-0.5b': {
    id: 'apertus-0.5b',
    repo: 'onnx-community/Apertus-v1.1-0.5B-Instruct-QAD-INT4-ONNX',
    name: 'Apertus 0.5B',
    downloadMb: { q4f16: 517, q4: 811 },
    license: 'Apache 2.0',
    // Greedy decoding makes this small model repeat itself instead of ending its answer.
    generation: { do_sample: true, temperature: 0.3, top_p: 0.9, repetition_penalty: 1.2 },
  },
  'gemma3-1b': {
    id: 'gemma3-1b',
    repo: 'onnx-community/gemma-3-1b-it-ONNX',
    name: 'Gemma 3 1B',
    downloadMb: { q4f16: 764, q4: 859 },
    license: 'Gemma Terms of Use',
    generation: GREEDY,
  },
};

export const CHAT_MODEL_IDS = Object.keys(CHAT_MODELS) as ChatModelId[];
export const DEFAULT_CHAT_MODEL: ChatModelId = 'qwen3-0.6b';

export function isChatModelId(value: unknown): value is ChatModelId {
  return typeof value === 'string' && value in CHAT_MODELS;
}

export type ChatDtype = 'q4f16' | 'q4';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type ChatWorkerRequest =
  | { type: 'init'; model: ChatModelSpec; wasmPaths: string }
  | { type: 'generate'; id: number; messages: ChatMessage[]; maxNewTokens: number }
  | { type: 'interrupt' };

export type ChatWorkerResponse =
  | { type: 'progress'; file: string; loaded: number; total: number }
  | { type: 'ready'; dtype: ChatDtype }
  | { type: 'token'; id: number; text: string }
  | { type: 'done'; id: number; text: string }
  | { type: 'error'; id?: number; message: string; unsupported?: boolean };

/**
 * Removes a reasoning block some models still emit (Qwen3 writes an empty `<think></think>`
 * even with thinking turned off), including one that is not closed yet while streaming.
 */
export function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?(<\/think>|$)/g, '').trimStart();
}

/**
 * Small models sometimes fall into a loop, writing the same line again and again. Returns
 * where the text should be cut (at the line's second appearance) once a line of some length
 * appears three times, or null.
 */
export function loopCut(text: string): number | null {
  const seen = new Map<string, number[]>();
  let offset = 0;
  for (const line of text.split('\n')) {
    const key = line.trim();
    if (key.length >= 12) {
      const at = seen.get(key) ?? [];
      at.push(offset);
      seen.set(key, at);
      if (at.length >= 3) return at[1];
    }
    offset += line.length + 1;
  }
  return null;
}
