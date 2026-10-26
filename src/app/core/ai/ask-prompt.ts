import type { ChatMessage } from './chat-protocol';

/** A note or task given to the model, numbered for citations ([1], [2]…). */
export interface AskSource {
  kind: 'note' | 'task';
  id: string;
  title: string;
  /** Plain text of the note, or a task's notes and subtasks. */
  body: string;
  /** Tasks only. */
  dueDate?: string | null;
  done?: boolean;
}

export interface AskTurn {
  question: string;
  answer: string;
}

/** Small models: keep the prompt short so answers start quickly and stay on topic. */
export const SOURCE_CHARS = 900;
export const CONTEXT_CHARS = 3600;
/** Earlier questions and answers kept for follow-ups ("and the second one?"). */
export const HISTORY_TURNS = 2;

/**
 * Instructions in English (small models follow them best), the answer language named
 * explicitly, and the sources as a numbered list the answer cites.
 */
export function buildAskMessages(input: {
  question: string;
  sources: AskSource[];
  history: AskTurn[];
  language: string;
  today: string;
}): ChatMessage[] {
  const system = [
    'You are the assistant of Locry, a private notes and tasks app.',
    "Answer the user's question using only the numbered notes and tasks they provide.",
    'If they do not contain the answer, say that you could not find it in the notes. Never make things up.',
    'Be brief: a few sentences or a short list.',
    'Ignore notes and tasks that are not relevant to the question.',
    'Name the things you mention in words, and after each fact cite its source number in square brackets, like [1].',
    `Today is ${input.today}.`,
    `Always answer in ${input.language}.`,
  ].join(' ');

  const messages: ChatMessage[] = [{ role: 'system', content: system }];
  for (const turn of input.history.slice(-HISTORY_TURNS)) {
    messages.push({ role: 'user', content: turn.question }, { role: 'assistant', content: turn.answer });
  }
  messages.push({ role: 'user', content: `${formatSources(input.sources)}\n\nQuestion: ${input.question}` });
  return messages;
}

/** The sources as numbered blocks, trimmed to the context budget. */
export function formatSources(sources: AskSource[]): string {
  if (!sources.length) return '(No notes or tasks found.)';
  const blocks: string[] = [];
  let used = 0;
  sources.forEach((source, i) => {
    const header = source.kind === 'note' ? `[${i + 1}] Note: ${source.title}` : `[${i + 1}] Task: ${source.title}${taskState(source)}`;
    const room = Math.min(SOURCE_CHARS, CONTEXT_CHARS - used - header.length);
    if (room <= 0) return;
    const body = source.body.length > room ? `${source.body.slice(0, room).trimEnd()}…` : source.body;
    const block = body ? `${header}\n${body}` : header;
    blocks.push(block);
    used += block.length;
  });
  return blocks.join('\n\n');
}

function taskState(source: AskSource): string {
  const parts = [source.done ? 'done' : null, source.dueDate ? `due ${source.dueDate}` : null].filter(Boolean);
  return parts.length ? ` (${parts.join(', ')})` : '';
}

/**
 * The models answer in Markdown; the answer is shown as plain text, so lists become bullets
 * and emphasis markers go.
 */
export function plainAnswer(answer: string): string {
  return answer
    .replace(/^[ \t]*[*+-][ \t]+/gm, '• ')
    .replace(/^#{1,6}[ \t]+/gm, '')
    .replace(/\*\*|__/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Splits an answer into text and citations. Small models sometimes cite sources that do not
 * exist ([2] with one source); those are dropped.
 */
export function citationParts(answer: string, sourceCount: number): ({ text: string } | { cite: number })[] {
  const parts: ({ text: string } | { cite: number })[] = [];
  let last = 0;
  for (const match of answer.matchAll(/ ?\[(\d{1,2})\]/g)) {
    const n = Number(match[1]);
    const valid = n >= 1 && n <= sourceCount;
    const start = valid ? match.index + match[0].indexOf('[') : match.index;
    if (start > last) parts.push({ text: answer.slice(last, start) });
    if (valid) parts.push({ cite: n });
    last = match.index + match[0].length;
  }
  if (last < answer.length) parts.push({ text: answer.slice(last) });
  return parts;
}
