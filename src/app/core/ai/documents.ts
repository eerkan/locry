import { fromBase64Url, toBase64Url, utf8Encode } from '../crypto/bytes';

/** Record type of stored vectors; derived data, so it is left out of backups. */
export const EMBEDDING_RECORD_TYPE = 'embedding';

/** A searchable item, independent of whether it is a note or a task. */
export interface SearchDoc {
  kind: 'note' | 'task';
  id: string;
  title: string;
  /** Plain text without Markdown syntax. */
  body: string;
  updatedAt: string;
  /** Archived notes and completed tasks rank a little lower. */
  inactive: boolean;
}

export function docKey(doc: Pick<SearchDoc, 'kind' | 'id'>): string {
  return `${doc.kind}:${doc.id}`;
}

/** Strips the Markdown syntax that adds noise to embeddings and snippets. */
export function markdownToText(markdown: string): string {
  return markdown
    .replace(/```[^\n]*\n([\s\S]*?)```/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    // [ \t] rather than \s: \s would also eat the blank lines between paragraphs.
    .replace(/^[ \t]{0,3}(#{1,6}|>|[-*+]|\d+[.)])[ \t]+(\[[ xX]\][ \t]+)?/gm, '')
    // Tables: drop the |---|---| separator rows and the cell pipes.
    .replace(/^[ \t]*\|?[ \t]*:?-{2,}:?[ \t]*(\|[ \t]*:?-{2,}:?[ \t]*)*\|?[ \t]*$/gm, '')
    .replace(/\|/g, ' ')
    .replace(/[*_~`]/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const CHUNK_CHARS = 600;

/**
 * Splits a document into passages of roughly {@link CHUNK_CHARS}, on paragraph and then
 * sentence boundaries. The title leads every chunk so each passage carries its context.
 */
export function chunkDoc(doc: Pick<SearchDoc, 'title' | 'body'>): string[] {
  const title = doc.title.trim();
  const pieces = doc.body
    .split(/\n{2,}/)
    .flatMap((p) => (p.length > CHUNK_CHARS ? p.split(/(?<=[.!?])\s+/) : [p]))
    .flatMap((p) => (p.length > CHUNK_CHARS ? hardWrap(p) : [p]))
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';
  for (const piece of pieces) {
    if (current && current.length + piece.length + 1 > CHUNK_CHARS) {
      chunks.push(current);
      current = '';
    }
    current = current ? `${current}\n${piece}` : piece;
  }
  if (current) chunks.push(current);
  if (!chunks.length) return title ? [title] : [];
  return chunks.map((chunk) => (title ? `${title}\n${chunk}` : chunk));
}

function hardWrap(text: string): string[] {
  const parts: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK_CHARS) parts.push(text.slice(i, i + CHUNK_CHARS));
  return parts;
}

/** Identifies the exact input that produced a set of vectors, so unchanged docs are skipped. */
export async function chunksHash(model: string, chunks: string[]): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', utf8Encode(`${model}\u0000${chunks.join('\u0001')}`));
  return toBase64Url(digest);
}

export function encodeVector(vector: Float32Array): string {
  return toBase64Url(vector.buffer.slice(vector.byteOffset, vector.byteOffset + vector.byteLength) as ArrayBuffer);
}

export function decodeVector(encoded: string): Float32Array {
  return new Float32Array(fromBase64Url(encoded).buffer);
}

/** Dot product; equals cosine similarity for the normalized vectors the model returns. */
export function similarity(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}
