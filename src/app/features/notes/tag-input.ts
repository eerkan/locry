import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideHash, lucideX } from '@ng-icons/lucide';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { normalizeTag } from './note';

/** Inline tag editor: badges with a remove button plus an input that adds on Enter or comma. */
@Component({
  selector: 'app-tag-input',
  imports: [HlmBadge, NgIcon, TranslocoPipe],
  providers: [provideIcons({ lucideX, lucideHash })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-wrap items-center gap-1.5' },
  template: `
    @for (tag of tags(); track tag) {
      <span hlmBadge variant="secondary" class="gap-1 pe-1">
        #{{ tag }}
        <button
          type="button"
          class="hover:bg-foreground/10 rounded-sm p-0.5"
          [attr.aria-label]="'pages.notes.removeTag' | transloco: { tag }"
          (click)="remove(tag)"
        >
          <ng-icon name="lucideX" class="text-[10px]" />
        </button>
      </span>
    }
    <span class="text-muted-foreground flex items-center gap-1 text-sm">
      <ng-icon name="lucideHash" class="text-xs" />
      <input
        class="placeholder:text-muted-foreground/70 w-28 bg-transparent py-0.5 outline-none"
        list="locry-tag-suggestions"
        [placeholder]="'pages.notes.addTag' | transloco"
        [value]="draft()"
        (input)="onInput($any($event.target).value)"
        (keydown)="onKeydown($event)"
        (blur)="commit()"
      />
      <datalist id="locry-tag-suggestions">
        @for (tag of suggestions(); track tag) {
          <option [value]="tag"></option>
        }
      </datalist>
    </span>
  `,
})
export class TagInput {
  readonly tags = input.required<string[]>();
  readonly suggestions = input<string[]>([]);
  /** Emits single changes: the parent applies them to the latest note state. */
  readonly added = output<string>();
  readonly removed = output<string>();

  protected readonly draft = signal('');

  protected onInput(value: string): void {
    if (value.includes(',')) {
      this.draft.set(value.replace(/,/g, ''));
      this.commit();
    } else {
      this.draft.set(value);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commit();
    } else if (event.key === 'Backspace' && !this.draft() && this.tags().length) {
      this.remove(this.tags()[this.tags().length - 1]);
    }
  }

  protected commit(): void {
    const tag = normalizeTag(this.draft());
    this.draft.set('');
    if (tag && !this.tags().includes(tag)) this.added.emit(tag);
  }

  protected remove(tag: string): void {
    this.removed.emit(tag);
  }
}
