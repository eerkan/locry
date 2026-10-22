import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideCloud, lucideFileUp, lucideInfo, lucideTriangleAlert } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { BACKUP_FILE_EXTENSION, type SealedBackup } from '../../core/backup/backup-format';
import { BackupService } from '../../core/backup/backup.service';
import { type DriveBackup, DriveService } from '../../core/drive/drive.service';
import { errorKey } from '../../core/i18n';
import { PreferencesService } from '../../core/preferences.service';
import { currentRpId } from '../../core/vault/passkey';
import { passkeySites, passkeySlotsFor } from '../../core/vault/vault-header';
import { type ReAuth, VaultService } from '../../core/vault/vault.service';
import { AddSitePasskey } from '../../shared/add-site-passkey';
import { readFileBytes } from '../../shared/download';
import { DriveBackupList } from '../../shared/drive-backup-list';
import { DriveSetup } from '../../shared/drive-setup';
import { ReAuthPrompt } from '../../shared/reauth';

/** Restore from the lock screen: adds the vault of a `.locry` backup, or merges into it if it is already here. */
@Component({
  selector: 'app-restore-page',
  imports: [
    AddSitePasskey,
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
  providers: [provideIcons({ lucideArrowLeft, lucideFileUp, lucideCloud, lucideInfo, lucideTriangleAlert })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section hlmCard>
      @if (sitePasskeyFor(); as recoveryKey) {
        <div hlmCardContent>
          <app-add-site-passkey [recoveryKey]="recoveryKey" (done)="finish()" />
        </div>
      } @else {
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
          @if (!passkeyUsableHere()) {
            <div hlmAlert>
              <ng-icon name="lucideInfo" />
              <p hlmAlertDescription>{{ 'restore.otherSite' | transloco: { sites: backupSites(), site: rpId } }}</p>
            </div>
          }
          <app-reauth
            passkeyLabel="unlock.withPasskey"
            [allowPasskey]="passkeyUsableHere()"
            [busy]="busy()"
            [error]="unlockError()"
            (submitted)="restore($event)"
          />
        }
      </div>
      <div hlmCardFooter>
        <a hlmBtn variant="ghost" [routerLink]="vault.vaults().length ? '/unlock' : '/setup'">
          <ng-icon name="lucideArrowLeft" />
          {{ 'common.back' | transloco }}
        </a>
      </div>
      }
    </section>
  `,
})
export class RestorePage {
  private readonly backups = inject(BackupService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);
  private readonly prefs = inject(PreferencesService);

  protected readonly vault = inject(VaultService);
  protected readonly rpId = currentRpId();
  protected readonly drive = inject(DriveService);
  /** Set after a recovery-key restore with no passkey for this site: offer to create one. */
  protected readonly sitePasskeyFor = signal<string | null>(null);
  protected readonly showDrive = signal(false);
  protected readonly extension = BACKUP_FILE_EXTENSION;
  protected readonly backup = signal<SealedBackup | null>(null);
  protected readonly busy = signal(false);
  protected readonly fileError = signal<string | null>(null);
  protected readonly unlockError = signal<string | null>(null);

  /** The backup's passkeys only work on the site they were made for. */
  protected readonly passkeyUsableHere = computed(() => {
    const backup = this.backup();
    return !backup || passkeySlotsFor(backup.header.vault, this.rpId).length > 0;
  });
  protected readonly backupSites = computed(() => {
    const backup = this.backup();
    return backup ? passkeySites(backup.header.vault).join(', ') : '';
  });

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
      const summary = await this.backups.restoreAsVault(await this.backups.open(backup, auth));
      const name = this.vault.activeVault()?.name || this.transloco.translate('vaults.unnamed');
      toast.success(
        summary.merged
          ? this.transloco.translate('vaults.mergedInto', { name, count: summary.restored })
          : this.transloco.translate('restore.done', { count: summary.restored }),
      );
      if (auth.method === 'recovery' && !this.vault.localPasskeySlots().length) {
        this.sitePasskeyFor.set(auth.recoveryKey);
        return;
      }
      await this.finish();
    } catch (error) {
      console.error(error);
      this.unlockError.set(errorKey(error));
    } finally {
      this.busy.set(false);
    }
  }

  protected async finish(): Promise<void> {
    this.sitePasskeyFor.set(null);
    await this.router.navigateByUrl('/notes', { replaceUrl: true });
  }
}
