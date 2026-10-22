/**
 * Multilingual (TR/EN) sentence embeddings, ~120 MB as 8-bit ONNX. Measured on TR/EN notes:
 * same retrieval quality as fp32 (4x the download) and better than paraphrase-MiniLM-L12.
 */
export const EMBEDDING_MODEL = 'Xenova/multilingual-e5-small';
export const EMBEDDING_DIMENSIONS = 384;

/** e5 models are trained with these prefixes; using them noticeably improves retrieval. */
export type EmbeddingKind = 'query' | 'passage';

export type WorkerRequest =
  | { type: 'init'; model: string; wasmPaths: string }
  | { type: 'embed'; id: number; texts: string[] };

export type WorkerResponse =
  | { type: 'progress'; file: string; loaded: number; total: number }
  | { type: 'ready' }
  | { type: 'result'; id: number; vectors: Float32Array[] }
  | { type: 'error'; id?: number; message: string };
