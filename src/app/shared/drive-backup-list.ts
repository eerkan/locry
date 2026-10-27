import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCloud, lucideRotateCcw, lucideTrash2 } from '@ng-icons/lucide';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import type { DriveBackup } from '../core/drive/drive.service';
import { PreferencesService } from '../core/preferences.service';
import { VaultService } from '../core/vault/vault.service';
import { VaultLabel } from './vault-ui';

/**
 * Lists backups stored in Drive by vault (the open vault first, vaults not on this device by
 * a short id), with restore (and optionally delete) actions.
 */
@Component({
  selector: 'app-drive-backup-list',
  imports: [HlmAlertDialogImports, HlmBadge, HlmButton, NgIcon, TranslocoPipe, VaultLabel],
  providers: [provideIcons({ lucideCloud, lucideRotateCcw, lucideTrash2 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (files().length) {
      <div class="flex flex-col gap-4" data-testid="drive-backups">
        @for (group of groups(); track group.vaultId) {
          <section class="flex flex-col gap-1.5" [attr.data-vault]="group.vaultId">
            <h4 class="flex items-center gap-2 text-xs font-medium">
              @if (group.profile; as profile) {
                <app-vault-label [vault]="profile" />
              } @else {
                <span class="bg-muted-foreground/40 size-2.5 shrink-0 rounded-full"></span>
                <span class="truncate">{{ 'drive.unknownVault' | transloco: { id: group.vaultId.slice(0, 8) || '?' } }}</span>
              }
              @if (group.current) {
                <span hlmBadge variant="secondary">{{ 'drive.thisVault' | transloco }}</span>
              }
              <span class="text-muted-foreground ms-auto font-normal">{{
                'drive.vaultBackups' | transloco: { count: group.backups.length }
              }}</span>
            </h4>
            <ul class="divide-y rounded-lg border">
              @for (file of group.backups; track file.id) {
                <li class="flex items-center gap-3 px-3 py-2.5">
                  <ng-icon name="lucideCloud" class="text-muted-foreground shrink-0" />
                  <div class="flex min-w-0 flex-1 flex-col">
                    <span class="text-sm">{{ formatDate(file.createdTime) }}</span>
                    <span class="text-muted-foreground text-xs">
                      {{ formatSize(file.size) }}
                      @if (file.device) {
                        · {{ file.device }}
                        @if (file.fromThisDevice) {
                          ({{ 'sync.thisDevice' | transloco }})
                        }
                      }
                    </span>
                  </div>
                  <button hlmBtn variant="outline" size="sm" [disabled]="disabled()" (click)="restore.emit(file)">
                    <ng-icon name="lucideRotateCcw" />
                    {{ 'drive.restore' | transloco }}
                  </button>
                  @if (allowDelete()) {
                    <button
                      hlmBtn
                      variant="ghost"
                      size="icon-sm"
                      class="hover:text-destructive"
                      [disabled]="disabled()"
                      [attr.aria-label]="'drive.delete' | transloco"
                      (click)="toDelete.set(file)"
                    >
                      <ng-icon name="lucideTrash2" />
                    </button>
                  }
                </li>
              }
            </ul>
          </section>
        }
      </div>
    } @else {
      <p class="text-muted-foreground text-sm">{{ 'drive.noBackups' | transloco }}</p>
    }

    <hlm-alert-dialog [state]="toDelete() ? 'open' : 'closed'" (stateChanged)="$event === 'closed' && toDelete.set(null)">
      <hlm-alert-dialog-content *hlmAlertDialogPortal="let ctx">
        <hlm-alert-dialog-header>
          <h2 hlmAlertDialogTitle>{{ 'drive.deleteTitle' | transloco }}</h2>
          <p hlmAlertDialogDescription>
            {{ 'drive.deleteDescription' | transloco: { date: toDelete() ? formatDate(toDelete()!.createdTime) : '' } }}
          </p>
        </hlm-alert-dialog-header>
        <hlm-alert-dialog-footer>
          <button hlmAlertDialogCancel>{{ 'pages.tasks.cancel' | transloco }}</button>
          <button hlmAlertDialogAction variant="destructive" (click)="confirmDelete(); ctx.close()">{{ 'drive.delete' | transloco }}</button>
        </hlm-alert-dialog-footer>
      </hlm-alert-dialog-content>
    </hlm-alert-dialog>
  `,
})
export class DriveBackupList {
  readonly files = input.required<DriveBackup[]>();
  readonly allowDelete = input(true);
  readonly disabled = input(false);
  readonly restore = output<DriveBackup>();
  readonly remove = output<DriveBackup>();

  private readonly prefs = inject(PreferencesService);
  private readonly vault = inject(VaultService);
  protected readonly toDelete = signal<DriveBackup | null>(null);

  protected readonly groups = computed(() => {
    const current = this.vault.isUnlocked() ? this.vault.header()?.vaultId : undefined;
    const byVault = new Map<string, DriveBackup[]>();
    for (const file of this.files()) {
      const id = file.appProperties['locryVaultId'] ?? '';
      byVault.set(id, [...(byVault.get(id) ?? []), file]);
    }
    return [...byVault]
      .map(([vaultId, backups]) => ({
        vaultId,
        backups,
        current: vaultId === current,
        profile: this.vault.vaults().find((v) => v.id === vaultId) ?? null,
      }))
      .sort((a, b) => Number(b.current) - Number(a.current) || b.backups[0].createdTime.localeCompare(a.backups[0].createdTime));
  });

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.prefs.lang(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  }

  protected formatSize(bytes: number): string {
    const unit = bytes < 1024 * 1024 ? 'kilobyte' : 'megabyte';
    const value = unit === 'kilobyte' ? bytes / 1024 : bytes / (1024 * 1024);
    return new Intl.NumberFormat(this.prefs.lang(), { style: 'unit', unit, maximumFractionDigits: 1 }).format(value);
  }

  /** Reads the target synchronously: closing the dialog right after clears `toDelete`. */
  protected confirmDelete(): void {
    const file = this.toDelete();
    if (file) this.remove.emit(file);
  }
}
