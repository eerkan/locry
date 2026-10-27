import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCalendar, lucideFileText, lucideFlag, lucideGripVertical, lucideListChecks } from '@ng-icons/lucide';
import { PreferencesService } from '../../core/preferences.service';
import { type Task, type TaskList, dueStatus } from './task';
import { TaskCheck } from './task-check';
import { LIST_DOT, PRIORITY_TEXT, formatDue } from './task-ui';

@Component({
  selector: 'app-task-row',
  imports: [CdkDragHandle, NgIcon, TaskCheck, TranslocoPipe],
  providers: [provideIcons({ lucideGripVertical, lucideCalendar, lucideFlag, lucideListChecks, lucideFileText })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'group hover:bg-accent/50 has-[button:focus-visible]:ring-ring/50 flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 transition-colors has-[button:focus-visible]:ring-[3px]',
    '[class.bg-accent]': 'selected()',
    '(click)': 'opened.emit()',
  },
  template: `
    @if (draggable()) {
      <span
        class="text-muted-foreground/60 -ms-1 mt-0.5 cursor-grab opacity-0 group-hover:opacity-100 active:cursor-grabbing"
        cdkDragHandle
        [attr.aria-label]="'pages.tasks.dragHandle' | transloco"
      >
        <ng-icon name="lucideGripVertical" />
      </span>
    }
    <app-task-check
      class="mt-0.5"
      [done]="task().done"
      [priority]="task().priority"
      [label]="(task().done ? 'pages.tasks.markOpen' : 'pages.tasks.markDone') | transloco: { title: displayTitle() }"
      (toggled)="toggled.emit()"
    />
    <button type="button" class="flex min-w-0 flex-1 flex-col gap-1 text-start outline-none">
      <span
        class="text-sm leading-5 decoration-transparent transition-[color,text-decoration-color] duration-300 group-has-[[data-completing]]:text-muted-foreground group-has-[[data-completing]]:line-through group-has-[[data-completing]]:decoration-current"
        [class.text-muted-foreground]="task().done"
        [class.line-through]="task().done"
        [class.decoration-current]="task().done"
      >
        {{ displayTitle() }}
      </span>
      @if (hasMeta()) {
        <div class="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          @if (task().dueDate && !task().done) {
            <span class="flex items-center gap-1" [class]="dueClass()">
              <ng-icon name="lucideCalendar" />
              {{ dueLabel() }}
            </span>
          }
          @if (task().priority > 0) {
            <span class="flex items-center gap-1" [class]="priorityClass()">
              <ng-icon name="lucideFlag" />
              {{ 'pages.tasks.priority.' + task().priority | transloco }}
            </span>
          }
          @if (task().subtasks.length) {
            <span class="flex items-center gap-1">
              <ng-icon name="lucideListChecks" />
              {{ subtaskDone() }}/{{ task().subtasks.length }}
            </span>
          }
          @if (task().noteId) {
            <ng-icon name="lucideFileText" />
          }
          @if (list(); as list) {
            <span class="flex items-center gap-1.5">
              <span class="size-2 rounded-full" [class]="dot()"></span>
              {{ list.name }}
            </span>
          }
        </div>
      }
    </button>
  `,
})
export class TaskRow {
  readonly task = input.required<Task>();
  readonly today = input.required<string>();
  /** Shown in smart views, where tasks from several lists are mixed. */
  readonly list = input<TaskList | undefined>();
  readonly draggable = input(false);
  readonly selected = input(false);
  readonly toggled = output<void>();
  readonly opened = output<void>();

  private readonly transloco = inject(TranslocoService);
  private readonly prefs = inject(PreferencesService);

  protected readonly displayTitle = computed(
    () => this.task().title || this.transloco.translate('pages.tasks.untitled'),
  );
  protected readonly subtaskDone = computed(() => this.task().subtasks.filter((s) => s.done).length);
  protected readonly hasMeta = computed(() => {
    const t = this.task();
    return (!!t.dueDate && !t.done) || t.priority > 0 || t.subtasks.length > 0 || !!t.noteId || !!this.list();
  });
  protected readonly dueLabel = computed(() => {
    const due = this.task().dueDate;
    // Re-evaluated when the language changes through prefs.lang().
    return due ? formatDue(due, this.today(), this.prefs.lang(), this.transloco) : '';
  });
  protected readonly dueClass = computed(() => {
    const status = dueStatus(this.task().dueDate, this.today());
    return status === 'overdue' ? 'text-red-500' : status === 'today' ? 'text-green-600 dark:text-green-500' : '';
  });
  protected readonly priorityClass = computed(() => PRIORITY_TEXT[this.task().priority]);
  protected readonly dot = computed(() => {
    const list = this.list();
    return list ? LIST_DOT[list.color] : '';
  });
}
