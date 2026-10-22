/// <reference lib="webworker" />

import { type FeatureExtractionPipeline, env, pipeline } from '@huggingface/transformers';
import type { WorkerRequest, WorkerResponse } from './embedding-protocol';

let extractor: Promise<FeatureExtractionPipeline> | null = null;

const post = (message: WorkerResponse, transfer: Transferable[] = []) => postMessage(message, transfer);

addEventListener('message', async ({ data }: MessageEvent<WorkerRequest>) => {
  if (data.type === 'init') {
    extractor ??= load(data.model, data.wasmPaths);
    try {
      await extractor;
      post({ type: 'ready' });
    } catch (error) {
      extractor = null;
      post({ type: 'error', message: String((error as Error)?.message ?? error) });
    }
    return;
  }

  try {
    if (!extractor) throw new Error('Model not loaded');
    const pipe = await extractor;
    const output = await pipe(data.texts, { pooling: 'mean', normalize: true });
    const [count, dims] = output.dims as [number, number];
    const flat = output.data as Float32Array;
    const vectors = Array.from({ length: count }, (_, i) => flat.slice(i * dims, (i + 1) * dims));
    post({ type: 'result', id: data.id, vectors }, vectors.map((v) => v.buffer));
  } catch (error) {
    post({ type: 'error', id: data.id, message: String((error as Error)?.message ?? error) });
  }
});

function load(model: string, wasmPaths: string): Promise<FeatureExtractionPipeline> {
  // Models come from the Hugging Face Hub and are cached by the browser; the ONNX runtime
  // is served by this app instead of a CDN.
  env.allowLocalModels = false;
  env.useBrowserCache = true;
  const wasm = env.backends.onnx.wasm!;
  wasm.wasmPaths = wasmPaths;
  // Threads need cross-origin isolation, which a plain local dev server does not provide.
  wasm.numThreads = 1;

  return pipeline('feature-extraction', model, {
    device: 'wasm',
    dtype: 'q8',
    progress_callback: (info: { status: string; file?: string; loaded?: number; total?: number }) => {
      if (info.status === 'progress' && info.file) {
        post({ type: 'progress', file: info.file, loaded: info.loaded ?? 0, total: info.total ?? 0 });
      }
    },
  }) as Promise<FeatureExtractionPipeline>;
}
