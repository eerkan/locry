import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCloud, lucideRotateCcw, lucideTrash2 } from '@ng-icons/lucide';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import type { DriveBackup } from '../core/drive/drive.service';
import { PreferencesService } from '../core/preferences.service';

/** Lists backups stored in Drive with restore (and optionally delete) actions. */
@Component({
  selector: 'app-drive-backup-list',
  imports: [HlmAlertDialogImports, HlmBadge, HlmButton, NgIcon, TranslocoPipe],
  providers: [provideIcons({ lucideCloud, lucideRotateCcw, lucideTrash2 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (files().length) {
      <ul class="divide-y rounded-lg border" data-testid="drive-backups">
        @for (file of files(); track file.id) {
          <li class="flex items-center gap-3 px-3 py-2.5">
            <ng-icon name="lucideCloud" class="text-muted-foreground shrink-0" />
            <div class="flex min-w-0 flex-1 flex-col">
              <span class="text-sm">{{ formatDate(file.createdTime) }}</span>
              <span class="text-muted-foreground text-xs">{{ formatSize(file.size) }}</span>
            </div>
            @if (showVaultBadge()) {
              <span hlmBadge [variant]="file.fromThisVault ? 'secondary' : 'outline'">
                {{ (file.fromThisVault ? 'drive.thisVault' : 'drive.otherVault') | transloco }}
              </span>
            }
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
  readonly showVaultBadge = input(true);
  readonly disabled = input(false);
  readonly restore = output<DriveBackup>();
  readonly remove = output<DriveBackup>();

  private readonly prefs = inject(PreferencesService);
  protected readonly toDelete = signal<DriveBackup | null>(null);

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
