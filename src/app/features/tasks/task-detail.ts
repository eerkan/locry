import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCalendar, lucideExternalLink, lucideFlag, lucidePlus, lucideTrash2, lucideX } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';
import { PreferencesService } from '../../core/preferences.service';
import { relativeTime } from '../../shared/relative-time';
import { NotesStore } from '../notes/notes.store';
import { type Priority, addDays } from './task';
import { TaskCheck } from './task-check';
import { PRIORITY_TEXT, formatDue } from './task-ui';
import { TasksStore } from './tasks.store';

const SAVE_DELAY_MS = 400;

/** Editable details of one task, shown inside the side sheet. */
@Component({
  selector: 'app-task-detail',
  imports: [HlmAlertDialogImports, HlmButton, HlmToggleGroupImports, NgIcon, TaskCheck, TranslocoPipe],
  providers: [provideIcons({ lucideCalendar, lucideFlag, lucidePlus, lucideTrash2, lucideX, lucideExternalLink })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex h-full flex-col' },
  template: `
    @if (task(); as task) {
      <div class="flex flex-1 flex-col gap-6 overflow-y-auto p-6 pt-12">
        <div class="flex items-start gap-3">
          <app-task-check
            class="mt-1.5"
            [done]="task.done"
            [priority]="task.priority"
            [label]="(task.done ? 'pages.tasks.markOpen' : 'pages.tasks.markDone') | transloco: { title: task.title }"
            (toggled)="store.toggleDone(task.id)"
          />
          <textarea
            rows="1"
            class="placeholder:text-muted-foreground/60 field-sizing-content w-full resize-none bg-transparent text-lg leading-snug font-semibold outline-none"
            [class.line-through]="task.done"
            [class.text-muted-foreground]="task.done"
            [placeholder]="'pages.tasks.detail.titlePlaceholder' | transloco"
            [attr.aria-label]="'pages.tasks.detail.titlePlaceholder' | transloco"
            [value]="title()"
            (input)="onTitle($any($event.target).value)"
            (keydown.enter)="$event.preventDefault(); $any($event.target).blur()"
            (blur)="flush()"
          ></textarea>
        </div>

        <section class="flex flex-col gap-2">
          <h3 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">{{ 'pages.tasks.detail.dueDate' | transloco }}</h3>
          <div class="flex flex-wrap items-center gap-2">
            <input
              type="date"
              class="border-input bg-background focus-visible:ring-ring/50 h-8 rounded-md border px-2 text-sm outline-none focus-visible:ring-[3px]"
              [attr.aria-label]="'pages.tasks.detail.dueDate' | transloco"
              [value]="task.dueDate ?? ''"
              (change)="setDue($any($event.target).value || null)"
            />
            <button hlmBtn size="xs" variant="outline" (click)="setDue(store.today())">{{ 'pages.tasks.due.today' | transloco }}</button>
            <button hlmBtn size="xs" variant="outline" (click)="setDue(tomorrow())">{{ 'pages.tasks.due.tomorrow' | transloco }}</button>
            <button hlmBtn size="xs" variant="outline" (click)="setDue(nextWeek())">{{ 'pages.tasks.detail.nextWeek' | transloco }}</button>
            @if (task.dueDate) {
              <button hlmBtn size="xs" variant="ghost" (click)="setDue(null)">{{ 'pages.tasks.detail.clearDate' | transloco }}</button>
            }
          </div>
          @if (task.dueDate) {
            <p class="text-muted-foreground text-xs">{{ dueLabel() }}</p>
          }
        </section>

        <section class="flex flex-col gap-2">
          <h3 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">{{ 'pages.tasks.priority.label' | transloco }}</h3>
          <hlm-toggle-group type="single" size="sm" variant="outline" [value]="'' + task.priority" (valueChange)="setPriority($event)">
            @for (p of priorities; track p) {
              <button hlmToggleGroupItem [value]="'' + p" class="gap-1.5">
                @if (p > 0) {
                  <ng-icon name="lucideFlag" [class]="priorityText[p]" />
                }
                {{ 'pages.tasks.priority.' + p | transloco }}
              </button>
            }
          </hlm-toggle-group>
        </section>

        <section class="flex flex-col gap-2">
          <label for="task-list" class="text-muted-foreground text-xs font-medium tracking-wide uppercase">{{ 'pages.tasks.detail.list' | transloco }}</label>
          <select id="task-list" [class]="selectClass" (change)="setList($any($event.target).value)">
            <option value="" [selected]="task.listId === null">{{ 'pages.tasks.views.inbox' | transloco }}</option>
            @for (list of store.lists(); track list.id) {
              <option [value]="list.id" [selected]="task.listId === list.id">{{ list.name }}</option>
            }
          </select>
        </section>

        <section class="flex flex-col gap-2">
          <h3 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {{ 'pages.tasks.detail.subtasks' | transloco }}
            @if (task.subtasks.length) {
              <span class="tabular-nums">· {{ subtaskDone() }}/{{ task.subtasks.length }}</span>
            }
          </h3>
          <ul class="flex flex-col">
            @for (sub of task.subtasks; track sub.id) {
              <li class="group flex items-center gap-2.5 py-1">
                <app-task-check
                  size="sm"
                  [done]="sub.done"
                  [label]="(sub.done ? 'pages.tasks.markOpen' : 'pages.tasks.markDone') | transloco: { title: sub.title }"
                  (toggled)="store.updateSubtask(task.id, sub.id, { done: !sub.done })"
                />
                <input
                  class="flex-1 bg-transparent text-sm outline-none"
                  [class.line-through]="sub.done"
                  [class.text-muted-foreground]="sub.done"
                  [value]="sub.title"
                  (change)="renameSubtask(sub.id, $any($event.target).value)"
                />
                <button
                  hlmBtn
                  variant="ghost"
                  size="icon-xs"
                  class="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  [attr.aria-label]="'pages.tasks.detail.removeSubtask' | transloco: { title: sub.title }"
                  (click)="store.removeSubtask(task.id, sub.id)"
                >
                  <ng-icon name="lucideX" />
                </button>
              </li>
            }
          </ul>
          <div class="text-muted-foreground flex items-center gap-2.5">
            <ng-icon name="lucidePlus" class="mx-0.5" />
            <input
              class="placeholder:text-muted-foreground/70 flex-1 bg-transparent py-1 text-sm outline-none"
              [placeholder]="'pages.tasks.detail.addSubtask' | transloco"
              [value]="subtaskDraft()"
              (input)="subtaskDraft.set($any($event.target).value)"
              (keydown.enter)="addSubtask()"
            />
          </div>
        </section>

        <section class="flex flex-col gap-2">
          <label for="task-notes" class="text-muted-foreground text-xs font-medium tracking-wide uppercase">{{ 'pages.tasks.detail.notes' | transloco }}</label>
          <textarea
            id="task-notes"
            rows="4"
            class="border-input bg-background focus-visible:ring-ring/50 field-sizing-content min-h-24 w-full resize-none rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
            [placeholder]="'pages.tasks.detail.notesPlaceholder' | transloco"
            [value]="notesDraft()"
            (input)="onNotes($any($event.target).value)"
            (blur)="flush()"
          ></textarea>
        </section>

        <section class="flex flex-col gap-2">
          <label for="task-note" class="text-muted-foreground text-xs font-medium tracking-wide uppercase">{{ 'pages.tasks.detail.linkedNote' | transloco }}</label>
          <div class="flex items-center gap-2">
            <select id="task-note" [class]="selectClass + ' min-w-0 flex-1'" (change)="setNote($any($event.target).value)">
              <option value="" [selected]="!task.noteId">{{ 'pages.tasks.detail.noNote' | transloco }}</option>
              @for (note of notesStore.notes(); track note.id) {
                <option [value]="note.id" [selected]="task.noteId === note.id">
                  {{ note.title || ('pages.notes.untitled' | transloco) }}
                </option>
              }
            </select>
            @if (task.noteId && notesStore.byId(task.noteId)) {
              <button hlmBtn variant="outline" size="sm" (click)="openNote(task.noteId)">
                <ng-icon name="lucideExternalLink" />
                {{ 'pages.tasks.detail.openNote' | transloco }}
              </button>
            }
          </div>
        </section>
      </div>

      <footer class="flex items-center justify-between gap-2 border-t px-6 py-3">
        <span class="text-muted-foreground text-xs">
          @if (task.done && task.completedAt) {
            {{ 'pages.tasks.detail.completedAt' | transloco: { time: relative(task.completedAt) } }}
          } @else {
            {{ 'pages.tasks.detail.created' | transloco: { time: relative(task.createdAt) } }}
          }
        </span>
        <hlm-alert-dialog>
          <button hlmAlertDialogTrigger hlmBtn variant="ghost" size="sm" class="text-destructive hover:text-destructive">
            <ng-icon name="lucideTrash2" />
            {{ 'pages.tasks.detail.delete' | transloco }}
          </button>
          <hlm-alert-dialog-content *hlmAlertDialogPortal="let ctx">
            <hlm-alert-dialog-header>
              <h2 hlmAlertDialogTitle>{{ 'pages.tasks.detail.deleteTitle' | transloco }}</h2>
              <p hlmAlertDialogDescription>{{ 'pages.tasks.detail.deleteDescription' | transloco: { title: task.title } }}</p>
            </hlm-alert-dialog-header>
            <hlm-alert-dialog-footer>
              <button hlmAlertDialogCancel>{{ 'pages.tasks.cancel' | transloco }}</button>
              <button hlmAlertDialogAction variant="destructive" (click)="ctx.close(); remove()">
                {{ 'pages.tasks.detail.delete' | transloco }}
              </button>
            </hlm-alert-dialog-footer>
          </hlm-alert-dialog-content>
        </hlm-alert-dialog>
      </footer>
    }
  `,
})
export class TaskDetail {
  readonly taskId = input.required<string>();
  /** Emitted after deletion or when navigating away to a linked note. */
  readonly dismissed = output<void>();

  protected readonly store = inject(TasksStore);
  protected readonly notesStore = inject(NotesStore);
  private readonly prefs = inject(PreferencesService);
  private readonly transloco = inject(TranslocoService);
  private readonly router = inject(Router);

  protected readonly priorities: Priority[] = [0, 1, 2, 3];
  protected readonly priorityText = PRIORITY_TEXT;
  protected readonly selectClass =
    'border-input bg-background focus-visible:ring-ring/50 h-9 rounded-md border px-2 text-sm outline-none focus-visible:ring-[3px]';

  protected readonly task = computed(() => this.store.taskById(this.taskId()));
  protected readonly title = signal('');
  protected readonly notesDraft = signal('');
  protected readonly subtaskDraft = signal('');

  protected readonly subtaskDone = computed(() => this.task()?.subtasks.filter((s) => s.done).length ?? 0);
  protected readonly tomorrow = computed(() => addDays(this.store.today(), 1));
  protected readonly nextWeek = computed(() => addDays(this.store.today(), 7));
  protected readonly dueLabel = computed(() => {
    const due = this.task()?.dueDate;
    return due ? formatDue(due, this.store.today(), this.prefs.lang(), this.transloco) : '';
  });

  private loadedId: string | null = null;
  private saveTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const id = this.taskId();
      untracked(() => {
        if (id === this.loadedId) return;
        void this.flush();
        const task = this.store.taskById(id);
        this.loadedId = id;
        this.title.set(task?.title ?? '');
        this.notesDraft.set(task?.notes ?? '');
        this.subtaskDraft.set('');
      });
    });
    inject(DestroyRef).onDestroy(() => void this.flush());
  }

  protected relative(iso: string): string {
    return relativeTime(iso, this.prefs.lang());
  }

  protected onTitle(value: string): void {
    this.title.set(value.replace(/\n/g, ' '));
    this.scheduleSave();
  }

  protected onNotes(value: string): void {
    this.notesDraft.set(value);
    this.scheduleSave();
  }

  protected setDue(date: string | null): void {
    void this.store.updateTask(this.taskId(), { dueDate: date });
  }

  protected setPriority(value: unknown): void {
    const priority = Number(value);
    if ([0, 1, 2, 3].includes(priority)) void this.store.updateTask(this.taskId(), { priority: priority as Priority });
  }

  protected setList(value: string): void {
    void this.store.updateTask(this.taskId(), { listId: value || null });
  }

  protected setNote(value: string): void {
    void this.store.updateTask(this.taskId(), { noteId: value || null });
  }

  protected addSubtask(): void {
    const title = this.subtaskDraft().trim();
    if (!title) return;
    this.subtaskDraft.set('');
    void this.store.addSubtask(this.taskId(), title);
  }

  protected renameSubtask(id: string, title: string): void {
    const trimmed = title.trim();
    if (trimmed) void this.store.updateSubtask(this.taskId(), id, { title: trimmed });
    else void this.store.removeSubtask(this.taskId(), id);
  }

  protected async openNote(noteId: string): Promise<void> {
    await this.flush();
    this.dismissed.emit();
    await this.router.navigate(['/notes', noteId]);
  }

  protected async remove(): Promise<void> {
    clearTimeout(this.saveTimer);
    const id = this.taskId();
    this.loadedId = null;
    this.dismissed.emit();
    await this.store.removeTask(id);
    toast.success(this.transloco.translate('pages.tasks.detail.deleted'));
  }

  private scheduleSave(): void {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => void this.flush(), SAVE_DELAY_MS);
  }

  /** Writes pending title/notes edits. Reads the drafts synchronously, before any await. */
  protected async flush(): Promise<void> {
    clearTimeout(this.saveTimer);
    const id = this.loadedId;
    const task = id ? this.store.taskById(id) : undefined;
    if (!id || !task) return;
    const title = this.title().trim();
    const notes = this.notesDraft();
    if (task.title === title && task.notes === notes) return;
    await this.store.updateTask(id, { title: title || task.title, notes });
  }
}
