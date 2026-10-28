/// <reference lib="webworker" />

import { type AutomaticSpeechRecognitionPipeline, env, pipeline } from '@huggingface/transformers';
import type { SpeechDevice, SpeechModelSpec, SpeechWorkerRequest, SpeechWorkerResponse } from './speech-protocol';

let loaded: Promise<{ transcriber: AutomaticSpeechRecognitionPipeline; device: SpeechDevice }> | null = null;

const post = (message: SpeechWorkerResponse) => postMessage(message);

addEventListener('message', async ({ data }: MessageEvent<SpeechWorkerRequest>) => {
  switch (data.type) {
    case 'init':
      loaded ??= load(data.model, data.wasmPaths);
      try {
        post({ type: 'ready', device: (await loaded).device });
      } catch (error) {
        loaded = null;
        post({ type: 'error', message: messageOf(error), unsupported: error instanceof UnsupportedError });
      }
      return;
    case 'transcribe':
      try {
        if (!loaded) throw new Error('Model not loaded');
        const { transcriber } = await loaded;
        const output = await transcriber(data.audio, {
          task: 'transcribe',
          // null: Whisper detects the language itself.
          ...(data.language ? { language: data.language } : {}),
          // Longer recordings are transcribed in overlapping 30 s windows.
          chunk_length_s: 30,
          stride_length_s: 5,
        });
        const text = (Array.isArray(output) ? output.map((o) => o.text).join(' ') : output.text) ?? '';
        post({ type: 'done', id: data.id, text });
      } catch (error) {
        post({ type: 'error', id: data.id, message: messageOf(error) });
      }
  }
});

class UnsupportedError extends Error {}

/** The part of the WebGPU API used here (the full typings are not a dependency). */
interface Gpu {
  requestAdapter(): Promise<{ features: ReadonlySet<string> } | null>;
}

async function load(spec: SpeechModelSpec, wasmPaths: string) {
  env.allowLocalModels = false;
  env.useBrowserCache = true;
  env.backends.onnx.wasm!.wasmPaths = wasmPaths;
  const adapter = await (navigator as WorkerNavigator & { gpu?: Gpu }).gpu?.requestAdapter().catch(() => null);
  // 16-bit weights need the GPU feature; without a GPU, only models with CPU weights run.
  const gpuOk = !!adapter && (!JSON.stringify(spec.gpu.dtype).includes('f16') || adapter.features.has('shader-f16'));
  const device: SpeechDevice = gpuOk ? 'webgpu' : 'wasm';
  const weights = gpuOk ? spec.gpu : spec.cpu;
  if (!weights) throw new UnsupportedError('This model needs WebGPU with 16-bit support');
  const transcriber = (await pipeline('automatic-speech-recognition', spec.repo, {
    device,
    dtype: weights.dtype,
    progress_callback: (info: { status: string; file?: string; loaded?: number; total?: number }) => {
      if (info.status === 'progress' && info.file) post({ type: 'progress', file: info.file, loaded: info.loaded ?? 0, total: info.total ?? 0 });
    },
  })) as AutomaticSpeechRecognitionPipeline;
  return { transcriber, device };
}

function messageOf(error: unknown): string {
  return String((error as Error)?.message ?? error);
}
