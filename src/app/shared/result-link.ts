import type { SearchDoc } from '../core/ai/documents';
import type { Task } from '../features/tasks/task';

/** Router link to open a search result: a note in the editor, a task with its detail panel. */
export function resultLink(
  doc: Pick<SearchDoc, 'kind' | 'id'>,
  taskById: (id: string) => Task | undefined,
): { commands: string[]; queryParams?: Record<string, string> } {
  if (doc.kind === 'note') return { commands: ['/notes', doc.id] };
  const task = taskById(doc.id);
  return { commands: ['/tasks', task?.listId ?? 'inbox'], queryParams: { task: doc.id } };
}
