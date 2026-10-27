import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFileUp, lucideFingerprint, lucideInfo, lucideLock, lucideLockOpen, lucidePlus, lucideTriangleAlert } from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { errorKey } from '../../core/i18n';
import { safeNext } from '../../core/vault/vault.guard';
import { passkeySites } from '../../core/vault/vault-header';
import { VaultService } from '../../core/vault/vault.service';
import { prefersReducedMotion } from '../../shared/motion';
import { VaultLabel } from '../../shared/vault-ui';

/** How long the open lock shows after unlocking, before the app fades in. */
const OPENED_PAUSE_MS = 220;

@Component({
  selector: 'app-unlock-page',
  imports: [HlmAlertImports, HlmButton, HlmCardImports, HlmSpinner, NgIcon, RouterLink, TranslocoPipe, VaultLabel],
  providers: [provideIcons({ lucideLock, lucideLockOpen, lucideFingerprint, lucideInfo, lucideTriangleAlert, lucidePlus, lucideFileUp })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section hlmCard>
      <div hlmCardHeader class="items-center text-center">
        <span class="bg-muted mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
          <ng-icon [name]="opened() ? 'lucideLockOpen' : 'lucideLock'" class="lock-snap text-xl" />
        </span>
        <h1 hlmCardTitle class="text-xl">{{ 'unlock.title' | transloco }}</h1>
        <p hlmCardDescription>{{ 'unlock.description' | transloco }}</p>
      </div>
      @if (vault.vaults().length > 1) {
        <div hlmCardContent>
          <div role="radiogroup" class="flex flex-col gap-1.5" [attr.aria-label]="'vaults.choose' | transloco">
            @for (v of vault.vaults(); track v.id) {
              <button
                type="button"
                role="radio"
                class="hover:bg-accent flex h-10 items-center rounded-md border px-3 text-start text-sm transition-colors"
                [class.border-primary]="v.id === vault.activeVault()?.id"
                [class.bg-accent]="v.id === vault.activeVault()?.id"
                [attr.aria-checked]="v.id === vault.activeVault()?.id"
                [disabled]="busy()"
                (click)="choose(v.id)"
              >
                <app-vault-label [vault]="v" />
              </button>
            }
          </div>
        </div>
      } @else if (vault.activeVault(); as only) {
        @if (only.name) {
          <div hlmCardContent class="flex justify-center text-sm font-medium">
            <app-vault-label [vault]="only" />
          </div>
        }
      }
      @if (error()) {
        <div hlmCardContent>
          <div hlmAlert variant="destructive">
            <ng-icon name="lucideTriangleAlert" />
            <p hlmAlertDescription>{{ error()! | transloco }}</p>
          </div>
        </div>
      }
      @if (!hasPasskeyHere()) {
        <div hlmCardContent>
          <div hlmAlert>
            <ng-icon name="lucideInfo" />
            <p hlmAlertDescription>{{ 'unlock.noPasskeyHere' | transloco: { sites: sites(), site: vault.rpId } }}</p>
          </div>
        </div>
      }
      <div hlmCardFooter class="flex-col gap-2">
        @if (!hasPasskeyHere()) {
          <a hlmBtn class="w-full" routerLink="/recover" [queryParams]="{ next: next() }">{{ 'unlock.useRecovery' | transloco }}</a>
        } @else {
        <button hlmBtn class="w-full" [disabled]="busy()" (click)="unlock()">
          @if (busy()) {
            <hlm-spinner />
            {{ 'unlock.waiting' | transloco }}
          } @else {
            <ng-icon name="lucideFingerprint" />
            {{ 'unlock.withPasskey' | transloco }}
          }
        </button>
        <a hlmBtn variant="link" size="sm" routerLink="/recover" [queryParams]="{ next: next() }">{{ 'unlock.useRecovery' | transloco }}</a>
        }
        <div class="text-muted-foreground mt-2 flex w-full flex-wrap justify-center gap-1 border-t pt-3">
          <a hlmBtn variant="ghost" size="sm" routerLink="/setup">
            <ng-icon name="lucidePlus" />
            {{ 'vaults.newVault' | transloco }}
          </a>
          <a hlmBtn variant="ghost" size="sm" routerLink="/restore">
            <ng-icon name="lucideFileUp" />
            {{ 'vaults.addFromBackup' | transloco }}
          </a>
        </div>
      </div>
    </section>
  `,
})
export class UnlockPage {
  protected readonly vault = inject(VaultService);
  protected readonly hasPasskeyHere = computed(() => this.vault.localPasskeySlots().length > 0);
  protected readonly sites = computed(() => {
    const header = this.vault.header();
    return header ? passkeySites(header).join(', ') : '';
  });
  private readonly router = inject(Router);
  /** `?next=`: where to go after unlocking. */
  readonly next = input<string>();

  protected readonly busy = signal(false);
  protected readonly opened = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async choose(vaultId: string): Promise<void> {
    this.error.set(null);
    try {
      await this.vault.select(vaultId);
    } catch (error) {
      console.error(error);
      this.error.set(errorKey(error));
    }
  }

  protected async unlock(): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await this.vault.unlockWithPasskey();
      // The open lock shows for a moment, then the app fades in over it.
      this.opened.set(true);
      if (!prefersReducedMotion()) await new Promise((resolve) => setTimeout(resolve, OPENED_PAUSE_MS));
      await this.router.navigateByUrl(safeNext(this.next()) ?? '/notes', { replaceUrl: true });
    } catch (error) {
      console.error(error);
      this.error.set(errorKey(error));
    } finally {
      this.busy.set(false);
    }
  }
}
