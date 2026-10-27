import type { Task } from '../../features/tasks/task';

/** A moment to announce an open task, in local time. */
export interface Reminder {
  taskId: string;
  /** Epoch milliseconds. */
  at: number;
  /** The task's title; null once the vault locks (only the times stay in memory then). */
  title: string | null;
}

/** Local `YYYY-MM-DD` + `HH:MM` → epoch milliseconds. */
export function localTime(date: string, time: string): number {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  return new Date(y, m - 1, d, h, min).getTime();
}

/**
 * When to announce each open task with a due date: at its time, or at `defaultTime` on the
 * day for tasks without one. Sorted by time.
 */
export function remindersFor(tasks: readonly Task[], defaultTime: string): Reminder[] {
  return tasks
    .filter((t) => !t.done && !!t.dueDate)
    .map((t) => ({ taskId: t.id, at: localTime(t.dueDate!, t.dueTime || defaultTime), title: t.title.trim() || null }))
    .sort((a, b) => a.at - b.at);
}

/** Identity of one announcement: the same task again at another time is a new one. */
export function reminderKey(reminder: Reminder): string {
  return `${reminder.taskId}@${reminder.at}`;
}

/**
 * The reminders to announce now: due, not announced yet, and not older than `graceMs` (a
 * computer that slept through the evening should not replay it in the morning).
 */
export function dueReminders(reminders: readonly Reminder[], now: number, announced: ReadonlySet<string>, graceMs: number): Reminder[] {
  return reminders.filter((r) => r.at <= now && now - r.at <= graceMs && !announced.has(reminderKey(r)));
}
