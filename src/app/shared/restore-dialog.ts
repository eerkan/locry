import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideTriangleAlert } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import type { SealedBackup } from '../core/backup/backup-format';
import { BackupService, type BackupUnlock, type OpenedBackup, type RestoreMode } from '../core/backup/backup.service';
import { errorKey } from '../core/i18n';
import { PreferencesService } from '../core/preferences.service';
import { currentRpId } from '../core/vault/passkey';
import { passkeySites, passkeySlotsFor } from '../core/vault/vault-header';
import { ReAuthPrompt } from './reauth';

/**
 * Restores a parsed backup into the unlocked vault: opens it (with the current key, or the
 * backup's own passkey / recovery key when it comes from another vault), shows what it
 * contains and lets the user merge or replace.
 */
@Component({
  selector: 'app-restore-dialog',
  imports: [HlmAlertImports, HlmButton, HlmDialogImports, HlmSpinner, NgIcon, ReAuthPrompt, TranslocoPipe],
  providers: [provideIcons({ lucideTriangleAlert })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog [state]="backup() ? 'open' : 'closed'" (stateChanged)="$event === 'closed' && close()">
      <hlm-dialog-content *hlmDialogPortal="let ctx" class="sm:max-w-md">
        <hlm-dialog-header>
          <h2 hlmDialogTitle>{{ 'pages.settings.restoreTitle' | transloco }}</h2>
          <p hlmDialogDescription>{{ 'pages.settings.restoreFrom' | transloco: { date: backupDate() } }}</p>
        </hlm-dialog-header>

        @if (opened(); as opened) {
          <p class="text-sm">{{ 'pages.settings.restoreContents' | transloco: contents() }}</p>
          <fieldset class="flex flex-col gap-2">
            <legend class="mb-2 text-sm font-medium">{{ 'pages.settings.restoreMode' | transloco }}</legend>
            @for (m of modes; track m.value) {
              <label class="has-[:checked]:border-primary has-[:checked]:bg-accent/50 flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors">
                <input type="radio" name="restore-mode" class="accent-primary mt-1" [value]="m.value" [checked]="mode() === m.value" (change)="mode.set(m.value)" />
                <span class="flex flex-col gap-0.5">
                  <span class="text-sm font-medium">{{ m.label | transloco }}</span>
                  <span class="text-muted-foreground text-xs">{{ m.description | transloco }}</span>
                </span>
              </label>
            }
          </fieldset>
          @if (error()) {
            <div hlmAlert variant="destructive">
              <ng-icon name="lucideTriangleAlert" />
              <p hlmAlertDescription>{{ error()! | transloco }}</p>
            </div>
          }
          <hlm-dialog-footer>
            <button hlmBtn variant="outline" (click)="close()">{{ 'pages.tasks.cancel' | transloco }}</button>
            <button hlmBtn [variant]="mode() === 'replace' ? 'destructive' : 'default'" [disabled]="busy()" (click)="restore(opened)">
              @if (busy()) {
                <hlm-spinner />
              }
              {{ 'pages.settings.restoreConfirm' | transloco }}
            </button>
          </hlm-dialog-footer>
        } @else if (needsUnlock()) {
          <p class="text-muted-foreground text-sm">{{ 'pages.settings.restoreOtherVault' | transloco }}</p>
          @if (!passkeyUsableHere()) {
            <p class="text-muted-foreground text-sm">{{ 'restore.otherSite' | transloco: { sites: backupSites(), site: rpId } }}</p>
          }
          <app-reauth
            passkeyLabel="unlock.withPasskey"
            [allowPasskey]="passkeyUsableHere()"
            [busy]="busy()"
            [error]="error()"
            (submitted)="unlock($event)"
          />
        } @else {
          <div class="flex justify-center py-6"><hlm-spinner /></div>
        }
      </hlm-dialog-content>
    </hlm-dialog>
  `,
})
export class RestoreDialog {
  readonly backup = input<SealedBackup | null>(null);
  readonly closed = output<void>();
  readonly restored = output<void>();

  private readonly backups = inject(BackupService);
  private readonly prefs = inject(PreferencesService);
  private readonly transloco = inject(TranslocoService);

  protected readonly modes: { value: RestoreMode; label: string; description: string }[] = [
    { value: 'merge', label: 'pages.settings.restoreMerge', description: 'pages.settings.restoreMergeDescription' },
    { value: 'replace', label: 'pages.settings.restoreReplace', description: 'pages.settings.restoreReplaceDescription' },
  ];
  protected readonly opened = signal<OpenedBackup | null>(null);
  protected readonly needsUnlock = signal(false);
  protected readonly mode = signal<RestoreMode>('merge');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly rpId = currentRpId();
  protected readonly passkeyUsableHere = computed(() => {
    const backup = this.backup();
    return !backup || passkeySlotsFor(backup.header.vault, this.rpId).length > 0;
  });
  protected readonly backupSites = computed(() => {
    const backup = this.backup();
    return backup ? passkeySites(backup.header.vault).join(', ') : '';
  });

  protected readonly backupDate = computed(() => {
    const backup = this.backup();
    return backup
      ? new Intl.DateTimeFormat(this.prefs.lang(), { dateStyle: 'long', timeStyle: 'short' }).format(
          new Date(backup.header.createdAt),
        )
      : '';
  });

  protected readonly contents = computed(() => {
    const records = this.opened()?.records ?? [];
    const count = (type: string) => records.filter((r) => r.type === type).length;
    return { notes: count('note'), tasks: count('task'), lists: count('task-list') };
  });

  constructor() {
    effect(() => {
      const backup = this.backup();
      untracked(() => {
        this.opened.set(null);
        this.mode.set('merge');
        this.error.set(null);
        this.needsUnlock.set(false);
        if (!backup) return;
        // Backups of this vault open with the key already in memory.
        if (this.backups.isFromThisVault(backup)) void this.unlock({ method: 'current' });
        else this.needsUnlock.set(true);
      });
    });
  }

  protected async unlock(unlock: BackupUnlock): Promise<void> {
    const backup = this.backup();
    if (!backup) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      this.opened.set(await this.backups.open(backup, unlock));
    } catch (error) {
      console.error(error);
      this.error.set(errorKey(error));
      this.needsUnlock.set(true);
    } finally {
      this.busy.set(false);
    }
  }

  protected async restore(opened: OpenedBackup): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      const summary = await this.backups.restore(opened, this.mode());
      toast.success(
        this.transloco.translate(summary.keptLocal ? 'pages.settings.restoreDoneKept' : 'pages.settings.restoreDone', {
          restored: summary.restored,
          kept: summary.keptLocal,
        }),
      );
      this.restored.emit();
      this.close();
    } catch (error) {
      console.error(error);
      this.error.set(errorKey(error));
    } finally {
      this.busy.set(false);
    }
  }

  protected close(): void {
    this.opened.set(null);
    this.closed.emit();
  }
}
