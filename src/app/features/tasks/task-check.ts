import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';
import { prefersReducedMotion } from '../../shared/motion';
import type { Priority } from './task';
import { PRIORITY_RING } from './task-ui';

/** How long the tick animates before the task is marked done (and may move out of the list). */
const COMPLETE_DELAY_MS = 320;

/**
 * Round completion toggle; its ring color reflects the task priority. Ticking a task first
 * shows the tick drawing itself (the row strikes through via `data-completing`), then reports
 * it; unticking is immediate.
 */
@Component({
  selector: 'app-task-check',
  imports: [NgIcon],
  providers: [provideIcons({ lucideCheck })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      role="checkbox"
      [attr.aria-checked]="done() || completing()"
      [attr.aria-label]="label()"
      [attr.data-completing]="completing() ? '' : null"
      [class]="classes()"
      (click)="$event.stopPropagation(); toggle()"
    >
      @if (done() || completing()) {
        <ng-icon name="lucideCheck" class="text-[11px]" [class.check-draw]="completing()" />
      }
    </button>
  `,
})
export class TaskCheck {
  readonly done = input.required<boolean>();
  readonly priority = input<Priority>(0);
  readonly size = input<'sm' | 'md'>('md');
  readonly label = input.required<string>();
  readonly toggled = output<void>();
  protected readonly completing = signal(false);
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected toggle(): void {
    if (this.done() || prefersReducedMotion()) {
      this.toggled.emit();
      return;
    }
    if (this.completing()) return;
    this.completing.set(true);
    this.timer = setTimeout(() => {
      this.toggled.emit();
      this.completing.set(false);
    }, COMPLETE_DELAY_MS);
  }

  protected readonly classes = computed(() => {
    const size = this.size() === 'sm' ? 'size-4' : 'size-[18px]';
    const state = this.completing()
      ? 'bg-primary border-primary text-primary-foreground check-pop'
      : this.done()
      ? 'bg-primary border-primary text-primary-foreground'
      : `${PRIORITY_RING[this.priority()]} hover:bg-muted`;
    return `${size} ${state} flex shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]`;
  });
}
