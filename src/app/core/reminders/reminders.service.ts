import { DOCUMENT, DestroyRef, Injectable, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { SwPush } from '@angular/service-worker';
import { TranslocoService } from '@jsverse/transloco';
import { toast } from '@spartan-ng/brain/sonner';
import { TasksStore } from '../../features/tasks/tasks.store';
import { PreferencesService } from '../preferences.service';
import { VaultService } from '../vault/vault.service';
import { type Reminder, dueReminders, reminderKey, remindersFor } from './reminders';

/** A computer that slept through a reminder still shows it within this window. */
const GRACE_MS = 60 * 60_000;
/** Look again at least this often, so sleep, clock changes and throttled timers catch up. */
const MAX_WAIT_MS = 5 * 60_000;
/** More than this many due at once: one summary instead of a notification each. */
const SUMMARY_FROM = 3;

export type ReminderPermission = NotificationPermission | 'unsupported';

/**
 * Task reminders while Locry is open (in a background tab or an installed app too): a system
 * notification when a task's time comes, or a toast when Locry is in front. There is no server,
 * so nothing arrives while Locry is closed. Once the vault locks only the times stay in memory,
 * not the titles, and the notification just says a task is due.
 */
@Injectable({ providedIn: 'root' })
export class RemindersService {
  private readonly prefs = inject(PreferencesService);
  private readonly vault = inject(VaultService);
  private readonly tasks = inject(TasksStore);
  private readonly transloco = inject(TranslocoService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly swPush = inject(SwPush, { optional: true });

  private readonly _permission = signal<ReminderPermission>(currentPermission());
  /** Whether this browser lets Locry show notifications. */
  readonly permission = this._permission.asReadonly();

  private reminders: Reminder[] = [];
  private readonly announced = new Set<string>();
  private started = false;
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    // While unlocked, the schedule follows the tasks; when the vault locks, the titles go.
    effect(() => {
      const enabled = this.prefs.reminders();
      const unlocked = this.vault.isUnlocked();
      const loaded = this.tasks.loaded();
      const tasks = this.tasks.tasks();
      const time = this.prefs.reminderTime();
      untracked(() => {
        if (!enabled) this.reminders = [];
        else if (unlocked && loaded) this.reminders = remindersFor(tasks, time);
        else if (!unlocked) this.reminders = this.reminders.map((r) => ({ ...r, title: null }));
        else return;
        if (!this.started && this.reminders.length) {
          // Reminders already past when Locry starts are not replayed all at once.
          this.started = true;
          const now = Date.now();
          for (const r of this.reminders) if (r.at <= now) this.announced.add(reminderKey(r));
        }
        this.check();
      });
    });

    const onVisible = () => {
      this._permission.set(currentPermission());
      this.check();
    };
    this.document.addEventListener('visibilitychange', onVisible);
    this.swPush?.notificationClicks.pipe(takeUntilDestroyed()).subscribe(({ notification }) => this.open(notification.data?.taskId));
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
      this.document.removeEventListener('visibilitychange', onVisible);
    });
  }

  /** Asks the browser for permission (call from a click) and turns reminders on when granted. */
  async enable(): Promise<ReminderPermission> {
    if (typeof Notification === 'undefined') {
      this._permission.set('unsupported');
      return 'unsupported';
    }
    const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
    this._permission.set(permission);
    if (permission === 'granted') this.prefs.setReminders({ reminders: true });
    return permission;
  }

  disable(): void {
    this.prefs.setReminders({ reminders: false });
  }

  /**
   * Shows a sample notification and says what happened: browsers accept notifications even
   * when the operating system then hides them (system notification settings, Focus or Do Not
   * Disturb), so a silent button would leave people guessing.
   */
  async test(): Promise<void> {
    const t = (key: string) => this.transloco.translate(key);
    this._permission.set(currentPermission());
    if (this._permission() !== 'granted') {
      toast.error(t('reminders.denied'));
      return;
    }
    // A new tag each time: a notification with the same tag would replace the last one silently.
    const shown = await this.notify(t('reminders.testTitle'), t('reminders.testBody'), `locry-test-${Date.now()}`, null);
    if (shown === 'failed') toast.error(t('reminders.testFailed'));
    else toast.success(t('reminders.testSent'), { description: t('reminders.testHint'), duration: 12_000 });
  }

  private check(): void {
    clearTimeout(this.timer);
    if (!this.reminders.length) return;
    const now = Date.now();
    const due = dueReminders(this.reminders, now, this.announced, GRACE_MS);
    if (due.length) {
      for (const r of due) this.announced.add(reminderKey(r));
      void this.announce(due);
    }
    const next = this.reminders.find((r) => r.at > now);
    if (next) this.timer = setTimeout(() => this.check(), Math.min(next.at - now, MAX_WAIT_MS));
  }

  private async announce(due: Reminder[]): Promise<void> {
    const t = (key: string, params?: object) => this.transloco.translate(key, params);
    const inFront = this.document.visibilityState === 'visible' && this.document.hasFocus();
    if (inFront) {
      for (const r of due.slice(0, SUMMARY_FROM)) {
        toast(r.title ?? t('reminders.dueLocked'), {
          description: r.title ? t('reminders.due') : undefined,
          duration: 15_000,
          action: r.title ? { label: t('reminders.open'), onClick: () => this.open(r.taskId) } : undefined,
        });
      }
      return;
    }
    if (this._permission() !== 'granted') return;
    if (due.length >= SUMMARY_FROM) {
      await this.notify(t('reminders.manyDue', { count: due.length }), t('reminders.manyDueBody'), 'locry-reminders', null);
      return;
    }
    for (const r of due) {
      await this.notify(r.title ?? t('reminders.dueLocked'), r.title ? t('reminders.due') : t('reminders.unlockToSee'), `locry-task-${r.taskId}`, r.taskId);
    }
  }

  /** Through the service worker where there is one (required on Android), else directly. */
  private async notify(title: string, body: string, tag: string, taskId: string | null): Promise<'shown' | 'failed'> {
    const options: NotificationOptions & { renotify: boolean } = {
      body,
      tag,
      // Alert again when a task's reminder replaces an earlier one with the same tag.
      renotify: true,
      icon: 'icons/icon-any-192.png',
      // The service worker focuses the open Locry window (navigating it would reload and lock it).
      data: { taskId, onActionClick: { default: { operation: 'focusLastFocusedOrOpen', url: 'tasks/today' } } },
    };
    try {
      const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
      if (registration?.active) {
        await registration.showNotification(title, options);
        return 'shown';
      }
      const notification = new Notification(title, options);
      notification.onclick = () => {
        window.focus();
        this.open(taskId);
        notification.close();
      };
      return 'shown';
    } catch (error) {
      console.warn('Could not show a notification', error);
      return 'failed';
    }
  }

  private open(taskId: string | null | undefined): void {
    if (!this.vault.isUnlocked()) return; // The lock screen comes first; the task is in Today.
    void this.router.navigate(['/tasks', 'today'], taskId ? { queryParams: { task: taskId } } : {});
  }
}

function currentPermission(): ReminderPermission {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
}
