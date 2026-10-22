import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideRefreshCw } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { errorKey } from '../../core/i18n';
import { type PendingRecoveryKey, type ReAuth, VaultService } from '../../core/vault/vault.service';
import { ReAuthPrompt } from '../../shared/reauth';
import { RecoveryKeyFlow } from '../../shared/recovery-key-flow';

@Component({
  selector: 'app-recovery-card',
  imports: [HlmButton, HlmCardImports, HlmDialogImports, NgIcon, ReAuthPrompt, RecoveryKeyFlow, TranslocoPipe],
  providers: [provideIcons({ lucideRefreshCw })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section hlmCard>
      <div hlmCardHeader>
        <h2 hlmCardTitle>{{ 'pages.settings.recoveryTitle' | transloco }}</h2>
        <p hlmCardDescription>{{ 'pages.settings.recoveryDescription' | transloco }}</p>
      </div>
      <div hlmCardFooter class="justify-end">
        <button hlmBtn variant="outline" (click)="start()">
          <ng-icon name="lucideRefreshCw" />
          {{ 'pages.settings.regenerateRecovery' | transloco }}
        </button>
      </div>
    </section>

    <hlm-dialog [state]="open() ? 'open' : 'closed'" (stateChanged)="$event === 'closed' && close()">
      <hlm-dialog-content *hlmDialogPortal="let ctx" class="sm:max-w-md">
        @if (pending(); as pending) {
          <app-recovery-key-flow
            [recoveryKey]="pending.recoveryKey"
            finishLabel="pages.settings.regenerateRecovery"
            [busy]="busy()"
            (confirmed)="commit()"
          />
        } @else {
          <hlm-dialog-header>
            <h2 hlmDialogTitle>{{ 'pages.settings.regenerateRecovery' | transloco }}</h2>
            <p hlmDialogDescription>{{ 'pages.settings.regenerateRecoveryDescription' | transloco }}</p>
          </hlm-dialog-header>
          <app-reauth [busy]="busy()" [error]="error()" (submitted)="prepare($event)" />
        }
      </hlm-dialog-content>
    </hlm-dialog>
  `,
})
export class RecoveryCard {
  private readonly vault = inject(VaultService);
  private readonly transloco = inject(TranslocoService);

  protected readonly open = signal(false);
  protected readonly pending = signal<PendingRecoveryKey | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected start(): void {
    this.pending.set(null);
    this.error.set(null);
    this.open.set(true);
  }

  /** Closing before confirmation discards the new key; the old one stays valid. */
  protected close(): void {
    this.open.set(false);
    this.pending.set(null);
  }

  protected async prepare(auth: ReAuth): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      this.pending.set(await this.vault.prepareRecoveryKey(auth));
    } catch (error) {
      console.error(error);
      this.error.set(errorKey(error));
    } finally {
      this.busy.set(false);
    }
  }

  protected async commit(): Promise<void> {
    const pending = this.pending();
    if (!pending) return;
    this.busy.set(true);
    try {
      await this.vault.commitRecoveryKey(pending);
      this.close();
      toast.success(this.transloco.translate('pages.settings.recoveryRotated'));
    } finally {
      this.busy.set(false);
    }
  }
}
