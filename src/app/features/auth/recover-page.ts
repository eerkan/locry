import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideKeyRound, lucideTriangleAlert } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { errorKey } from '../../core/i18n';
import { safeNext } from '../../core/vault/vault.guard';
import { VaultService } from '../../core/vault/vault.service';
import { AddSitePasskey } from '../../shared/add-site-passkey';

@Component({
  selector: 'app-recover-page',
  imports: [
    AddSitePasskey,
    HlmAlertImports,
    HlmButton,
    HlmCardImports,
    HlmFieldImports,
    HlmSpinner,
    NgIcon,
    RouterLink,
    TranslocoPipe,
  ],
  providers: [provideIcons({ lucideKeyRound, lucideArrowLeft, lucideTriangleAlert })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section hlmCard>
      @if (sitePasskeyFor(); as recoveryKey) {
        <div hlmCardContent>
          <app-add-site-passkey [recoveryKey]="recoveryKey" (done)="finish()" />
        </div>
      } @else {
      <div hlmCardHeader>
        <h1 hlmCardTitle class="text-xl">{{ 'recover.title' | transloco }}</h1>
        <p hlmCardDescription>{{ 'recover.description' | transloco }}</p>
      </div>
      <div hlmCardContent class="flex flex-col gap-4">
        <div hlmField>
          <label hlmFieldLabel for="recovery-key">{{ 'recover.label' | transloco }}</label>
          <textarea
            id="recovery-key"
            rows="4"
            spellcheck="false"
            autocomplete="off"
            class="border-input bg-background focus-visible:ring-ring/50 focus-visible:border-ring w-full resize-none rounded-md border px-3 py-2 font-mono text-sm tracking-wider uppercase outline-none focus-visible:ring-[3px]"
            placeholder="XXXX-XXXX-XXXX-…"
            [value]="input()"
            (input)="input.set($any($event.target).value)"
          ></textarea>
        </div>
        @if (error()) {
          <div hlmAlert variant="destructive">
            <ng-icon name="lucideTriangleAlert" />
            <p hlmAlertDescription>{{ error()! | transloco }}</p>
          </div>
        }
      </div>
      <div hlmCardFooter class="gap-2">
        <a hlmBtn variant="ghost" routerLink="/unlock" [queryParams]="{ next: next() }">
          <ng-icon name="lucideArrowLeft" />
          {{ 'common.back' | transloco }}
        </a>
        <button hlmBtn class="flex-1" [disabled]="busy() || !input().trim()" (click)="unlock()">
          @if (busy()) {
            <hlm-spinner />
          } @else {
            <ng-icon name="lucideKeyRound" />
          }
          {{ 'recover.submit' | transloco }}
        </button>
      </div>
      }
    </section>
  `,
})
export class RecoverPage {
  private readonly vault = inject(VaultService);
  private readonly router = inject(Router);
  /** `?next=`: where to go after unlocking. */
  readonly next = input<string>();
  private readonly transloco = inject(TranslocoService);

  protected readonly input = signal('');
  /** Set when this site has no passkey for the vault: offer to create one with this key. */
  protected readonly sitePasskeyFor = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async unlock(): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      const recoveryKey = this.input();
      await this.vault.unlockWithRecoveryKey(recoveryKey);
      this.input.set('');
      if (!this.vault.localPasskeySlots().length) {
        this.sitePasskeyFor.set(recoveryKey);
        return;
      }
      toast.info(this.transloco.translate('recover.unlocked'));
      await this.finish();
    } catch (error) {
      console.error(error);
      this.error.set(errorKey(error));
    } finally {
      this.busy.set(false);
    }
  }

  protected async finish(): Promise<void> {
    this.sitePasskeyFor.set(null);
    await this.router.navigateByUrl(safeNext(this.next()) ?? '/notes', { replaceUrl: true });
  }
}
