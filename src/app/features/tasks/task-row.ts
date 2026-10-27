import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCalendar, lucideChevronDown, lucideChevronUp, lucideFileText, lucideFlag, lucideGripVertical, lucideListChecks } from '@ng-icons/lucide';
import { PreferencesService } from '../../core/preferences.service';
import { type Task, type TaskList, dueStatus } from './task';
import { TaskCheck } from './task-check';
import { LIST_DOT, PRIORITY_TEXT, formatDue } from './task-ui';

@Component({
  selector: 'app-task-row',
  imports: [CdkDragHandle, NgIcon, TaskCheck, TranslocoPipe],
  providers: [provideIcons({ lucideGripVertical, lucideChevronUp, lucideChevronDown, lucideCalendar, lucideFlag, lucideListChecks, lucideFileText })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'group hover:bg-accent/50 has-[button:focus-visible]:ring-ring/50 flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 transition-colors has-[button:focus-visible]:ring-[3px]',
    '[class.bg-accent]': 'selected()',
    '(click)': 'opened.emit()',
    // Reordering without dragging: Alt+↑ / Alt+↓ on the focused task.
    '(keydown.alt.arrowup)': 'draggable() && move($event, -1)',
    '(keydown.alt.arrowdown)': 'draggable() && move($event, 1)',
  },
  template: `
    @if (draggable()) {
      <!-- Dragging is for the mouse; the move buttons at the end of the row do the same. -->
      <span
        class="text-muted-foreground/60 -ms-1 mt-0.5 cursor-grab opacity-0 group-hover:opacity-100 active:cursor-grabbing"
        cdkDragHandle
        aria-hidden="true"
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
    @if (draggable()) {
      <!-- Reordering with a click or the keyboard, for everyone who does not drag. -->
      <span class="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
        <button
          type="button"
          class="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring/50 flex size-6 items-center justify-center rounded-md outline-none focus-visible:ring-[3px] disabled:invisible"
          [disabled]="first()"
          [attr.aria-label]="'pages.tasks.moveUp' | transloco: { title: displayTitle() }"
          (click)="move($event, -1)"
        >
          <ng-icon name="lucideChevronUp" class="text-[14px]" />
        </button>
        <button
          type="button"
          class="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring/50 flex size-6 items-center justify-center rounded-md outline-none focus-visible:ring-[3px] disabled:invisible"
          [disabled]="last()"
          [attr.aria-label]="'pages.tasks.moveDown' | transloco: { title: displayTitle() }"
          (click)="move($event, 1)"
        >
          <ng-icon name="lucideChevronDown" class="text-[14px]" />
        </button>
      </span>
    }
  `,
})
export class TaskRow {
  readonly task = input.required<Task>();
  readonly today = input.required<string>();
  /** Shown in smart views, where tasks from several lists are mixed. */
  readonly list = input<TaskList | undefined>();
  readonly draggable = input(false);
  /** Position in a reorderable list, to disable moving past the ends. */
  readonly first = input(false);
  readonly last = input(false);
  readonly selected = input(false);
  readonly toggled = output<void>();
  readonly opened = output<void>();
  /** Move one place up (-1) or down (1). */
  readonly moved = output<-1 | 1>();

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
    return due ? formatDue(due, this.today(), this.prefs.lang(), this.transloco, this.task().dueTime) : '';
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

  protected move(event: Event, by: -1 | 1): void {
    event.preventDefault();
    event.stopPropagation();
    if ((by < 0 && this.first()) || (by > 0 && this.last())) return;
    this.moved.emit(by);
  }
}
