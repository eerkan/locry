import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInput } from '@spartan-ng/helm/input';
import { LIST_COLORS, type ListColor, type TaskList } from './task';
import { LIST_DOT } from './task-ui';

export interface ListDraft {
  name: string;
  color: ListColor;
}

/** Create or edit a task list. Pass `list` to edit; leave it null to create. */
@Component({
  selector: 'app-list-dialog',
  imports: [HlmButton, HlmDialogImports, HlmFieldImports, HlmInput, NgIcon, TranslocoPipe],
  providers: [provideIcons({ lucideCheck })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog [state]="open() ? 'open' : 'closed'" (stateChanged)="$event === 'closed' && closed.emit()">
      <hlm-dialog-content *hlmDialogPortal="let ctx" class="sm:max-w-sm">
        <form class="flex flex-col gap-5" (submit)="$event.preventDefault(); submit()">
          <hlm-dialog-header>
            <h2 hlmDialogTitle>{{ (list() ? 'pages.tasks.editList' : 'pages.tasks.newList') | transloco }}</h2>
          </hlm-dialog-header>
          <div hlmField>
            <label hlmFieldLabel for="list-name">{{ 'pages.tasks.listName' | transloco }}</label>
            <input
              hlmInput
              id="list-name"
              autocomplete="off"
              maxlength="60"
              [placeholder]="'pages.tasks.listNamePlaceholder' | transloco"
              [value]="name()"
              (input)="name.set($any($event.target).value)"
            />
          </div>
          <fieldset class="flex flex-col gap-2">
            <legend class="mb-2 text-sm font-medium">{{ 'pages.tasks.listColor' | transloco }}</legend>
            <div class="flex flex-wrap gap-2">
              @for (c of colors; track c) {
                <button
                  type="button"
                  class="ring-offset-background flex size-7 items-center justify-center rounded-full text-white transition-shadow"
                  [class]="dot[c]"
                  [class.ring-2]="color() === c"
                  [class.ring-ring]="color() === c"
                  [class.ring-offset-2]="color() === c"
                  [attr.aria-label]="'pages.tasks.colors.' + c | transloco"
                  [attr.aria-pressed]="color() === c"
                  (click)="color.set(c)"
                >
                  @if (color() === c) {
                    <ng-icon name="lucideCheck" class="text-sm" />
                  }
                </button>
              }
            </div>
          </fieldset>
          <hlm-dialog-footer>
            <button hlmBtn type="button" variant="outline" (click)="closed.emit()">{{ 'pages.tasks.cancel' | transloco }}</button>
            <button hlmBtn type="submit" [disabled]="!name().trim()">
              {{ (list() ? 'pages.tasks.save' : 'pages.tasks.createList') | transloco }}
            </button>
          </hlm-dialog-footer>
        </form>
      </hlm-dialog-content>
    </hlm-dialog>
  `,
})
export class ListDialog {
  readonly open = input.required<boolean>();
  readonly list = input<TaskList | null>(null);
  readonly saved = output<ListDraft>();
  readonly closed = output<void>();

  protected readonly colors = LIST_COLORS;
  protected readonly dot = LIST_DOT;
  protected readonly name = signal('');
  protected readonly color = signal<ListColor>('blue');

  constructor() {
    // Reset the form every time the dialog opens.
    effect(() => {
      if (!this.open()) return;
      const list = this.list();
      this.name.set(list?.name ?? '');
      this.color.set(list?.color ?? 'blue');
    });
  }

  protected submit(): void {
    const name = this.name().trim();
    if (name) this.saved.emit({ name, color: this.color() });
  }
}
