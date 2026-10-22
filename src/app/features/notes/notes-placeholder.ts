import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideNotebookPen } from '@ng-icons/lucide';

/** Shown in the editor pane when no note is selected. */
@Component({
  selector: 'app-notes-placeholder',
  imports: [NgIcon, TranslocoPipe],
  providers: [provideIcons({ lucideNotebookPen })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'text-muted-foreground flex h-full flex-col items-center justify-center gap-3 p-8 text-center' },
  template: `
    <span class="bg-muted text-foreground flex size-12 items-center justify-center rounded-full">
      <ng-icon name="lucideNotebookPen" class="text-xl" />
    </span>
    <p class="text-foreground font-medium">{{ 'pages.notes.selectTitle' | transloco }}</p>
    <p class="max-w-xs text-sm">{{ 'pages.notes.selectDescription' | transloco }}</p>
  `,
})
export class NotesPlaceholder {}
