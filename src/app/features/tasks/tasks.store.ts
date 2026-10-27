import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { injectEncryptedCollection } from '../../core/storage/encrypted-collection';
import {
  type ListColor,
  type Priority,
  type Subtask,
  type Task,
  type TaskList,
  type TaskPatch,
  type TaskView,
  completedTasksFor,
  dateKey,
  openTasksFor,
} from './task';

/** Decrypted tasks and task lists, kept in memory while the vault is unlocked. */
@Injectable({ providedIn: 'root' })
export class TasksStore {
  private readonly taskCollection = injectEncryptedCollection<Task>('task');
  private readonly listCollection = injectEncryptedCollection<TaskList>('task-list');

  /** Today's date; refreshed every minute so "today" rolls over at midnight. */
  readonly today = signal(dateKey());

  readonly loaded = computed(() => this.taskCollection.loaded() && this.listCollection.loaded());
  readonly tasks = this.taskCollection.items;
  readonly lists = computed(() =>
    [...this.listCollection.items()].sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt)),
  );

  /** Open-task counts per smart view and per list, for the sidebar. */
  readonly counts = computed(() => {
    const tasks = this.tasks();
    const today = this.today();
    const open = tasks.filter((t) => !t.done);
    const perList: Record<string, number> = {};
    for (const task of open) if (task.listId) perList[task.listId] = (perList[task.listId] ?? 0) + 1;
    return {
      inbox: open.filter((t) => t.listId === null).length,
      today: open.filter((t) => t.dueDate && t.dueDate <= today).length,
      upcoming: open.filter((t) => t.dueDate && t.dueDate > today).length,
      completed: tasks.length - open.length,
      lists: perList,
    };
  });

  constructor() {
    const timer = setInterval(() => {
      const now = dateKey();
      if (now !== this.today()) this.today.set(now);
    }, 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  taskById(id: string): Task | undefined {
    return this.taskCollection.byId(id);
  }

  listById(id: string): TaskList | undefined {
    return this.listCollection.byId(id);
  }

  openTasks(view: TaskView): Task[] {
    return openTasksFor(this.tasks(), view, this.today());
  }

  completedTasks(view: TaskView): Task[] {
    return completedTasksFor(this.tasks(), view);
  }

  // ---- Tasks ---------------------------------------------------------------------------

  async createTask(
    title: string,
    options: { listId?: string | null; dueDate?: string | null; priority?: Priority } = {},
  ): Promise<Task> {
    const listId = options.listId ?? null;
    const siblings = this.tasks().filter((t) => t.listId === listId);
    const now = new Date().toISOString();
    const task: Task = {
      id: crypto.randomUUID(),
      listId,
      title: title.trim(),
      notes: '',
      done: false,
      completedAt: null,
      priority: options.priority ?? 0,
      dueDate: options.dueDate ?? null,
      subtasks: [],
      noteId: null,
      order: siblings.length ? Math.max(...siblings.map((t) => t.order)) + 1 : 0,
      createdAt: now,
      updatedAt: now,
    };
    await this.taskCollection.put(task);
    return task;
  }

  async updateTask(id: string, patch: TaskPatch): Promise<void> {
    const current = this.taskById(id);
    if (!current) return;
    const next: Task = { ...current, ...patch, updatedAt: new Date().toISOString() };
    // A time only makes sense on a date.
    if (!next.dueDate) next.dueTime = null;
    if (patch.done !== undefined && patch.done !== current.done) {
      next.completedAt = patch.done ? next.updatedAt : null;
    }
    if (patch.listId !== undefined && patch.listId !== current.listId) {
      // Moving to another list: append at the end of the target list.
      const siblings = this.tasks().filter((t) => t.listId === patch.listId);
      next.order = siblings.length ? Math.max(...siblings.map((t) => t.order)) + 1 : 0;
    }
    await this.taskCollection.put(next);
  }

  toggleDone(id: string): Promise<void> {
    const task = this.taskById(id);
    return task ? this.updateTask(id, { done: !task.done }) : Promise.resolve();
  }

  removeTask(id: string): Promise<void> {
    return this.taskCollection.remove(id);
  }

  /** Persists a new manual order for the given tasks (as shown, top to bottom). */
  async reorder(orderedIds: string[]): Promise<void> {
    const now = new Date().toISOString();
    const changed = orderedIds
      .map((id, order) => ({ task: this.taskById(id), order }))
      .filter((entry): entry is { task: Task; order: number } => !!entry.task && entry.task.order !== entry.order)
      .map(({ task, order }) => ({ ...task, order, updatedAt: now }));
    if (changed.length) await this.taskCollection.put(...changed);
  }

  // ---- Subtasks --------------------------------------------------------------------------

  addSubtask(taskId: string, title: string): Promise<void> {
    const task = this.taskById(taskId);
    if (!task || !title.trim()) return Promise.resolve();
    const subtask: Subtask = { id: crypto.randomUUID(), title: title.trim(), done: false };
    return this.updateTask(taskId, { subtasks: [...task.subtasks, subtask] });
  }

  updateSubtask(taskId: string, subtaskId: string, patch: Partial<Omit<Subtask, 'id'>>): Promise<void> {
    const task = this.taskById(taskId);
    if (!task) return Promise.resolve();
    return this.updateTask(taskId, {
      subtasks: task.subtasks.map((s) => (s.id === subtaskId ? { ...s, ...patch } : s)),
    });
  }

  removeSubtask(taskId: string, subtaskId: string): Promise<void> {
    const task = this.taskById(taskId);
    if (!task) return Promise.resolve();
    return this.updateTask(taskId, { subtasks: task.subtasks.filter((s) => s.id !== subtaskId) });
  }

  // ---- Lists -----------------------------------------------------------------------------

  async createList(name: string, color: ListColor): Promise<TaskList> {
    const lists = this.lists();
    const now = new Date().toISOString();
    const list: TaskList = {
      id: crypto.randomUUID(),
      name: name.trim(),
      color,
      order: lists.length ? Math.max(...lists.map((l) => l.order)) + 1 : 0,
      createdAt: now,
      updatedAt: now,
    };
    await this.listCollection.put(list);
    return list;
  }

  async updateList(id: string, patch: Partial<Pick<TaskList, 'name' | 'color'>>): Promise<void> {
    const current = this.listById(id);
    if (!current) return;
    await this.listCollection.put({ ...current, ...patch, updatedAt: new Date().toISOString() });
  }

  /** Deletes a list; its tasks move to the inbox rather than being lost. */
  async removeList(id: string): Promise<void> {
    const inbox = this.tasks().filter((t) => t.listId === null);
    let order = inbox.length ? Math.max(...inbox.map((t) => t.order)) + 1 : 0;
    const now = new Date().toISOString();
    const moved = this.tasks()
      .filter((t) => t.listId === id)
      .map((t) => ({ ...t, listId: null, order: order++, updatedAt: now }));
    if (moved.length) await this.taskCollection.put(...moved);
    await this.listCollection.remove(id);
  }
}
