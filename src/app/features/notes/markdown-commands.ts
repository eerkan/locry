/** Text plus selection, as read from and written back to a textarea. */
export interface EditorState {
  value: string;
  start: number;
  end: number;
}

export type MarkdownCommand =
  | 'bold'
  | 'italic'
  | 'strike'
  | 'code'
  | 'link'
  | 'heading'
  | 'quote'
  | 'bullet'
  | 'numbered'
  | 'task'
  | 'codeBlock'
  | 'divider';

const WRAPS: Partial<Record<MarkdownCommand, [string, string]>> = {
  bold: ['**', '**'],
  italic: ['_', '_'],
  strike: ['~~', '~~'],
  code: ['`', '`'],
};

const LINE_PREFIXES: Partial<Record<MarkdownCommand, string>> = {
  heading: '## ',
  quote: '> ',
  bullet: '- ',
  task: '- [ ] ',
};

/** Applies a toolbar command to the editor state and returns the new state. */
export function applyCommand(state: EditorState, command: MarkdownCommand, placeholder = ''): EditorState {
  const wrap = WRAPS[command];
  if (wrap) return toggleWrap(state, wrap[0], wrap[1], placeholder);

  const prefix = LINE_PREFIXES[command];
  if (prefix) return toggleLinePrefix(state, () => prefix, prefix);

  switch (command) {
    case 'numbered':
      return toggleLinePrefix(state, (i) => `${i + 1}. `, /^\d+\.\s/);
    case 'link':
      return insertLink(state, placeholder);
    case 'codeBlock':
      return wrapBlock(state, '```\n', '\n```');
    case 'divider':
      return insertBlock(state, '---');
    default:
      return state;
  }
}

function toggleWrap(state: EditorState, before: string, after: string, placeholder: string): EditorState {
  const { value, start, end } = state;
  const selected = value.slice(start, end);

  // Already wrapped just outside the selection: unwrap.
  if (value.slice(start - before.length, start) === before && value.slice(end, end + after.length) === after) {
    return {
      value: value.slice(0, start - before.length) + selected + value.slice(end + after.length),
      start: start - before.length,
      end: end - before.length,
    };
  }

  const text = selected || placeholder;
  return {
    value: value.slice(0, start) + before + text + after + value.slice(end),
    start: start + before.length,
    end: start + before.length + text.length,
  };
}

/**
 * Adds the prefix to every line touched by the selection, or removes it when all those
 * lines already have it.
 */
function toggleLinePrefix(
  state: EditorState,
  prefixFor: (lineIndex: number) => string,
  existing: string | RegExp,
): EditorState {
  const { value, start, end } = state;
  const blockStart = value.lastIndexOf('\n', start - 1) + 1;
  const nextBreak = value.indexOf('\n', end > start && value[end - 1] === '\n' ? end - 1 : end);
  const blockEnd = nextBreak === -1 ? value.length : nextBreak;

  const lines = value.slice(blockStart, blockEnd).split('\n');
  const has = (line: string) => (typeof existing === 'string' ? line.startsWith(existing) : existing.test(line));
  const strip = (line: string) => (typeof existing === 'string' ? line.slice(existing.length) : line.replace(existing, ''));
  const filled = lines.filter((line) => line.trim());
  const allPrefixed = filled.length > 0 && filled.every(has);

  const updated = lines.map((line, i) => {
    if (!line.trim() && lines.length > 1) return line;
    return allPrefixed ? strip(line) : prefixFor(i) + (has(line) ? strip(line) : line);
  });
  const block = updated.join('\n');
  const delta = block.length - (blockEnd - blockStart);

  return {
    value: value.slice(0, blockStart) + block + value.slice(blockEnd),
    start: lines.length === 1 ? Math.max(blockStart, start + delta) : blockStart,
    end: lines.length === 1 ? Math.max(blockStart, end + delta) : blockStart + block.length,
  };
}

function insertLink(state: EditorState, placeholder: string): EditorState {
  const { value, start, end } = state;
  const text = value.slice(start, end) || placeholder;
  const urlPlaceholder = 'https://';
  const inserted = `[${text}](${urlPlaceholder})`;
  const urlStart = start + text.length + 3;
  return {
    value: value.slice(0, start) + inserted + value.slice(end),
    start: urlStart,
    end: urlStart + urlPlaceholder.length,
  };
}

function wrapBlock(state: EditorState, before: string, after: string): EditorState {
  const { value, start, end } = state;
  const lead = start > 0 && value[start - 1] !== '\n' ? '\n' : '';
  const trail = end < value.length && value[end] !== '\n' ? '\n' : '';
  const inner = value.slice(start, end);
  const contentStart = start + lead.length + before.length;
  return {
    value: value.slice(0, start) + lead + before + inner + after + trail + value.slice(end),
    start: contentStart,
    end: contentStart + inner.length,
  };
}

function insertBlock(state: EditorState, block: string): EditorState {
  const { value, start, end } = state;
  const lead = start > 0 && value[start - 1] !== '\n' ? '\n\n' : start > 0 && value[start - 2] !== '\n' ? '\n' : '';
  const inserted = `${lead}${block}\n\n`;
  const caret = start + inserted.length;
  return { value: value.slice(0, start) + inserted + value.slice(end), start: caret, end: caret };
}

const LIST_ITEM = /^(\s*)([-*+]|(\d+)([.)]))\s+(\[[ xX]\]\s+)?/;

/**
 * Handles Enter inside a list item: continues the list on the next line (with an unchecked
 * box for task items and the next number for ordered items), or ends the list when the
 * current item is empty. Returns null when the caret is not in a list item.
 */
export function continueList(state: EditorState): EditorState | null {
  const { value, start, end } = state;
  if (start !== end) return null;
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const line = value.slice(lineStart, start);
  const match = line.match(LIST_ITEM);
  if (!match) return null;

  const [prefix, indent, bullet, number, delimiter, task] = match;
  if (line.trim() === prefix.trim()) {
    // Empty item: remove its marker and leave the list.
    return { value: value.slice(0, lineStart) + value.slice(start), start: lineStart, end: lineStart };
  }

  const marker = number ? `${Number(number) + 1}${delimiter}` : bullet;
  const next = `\n${indent}${marker} ${task ? '[ ] ' : ''}`;
  const caret = start + next.length;
  return { value: value.slice(0, start) + next + value.slice(end), start: caret, end: caret };
}
