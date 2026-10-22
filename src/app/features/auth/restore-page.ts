import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideCloud, lucideFileUp, lucideTriangleAlert } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { BACKUP_FILE_EXTENSION, type SealedBackup } from '../../core/backup/backup-format';
import { BackupService } from '../../core/backup/backup.service';
import { type DriveBackup, DriveService } from '../../core/drive/drive.service';
import { errorKey } from '../../core/i18n';
import { PreferencesService } from '../../core/preferences.service';
import type { ReAuth } from '../../core/vault/vault.service';
import { readFileBytes } from '../../shared/download';
import { DriveBackupList } from '../../shared/drive-backup-list';
import { DriveSetup } from '../../shared/drive-setup';
import { ReAuthPrompt } from '../../shared/reauth';

/** First-run restore: brings a vault from a `.locry` backup onto an empty device. */
@Component({
  selector: 'app-restore-page',
  imports: [
    DriveBackupList,
    DriveSetup,
    HlmAlertImports,
    HlmButton,
    HlmCardImports,
    NgIcon,
    ReAuthPrompt,
    RouterLink,
    TranslocoPipe,
  ],
  providers: [provideIcons({ lucideArrowLeft, lucideFileUp, lucideCloud, lucideTriangleAlert })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section hlmCard>
      <div hlmCardHeader>
        <h1 hlmCardTitle class="text-xl">{{ 'restore.title' | transloco }}</h1>
        <p hlmCardDescription>{{ 'restore.description' | transloco }}</p>
      </div>
      <div hlmCardContent class="flex flex-col gap-4">
        <input #file type="file" class="hidden" [accept]="extension" (change)="pick($any($event.target))" />
        <button hlmBtn variant="outline" class="w-full" [disabled]="busy()" (click)="file.click()">
          <ng-icon name="lucideFileUp" />
          {{ backup() ? backupLabel() : ('restore.chooseFile' | transloco) }}
        </button>

        <button hlmBtn variant="outline" class="w-full" [disabled]="busy() || drive.busy()" (click)="showDrive.set(!showDrive())">
          <ng-icon name="lucideCloud" />
          {{ 'drive.restoreFromDrive' | transloco }}
        </button>

        @if (showDrive()) {
          <div class="flex flex-col gap-3 rounded-lg border p-4">
            @if (!drive.configured()) {
              <app-drive-setup />
            } @else if (drive.files(); as files) {
              <h2 class="text-sm font-medium">{{ 'drive.chooseDriveBackup' | transloco }}</h2>
              <app-drive-backup-list
                [files]="files"
                [allowDelete]="false"
                [showVaultBadge]="false"
                [disabled]="drive.busy()"
                (restore)="pickFromDrive($event)"
              />
            } @else {
              <button hlmBtn class="w-full" [disabled]="drive.busy()" (click)="connectDrive()">{{ 'drive.connect' | transloco }}</button>
            }
          </div>
        }

        @if (fileError()) {
          <div hlmAlert variant="destructive">
            <ng-icon name="lucideTriangleAlert" />
            <p hlmAlertDescription>{{ fileError()! | transloco }}</p>
          </div>
        }

        @if (backup()) {
          <h2 class="text-sm font-medium">{{ 'restore.unlockTitle' | transloco }}</h2>
          <app-reauth passkeyLabel="unlock.withPasskey" [busy]="busy()" [error]="unlockError()" (submitted)="restore($event)" />
        }
      </div>
      <div hlmCardFooter>
        <a hlmBtn variant="ghost" routerLink="/setup">
          <ng-icon name="lucideArrowLeft" />
          {{ 'common.back' | transloco }}
        </a>
      </div>
    </section>
  `,
})
export class RestorePage {
  private readonly backups = inject(BackupService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);
  private readonly prefs = inject(PreferencesService);

  protected readonly drive = inject(DriveService);
  protected readonly showDrive = signal(false);
  protected readonly extension = BACKUP_FILE_EXTENSION;
  protected readonly backup = signal<SealedBackup | null>(null);
  protected readonly busy = signal(false);
  protected readonly fileError = signal<string | null>(null);
  protected readonly unlockError = signal<string | null>(null);

  protected readonly backupLabel = computed(() => {
    const backup = this.backup();
    if (!backup) return '';
    const date = new Intl.DateTimeFormat(this.prefs.lang(), { dateStyle: 'long', timeStyle: 'short' }).format(
      new Date(backup.header.createdAt),
    );
    return this.transloco.translate('restore.fileInfo', { date });
  });

  protected async pick(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.fileError.set(null);
    this.unlockError.set(null);
    try {
      this.backup.set(this.backups.read(await readFileBytes(file)));
    } catch (error) {
      this.backup.set(null);
      this.fileError.set(errorKey(error));
    }
  }

  protected async connectDrive(): Promise<void> {
    this.fileError.set(null);
    try {
      await this.drive.connect();
    } catch (error) {
      console.error(error);
      this.fileError.set(errorKey(error));
    }
  }

  protected async pickFromDrive(file: DriveBackup): Promise<void> {
    this.fileError.set(null);
    this.unlockError.set(null);
    try {
      this.backup.set(await this.drive.download(file));
      this.showDrive.set(false);
    } catch (error) {
      console.error(error);
      this.fileError.set(errorKey(error));
    }
  }

  protected async restore(auth: ReAuth): Promise<void> {
    const backup = this.backup();
    if (!backup) return;
    this.busy.set(true);
    this.unlockError.set(null);
    try {
      const summary = await this.backups.restoreAsNewVault(await this.backups.open(backup, auth));
      toast.success(this.transloco.translate('restore.done', { count: summary.restored }));
      await this.router.navigateByUrl('/notes', { replaceUrl: true });
    } catch (error) {
      console.error(error);
      this.unlockError.set(errorKey(error));
    } finally {
      this.busy.set(false);
    }
  }
}
