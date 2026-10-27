import DOMPurify from 'dompurify';
import { Marked } from 'marked';

const TASK_LINE = /^(\s*(?:[-*+]|\d+[.)])\s+\[)([ xX])(\])/;
const FENCE = /^\s{0,3}(`{3,}|~{3,})/;

let hooksInstalled = false;

/**
 * Hardens DOMPurify output for a local-only app:
 * - links open in a new tab without leaking the opener or referrer;
 * - remote images are not loaded (that would reveal note activity to third parties),
 *   only inline `data:` images are kept.
 */
function installHooks(): void {
  if (hooksInstalled) return;
  hooksInstalled = true;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.getAttribute('href')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src') ?? '';
      if (!src.startsWith('data:image/')) {
        node.setAttribute('data-blocked-src', src);
        node.removeAttribute('src');
      }
    }
  });
}

/**
 * Renders Markdown (GFM) to sanitized HTML. Task-list checkboxes carry a
 * `data-task-index` so the preview can toggle them in the source.
 */
export function renderMarkdown(source: string): string {
  installHooks();
  let taskIndex = 0;
  const marked = new Marked({
    gfm: true,
    breaks: true,
    renderer: {
      checkbox({ checked }) {
        return `<input type="checkbox" data-task-index="${taskIndex++}"${checked ? ' checked' : ''}> `;
      },
    },
  });
  const html = marked.parse(source, { async: false });
  const fragment = DOMPurify.sanitize(html, {
    ADD_ATTR: ['target', 'data-task-index', 'data-blocked-src'],
    FORBID_TAGS: ['style', 'form', 'button', 'textarea', 'select'],
    RETURN_DOM_FRAGMENT: true,
  });
  replaceBlockedImages(fragment);
  labelTaskBoxes(fragment);
  const container = document.createElement('div');
  container.append(fragment);
  return container.innerHTML;
}

/** Names each task-list checkbox after its item's own text (not nested items), for screen readers. */
function labelTaskBoxes(root: DocumentFragment): void {
  for (const box of Array.from(root.querySelectorAll('input[data-task-index]'))) {
    const item = box.closest('li');
    if (!item) continue;
    const own = Array.from(item.childNodes)
      .filter((n) => !(n instanceof Element && (n.matches('ul, ol') || n === box)))
      .map((n) => n.textContent ?? '')
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
    if (own) box.setAttribute('aria-label', own.length > 120 ? `${own.slice(0, 119)}…` : own);
  }
}

/** Swaps blocked remote images for a small labelled chip instead of a broken-image icon. */
function replaceBlockedImages(root: DocumentFragment): void {
  for (const img of Array.from(root.querySelectorAll('img[data-blocked-src]'))) {
    const src = img.getAttribute('data-blocked-src') ?? '';
    const chip = document.createElement('span');
    chip.className = 'blocked-image';
    chip.title = src;
    chip.textContent = img.getAttribute('alt') || src;
    img.replaceWith(chip);
  }
}

/** Toggles the n-th task-list checkbox in the Markdown source, skipping fenced code blocks. */
export function toggleTask(source: string, index: number): string {
  const lines = source.split('\n');
  let fence: string | null = null;
  let current = 0;
  for (let i = 0; i < lines.length; i++) {
    const fenceMatch = lines[i].match(FENCE);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (fence === null) fence = marker;
      else if (fence === marker) fence = null;
      continue;
    }
    if (fence !== null) continue;
    const task = lines[i].match(TASK_LINE);
    if (!task) continue;
    if (current++ === index) {
      const checked = task[2] !== ' ';
      lines[i] = lines[i].replace(TASK_LINE, `$1${checked ? ' ' : 'x'}$3`);
      return lines.join('\n');
    }
  }
  return source;
}
