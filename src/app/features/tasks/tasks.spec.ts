import { TestBed } from '@angular/core/testing';
import { IDBFactory } from 'fake-indexeddb';
import { randomBytes } from '../../core/crypto/bytes';
import { LocryDb } from '../../core/storage/locry-db';
import { PasskeyClient } from '../../core/vault/passkey';
import { VaultService } from '../../core/vault/vault.service';
import { type Task, addDays, dateKey, dueStatus, openTasksFor, parseView } from './task';
import { TasksStore } from './tasks.store';

const today = '2026-10-22';

function task(patch: Partial<Task>): Task {
  return {
    id: crypto.randomUUID(),
    listId: null,
    title: 't',
    notes: '',
    done: false,
    completedAt: null,
    priority: 0,
    dueDate: null,
    subtasks: [],
    noteId: null,
    order: 0,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...patch,
  };
}

describe('task helpers', () => {
  it('formats and shifts local dates', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('classifies due dates', () => {
    expect(dueStatus(null, today)).toBeNull();
    expect(dueStatus('2026-10-21', today)).toBe('overdue');
    expect(dueStatus(today, today)).toBe('today');
    expect(dueStatus('2026-10-23', today)).toBe('tomorrow');
    expect(dueStatus('2026-11-01', today)).toBe('upcoming');
  });

  it('parses view params', () => {
    expect(parseView(undefined)).toEqual({ kind: 'smart', view: 'inbox' });
    expect(parseView('today')).toEqual({ kind: 'smart', view: 'today' });
    expect(parseView('abc')).toEqual({ kind: 'list', listId: 'abc' });
  });

  it('includes overdue tasks in today, sorted by date then priority', () => {
    const tasks = [
      task({ title: 'later', dueDate: '2026-10-30' }),
      task({ title: 'today-low', dueDate: today, priority: 1 }),
      task({ title: 'today-high', dueDate: today, priority: 3 }),
      task({ title: 'overdue', dueDate: '2026-10-01' }),
      task({ title: 'done', dueDate: today, done: true }),
      task({ title: 'no-date' }),
    ];
    expect(openTasksFor(tasks, { kind: 'smart', view: 'today' }, today).map((t) => t.title)).toEqual([
      'overdue',
      'today-high',
      'today-low',
    ]);
    expect(openTasksFor(tasks, { kind: 'smart', view: 'upcoming' }, today).map((t) => t.title)).toEqual(['later']);
  });
});

describe('TasksStore', () => {
  let store: TasksStore;
  let vault: VaultService;

  beforeEach(async () => {
    globalThis.indexedDB = new IDBFactory();
    const prf = randomBytes(32);
    const passkeys = {
      register: async () => ({ credentialId: 'c', prfOutput: new Uint8Array(prf) }),
      assert: async () => ({ credentialId: 'c', prfOutput: new Uint8Array(prf) }),
    };
    TestBed.configureTestingModule({ providers: [{ provide: PasskeyClient, useValue: passkeys }] });
    vault = TestBed.inject(VaultService);
    store = TestBed.inject(TasksStore);
    await vault.init();
    await vault.completeSetup(await vault.prepareVault('Test'));
    TestBed.tick();
    for (let i = 0; i < 50 && !store.loaded(); i++) await new Promise((r) => setTimeout(r, 10));
  });

  afterEach(() => TestBed.inject(LocryDb).close());

  it('appends tasks in order and reorders them', async () => {
    const a = await store.createTask('A');
    const b = await store.createTask('B');
    const c = await store.createTask('C');
    const inbox = { kind: 'smart', view: 'inbox' } as const;
    expect(store.openTasks(inbox).map((t) => t.title)).toEqual(['A', 'B', 'C']);

    await store.reorder([c.id, a.id, b.id]);
    expect(store.openTasks(inbox).map((t) => t.title)).toEqual(['C', 'A', 'B']);
  });

  it('records completion time and moves done tasks to the completed section', async () => {
    const t = await store.createTask('X');
    await store.toggleDone(t.id);
    expect(store.taskById(t.id)?.completedAt).toBeTruthy();
    expect(store.counts().completed).toBe(1);
    expect(store.counts().inbox).toBe(0);
    await store.toggleDone(t.id);
    expect(store.taskById(t.id)?.completedAt).toBeNull();
  });

  it('manages subtasks', async () => {
    const t = await store.createTask('X');
    await store.addSubtask(t.id, 'alt 1');
    await store.addSubtask(t.id, '  ');
    const [sub] = store.taskById(t.id)!.subtasks;
    await store.updateSubtask(t.id, sub.id, { done: true });
    expect(store.taskById(t.id)!.subtasks).toEqual([{ id: sub.id, title: 'alt 1', done: true }]);
    await store.removeSubtask(t.id, sub.id);
    expect(store.taskById(t.id)!.subtasks).toEqual([]);
  });

  it('moves tasks to the inbox when their list is deleted', async () => {
    const list = await store.createList('İş', 'blue');
    await store.createTask('in list', { listId: list.id });
    await store.createTask('inbox');
    expect(store.counts().lists[list.id]).toBe(1);

    await store.removeList(list.id);
    expect(store.lists()).toEqual([]);
    expect(store.openTasks({ kind: 'smart', view: 'inbox' }).map((t) => t.title)).toEqual(['inbox', 'in list']);
  });

  it('persists tasks and lists encrypted across lock/unlock', async () => {
    const list = await store.createList('Ev', 'green');
    await store.createTask('Gizli görev', { listId: list.id, dueDate: today, priority: 3 });
    vault.lock();
    TestBed.tick();
    expect(store.tasks()).toEqual([]);

    await vault.unlockWithPasskey();
    TestBed.tick();
    for (let i = 0; i < 50 && !store.loaded(); i++) await new Promise((r) => setTimeout(r, 10));
    expect(store.lists().map((l) => l.name)).toEqual(['Ev']);
    expect(store.tasks()[0]).toMatchObject({ title: 'Gizli görev', listId: list.id, priority: 3 });
  });
});
