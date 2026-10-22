import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideInfo, lucideRefreshCw, lucideSmartphone } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { DriveService } from '../../core/drive/drive.service';
import { errorKey } from '../../core/i18n';
import { PreferencesService } from '../../core/preferences.service';
import { SyncService } from '../../core/sync/sync.service';
import { relativeTime } from '../../shared/relative-time';
import { SyncStatusLabel, announceSync } from '../../shared/sync-status';

/** Turns sync between devices on or off for the open vault and shows its state. */
@Component({
  selector: 'app-sync-card',
  imports: [HlmButton, HlmCardImports, HlmSpinner, NgIcon, SyncStatusLabel, TranslocoPipe],
  providers: [provideIcons({ lucideInfo, lucideRefreshCw, lucideSmartphone })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section hlmCard id="sync">
      <div hlmCardHeader>
        <h2 hlmCardTitle>{{ 'sync.title' | transloco }}</h2>
        <p hlmCardDescription>{{ 'sync.description' | transloco }}</p>
      </div>
      <div hlmCardContent class="flex flex-col gap-4">
        @if (!drive.configured()) {
          <p class="text-muted-foreground flex items-start gap-2 text-sm">
            <ng-icon name="lucideInfo" class="mt-0.5 shrink-0" />
            {{ 'sync.needsDrive' | transloco }}
          </p>
        } @else if (sync.enabled()) {
          <div class="flex flex-col gap-1 text-sm">
            <app-sync-status-label class="font-medium" />
            <span class="text-muted-foreground text-xs">
              @if (sync.lastSyncAt(); as last) {
                {{ 'sync.lastSync' | transloco: { time: ago(last) } }}
              } @else {
                {{ 'sync.never' | transloco }}
              }
            </span>
            @if (sync.lastError(); as error) {
              <span class="text-destructive text-xs">{{ error | transloco }}</span>
            }
          </div>
          @if (sync.devices().length) {
            <div class="flex flex-col gap-2">
              <h3 class="text-sm font-medium">{{ 'sync.devices' | transloco }}</h3>
              <ul class="divide-y rounded-lg border text-sm">
                @for (device of devices(); track device.deviceId) {
                  <li class="flex items-center gap-3 px-3 py-2">
                    <ng-icon name="lucideSmartphone" class="text-muted-foreground shrink-0" />
                    <span class="flex-1">
                      {{ device.name }}
                      @if (device.self) {
                        <span class="text-muted-foreground">({{ 'sync.thisDevice' | transloco }})</span>
                      }
                    </span>
                    <span class="text-muted-foreground text-xs">{{ ago(device.modifiedTime) }}</span>
                  </li>
                }
              </ul>
            </div>
          }
        }
        <p class="text-muted-foreground text-xs">{{ 'sync.howItWorks' | transloco }}</p>
      </div>
      @if (drive.configured()) {
        <div hlmCardFooter class="justify-end gap-2">
          @if (sync.enabled()) {
            <button hlmBtn variant="ghost" size="sm" (click)="disable()">{{ 'sync.disable' | transloco }}</button>
            <button hlmBtn variant="outline" size="sm" [disabled]="sync.status() === 'syncing'" (click)="syncNow()">
              @if (sync.status() === 'syncing') {
                <hlm-spinner />
              } @else {
                <ng-icon name="lucideRefreshCw" />
              }
              {{ (sync.status() === 'needsAuth' ? 'sync.connect' : 'sync.syncNow') | transloco }}
            </button>
          } @else {
            <button hlmBtn size="sm" (click)="enable()">{{ 'sync.enable' | transloco }}</button>
          }
        </div>
      }
    </section>
  `,
})
export class SyncCard {
  protected readonly sync = inject(SyncService);
  protected readonly drive = inject(DriveService);
  private readonly prefs = inject(PreferencesService);
  private readonly transloco = inject(TranslocoService);

  /** This device first, then the most recently synced. */
  protected readonly devices = computed(() =>
    [...this.sync.devices()].sort((a, b) => Number(b.self) - Number(a.self) || b.modifiedTime.localeCompare(a.modifiedTime)),
  );

  protected ago(iso: string): string {
    return relativeTime(iso, this.prefs.lang());
  }

  protected async enable(): Promise<void> {
    try {
      announceSync(await this.sync.enable(), this.transloco, 'sync.enabled');
    } catch (error) {
      console.error(error);
      toast.error(this.transloco.translate(errorKey(error)));
    }
  }

  protected disable(): void {
    this.sync.disable();
    toast.info(this.transloco.translate('sync.disabled'));
  }

  protected async syncNow(): Promise<void> {
    try {
      announceSync(await this.sync.syncNow({ interactive: true }), this.transloco, 'sync.done');
    } catch (error) {
      console.error(error);
      toast.error(this.transloco.translate(errorKey(error)));
    }
  }
}
