import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowUpRight, lucideCopy, lucideHeart } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { RuntimeConfigService } from '../../core/runtime-config.service';
import { copyText } from '../../shared/copy-text';
import { DonateLogo } from '../../shared/donate-logo';

/** Ways to support Locry, when this installation configured any (LOCRY_DONATE_* in .env). */
@Component({
  selector: 'app-support-card',
  imports: [DonateLogo, HlmButton, HlmCardImports, NgIcon, TranslocoPipe],
  providers: [provideIcons({ lucideArrowUpRight, lucideCopy, lucideHeart })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (config.donations(); as donations) {
      <section hlmCard id="support">
        <div hlmCardHeader>
          <h2 hlmCardTitle class="flex items-center gap-2"><ng-icon name="lucideHeart" class="text-rose-500" />{{ 'support.title' | transloco }}</h2>
          <p hlmCardDescription>{{ 'support.description' | transloco }}</p>
        </div>
        <div hlmCardContent class="flex flex-col gap-4">
          @if (donations.links.length) {
            <div class="flex flex-wrap gap-2">
              @for (link of donations.links; track link.platform) {
                <a hlmBtn variant="outline" size="sm" [href]="link.url" target="_blank" rel="noopener noreferrer">
                  <app-donate-logo [platform]="link.platform" />{{ link.name }}<ng-icon name="lucideArrowUpRight" class="rtl:-scale-x-100" />
                </a>
              }
            </div>
          }
          @if (donations.crypto.length) {
            <div class="flex flex-col gap-2">
              <p class="text-sm font-medium">{{ 'support.crypto' | transloco }}</p>
              <ul class="flex flex-col gap-1.5">
                @for (wallet of donations.crypto; track wallet.label + wallet.address) {
                  <li class="flex items-center gap-2 rounded-md border px-3 py-2">
                    <span class="flex min-w-20 shrink-0 items-center gap-2 text-xs font-medium whitespace-nowrap"><app-donate-logo [coin]="wallet.label" />{{ wallet.label }}</span>
                    <code #address dir="ltr" class="text-muted-foreground min-w-0 flex-1 truncate text-xs">{{ wallet.address }}</code>
                    <button
                      hlmBtn
                      variant="ghost"
                      size="icon-xs"
                      [attr.aria-label]="'support.copyAddress' | transloco: { label: wallet.label }"
                      (click)="copy(wallet.address, address)"
                    >
                      <ng-icon name="lucideCopy" />
                    </button>
                  </li>
                }
              </ul>
            </div>
          }
        </div>
      </section>
    }
  `,
})
export class SupportCard {
  protected readonly config = inject(RuntimeConfigService);
  private readonly transloco = inject(TranslocoService);

  protected async copy(address: string, element: HTMLElement): Promise<void> {
    if (await copyText(address, element)) toast.success(this.transloco.translate('common.copied'));
  }
}
