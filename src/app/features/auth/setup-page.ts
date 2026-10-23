import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideFingerprint, lucideKeyRound, lucideShieldCheck, lucideTriangleAlert } from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { errorKey } from '../../core/i18n';
import { type PendingVault, VaultService } from '../../core/vault/vault.service';
import type { VaultColor } from '../../core/vault/vault-registry';
import { RecoveryKeyFlow } from '../../shared/recovery-key-flow';
import { ColorPicker } from '../../shared/vault-ui';

@Component({
  selector: 'app-setup-page',
  imports: [
    ColorPicker,
    RouterLink,
    HlmAlertImports,
    HlmButton,
    HlmCardImports,
    HlmFieldImports,
    HlmInput,
    HlmSpinner,
    NgIcon,
    RecoveryKeyFlow,
    TranslocoPipe,
  ],
  providers: [provideIcons({ lucideArrowLeft, lucideFingerprint, lucideShieldCheck, lucideKeyRound, lucideTriangleAlert })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section hlmCard>
      @if (pending(); as pending) {
        <div hlmCardContent>
          <app-recovery-key-flow [recoveryKey]="pending.recoveryKey" [busy]="busy()" (confirmed)="finish()" />
        </div>
      } @else {
        <div hlmCardHeader>
          @if (hasVaults()) {
            <h1 hlmCardTitle class="text-xl">{{ 'vaults.newVaultTitle' | transloco }}</h1>
            <p hlmCardDescription>{{ 'vaults.newVaultDescription' | transloco }}</p>
          } @else {
            <h1 hlmCardTitle class="text-xl">{{ 'setup.title' | transloco }}</h1>
            <p hlmCardDescription>{{ 'setup.description' | transloco }}</p>
          }
        </div>
        <div hlmCardContent class="flex flex-col gap-5">
          @if (!hasVaults()) {
            <ul class="flex flex-col gap-3 text-sm">
              @for (point of introPoints; track point.key) {
                <li class="flex gap-3">
                  <ng-icon [name]="point.icon" class="text-primary mt-0.5 shrink-0 text-base" />
                  <span>{{ point.key | transloco }}</span>
                </li>
              }
            </ul>
          }
          <div hlmField>
            <label hlmFieldLabel for="vault-name">{{ 'vaults.name' | transloco }}</label>
            <input
              hlmInput
              id="vault-name"
              autocomplete="off"
              maxlength="60"
              [placeholder]="'vaults.namePlaceholder' | transloco"
              [value]="vaultName()"
              (input)="vaultName.set($any($event.target).value)"
            />
            <p hlmFieldDescription>{{ 'vaults.nameHint' | transloco }}</p>
          </div>
          <fieldset class="flex flex-col gap-2">
            <legend class="mb-2 text-sm font-medium">{{ 'vaults.color' | transloco }}</legend>
            <app-color-picker [(color)]="color" />
          </fieldset>
          <div hlmField>
            <label hlmFieldLabel for="passkey-name">{{ 'setup.passkeyName' | transloco }}</label>
            <input
              hlmInput
              id="passkey-name"
              autocomplete="off"
              [value]="passkeyName()"
              (input)="passkeyName.set($any($event.target).value)"
            />
            <p hlmFieldDescription>{{ 'setup.passkeyNameHint' | transloco }}</p>
          </div>
          @if (error()) {
            <div hlmAlert variant="destructive">
              <ng-icon name="lucideTriangleAlert" />
              <p hlmAlertDescription>{{ error()! | transloco }}</p>
            </div>
          }
        </div>
        <div hlmCardFooter class="flex-col gap-3">
          <button hlmBtn class="w-full" [disabled]="busy() || !passkeyName().trim()" (click)="createPasskey()">
            @if (busy()) {
              <hlm-spinner />
              {{ 'setup.creating' | transloco }}
            } @else {
              <ng-icon name="lucideFingerprint" />
              {{ 'setup.createPasskey' | transloco }}
            }
          </button>
          <div class="text-muted-foreground flex w-full items-center gap-3 text-xs">
            <span class="bg-border h-px flex-1"></span>
            {{ 'setup.or' | transloco }}
            <span class="bg-border h-px flex-1"></span>
          </div>
          <a hlmBtn variant="outline" class="w-full" routerLink="/restore">{{ 'setup.restoreInstead' | transloco }}</a>
          <p class="text-muted-foreground text-center text-xs">{{ 'setup.restoreInsteadHint' | transloco }}</p>
          @if (hasVaults()) {
            <a hlmBtn variant="ghost" class="self-start" routerLink="/unlock">
              <ng-icon name="lucideArrowLeft" class="rtl:-scale-x-100" />
              {{ 'common.back' | transloco }}
            </a>
          }
        </div>
      }
    </section>
  `,
})
export class SetupPage {
  private readonly vault = inject(VaultService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  protected readonly introPoints = [
    { key: 'setup.point1', icon: 'lucideShieldCheck' },
    { key: 'setup.point2', icon: 'lucideFingerprint' },
    { key: 'setup.point3', icon: 'lucideKeyRound' },
  ];

  protected readonly hasVaults = computed(() => this.vault.vaults().length > 0);
  protected readonly vaultName = signal(this.hasVaults() ? '' : this.transloco.translate('vaults.defaultName'));
  protected readonly color = signal<VaultColor>(this.hasVaults() ? 'green' : 'blue');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly passkeyName = signal(this.transloco.translate('setup.passkeyNameDefault'));
  protected readonly pending = signal<PendingVault | null>(null);

  protected async createPasskey(): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      this.pending.set(
        await this.vault.prepareVault(this.passkeyName().trim(), { name: this.vaultName(), color: this.color() }),
      );
    } catch (error) {
      console.error(error);
      this.error.set(errorKey(error));
    } finally {
      this.busy.set(false);
    }
  }

  protected async finish(): Promise<void> {
    this.busy.set(true);
    try {
      await this.vault.completeSetup(this.pending()!);
      this.pending.set(null);
      await this.router.navigateByUrl('/notes', { replaceUrl: true });
    } finally {
      this.busy.set(false);
    }
  }
}
