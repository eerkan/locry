import { CdkDrag, type CdkDragDrop, CdkDragPlaceholder, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCalendarClock,
  lucideCalendarDays,
  lucideChevronDown,
  lucideChevronRight,
  lucideCircleCheckBig,
  lucideEllipsis,
  lucideInbox,
  lucidePencil,
  lucidePlus,
  lucideTrash2,
} from '@ng-icons/lucide';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { HlmTooltip } from '@spartan-ng/helm/tooltip';
import { PreferencesService } from '../../core/preferences.service';
import { ListDialog, type ListDraft } from './list-dialog';
import {
  SMART_VIEWS,
  type SmartView,
  type Task,
  type TaskList,
  addDays,
  groupByDueDate,
  isManualView,
  parseView,
} from './task';
import { TaskDetail } from './task-detail';
import { TaskRow } from './task-row';
import { LIST_DOT, formatDue } from './task-ui';
import { ShellUi } from '../../layout/shell-ui.service';
import { TasksStore } from './tasks.store';

const VIEW_ICONS: Record<SmartView, string> = {
  inbox: 'lucideInbox',
  today: 'lucideCalendarDays',
  upcoming: 'lucideCalendarClock',
  completed: 'lucideCircleCheckBig',
};

@Component({
  selector: 'app-tasks-page',
  imports: [
    CdkDrag,
    CdkDragPlaceholder,
    CdkDropList,
    RouterLink,
    HlmAlertDialogImports,
    HlmButton,
    HlmDropdownMenuImports,
    HlmSheetImports,
    HlmTooltip,
    ListDialog,
    NgIcon,
    TaskDetail,
    TaskRow,
    TranslocoPipe,
  ],
  providers: [
    provideIcons({
      lucideInbox,
      lucideCalendarDays,
      lucideCalendarClock,
      lucideCircleCheckBig,
      lucidePlus,
      lucideEllipsis,
      lucidePencil,
      lucideTrash2,
      lucideChevronDown,
      lucideChevronRight,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex h-[calc(100svh-3.5rem)] -m-4 md:-m-6' },
  template: `
    <!-- Views and lists -->
    <aside class="bg-background hidden w-60 shrink-0 flex-col gap-4 overflow-y-auto border-e p-3 md:flex">
      <ul class="flex flex-col gap-0.5">
        @for (v of smartViews; track v) {
          <li>
            <a [routerLink]="['/tasks', v]" [class]="navClass(isActive(v))" [attr.aria-current]="isActive(v) ? 'page' : null">
              <ng-icon [name]="viewIcons[v]" class="text-muted-foreground" />
              <span class="flex-1">{{ 'pages.tasks.views.' + v | transloco }}</span>
              @if (v !== 'completed' && counts()[v]) {
                <span class="text-muted-foreground text-xs tabular-nums">{{ counts()[v] }}</span>
              }
            </a>
          </li>
        }
      </ul>

      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between px-2">
          <span class="text-muted-foreground text-xs font-medium">{{ 'pages.tasks.lists' | transloco }}</span>
          <button
            hlmBtn
            variant="ghost"
            size="icon-xs"
            [hlmTooltip]="'pages.tasks.newList' | transloco"
            [attr.aria-label]="'pages.tasks.newList' | transloco"
            (click)="openListDialog(null)"
          >
            <ng-icon name="lucidePlus" />
          </button>
        </div>
        <ul class="flex flex-col gap-0.5">
          @for (list of store.lists(); track list.id) {
            <li class="group relative">
              <a [routerLink]="['/tasks', list.id]" [class]="navClass(isActive(list.id))" [attr.aria-current]="isActive(list.id) ? 'page' : null">
                <span class="size-2.5 rounded-full" [class]="dot[list.color]"></span>
                <span class="flex-1 truncate">{{ list.name }}</span>
                <span class="text-muted-foreground text-xs tabular-nums group-hover:opacity-0">{{ counts().lists[list.id] || '' }}</span>
              </a>
              <button
                hlmBtn
                variant="ghost"
                size="icon-xs"
                class="absolute end-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                [attr.aria-label]="'pages.tasks.listActions' | transloco"
                [hlmDropdownMenuTrigger]="listMenu"
                [hlmDropdownMenuTriggerData]="{ $implicit: list }"
              >
                <ng-icon name="lucideEllipsis" />
              </button>
            </li>
          }
        </ul>
      </div>
    </aside>

    <ng-template #listMenu let-list>
      <hlm-dropdown-menu class="w-44">
        <button hlmDropdownMenuItem (triggered)="openListDialog(list)">
          <ng-icon name="lucidePencil" />
          {{ 'pages.tasks.rename' | transloco }}
        </button>
        <button hlmDropdownMenuItem variant="destructive" (triggered)="listToDelete.set(list)">
          <ng-icon name="lucideTrash2" />
          {{ 'pages.tasks.deleteList' | transloco }}
        </button>
      </hlm-dropdown-menu>
    </ng-template>

    <!-- Task list -->
    <section class="flex min-w-0 flex-1 flex-col">
      <div class="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 md:px-8">
        <!-- Mobile view picker -->
        <select class="border-input bg-background h-9 rounded-md border px-2 text-sm md:hidden" [attr.aria-label]="'nav.tasks' | transloco" (change)="go($any($event.target).value)">
          @for (v of smartViews; track v) {
            <option [value]="v" [selected]="isActive(v)">{{ 'pages.tasks.views.' + v | transloco }}</option>
          }
          @for (list of store.lists(); track list.id) {
            <option [value]="list.id" [selected]="isActive(list.id)">{{ list.name }}</option>
          }
        </select>

        <header class="flex items-center gap-3">
          @if (currentList(); as list) {
            <span class="size-3 rounded-full" [class]="dot[list.color]"></span>
            <h2 class="text-2xl font-semibold tracking-tight">{{ list.name }}</h2>
          } @else {
            <ng-icon [name]="viewIcons[smartView()]" class="text-muted-foreground text-xl" />
            <h2 class="text-2xl font-semibold tracking-tight">{{ 'pages.tasks.views.' + smartView() | transloco }}</h2>
          }
        </header>

        @if (canAdd()) {
          <div class="focus-within:ring-ring/50 flex items-center gap-3 rounded-lg border px-3 py-2 focus-within:ring-[3px]">
            <ng-icon name="lucidePlus" class="text-muted-foreground" />
            <input
              #quickAdd
              class="placeholder:text-muted-foreground flex-1 bg-transparent text-sm outline-none"
              [placeholder]="addPlaceholder()"
              [attr.aria-label]="addPlaceholder()"
              [value]="draft()"
              (input)="draft.set($any($event.target).value)"
              (keydown.enter)="addTask()"
            />
          </div>
        }

        @if (view().kind === 'smart' && smartView() === 'upcoming') {
          @for (group of upcomingGroups(); track group.date) {
            <div class="flex flex-col">
              <h3 class="text-muted-foreground border-b px-2 pt-2 pb-1 text-xs font-medium">{{ dueHeading(group.date) }}</h3>
              @for (task of group.tasks; track task.id) {
                <app-task-row animate.enter="item-enter" [task]="task" [today]="store.today()" [list]="listFor(task)" [selected]="task.id === selectedId()" (toggled)="store.toggleDone(task.id)" (opened)="selectedId.set(task.id)" />
              }
            </div>
          }
        } @else {
          <div cdkDropList [cdkDropListDisabled]="!manual()" (cdkDropListDropped)="drop($event)" class="flex flex-col">
            @for (task of openTasks(); track task.id; let first = $first, last = $last) {
              <app-task-row
                animate.enter="item-enter"
                cdkDrag
                [cdkDragData]="task"
                [task]="task"
                [today]="store.today()"
                [list]="view().kind === 'smart' ? listFor(task) : undefined"
                [draggable]="manual()"
                [first]="first"
                [last]="last"
                (moved)="move(task.id, $event)"
                [selected]="task.id === selectedId()"
                (toggled)="store.toggleDone(task.id)"
                (opened)="selectedId.set(task.id)"
              >
                <div *cdkDragPlaceholder class="bg-muted/60 my-0.5 h-10 rounded-lg border border-dashed"></div>
              </app-task-row>
            }
          </div>
        }

        @if (!openTasks().length && !completedTasks().length) {
          <p class="text-muted-foreground py-12 text-center text-sm">{{ emptyMessage() | transloco }}</p>
        }

        @if (completedTasks().length) {
          <div class="flex flex-col">
            @if (smartView() !== 'completed' || view().kind === 'list') {
              <button
                type="button"
                class="text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-2 text-xs font-medium"
                [attr.aria-expanded]="showCompleted()"
                (click)="showCompleted.set(!showCompleted())"
              >
                <ng-icon [name]="showCompleted() ? 'lucideChevronDown' : 'lucideChevronRight'" class="rtl:-scale-x-100" />
                {{ 'pages.tasks.completedSection' | transloco: { count: completedTasks().length } }}
              </button>
            }
            @if (showCompleted() || (view().kind === 'smart' && smartView() === 'completed')) {
              @for (task of completedTasks(); track task.id) {
                <app-task-row animate.enter="item-enter" [task]="task" [today]="store.today()" [list]="view().kind === 'smart' ? listFor(task) : undefined" [selected]="task.id === selectedId()" (toggled)="store.toggleDone(task.id)" (opened)="selectedId.set(task.id)" />
              }
            }
          </div>
        }
      </div>
    </section>

    <!-- Task details -->
    <hlm-sheet [side]="prefs.startSide() === 'left' ? 'right' : 'left'" [state]="selectedId() ? 'open' : 'closed'" (stateChanged)="$event === 'closed' && closeDetail()">
      <hlm-sheet-content *hlmSheetPortal="let ctx" class="w-full p-0 sm:max-w-md">
        @if (selectedId(); as id) {
          <app-task-detail [taskId]="id" (dismissed)="closeDetail()" />
        }
      </hlm-sheet-content>
    </hlm-sheet>

    <app-list-dialog [open]="listDialogOpen()" [list]="editingList()" (saved)="saveList($event)" (closed)="listDialogOpen.set(false)" />

    <hlm-alert-dialog [state]="listToDelete() ? 'open' : 'closed'" (stateChanged)="$event === 'closed' && listToDelete.set(null)">
      <hlm-alert-dialog-content *hlmAlertDialogPortal="let ctx">
        <hlm-alert-dialog-header>
          <h2 hlmAlertDialogTitle>{{ 'pages.tasks.deleteListTitle' | transloco }}</h2>
          <p hlmAlertDialogDescription>{{ 'pages.tasks.deleteListDescription' | transloco: { name: listToDelete()?.name } }}</p>
        </hlm-alert-dialog-header>
        <hlm-alert-dialog-footer>
          <button hlmAlertDialogCancel>{{ 'pages.tasks.cancel' | transloco }}</button>
          <button hlmAlertDialogAction variant="destructive" (click)="deleteList(); ctx.close()">{{ 'pages.tasks.deleteList' | transloco }}</button>
        </hlm-alert-dialog-footer>
      </hlm-alert-dialog-content>
    </hlm-alert-dialog>
  `,
})
export class TasksPage {
  /** Route parameter: a smart view name or a list id. */
  readonly viewParam = input<string>(undefined, { alias: 'view' });
  /** `?task=` query parameter (from search): opens that task's details. */
  readonly taskParam = input<string>(undefined, { alias: 'task' });

  protected readonly store = inject(TasksStore);
  private readonly router = inject(Router);
  protected readonly prefs = inject(PreferencesService);
  private readonly transloco = inject(TranslocoService);

  protected readonly smartViews = SMART_VIEWS;
  protected readonly viewIcons = VIEW_ICONS;
  protected readonly dot = LIST_DOT;

  protected readonly draft = signal('');
  protected readonly selectedId = signal<string | null>(null);
  protected readonly showCompleted = signal(false);
  protected readonly listDialogOpen = signal(false);
  protected readonly editingList = signal<TaskList | null>(null);
  protected readonly listToDelete = signal<TaskList | null>(null);

  protected readonly view = computed(() => parseView(this.viewParam()));
  protected readonly smartView = computed(() => {
    const view = this.view();
    return view.kind === 'smart' ? view.view : 'inbox';
  });
  protected readonly currentList = computed(() => {
    const view = this.view();
    return view.kind === 'list' ? this.store.listById(view.listId) : undefined;
  });
  protected readonly manual = computed(() => isManualView(this.view()));
  protected readonly canAdd = computed(() => {
    const view = this.view();
    return view.kind === 'list' || view.view !== 'completed';
  });
  protected readonly counts = this.store.counts;
  protected readonly openTasks = computed(() => this.store.openTasks(this.view()));
  protected readonly completedTasks = computed(() => this.store.completedTasks(this.view()));
  protected readonly upcomingGroups = computed(() => groupByDueDate(this.openTasks()));

  protected readonly addPlaceholder = computed(() => {
    const list = this.currentList();
    if (list) return this.transloco.translate('pages.tasks.addPlaceholderList', { name: list.name });
    return this.transloco.translate(
      this.smartView() === 'today' ? 'pages.tasks.addPlaceholderToday' : 'pages.tasks.addPlaceholder',
    );
  });
  protected readonly emptyMessage = computed(() =>
    this.view().kind === 'list' ? 'pages.tasks.empty.list' : `pages.tasks.empty.${this.smartView()}`,
  );

  private readonly quickAdd = viewChild<ElementRef<HTMLInputElement>>('quickAdd');
  private readonly ui = inject(ShellUi);

  constructor() {
    // "T" from anywhere: focus the quick-add field, also when this page is already open.
    let seenRequests = this.ui.quickAddRequests();
    effect(() => {
      const requests = this.ui.quickAddRequests();
      if (requests === seenRequests) return;
      seenRequests = requests;
      untracked(() => setTimeout(() => this.quickAdd()?.nativeElement.focus()));
    });

    effect(() => {
      const id = this.taskParam();
      if (id && this.store.taskById(id)) untracked(() => this.selectedId.set(id));
    });
  }

  /** Closes the detail sheet and drops `?task=` so a reload does not reopen it. */
  protected closeDetail(): void {
    this.selectedId.set(null);
    if (this.taskParam()) {
      void this.router.navigate([], { queryParams: { task: null }, queryParamsHandling: 'merge', replaceUrl: true });
    }
  }

  protected isActive(key: string): boolean {
    const view = this.view();
    return view.kind === 'list' ? view.listId === key : view.view === key;
  }

  protected navClass(active: boolean): string {
    return `flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
      active ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/60'
    }`;
  }

  protected listFor(task: Task): TaskList | undefined {
    return task.listId ? this.store.listById(task.listId) : undefined;
  }

  protected dueHeading(date: string): string {
    return formatDue(date, this.store.today(), this.prefs.lang(), this.transloco);
  }

  protected go(key: string): void {
    void this.router.navigate(['/tasks', key]);
  }

  protected async addTask(): Promise<void> {
    const title = this.draft().trim();
    if (!title) return;
    this.draft.set('');
    const view = this.view();
    // In date-based views, give the new task a date so it stays visible there.
    const dueDate =
      view.kind === 'list' || view.view === 'inbox'
        ? null
        : view.view === 'today'
          ? this.store.today()
          : addDays(this.store.today(), 1);
    await this.store.createTask(title, { listId: view.kind === 'list' ? view.listId : null, dueDate });
  }

  protected drop(event: CdkDragDrop<unknown, unknown, Task>): void {
    if (event.previousIndex === event.currentIndex) return;
    const ids = this.openTasks().map((t) => t.id);
    moveItemInArray(ids, event.previousIndex, event.currentIndex);
    void this.store.reorder(ids);
  }

  /** Moves a task one place (buttons or Alt+↑/↓), keeping keyboard focus on it. */
  protected move(id: string, by: -1 | 1): void {
    const ids = this.openTasks().map((t) => t.id);
    const from = ids.indexOf(id);
    const to = from + by;
    if (from < 0 || to < 0 || to >= ids.length) return;
    moveItemInArray(ids, from, to);
    // The row's element moves in the DOM, which can drop focus: put it back on the same control.
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    void this.store.reorder(ids).then(() => requestAnimationFrame(() => active?.isConnected && active !== document.activeElement && active.focus()));
  }

  protected openListDialog(list: TaskList | null): void {
    this.editingList.set(list);
    this.listDialogOpen.set(true);
  }

  protected async saveList(draft: ListDraft): Promise<void> {
    const editing = this.editingList();
    this.listDialogOpen.set(false);
    if (editing) {
      await this.store.updateList(editing.id, draft);
    } else {
      const list = await this.store.createList(draft.name, draft.color);
      await this.router.navigate(['/tasks', list.id]);
    }
  }

  /** Reads the target synchronously: closing the dialog right after clears `listToDelete`. */
  protected async deleteList(): Promise<void> {
    const list = this.listToDelete();
    if (!list) return;
    this.listToDelete.set(null);
    const wasActive = this.isActive(list.id);
    await this.store.removeList(list.id);
    if (wasActive) await this.router.navigate(['/tasks', 'inbox']);
  }
}

