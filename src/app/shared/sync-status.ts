import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoPipe, type TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCloud, lucideCloudAlert, lucideCloudCheck, lucideCloudOff, lucideRefreshCw } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { type SyncStatus, type SyncSummary, SyncService } from '../core/sync/sync.service';

const ICON: Record<SyncStatus, string> = {
  off: 'lucideCloudOff',
  idle: 'lucideCloudCheck',
  syncing: 'lucideRefreshCw',
  needsAuth: 'lucideCloud',
  error: 'lucideCloudAlert',
};

const LABEL: Record<SyncStatus, string> = {
  off: 'sync.statusOff',
  idle: 'sync.statusIdle',
  syncing: 'sync.statusSyncing',
  needsAuth: 'sync.statusNeedsAuth',
  error: 'sync.statusError',
};

export function syncStatusLabel(status: SyncStatus): string {
  return LABEL[status];
}

/** Icon and text for the current sync state. */
@Component({
  selector: 'app-sync-status-label',
  imports: [NgIcon, TranslocoPipe],
  providers: [provideIcons({ lucideCloud, lucideCloudAlert, lucideCloudCheck, lucideCloudOff, lucideRefreshCw })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0 items-center gap-2' },
  template: `
    <ng-icon
      [name]="icon()"
      class="shrink-0"
      [class.animate-spin]="sync.status() === 'syncing'"
      [class.text-destructive]="sync.status() === 'error'"
      [class.text-amber-500]="sync.status() === 'needsAuth'"
    />
    <span class="truncate">{{ label() | transloco }}</span>
  `,
})
export class SyncStatusLabel {
  protected readonly sync = inject(SyncService);
  protected readonly icon = computed(() => ICON[this.sync.status()]);
  protected readonly label = computed(() => LABEL[this.sync.status()]);
}

/** Toast after a sync the user started, mentioning received changes and conflict copies. */
export function announceSync(summary: SyncSummary | null, transloco: TranslocoService, doneKey: string): void {
  if (!summary) return;
  if (summary.conflicts) toast.warning(transloco.translate('sync.conflicts', { count: summary.conflicts }), { duration: 10_000 });
  toast.success(
    summary.received ? transloco.translate('sync.received', { count: summary.received }) : transloco.translate(doneKey),
  );
}
