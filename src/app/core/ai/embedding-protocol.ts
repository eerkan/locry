/** Embedding models the user can choose from; all multilingual (TR/EN) and run in the browser. */
export type EmbeddingModelId = 'embeddinggemma' | 'e5-small' | 'e5-base' | 'arctic-m-v2' | 'bge-m3';

export interface EmbeddingModelSpec {
  id: EmbeddingModelId;
  /** Hugging Face repository; also stored with each vector so models never mix. */
  repo: string;
  /** Display name. */
  name: string;
  dtype: 'q8' | 'q4';
  /** Weights file name without the dtype suffix, when not the default `model`. */
  modelFileName?: string;
  /**
   * `pipeline`: Transformers.js feature extraction with the given pooling.
   * `sentence-embedding`: the model itself outputs pooled embeddings (EmbeddingGemma).
   */
  loader: 'pipeline' | 'sentence-embedding';
  pooling?: 'mean' | 'cls';
  /** Instructions the model was trained with, put in front of queries and documents. */
  queryPrefix: string;
  passagePrefix: string;
  dimensions: number;
  maxTokens: number;
  /** Download size of the chosen weights, in MB. */
  downloadMb: number;
  license: string;
  /** Large enough that phones may struggle (memory, download). */
  desktopOnly: boolean;
  /**
   * Calibrated on TR/EN sample vaults (notes plus short tasks, 23 queries): weight of the
   * hubness correction and the z-score a semantic-only match must reach.
   */
  hubWeight: number;
  minZ: number;
  /**
   * Similarity scales differ a lot between models (e5: 0.77-0.89, Gemma: 0.18-0.58). For
   * vaults with too few documents for statistics, a query match needs at least `floor`
   * (about the 95th percentile of unrelated pairs); "similar notes" need `similarFloor`.
   */
  floor: number;
  similarFloor: number;
}

export const EMBEDDING_MODELS: Record<EmbeddingModelId, EmbeddingModelSpec> = {
  // Best on our TR/EN test set even without correction (19/23 right note first; 20/23 calibrated).
  embeddinggemma: {
    id: 'embeddinggemma',
    repo: 'onnx-community/embeddinggemma-300m-ONNX',
    name: 'EmbeddingGemma 300M',
    dtype: 'q4',
    // The browser's WASM runtime lacks the quantized Gather of the plain q4 export.
    modelFileName: 'model_no_gather',
    loader: 'sentence-embedding',
    queryPrefix: 'task: search result | query: ',
    passagePrefix: 'title: none | text: ',
    dimensions: 768,
    maxTokens: 2048,
    downloadMb: 195,
    license: 'Gemma Terms of Use',
    desktopOnly: false,
    hubWeight: 0.5,
    minZ: 1.5,
    // Above the 95th percentile of unrelated pairs (0.31): short, title-only notes score low.
    floor: 0.34,
    similarFloor: 0.5,
  },
  // 19/23 calibrated; the smallest and fastest.
  'e5-small': {
    id: 'e5-small',
    repo: 'Xenova/multilingual-e5-small',
    name: 'Multilingual E5 Small',
    dtype: 'q8',
    loader: 'pipeline',
    pooling: 'mean',
    queryPrefix: 'query: ',
    passagePrefix: 'passage: ',
    dimensions: 384,
    maxTokens: 512,
    downloadMb: 118,
    license: 'MIT',
    desktopOnly: false,
    hubWeight: 1,
    minZ: 1.2,
    floor: 0.84,
    similarFloor: 0.9,
  },
  // 19/23 calibrated, no better than Small on our set but larger.
  'e5-base': {
    id: 'e5-base',
    repo: 'Xenova/multilingual-e5-base',
    name: 'Multilingual E5 Base',
    dtype: 'q8',
    loader: 'pipeline',
    pooling: 'mean',
    queryPrefix: 'query: ',
    passagePrefix: 'passage: ',
    dimensions: 768,
    maxTokens: 512,
    downloadMb: 279,
    license: 'MIT',
    desktopOnly: true,
    hubWeight: 1,
    minZ: 1.2,
    floor: 0.815,
    similarFloor: 0.86,
  },
  // 16/23 calibrated on short notes; made for long documents (8k tokens).
  'arctic-m-v2': {
    id: 'arctic-m-v2',
    repo: 'Snowflake/snowflake-arctic-embed-m-v2.0',
    name: 'Snowflake Arctic Embed M v2.0',
    dtype: 'q8',
    loader: 'pipeline',
    pooling: 'cls',
    queryPrefix: 'query: ',
    passagePrefix: '',
    dimensions: 768,
    maxTokens: 8192,
    downloadMb: 311,
    license: 'Apache 2.0',
    desktopOnly: true,
    hubWeight: 0.5,
    minZ: 1.5,
    floor: 0.23,
    similarFloor: 0.42,
  },
  // 16/23 calibrated on short notes; the largest, made for long documents (8k tokens).
  'bge-m3': {
    id: 'bge-m3',
    repo: 'Xenova/bge-m3',
    name: 'BGE-M3',
    dtype: 'q8',
    loader: 'pipeline',
    pooling: 'cls',
    queryPrefix: '',
    passagePrefix: '',
    dimensions: 1024,
    maxTokens: 8192,
    downloadMb: 568,
    license: 'MIT',
    desktopOnly: true,
    hubWeight: 1.5,
    minZ: 1.5,
    floor: 0.52,
    similarFloor: 0.48,
  },
};

/** Listed in this order in Settings. */
export const EMBEDDING_MODEL_IDS = Object.keys(EMBEDDING_MODELS) as EmbeddingModelId[];
export const DEFAULT_EMBEDDING_MODEL: EmbeddingModelId = 'embeddinggemma';
/** Vaults that turned semantic search on before models were selectable used this one. */
export const LEGACY_EMBEDDING_MODEL: EmbeddingModelId = 'e5-small';

export function isEmbeddingModelId(value: unknown): value is EmbeddingModelId {
  return typeof value === 'string' && value in EMBEDDING_MODELS;
}

/** Whether a text is a search query or a stored document; models prefix them differently. */
export type EmbeddingKind = 'query' | 'passage';

export type WorkerRequest =
  | { type: 'init'; model: EmbeddingModelSpec; wasmPaths: string }
  | { type: 'embed'; id: number; texts: string[] };

export type WorkerResponse =
  | { type: 'progress'; file: string; loaded: number; total: number }
  | { type: 'ready' }
  | { type: 'result'; id: number; vectors: Float32Array[] }
  | { type: 'error'; id?: number; message: string };
