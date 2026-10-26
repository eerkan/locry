import { Injectable, computed, inject } from '@angular/core';
import { foldForSearch } from '../../features/notes/note';
import { type SearchDoc, docKey, similarity } from './documents';
import { EMBEDDER } from './embedding.service';
import { SemanticIndexService } from './semantic-index.service';

/**
 * Similarities sit in a narrow band that shifts per query (e5: the right note at 0.82-0.86
 * while unrelated ones reached 0.84 for other queries), and the band differs per model. A
 * fixed threshold cannot separate them, but the right note stands out from the query's own
 * distribution, so relevance is a z-score over all indexed documents.
 */
/**
 * Below this many documents a z-score says little (two right notes among six pull each other
 * down), so small vaults compare against the model's absolute floor instead.
 */
const MIN_DOCS_FOR_STATS = 15;
/** Similar notes: passage-passage scores run higher, so be stricter. */
const SIMILAR_MIN_Z = 1.5;
const INACTIVE_PENALTY = 0.85;
/*
 * Hubness correction: short, generic texts (a task called "Gym") sit close to the centre of
 * all vectors and look similar to every query. Subtracting each chunk's similarity to the
 * centroid removes that bias. Its weight, and how many standard deviations a semantic-only
 * match must stand out (minZ), are calibrated per model (see EMBEDDING_MODELS).
 */

export type SearchKind = 'all' | 'note' | 'task';

export interface SearchResult {
  doc: SearchDoc;
  score: number;
  /** Which signals matched: words, meaning, or both. */
  matchedBy: 'keyword' | 'semantic' | 'both';
  snippet: string;
}

/** Hybrid search: keyword matching always, plus vector similarity when the model is ready. */
@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly index = inject(SemanticIndexService);
  private readonly embedder = inject(EMBEDDER);

  /** Changes whenever results could differ: documents, vectors or model readiness. */
  readonly revision = computed(() => [this.index.docs(), this.index.vectors(), this.index.ready()]);

  /** Per document, each chunk's similarity to the centroid of all chunks (see HUB_WEIGHT). */
  private readonly hubness = computed(() => {
    const vectors = this.index.vectors();
    const all = [...vectors.values()].flat();
    const hubness = new Map<string, number[]>();
    if (vectors.size < MIN_DOCS_FOR_STATS) return hubness;
    const centroid = mean(all);
    for (const [key, chunks] of vectors) hubness.set(key, chunks.map((c) => similarity(c, centroid)));
    return hubness;
  });

  async search(query: string, options: { kind?: SearchKind; limit?: number } = {}): Promise<SearchResult[]> {
    const terms = foldForSearch(query).split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    const kind = options.kind ?? 'all';
    const docs = this.index.docs().filter((d) => kind === 'all' || d.kind === kind);

    let queryVector: Float32Array | null = null;
    if (this.index.ready()) {
      try {
        [queryVector] = await this.embedder.embed([query], 'query');
      } catch (error) {
        console.error(error);
      }
    }
    const vectors = this.index.vectors();
    const hubness = this.hubness();
    // Score every indexed document (not just the filtered kind) so the statistics are stable.
    const similarities = new Map<string, number>();
    if (queryVector) {
      for (const doc of this.index.docs()) {
        const key = docKey(doc);
        const chunks = vectors.get(key);
        if (chunks?.length) {
          similarities.set(key, bestSimilarity(queryVector, chunks, hubness.get(key), this.index.spec().hubWeight));
        }
      }
    }
    const spec = this.index.spec();
    const relevance = relevanceScale([...similarities.values()], spec.minZ, spec.floor);

    const results: SearchResult[] = [];
    for (const doc of docs) {
      const keyword = keywordScore(doc, terms);
      const sim = similarities.get(docKey(doc));
      const z = sim === undefined ? 0 : relevance(sim);
      const semanticMatch = z >= 1;
      if (keyword === 0 && !semanticMatch) continue;

      // z of 1 (just relevant) .. 2.5+ (clearly the best match) maps to 0.4 .. 1.
      const semantic = semanticMatch ? Math.min(1, 0.4 + (z - 1) * 0.4) : 0;
      let score = queryVector ? 0.55 * keyword + 0.45 * semantic : keyword;
      if (doc.inactive) score *= INACTIVE_PENALTY;
      results.push({
        doc,
        score,
        matchedBy: keyword && semanticMatch ? 'both' : keyword ? 'keyword' : 'semantic',
        snippet: snippet(doc, terms),
      });
    }
    return results.sort((a, b) => b.score - a.score).slice(0, options.limit ?? 50);
  }

  /** Vectors of texts compared against (see {@link closerToTexts}), per model. */
  private readonly textVectors = new Map<string, Float32Array>();

  /**
   * Whether the query is closer in meaning to one of `texts` than to every given result.
   * The texts are embedded like documents, so both sides are on the same scale whatever the
   * model. Null when the model is not ready.
   */
  async closerToTexts(query: string, texts: string[], results: SearchResult[]): Promise<boolean | null> {
    if (!this.index.ready()) return null;
    const repo = this.index.spec().repo;
    const missing = texts.filter((t) => !this.textVectors.has(`${repo}\n${t}`));
    if (missing.length) {
      const vectors = await this.embedder.embed(missing, 'passage');
      missing.forEach((t, i) => this.textVectors.set(`${repo}\n${t}`, vectors[i]));
    }
    const [queryVector] = await this.embedder.embed([query], 'query');
    const toTexts = Math.max(...texts.map((t) => similarity(queryVector, this.textVectors.get(`${repo}\n${t}`)!)));
    const vectors = this.index.vectors();
    const toResults = Math.max(
      -1,
      ...results.flatMap((r) => {
        const chunks = vectors.get(docKey(r.doc));
        return chunks?.length ? [bestSimilarity(queryVector, chunks)] : [];
      }),
    );
    return toTexts > toResults;
  }

  /** Notes most similar in meaning to the given one (needs the model's vectors). */
  similarNotes(noteId: string, limit = 3): SearchResult[] {
    const vectors = this.index.vectors();
    const source = vectors.get(docKey({ kind: 'note', id: noteId }));
    if (!source?.length) return [];
    const centroid = mean(source);
    const scored = this.index
      .docs()
      .filter((d) => d.kind === 'note' && d.id !== noteId)
      .flatMap((doc) => {
        const target = vectors.get(docKey(doc));
        return target?.length ? [{ doc, sim: bestSimilarity(centroid, target) }] : [];
      });
    const floor = this.index.spec().similarFloor;
    const relevance = relevanceScale(
      scored.map((s) => s.sim),
      SIMILAR_MIN_Z,
      floor,
    );
    return scored
      .filter((s) => s.sim >= floor && relevance(s.sim) >= 1)
      .sort((a, b) => b.sim - a.sim)
      .slice(0, limit)
      .map(({ doc, sim }) => ({ doc, score: sim, matchedBy: 'semantic' as const, snippet: snippet(doc, []) }));
  }
}

/** Share of query terms found, with matches in the title counting extra. */
export function keywordScore(doc: Pick<SearchDoc, 'title' | 'body'>, terms: string[]): number {
  const title = foldForSearch(doc.title);
  const body = foldForSearch(doc.body);
  let score = 0;
  for (const term of terms) {
    if (containsTerm(title, term)) score += 1;
    else if (containsTerm(body, term)) score += 0.7;
  }
  return Math.min(1, score / terms.length);
}

/**
 * Substring match, except that very short terms ("iş", "ve") must start a word: otherwise
 * "iş" would match inside "alışveriş" and "listesi".
 */
function containsTerm(text: string, term: string): boolean {
  if (term.length >= 3) return text.includes(term);
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}`, 'u').test(text);
}

/** Best chunk similarity, optionally corrected by each chunk's hubness. */
export function bestSimilarity(query: Float32Array, chunks: Float32Array[], hubness?: number[], hubWeight = 1): number {
  return Math.max(...chunks.map((c, i) => similarity(query, c) - (hubness ? hubWeight * hubness[i] : 0)));
}

/**
 * Returns a function mapping a similarity to "how relevant", where >= 1 means relevant:
 * the z-score divided by `minZ` when there are enough samples, otherwise a comparison
 * against `floor` (>= floor maps to 1+).
 */
export function relevanceScale(samples: number[], minZ: number, floor: number): (sim: number) => number {
  if (samples.length < MIN_DOCS_FOR_STATS) return (sim) => (sim >= floor ? 1 + (sim - floor) * 20 : 0);
  const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
  const std = Math.sqrt(samples.reduce((a, b) => a + (b - avg) ** 2, 0) / samples.length) || 1e-6;
  return (sim) => (sim - avg) / std / minZ;
}

/** Text around the first matching term, or the beginning of the body. */
export function snippet(doc: Pick<SearchDoc, 'body'>, terms: string[], radius = 70): string {
  const body = doc.body.replace(/\s+/g, ' ').trim();
  const folded = foldForSearch(body);
  // Folding keeps string length for Turkish letters, so indices map back onto `body`.
  const at = terms.map((t) => folded.indexOf(t)).filter((i) => i >= 0).sort((a, b) => a - b)[0];
  if (at === undefined) return body.length > radius * 2 ? `${body.slice(0, radius * 2).trimEnd()}…` : body;
  const start = Math.max(0, at - radius);
  const end = Math.min(body.length, at + radius);
  return `${start > 0 ? '…' : ''}${body.slice(start, end).trim()}${end < body.length ? '…' : ''}`;
}

function mean(vectors: Float32Array[]): Float32Array {
  const out = new Float32Array(vectors[0].length);
  for (const v of vectors) for (let i = 0; i < v.length; i++) out[i] += v[i] / vectors.length;
  const norm = Math.hypot(...out) || 1;
  return out.map((x) => x / norm);
}
