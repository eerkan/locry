import type { TranslocoService } from '@jsverse/transloco';
import { type ListColor, type Priority, dueStatus } from './task';

/** Static class names so Tailwind picks them up. */
export const LIST_DOT: Record<ListColor, string> = {
  slate: 'bg-slate-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  green: 'bg-green-500',
  teal: 'bg-teal-500',
  blue: 'bg-blue-500',
  violet: 'bg-violet-500',
  pink: 'bg-pink-500',
};

export const PRIORITY_TEXT: Record<Priority, string> = {
  0: 'text-muted-foreground',
  1: 'text-blue-500',
  2: 'text-amber-500',
  3: 'text-red-500',
};

export const PRIORITY_RING: Record<Priority, string> = {
  0: 'border-muted-foreground/50',
  1: 'border-blue-500',
  2: 'border-amber-500',
  3: 'border-red-500',
};

/** "Today", "Tomorrow", "Overdue · 3 Oct" or a short date such as "24 Oct". */
export function formatDue(dueDate: string, today: string, lang: string, transloco: TranslocoService): string {
  const status = dueStatus(dueDate, today);
  if (status === 'today' || status === 'tomorrow') return transloco.translate(`pages.tasks.due.${status}`);
  const label = formatDate(dueDate, today, lang);
  return status === 'overdue' ? `${transloco.translate('pages.tasks.due.overdue')} · ${label}` : label;
}

/** Short calendar date; includes the year only when it differs from the current one. */
export function formatDate(key: string, today: string, lang: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const sameYear = key.slice(0, 4) === today.slice(0, 4);
  return new Intl.DateTimeFormat(lang, {
    day: 'numeric',
    month: 'short',
    weekday: sameYear ? 'short' : undefined,
    year: sameYear ? undefined : 'numeric',
  }).format(new Date(y, m - 1, d));
}
