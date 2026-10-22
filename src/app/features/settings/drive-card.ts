import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCloudUpload, lucideLogOut, lucideRefreshCw, lucideShieldCheck } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import type { SealedBackup } from '../../core/backup/backup-format';
import { type DriveBackup, DriveService } from '../../core/drive/drive.service';
import { errorKey } from '../../core/i18n';
import { type DriveAutoBackup, PreferencesService } from '../../core/preferences.service';
import { DriveBackupList } from '../../shared/drive-backup-list';
import { DriveSetup } from '../../shared/drive-setup';
import { relativeTime } from '../../shared/relative-time';
import { RestoreDialog } from '../../shared/restore-dialog';

@Component({
  selector: 'app-drive-card',
  imports: [
    DriveBackupList,
    DriveSetup,
    HlmBadge,
    HlmButton,
    HlmCardImports,
    HlmFieldImports,
    HlmSpinner,
    NgIcon,
    RestoreDialog,
    TranslocoPipe,
  ],
  providers: [provideIcons({ lucideCloudUpload, lucideRefreshCw, lucideLogOut, lucideShieldCheck })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section hlmCard>
      <div hlmCardHeader>
        <h2 hlmCardTitle class="flex items-center gap-2">
          {{ 'drive.title' | transloco }}
          @if (drive.configured() && !editing()) {
            <span hlmBadge [variant]="drive.connected() ? 'default' : 'outline'">
              {{ (drive.connected() ? 'drive.connected' : 'drive.notConnected') | transloco }}
            </span>
          }
        </h2>
        <p hlmCardDescription>{{ 'drive.description' | transloco }}</p>
      </div>

      <div hlmCardContent class="flex flex-col gap-5">
        @if (!drive.configured() || editing()) {
          <app-drive-setup [cancellable]="editing()" (saved)="clientIdSaved()" (cancelled)="editing.set(false)" />
        } @else {
          @if (!drive.connected() && !drive.files()) {
            <div class="bg-muted/50 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center">
              <p class="flex-1 text-sm">{{ 'drive.connectHint' | transloco }}</p>
              <button hlmBtn [disabled]="drive.busy()" (click)="connect()">{{ 'drive.connect' | transloco }}</button>
            </div>
          }
          <p class="text-muted-foreground flex items-center gap-2 text-xs">
            <ng-icon name="lucideShieldCheck" />
            {{ 'drive.privacyNote' | transloco }}
          </p>

          <div class="grid gap-4 sm:grid-cols-2">
            <div hlmField>
              <label hlmFieldLabel for="drive-auto">{{ 'drive.auto' | transloco }}</label>
              <select id="drive-auto" [class]="selectClass" (change)="setAuto($any($event.target).value)">
                @for (option of autoOptions; track option.value) {
                  <option [value]="option.value" [selected]="prefs.driveAutoBackup() === option.value">{{ option.label | transloco }}</option>
                }
              </select>
              <p hlmFieldDescription>{{ 'drive.autoDescription' | transloco }}</p>
            </div>
            <div hlmField>
              <label hlmFieldLabel for="drive-keep">{{ 'drive.keep' | transloco }}</label>
              <select id="drive-keep" [class]="selectClass" (change)="setKeep($any($event.target).value)">
                @for (count of keepOptions; track count) {
                  <option [value]="count" [selected]="prefs.driveKeep() === count">{{ 'drive.keepValue' | transloco: { count } }}</option>
                }
              </select>
              <p hlmFieldDescription>{{ 'drive.keepDescription' | transloco }}</p>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-medium">{{ 'drive.backups' | transloco }}</h3>
              <span class="text-muted-foreground text-xs">
                @if (prefs.lastDriveBackupAt(); as last) {
                  {{ 'drive.lastDriveBackup' | transloco: { time: relative(last) } }}
                } @else {
                  {{ 'drive.neverDrive' | transloco }}
                }
              </span>
            </div>
            @if (drive.files(); as files) {
              <app-drive-backup-list [files]="files" [disabled]="drive.busy()" (restore)="restore($event)" (remove)="remove($event)" />
            } @else {
              <p class="text-muted-foreground text-sm">{{ 'drive.connectToSee' | transloco }}</p>
            }
          </div>
        }
      </div>

      @if (drive.configured() && !editing()) {
        <div hlmCardFooter class="flex-wrap justify-between gap-2">
          <div class="text-muted-foreground flex flex-wrap items-center gap-x-3 text-xs">
            @if (drive.customClientId()) {
              <span>{{ 'drive.usingOwnClientId' | transloco }}</span>
              <button hlmBtn variant="link" size="sm" class="h-auto px-0 text-xs" (click)="editing.set(true)">{{ 'drive.changeClientId' | transloco }}</button>
              @if (drive.hasBuiltInClientId()) {
                <button hlmBtn variant="link" size="sm" class="h-auto px-0 text-xs" (click)="useBuiltIn()">{{ 'drive.useBuiltIn' | transloco }}</button>
              }
            } @else {
              <button hlmBtn variant="link" size="sm" class="text-muted-foreground h-auto px-0 text-xs" (click)="editing.set(true)">
                {{ 'drive.useOwnClientId' | transloco }}
              </button>
            }
          </div>
          <div class="flex flex-wrap gap-2">
            @if (drive.connected()) {
              <button hlmBtn variant="ghost" size="sm" [disabled]="drive.busy()" (click)="disconnect()">
                <ng-icon name="lucideLogOut" />
                {{ 'drive.disconnect' | transloco }}
              </button>
              <button hlmBtn variant="outline" size="sm" [disabled]="drive.busy()" (click)="refresh()">
                <ng-icon name="lucideRefreshCw" />
                {{ 'drive.refresh' | transloco }}
              </button>
            }
            <button hlmBtn size="sm" [disabled]="drive.busy()" (click)="backupNow()">
              @if (drive.busy()) {
                <hlm-spinner />
              } @else {
                <ng-icon name="lucideCloudUpload" />
              }
              {{ 'drive.backupNow' | transloco }}
            </button>
          </div>
        </div>
      }
    </section>

    <app-restore-dialog [backup]="backup()" (closed)="backup.set(null)" />
  `,
})
export class DriveCard {
  protected readonly drive = inject(DriveService);
  protected readonly prefs = inject(PreferencesService);
  private readonly transloco = inject(TranslocoService);

  protected readonly editing = signal(false);
  protected readonly backup = signal<SealedBackup | null>(null);
  protected readonly keepOptions = [3, 5, 10, 20, 50];
  protected readonly autoOptions: { value: DriveAutoBackup; label: string }[] = [
    { value: 'off', label: 'drive.autoOff' },
    { value: 'daily', label: 'drive.autoDaily' },
    { value: 'weekly', label: 'drive.autoWeekly' },
  ];
  protected readonly selectClass =
    'border-input bg-background focus-visible:ring-ring/50 h-9 rounded-md border px-2 text-sm outline-none focus-visible:ring-[3px]';

  protected relative(iso: string): string {
    return relativeTime(iso, this.prefs.lang());
  }

  protected setAuto(value: string): void {
    if (value === 'off' || value === 'daily' || value === 'weekly') this.prefs.setDrive({ driveAutoBackup: value });
  }

  protected setKeep(value: string): void {
    this.prefs.setDrive({ driveKeep: Number(value) });
  }

  /** A different Client ID means a different Google project: drop the old session. */
  protected clientIdSaved(): void {
    void this.drive.disconnect();
    this.editing.set(false);
  }

  /** Drops the user's own Client ID and goes back to the one built into this installation. */
  protected useBuiltIn(): void {
    this.prefs.setDrive({ driveClientId: '' });
    void this.drive.disconnect();
  }

  protected connect(): Promise<void> {
    return this.attempt(() => this.drive.connect());
  }

  protected refresh(): Promise<void> {
    return this.attempt(() => this.drive.refresh());
  }

  protected disconnect(): Promise<void> {
    return this.attempt(() => this.drive.disconnect());
  }

  protected backupNow(): Promise<void> {
    return this.attempt(async () => {
      await this.drive.backupNow();
      toast.success(this.transloco.translate('drive.backupDone'));
    });
  }

  protected restore(file: DriveBackup): Promise<void> {
    return this.attempt(async () => this.backup.set(await this.drive.download(file)));
  }

  protected remove(file: DriveBackup): Promise<void> {
    return this.attempt(async () => {
      await this.drive.remove(file);
      toast.success(this.transloco.translate('drive.deleted'));
    });
  }

  private async attempt(task: () => Promise<void>): Promise<void> {
    try {
      await task();
    } catch (error) {
      console.error(error);
      toast.error(this.transloco.translate(errorKey(error)));
    }
  }
}
