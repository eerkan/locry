import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideDownload, lucideUpload } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import {
  BACKUP_FILE_EXTENSION,
  BACKUP_MIME_TYPE,
  type SealedBackup,
  backupFileName,
} from '../../core/backup/backup-format';
import { BackupService } from '../../core/backup/backup.service';
import { errorKey } from '../../core/i18n';
import { PreferencesService } from '../../core/preferences.service';
import { downloadFile, readFileBytes } from '../../shared/download';
import { relativeTime } from '../../shared/relative-time';
import { RestoreDialog } from '../../shared/restore-dialog';

@Component({
  selector: 'app-backup-card',
  imports: [HlmButton, HlmCardImports, HlmSpinner, NgIcon, RestoreDialog, TranslocoPipe],
  providers: [provideIcons({ lucideDownload, lucideUpload })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section hlmCard>
      <div hlmCardHeader>
        <h2 hlmCardTitle>{{ 'pages.settings.backupTitle' | transloco }}</h2>
        <p hlmCardDescription>{{ 'pages.settings.backupDescription' | transloco }}</p>
      </div>
      <div hlmCardContent>
        <p class="text-muted-foreground text-sm">
          @if (prefs.lastBackupAt(); as last) {
            {{ 'pages.settings.lastBackup' | transloco: { time: relative(last) } }}
          } @else {
            {{ 'pages.settings.neverBackedUp' | transloco }}
          }
        </p>
      </div>
      <div hlmCardFooter class="flex-wrap justify-end gap-2">
        <input #file type="file" class="hidden" [accept]="extension" (change)="pick($any($event.target))" />
        <button hlmBtn variant="outline" (click)="file.click()">
          <ng-icon name="lucideUpload" />
          {{ 'pages.settings.importBackup' | transloco }}
        </button>
        <button hlmBtn [disabled]="exporting()" (click)="export()">
          @if (exporting()) {
            <hlm-spinner />
          } @else {
            <ng-icon name="lucideDownload" />
          }
          {{ 'pages.settings.exportBackup' | transloco }}
        </button>
      </div>
    </section>

    <app-restore-dialog [backup]="backup()" (closed)="backup.set(null)" />
  `,
})
export class BackupCard {
  protected readonly prefs = inject(PreferencesService);
  private readonly backups = inject(BackupService);
  private readonly transloco = inject(TranslocoService);

  protected readonly extension = BACKUP_FILE_EXTENSION;
  protected readonly exporting = signal(false);
  protected readonly backup = signal<SealedBackup | null>(null);

  protected relative(iso: string): string {
    return relativeTime(iso, this.prefs.lang());
  }

  protected async export(): Promise<void> {
    this.exporting.set(true);
    try {
      downloadFile(await this.backups.export(), backupFileName(), BACKUP_MIME_TYPE);
      this.prefs.setLastBackupAt(new Date().toISOString());
      toast.success(this.transloco.translate('pages.settings.backupCreated'));
    } catch (error) {
      console.error(error);
      toast.error(this.transloco.translate(errorKey(error)));
    } finally {
      this.exporting.set(false);
    }
  }

  protected async pick(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      this.backup.set(this.backups.read(await readFileBytes(file)));
    } catch (error) {
      toast.error(this.transloco.translate(errorKey(error)));
    }
  }
}
