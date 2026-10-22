import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFingerprint, lucideInfo, lucideLock, lucideTriangleAlert } from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { errorKey } from '../../core/i18n';
import { safeNext } from '../../core/vault/vault.guard';
import { passkeySites } from '../../core/vault/vault-header';
import { VaultService } from '../../core/vault/vault.service';

@Component({
  selector: 'app-unlock-page',
  imports: [HlmAlertImports, HlmButton, HlmCardImports, HlmSpinner, NgIcon, RouterLink, TranslocoPipe],
  providers: [provideIcons({ lucideLock, lucideFingerprint, lucideInfo, lucideTriangleAlert })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section hlmCard>
      <div hlmCardHeader class="items-center text-center">
        <span class="bg-muted mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
          <ng-icon name="lucideLock" class="text-xl" />
        </span>
        <h1 hlmCardTitle class="text-xl">{{ 'unlock.title' | transloco }}</h1>
        <p hlmCardDescription>{{ 'unlock.description' | transloco }}</p>
      </div>
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
  protected readonly error = signal<string | null>(null);

  protected async unlock(): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await this.vault.unlockWithPasskey();
      await this.router.navigateByUrl(safeNext(this.next()) ?? '/notes', { replaceUrl: true });
    } catch (error) {
      console.error(error);
      this.error.set(errorKey(error));
    } finally {
      this.busy.set(false);
    }
  }
}
