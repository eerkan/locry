import { applyCommand, continueList } from './markdown-commands';
import { renderMarkdown, toggleTask } from './markdown';
import { type Note, foldForSearch, matchesQuery, normalizeTag, noteExcerpt } from './note';

function note(patch: Partial<Note> = {}): Note {
  return {
    id: '1',
    title: '',
    content: '',
    tags: [],
    pinned: false,
    archived: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...patch,
  };
}

describe('renderMarkdown', () => {
  it('renders GFM', () => {
    const html = renderMarkdown('# Başlık\n\n**kalın** ve `kod`\n\n| a | b |\n|---|---|\n| 1 | 2 |');
    expect(html).toContain('<h1>Başlık</h1>');
    expect(html).toContain('<strong>kalın</strong>');
    expect(html).toContain('<code>kod</code>');
    expect(html).toContain('<table>');
  });

  it('strips scripts and event handlers', () => {
    const html = renderMarkdown(
      '<script>alert(1)</script>\n\n<img src="x" onerror="alert(1)">\n\n[x](javascript:alert(1))\n\n<a href="javascript:alert(1)">y</a>',
    );
    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror');
    expect(html).not.toMatch(/href="javascript:/i);
  });

  it('does not load remote images', () => {
    const html = renderMarkdown('![logo](https://example.com/a.png)');
    expect(html).not.toContain('<img');
    expect(html).toContain('<span class="blocked-image" title="https://example.com/a.png">logo</span>');
  });

  it('opens links in a new tab without referrer', () => {
    const html = renderMarkdown('[site](https://example.com)');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('numbers task checkboxes in document order', () => {
    const html = renderMarkdown('- [ ] a\n- [x] b\n  - [ ] c');
    expect(html.match(/data-task-index="(\d)"/g)).toEqual([
      'data-task-index="0"',
      'data-task-index="1"',
      'data-task-index="2"',
    ]);
  });

  it('names task checkboxes after their own item text', () => {
    const html = renderMarkdown('- [ ] Buy **milk**\n  - [x] whole');
    expect(html).toContain('aria-label="Buy milk"');
    expect(html).toContain('aria-label="whole"');
  });
});

describe('toggleTask', () => {
  it('toggles the n-th task', () => {
    const source = '- [ ] a\n- [x] b\n  - [ ] c';
    expect(toggleTask(source, 0)).toBe('- [x] a\n- [x] b\n  - [ ] c');
    expect(toggleTask(source, 1)).toBe('- [ ] a\n- [ ] b\n  - [ ] c');
    expect(toggleTask(source, 2)).toBe('- [ ] a\n- [x] b\n  - [x] c');
  });

  it('ignores tasks inside fenced code', () => {
    const source = '```\n- [ ] code\n```\n- [ ] real';
    expect(toggleTask(source, 0)).toBe('```\n- [ ] code\n```\n- [x] real');
  });
});

describe('applyCommand', () => {
  it('wraps the selection and keeps it selected', () => {
    const next = applyCommand({ value: 'merhaba dünya', start: 8, end: 13 }, 'bold');
    expect(next.value).toBe('merhaba **dünya**');
    expect(next.value.slice(next.start, next.end)).toBe('dünya');
  });

  it('unwraps when applied again', () => {
    const once = applyCommand({ value: 'a b', start: 2, end: 3 }, 'italic');
    expect(applyCommand(once, 'italic').value).toBe('a b');
  });

  it('inserts a placeholder without selection', () => {
    const next = applyCommand({ value: '', start: 0, end: 0 }, 'bold', 'metin');
    expect(next.value).toBe('**metin**');
    expect(next.value.slice(next.start, next.end)).toBe('metin');
  });

  it('toggles line prefixes over multiple lines', () => {
    const value = 'bir\niki\nüç';
    const listed = applyCommand({ value, start: 0, end: value.length }, 'task');
    expect(listed.value).toBe('- [ ] bir\n- [ ] iki\n- [ ] üç');
    expect(applyCommand(listed, 'task').value).toBe(value);
  });

  it('adds a prefix on an empty line and places the caret after it', () => {
    const next = applyCommand({ value: 'başlık\n', start: 7, end: 7 }, 'task');
    expect(next.value).toBe('başlık\n- [ ] ');
    expect(next.start).toBe(next.value.length);
  });

  it('numbers ordered lists', () => {
    const value = 'a\nb';
    expect(applyCommand({ value, start: 0, end: value.length }, 'numbered').value).toBe('1. a\n2. b');
  });

  it('selects the URL placeholder of a new link', () => {
    const next = applyCommand({ value: 'site', start: 0, end: 4 }, 'link');
    expect(next.value).toBe('[site](https://)');
    expect(next.value.slice(next.start, next.end)).toBe('https://');
  });
});

describe('continueList', () => {
  it('continues bullets, tasks and numbers', () => {
    expect(continueList({ value: '- a', start: 3, end: 3 })?.value).toBe('- a\n- ');
    expect(continueList({ value: '- [x] a', start: 7, end: 7 })?.value).toBe('- [x] a\n- [ ] ');
    expect(continueList({ value: '  9. a', start: 6, end: 6 })?.value).toBe('  9. a\n  10. ');
  });

  it('ends the list on an empty item', () => {
    expect(continueList({ value: 'x\n- ', start: 4, end: 4 })).toEqual({ value: 'x\n', start: 2, end: 2 });
  });

  it('ignores plain lines', () => {
    expect(continueList({ value: 'metin', start: 5, end: 5 })).toBeNull();
  });
});

describe('note helpers', () => {
  it('folds Turkish case and diacritics', () => {
    expect(foldForSearch('IŞIK İnce Ğ')).toBe('isik ince g');
    expect(matchesQuery(note({ title: 'Işık ayarları' }), 'isik')).toBe(true);
    expect(matchesQuery(note({ content: 'INFO log' }), 'info')).toBe(true);
    expect(matchesQuery(note({ tags: ['iş'] }), 'is')).toBe(true);
    expect(matchesQuery(note({ title: 'a' }), 'a b')).toBe(false);
  });

  it('normalizes tags', () => {
    expect(normalizeTag('  #Proje Fikirleri ')).toBe('proje-fikirleri');
  });

  it('builds a plain-text excerpt', () => {
    const content = '# Başlık\n\n- [ ] **görev** ve [bağlantı](https://x.y)\n```\nkod\n```';
    expect(noteExcerpt(note({ content }))).toBe('Başlık görev ve bağlantı');
  });
});
