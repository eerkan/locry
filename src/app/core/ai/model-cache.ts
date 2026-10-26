/** Cache Storage name Transformers.js keeps downloaded model files in. */
const MODEL_CACHE = 'transformers-cache';

/**
 * Deletes downloaded model files of every Hugging Face repository not listed (models are
 * hundreds of MB each). Shared by the embedding models and the language models, so neither
 * deletes the other's files.
 */
export async function pruneModelCache(keepRepos: Iterable<string>): Promise<void> {
  if (typeof caches === 'undefined') return;
  const keep = [...keepRepos];
  const cache = await caches.open(MODEL_CACHE);
  for (const request of await cache.keys()) {
    const { hostname, pathname } = new URL(request.url);
    if (!hostname.endsWith('huggingface.co') && !hostname.endsWith('hf.co')) continue;
    if (!keep.some((repo) => pathname.startsWith(`/${repo}/`))) await cache.delete(request);
  }
}
