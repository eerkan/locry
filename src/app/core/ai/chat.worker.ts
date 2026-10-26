/// <reference lib="webworker" />

import {
  AutoModelForCausalLM,
  AutoTokenizer,
  InterruptableStoppingCriteria,
  type PreTrainedModel,
  type PreTrainedTokenizer,
  TextStreamer,
  type Tensor,
  env,
} from '@huggingface/transformers';
import { type ChatDtype, type ChatModelSpec, type ChatWorkerRequest, type ChatWorkerResponse, loopCut } from './chat-protocol';

interface Loaded {
  spec: ChatModelSpec;
  tokenizer: PreTrainedTokenizer;
  model: PreTrainedModel;
  dtype: ChatDtype;
}

let loaded: Promise<Loaded> | null = null;
const stopping = new InterruptableStoppingCriteria();

const post = (message: ChatWorkerResponse) => postMessage(message);

addEventListener('message', async ({ data }: MessageEvent<ChatWorkerRequest>) => {
  switch (data.type) {
    case 'init':
      loaded ??= load(data.model, data.wasmPaths);
      try {
        post({ type: 'ready', dtype: (await loaded).dtype });
      } catch (error) {
        loaded = null;
        post({ type: 'error', message: messageOf(error), unsupported: error instanceof UnsupportedError });
      }
      return;
    case 'interrupt':
      stopping.interrupt();
      return;
    case 'generate':
      try {
        if (!loaded) throw new Error('Model not loaded');
        const text = await generate(await loaded, data.id, data.messages, data.maxNewTokens);
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

/** WebGPU is required: on the CPU these models answer too slowly to be useful. */
async function gpuDtype(): Promise<ChatDtype> {
  const gpu = (navigator as WorkerNavigator & { gpu?: Gpu }).gpu;
  const adapter = await gpu?.requestAdapter().catch(() => null);
  if (!adapter) throw new UnsupportedError('WebGPU is not available');
  // 16-bit weights are smaller and faster, but not every GPU can compute with them.
  return adapter.features.has('shader-f16') ? 'q4f16' : 'q4';
}

async function load(spec: ChatModelSpec, wasmPaths: string): Promise<Loaded> {
  const dtype = await gpuDtype();
  env.allowLocalModels = false;
  env.useBrowserCache = true;
  env.backends.onnx.wasm!.wasmPaths = wasmPaths;

  const options = {
    progress_callback: (info: { status: string; file?: string; loaded?: number; total?: number }) => {
      if (info.status === 'progress' && info.file) {
        post({ type: 'progress', file: info.file, loaded: info.loaded ?? 0, total: info.total ?? 0 });
      }
    },
  };
  const [tokenizer, model] = await Promise.all([
    AutoTokenizer.from_pretrained(spec.repo, options),
    AutoModelForCausalLM.from_pretrained(spec.repo, { ...options, device: 'webgpu', dtype }),
  ]);
  return { spec, tokenizer, model, dtype };
}

async function generate(
  { spec, tokenizer, model }: Loaded,
  id: number,
  messages: { role: string; content: string }[],
  maxNewTokens: number,
): Promise<string> {
  stopping.reset();
  const inputs = tokenizer.apply_chat_template(messages, {
    add_generation_prompt: true,
    return_dict: true,
    ...spec.templateOptions,
  }) as { input_ids: Tensor; attention_mask: Tensor };

  let text = '';
  let looped = false;
  const streamer = new TextStreamer(tokenizer, {
    skip_prompt: true,
    skip_special_tokens: true,
    callback_function: (piece: string) => {
      if (looped) return;
      text += piece;
      post({ type: 'token', id, text: piece });
      if (loopCut(text) !== null) {
        looped = true;
        stopping.interrupt();
      }
    },
  });
  await model.generate({
    ...inputs,
    ...spec.generation,
    max_new_tokens: maxNewTokens,
    streamer,
    stopping_criteria: stopping,
  });
  const cut = loopCut(text);
  return cut === null ? text : text.slice(0, cut).trimEnd();
}

function messageOf(error: unknown): string {
  return String((error as Error)?.message ?? error);
}
