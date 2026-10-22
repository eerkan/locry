import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';
import type { Priority } from './task';
import { PRIORITY_RING } from './task-ui';

/** Round completion toggle; its ring color reflects the task priority. */
@Component({
  selector: 'app-task-check',
  imports: [NgIcon],
  providers: [provideIcons({ lucideCheck })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      role="checkbox"
      [attr.aria-checked]="done()"
      [attr.aria-label]="label()"
      [class]="classes()"
      (click)="$event.stopPropagation(); toggled.emit()"
    >
      @if (done()) {
        <ng-icon name="lucideCheck" class="text-[11px]" />
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

  protected readonly classes = computed(() => {
    const size = this.size() === 'sm' ? 'size-4' : 'size-[18px]';
    const state = this.done()
      ? 'bg-primary border-primary text-primary-foreground'
      : `${PRIORITY_RING[this.priority()]} hover:bg-muted`;
    return `${size} ${state} flex shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]`;
  });
}
