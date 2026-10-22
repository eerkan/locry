export interface Note {
  id: string;
  title: string;
  /** Markdown source. */
  content: string;
  tags: string[];
  pinned: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NotePatch = Partial<Pick<Note, 'title' | 'content' | 'tags' | 'pinned' | 'archived'>>;

/** Folds case and diacritics so "Işık" matches "isik" and "INFO" matches "info". */
export function foldForSearch(value: string): string {
  return value
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ı/g, 'i');
}

/** Normalizes a user-entered tag: trimmed, no leading '#', inner whitespace collapsed to '-'. */
export function normalizeTag(value: string): string {
  return value.trim().replace(/^#+/, '').replace(/\s+/g, '-').toLocaleLowerCase('tr');
}

/** First non-empty line of the content without Markdown syntax, for list previews. */
export function noteExcerpt(note: Note, maxLength = 140): string {
  const text = note.content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+[.)])\s+(\[[ xX]\]\s+)?/gm, '')
    .replace(/[*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
}

export function matchesQuery(note: Note, query: string): boolean {
  const terms = foldForSearch(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const haystack = foldForSearch(`${note.title}\n${note.content}\n${note.tags.join(' ')}`);
  return terms.every((term) => haystack.includes(term));
}

/** Pinned notes first, then most recently updated. */
export function compareNotes(a: Note, b: Note): number {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  return b.updatedAt.localeCompare(a.updatedAt);
}
