/** 0 = none, 1 = low, 2 = medium, 3 = high. */
export type Priority = 0 | 1 | 2 | 3;

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  /** null = inbox. */
  listId: string | null;
  title: string;
  notes: string;
  done: boolean;
  completedAt: string | null;
  priority: Priority;
  /** Local calendar date, `YYYY-MM-DD`. */
  dueDate: string | null;
  /** Optional local time on the due date, `HH:MM` (missing on tasks from older versions). */
  dueTime?: string | null;
  subtasks: Subtask[];
  /** Optional link to a note. */
  noteId: string | null;
  /** Manual position within its list. */
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type TaskPatch = Partial<
  Pick<Task, 'listId' | 'title' | 'notes' | 'done' | 'priority' | 'dueDate' | 'dueTime' | 'subtasks' | 'noteId'>
>;

export const LIST_COLORS = ['slate', 'red', 'orange', 'amber', 'green', 'teal', 'blue', 'violet', 'pink'] as const;
export type ListColor = (typeof LIST_COLORS)[number];

export interface TaskList {
  id: string;
  name: string;
  color: ListColor;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type SmartView = 'inbox' | 'today' | 'upcoming' | 'completed';
export const SMART_VIEWS: SmartView[] = ['inbox', 'today', 'upcoming', 'completed'];

/** Either a smart view or a user list id. */
export type TaskView = { kind: 'smart'; view: SmartView } | { kind: 'list'; listId: string };

export function parseView(param: string | null | undefined): TaskView {
  if (!param) return { kind: 'smart', view: 'inbox' };
  return (SMART_VIEWS as string[]).includes(param)
    ? { kind: 'smart', view: param as SmartView }
    : { kind: 'list', listId: param };
}

/** Views where tasks keep their manual order and can be reordered by dragging. */
export function isManualView(view: TaskView): boolean {
  return view.kind === 'list' || view.view === 'inbox';
}

// ---- Dates -------------------------------------------------------------------------------

/** Local calendar date as `YYYY-MM-DD`. */
export function dateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return dateKey(new Date(y, m - 1, d + days));
}

export type DueStatus = 'overdue' | 'today' | 'tomorrow' | 'upcoming';

export function dueStatus(dueDate: string | null, today: string): DueStatus | null {
  if (!dueDate) return null;
  if (dueDate < today) return 'overdue';
  if (dueDate === today) return 'today';
  if (dueDate === addDays(today, 1)) return 'tomorrow';
  return 'upcoming';
}

// ---- Filtering and sorting ---------------------------------------------------------------

const byOrder = (a: Task, b: Task) => a.order - b.order || a.createdAt.localeCompare(b.createdAt);

/** Earliest due date (and time; untimed last within a day) first, then higher priority, then manual order. */
const byDue = (a: Task, b: Task) =>
  (a.dueDate ?? '').localeCompare(b.dueDate ?? '') ||
  (a.dueTime ?? '99').localeCompare(b.dueTime ?? '99') ||
  b.priority - a.priority ||
  byOrder(a, b);

const byCompleted = (a: Task, b: Task) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '');

/** Open tasks shown in a view, already sorted. */
export function openTasksFor(tasks: Task[], view: TaskView, today: string): Task[] {
  if (view.kind === 'list') return tasks.filter((t) => !t.done && t.listId === view.listId).sort(byOrder);
  switch (view.view) {
    case 'inbox':
      return tasks.filter((t) => !t.done && t.listId === null).sort(byOrder);
    case 'today':
      return tasks.filter((t) => !t.done && !!t.dueDate && t.dueDate <= today).sort(byDue);
    case 'upcoming':
      return tasks.filter((t) => !t.done && !!t.dueDate && t.dueDate > today).sort(byDue);
    case 'completed':
      return [];
  }
}

/** Completed tasks shown in a view, most recently completed first. */
export function completedTasksFor(tasks: Task[], view: TaskView): Task[] {
  if (view.kind === 'list') return tasks.filter((t) => t.done && t.listId === view.listId).sort(byCompleted);
  switch (view.view) {
    case 'inbox':
      return tasks.filter((t) => t.done && t.listId === null).sort(byCompleted);
    case 'completed':
      return tasks.filter((t) => t.done).sort(byCompleted);
    default:
      return [];
  }
}

/** Groups upcoming tasks by due date for section headers. */
export function groupByDueDate(tasks: Task[]): { date: string; tasks: Task[] }[] {
  const groups = new Map<string, Task[]>();
  for (const task of tasks) {
    const key = task.dueDate ?? '';
    groups.set(key, [...(groups.get(key) ?? []), task]);
  }
  return [...groups].map(([date, grouped]) => ({ date, tasks: grouped }));
}
