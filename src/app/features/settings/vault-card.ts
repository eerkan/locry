import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideTrash2, lucideTriangleAlert } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInput } from '@spartan-ng/helm/input';
import { errorKey } from '../../core/i18n';
import type { VaultColor } from '../../core/vault/vault-registry';
import { type ReAuth, VaultService } from '../../core/vault/vault.service';
import { ReAuthPrompt } from '../../shared/reauth';
import { ColorPicker } from '../../shared/vault-ui';

/** Name and color of the open vault, and deleting it from this device. */
@Component({
  selector: 'app-vault-card',
  imports: [
    ColorPicker,
    HlmAlertImports,
    HlmButton,
    HlmCardImports,
    HlmDialogImports,
    HlmFieldImports,
    HlmInput,
    NgIcon,
    ReAuthPrompt,
    TranslocoPipe,
  ],
  providers: [provideIcons({ lucideTrash2, lucideTriangleAlert })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section hlmCard id="vault">
      <div hlmCardHeader>
        <h2 hlmCardTitle>{{ 'vaults.cardTitle' | transloco }}</h2>
        <p hlmCardDescription>{{ 'vaults.cardDescription' | transloco }}</p>
      </div>
      <form hlmCardContent class="flex flex-col gap-4" (submit)="$event.preventDefault(); save()">
        <div hlmField>
          <label hlmFieldLabel for="vault-name">{{ 'vaults.name' | transloco }}</label>
          <input
            hlmInput
            id="vault-name"
            autocomplete="off"
            maxlength="60"
            [placeholder]="'vaults.unnamed' | transloco"
            [value]="name()"
            (input)="name.set($any($event.target).value)"
          />
          <p hlmFieldDescription>{{ 'vaults.nameHint' | transloco }}</p>
        </div>
        <fieldset class="flex flex-col gap-2">
          <legend class="mb-2 text-sm font-medium">{{ 'vaults.color' | transloco }}</legend>
          <app-color-picker [(color)]="color" />
        </fieldset>
        <div class="flex flex-wrap justify-between gap-2">
          <button hlmBtn type="button" variant="outline" class="text-destructive" (click)="startDelete()">
            <ng-icon name="lucideTrash2" />
            {{ 'vaults.deleteTitle' | transloco }}
          </button>
          <button hlmBtn type="submit" [disabled]="!changed()">{{ 'vaults.save' | transloco }}</button>
        </div>
      </form>
    </section>

    <hlm-dialog [state]="deleting() ? 'open' : 'closed'" (stateChanged)="$event === 'closed' && deleting.set(false)">
      <hlm-dialog-content *hlmDialogPortal="let ctx" class="sm:max-w-md">
        <hlm-dialog-header>
          <h2 hlmDialogTitle>{{ 'vaults.deleteTitle' | transloco }}</h2>
          <p hlmDialogDescription>{{ 'vaults.deleteDescription' | transloco: { name: displayName() } }}</p>
        </hlm-dialog-header>
        <div hlmAlert>
          <ng-icon name="lucideTriangleAlert" />
          <p hlmAlertDescription>{{ 'vaults.deleteHint' | transloco }}</p>
        </div>
        <app-reauth
          passkeyLabel="vaults.deleteConfirm"
          [allowPasskey]="vault.localPasskeySlots().length > 0"
          [busy]="busy()"
          [error]="error()"
          (submitted)="delete($event)"
        />
      </hlm-dialog-content>
    </hlm-dialog>
  `,
})
export class VaultCard {
  protected readonly vault = inject(VaultService);
  private readonly transloco = inject(TranslocoService);

  private readonly profile = computed(() => this.vault.activeVault());
  protected readonly name = linkedSignal(() => this.profile()?.name ?? '');
  protected readonly color = linkedSignal<VaultColor>(() => this.profile()?.color ?? 'blue');
  protected readonly changed = computed(() => {
    const profile = this.profile();
    return !!profile && (this.name().trim() !== profile.name || this.color() !== profile.color);
  });
  protected readonly displayName = computed(() => this.profile()?.name || this.transloco.translate('vaults.unnamed'));

  protected readonly deleting = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async save(): Promise<void> {
    const profile = this.profile();
    if (!profile || !this.changed()) return;
    await this.vault.updateProfile(profile.id, { name: this.name(), color: this.color() });
    toast.success(this.transloco.translate('vaults.saved'));
  }

  protected startDelete(): void {
    this.error.set(null);
    this.deleting.set(true);
  }

  protected async delete(auth: ReAuth): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await this.vault.deleteVault(auth);
      this.deleting.set(false);
      toast.success(this.transloco.translate('vaults.deleted'));
    } catch (error) {
      console.error(error);
      this.error.set(errorKey(error));
    } finally {
      this.busy.set(false);
    }
  }
}
