import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFingerprint, lucideTriangleAlert } from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { errorKey } from '../core/i18n';
import { VaultService } from '../core/vault/vault.service';

/**
 * Offers to create a passkey for the current site right after the vault was opened with the
 * recovery key, because its existing passkeys belong to another site (or were lost).
 */
@Component({
  selector: 'app-add-site-passkey',
  imports: [HlmAlertImports, HlmButton, HlmFieldImports, HlmInput, HlmSpinner, NgIcon, TranslocoPipe],
  providers: [provideIcons({ lucideFingerprint, lucideTriangleAlert })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-4' },
  template: `
    <div>
      <h2 class="text-lg font-semibold">{{ 'sitePasskey.title' | transloco }}</h2>
      <p class="text-muted-foreground text-sm">{{ 'sitePasskey.description' | transloco: { site: vault.rpId } }}</p>
    </div>
    <div hlmField>
      <label hlmFieldLabel for="site-passkey-label">{{ 'pages.settings.passkeyLabel' | transloco }}</label>
      <input hlmInput id="site-passkey-label" autocomplete="off" [value]="label()" (input)="label.set($any($event.target).value)" />
    </div>
    @if (error()) {
      <div hlmAlert variant="destructive">
        <ng-icon name="lucideTriangleAlert" />
        <p hlmAlertDescription>{{ error()! | transloco }}</p>
      </div>
    }
    <div class="flex gap-2">
      <button hlmBtn variant="ghost" [disabled]="busy()" (click)="done.emit()">{{ 'sitePasskey.later' | transloco }}</button>
      <button hlmBtn class="flex-1" [disabled]="busy()" (click)="create()">
        @if (busy()) {
          <hlm-spinner />
        } @else {
          <ng-icon name="lucideFingerprint" />
        }
        {{ 'setup.createPasskey' | transloco }}
      </button>
    </div>
  `,
})
export class AddSitePasskey {
  /** The recovery key the user just entered; proves access for creating the new slot. */
  readonly recoveryKey = input.required<string>();
  readonly done = output<void>();

  protected readonly vault = inject(VaultService);
  private readonly transloco = inject(TranslocoService);

  protected readonly label = signal(`${this.transloco.translate('setup.passkeyNameDefault')} · ${this.vault.rpId}`);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async create(): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await this.vault.addPasskey(this.label().trim() || this.vault.rpId, {
        method: 'recovery',
        recoveryKey: this.recoveryKey(),
      });
      this.done.emit();
    } catch (error) {
      console.error(error);
      this.error.set(errorKey(error));
    } finally {
      this.busy.set(false);
    }
  }
}
