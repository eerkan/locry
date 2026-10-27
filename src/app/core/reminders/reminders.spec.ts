import type { Task } from '../../features/tasks/task';
import { dueReminders, localTime, reminderKey, remindersFor } from './reminders';

function task(id: string, patch: Partial<Task>): Task {
  return {
    id,
    listId: null,
    title: id,
    notes: '',
    done: false,
    completedAt: null,
    priority: 0,
    dueDate: null,
    subtasks: [],
    noteId: null,
    order: 0,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
    ...patch,
  };
}

describe('reminders', () => {
  const tasks = [
    task('timed', { dueDate: '2026-10-28', dueTime: '14:30' }),
    task('untimed', { dueDate: '2026-10-28' }),
    task('done', { dueDate: '2026-10-28', dueTime: '08:00', done: true }),
    task('undated', {}),
  ];

  it('announces open tasks with a date, at their time or the default time', () => {
    const reminders = remindersFor(tasks, '09:00');
    expect(reminders.map((r) => [r.taskId, r.at])).toEqual([
      ['untimed', localTime('2026-10-28', '09:00')],
      ['timed', localTime('2026-10-28', '14:30')],
    ]);
  });

  it('announces each reminder once, and not ones long past', () => {
    const reminders = remindersFor(tasks, '09:00');
    const at = (time: string) => localTime('2026-10-28', time);
    const announced = new Set<string>();
    expect(dueReminders(reminders, at('08:59'), announced, 3600_000)).toEqual([]);
    const first = dueReminders(reminders, at('09:00'), announced, 3600_000);
    expect(first.map((r) => r.taskId)).toEqual(['untimed']);
    announced.add(reminderKey(first[0]));
    expect(dueReminders(reminders, at('09:01'), announced, 3600_000)).toEqual([]);
    // Asleep from 14:00 to 16:00: the 14:30 one is more than an hour old by then.
    expect(dueReminders(reminders, at('16:00'), announced, 3600_000)).toEqual([]);
    expect(dueReminders(reminders, at('15:00'), announced, 3600_000).map((r) => r.taskId)).toEqual(['timed']);
  });

  it('treats a moved due time as a new reminder', () => {
    const before = remindersFor([task('a', { dueDate: '2026-10-28', dueTime: '10:00' })], '09:00')[0];
    const after = remindersFor([task('a', { dueDate: '2026-10-28', dueTime: '11:00' })], '09:00')[0];
    expect(reminderKey(before)).not.toBe(reminderKey(after));
  });
});
