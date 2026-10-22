import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { foldForSearch } from '../features/notes/note';

/** Renders text with query terms wrapped in <mark>, matching case- and accent-insensitively. */
@Component({
  selector: 'app-highlight',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@for (part of parts(); track $index) {@if (part.match) {<mark class="bg-yellow-200/70 text-inherit dark:bg-yellow-500/30 rounded-sm">{{ part.text }}</mark>} @else {{{ part.text }}}}`,
})
export class Highlight {
  readonly text = input.required<string>();
  readonly terms = input<string[]>([]);

  protected readonly parts = computed(() => {
    const text = this.text();
    const terms = this.terms().filter(Boolean);
    if (!terms.length) return [{ text, match: false }];
    // Folding keeps length for Turkish letters, so ranges found in the folded text apply to the original.
    const folded = foldForSearch(text);
    const ranges: [number, number][] = [];
    for (const term of terms) {
      for (let at = folded.indexOf(term); at >= 0; at = folded.indexOf(term, at + term.length)) {
        ranges.push([at, at + term.length]);
      }
    }
    ranges.sort((a, b) => a[0] - b[0]);
    const parts: { text: string; match: boolean }[] = [];
    let pos = 0;
    for (const [start, end] of ranges) {
      if (start < pos) continue;
      if (start > pos) parts.push({ text: text.slice(pos, start), match: false });
      parts.push({ text: text.slice(start, end), match: true });
      pos = end;
    }
    if (pos < text.length) parts.push({ text: text.slice(pos), match: false });
    return parts;
  });
}
