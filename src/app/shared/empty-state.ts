import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';
import { HlmBadge } from '@spartan-ng/helm/badge';

/** Placeholder for sections that land in a later phase. Icons must be provided by the host. */
@Component({
  selector: 'app-empty-state',
  imports: [NgIcon, HlmBadge, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="text-muted-foreground mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center"
    >
      <span class="bg-muted text-foreground flex size-12 items-center justify-center rounded-full">
        <ng-icon [name]="icon()" class="text-xl" />
      </span>
      <span hlmBadge variant="secondary">{{ 'common.comingSoon' | transloco }}</span>
      <p class="text-sm">{{ message() | transloco }}</p>
    </div>
  `,
})
export class EmptyState {
  readonly icon = input.required<string>();
  readonly message = input.required<string>();
}
