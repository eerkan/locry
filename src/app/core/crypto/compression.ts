/** gzip-compresses bytes with the platform CompressionStream. */
export function gzip(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  return transform(data, new CompressionStream('gzip'));
}

/** Inflates gzip-compressed bytes. Rejects on malformed input. */
export function gunzip(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  return transform(data, new DecompressionStream('gzip'));
}

async function transform(
  data: Uint8Array<ArrayBuffer>,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array<ArrayBuffer>> {
  const body = new Response(data).body!.pipeThrough(stream);
  return new Uint8Array(await new Response(body).arrayBuffer());
}
