/// <reference lib="webworker" />

import { AutoModel, AutoTokenizer, type Tensor, env, pipeline } from '@huggingface/transformers';
import type { EmbeddingModelSpec, WorkerRequest, WorkerResponse } from './embedding-protocol';

/** Turns texts (already prefixed) into one normalized vector each. */
type Embed = (texts: string[]) => Promise<Float32Array[]>;

let embedder: Promise<Embed> | null = null;

const post = (message: WorkerResponse, transfer: Transferable[] = []) => postMessage(message, transfer);

addEventListener('message', async ({ data }: MessageEvent<WorkerRequest>) => {
  if (data.type === 'init') {
    embedder ??= load(data.model, data.wasmPaths);
    try {
      await embedder;
      post({ type: 'ready' });
    } catch (error) {
      embedder = null;
      post({ type: 'error', message: String((error as Error)?.message ?? error) });
    }
    return;
  }

  try {
    if (!embedder) throw new Error('Model not loaded');
    const vectors = await (await embedder)(data.texts);
    post({ type: 'result', id: data.id, vectors }, vectors.map((v) => v.buffer));
  } catch (error) {
    post({ type: 'error', id: data.id, message: String((error as Error)?.message ?? error) });
  }
});

async function load(spec: EmbeddingModelSpec, wasmPaths: string): Promise<Embed> {
  // Models come from the Hugging Face Hub and are cached by the browser; the ONNX runtime
  // is served by this app instead of a CDN.
  env.allowLocalModels = false;
  env.useBrowserCache = true;
  const wasm = env.backends.onnx.wasm!;
  wasm.wasmPaths = wasmPaths;
  // Threads need cross-origin isolation, which a plain local dev server does not provide.
  wasm.numThreads = 1;

  const options = {
    device: 'wasm' as const,
    dtype: spec.dtype,
    ...(spec.modelFileName ? { model_file_name: spec.modelFileName } : {}),
    progress_callback: (info: { status: string; file?: string; loaded?: number; total?: number }) => {
      if (info.status === 'progress' && info.file) {
        post({ type: 'progress', file: info.file, loaded: info.loaded ?? 0, total: info.total ?? 0 });
      }
    },
  };

  if (spec.loader === 'sentence-embedding') {
    // EmbeddingGemma: the exported model includes pooling and its dense layers.
    const [tokenizer, model] = await Promise.all([
      AutoTokenizer.from_pretrained(spec.repo, options),
      AutoModel.from_pretrained(spec.repo, options),
    ]);
    return async (texts) => {
      const inputs = tokenizer(texts, { padding: true, truncation: true, max_length: spec.maxTokens });
      const { sentence_embedding } = (await model(inputs)) as { sentence_embedding: Tensor };
      return rows(sentence_embedding).map(normalize);
    };
  }

  const extractor = await pipeline('feature-extraction', spec.repo, options);
  return async (texts) => rows(await extractor(texts, { pooling: spec.pooling ?? 'mean', normalize: true }));
}

function rows(tensor: Tensor): Float32Array[] {
  const [count, dims] = tensor.dims as [number, number];
  const flat = tensor.data as Float32Array;
  return Array.from({ length: count }, (_, i) => flat.slice(i * dims, (i + 1) * dims));
}

function normalize(vector: Float32Array): Float32Array {
  const norm = Math.hypot(...vector) || 1;
  return vector.map((x) => x / norm);
}
