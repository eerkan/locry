import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEllipsis, lucideFingerprint, lucidePencil, lucidePlus, lucideTrash2 } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInput } from '@spartan-ng/helm/input';
import { errorKey } from '../../core/i18n';
import { PreferencesService } from '../../core/preferences.service';
import { type KeySlot, slotRpId } from '../../core/vault/vault-header';
import { type ReAuth, VaultService } from '../../core/vault/vault.service';
import { ReAuthPrompt } from '../../shared/reauth';

@Component({
  selector: 'app-passkeys-card',
  imports: [
    HlmAlertDialogImports,
    HlmBadge,
    HlmButton,
    HlmCardImports,
    HlmDialogImports,
    HlmDropdownMenuImports,
    HlmFieldImports,
    HlmInput,
    NgIcon,
    ReAuthPrompt,
    TranslocoPipe,
  ],
  providers: [provideIcons({ lucideFingerprint, lucidePlus, lucideEllipsis, lucidePencil, lucideTrash2 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section hlmCard>
      <div hlmCardHeader>
        <h2 hlmCardTitle>{{ 'pages.settings.passkeysTitle' | transloco }}</h2>
        <p hlmCardDescription>{{ 'pages.settings.passkeysDescription' | transloco }}</p>
      </div>
      <div hlmCardContent>
        <ul class="divide-y rounded-lg border">
          @for (slot of vault.passkeySlots(); track slot.id) {
            <li class="flex items-center gap-3 px-3 py-2.5">
              <span class="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full">
                <ng-icon name="lucideFingerprint" />
              </span>
              <div class="flex min-w-0 flex-1 flex-col">
                <span class="flex items-center gap-2">
                  <span class="truncate text-sm font-medium">{{ slot.label }}</span>
                  @if (site(slot) !== vault.rpId) {
                    <span hlmBadge variant="outline" class="text-[10px]">{{ 'pages.settings.passkeyOtherSite' | transloco }}</span>
                  }
                </span>
                <span class="text-muted-foreground text-xs">
                  {{ site(slot) }} · {{ 'pages.settings.addedOn' | transloco: { date: formatDate(slot.createdAt) } }}
                </span>
              </div>
              <button
                hlmBtn
                variant="ghost"
                size="icon-sm"
                [attr.aria-label]="'pages.settings.passkeyActions' | transloco"
                [hlmDropdownMenuTrigger]="slotMenu"
                [hlmDropdownMenuTriggerData]="{ $implicit: slot }"
              >
                <ng-icon name="lucideEllipsis" />
              </button>
            </li>
          }
        </ul>
      </div>
      <div hlmCardFooter class="justify-end">
        <button hlmBtn variant="outline" (click)="openAdd()">
          <ng-icon name="lucidePlus" />
          {{ 'pages.settings.addPasskey' | transloco }}
        </button>
      </div>
    </section>

    <ng-template #slotMenu let-slot>
      <hlm-dropdown-menu class="w-48">
        <button hlmDropdownMenuItem (triggered)="openRename(slot)">
          <ng-icon name="lucidePencil" />
          {{ 'pages.settings.renamePasskey' | transloco }}
        </button>
        <button
          hlmDropdownMenuItem
          variant="destructive"
          [disabled]="vault.passkeySlots().length <= 1"
          (triggered)="toRemove.set(slot)"
        >
          <ng-icon name="lucideTrash2" />
          {{ 'pages.settings.removePasskey' | transloco }}
        </button>
        @if (vault.passkeySlots().length <= 1) {
          <p class="text-muted-foreground px-2 py-1.5 text-xs">{{ 'pages.settings.lastPasskeyHint' | transloco }}</p>
        }
      </hlm-dropdown-menu>
    </ng-template>

    <!-- Add passkey -->
    <hlm-dialog [state]="adding() ? 'open' : 'closed'" (stateChanged)="$event === 'closed' && adding.set(false)">
      <hlm-dialog-content *hlmDialogPortal="let ctx" class="sm:max-w-md">
        <hlm-dialog-header>
          <h2 hlmDialogTitle>{{ 'pages.settings.addPasskey' | transloco }}</h2>
          <p hlmDialogDescription>{{ 'pages.settings.addPasskeyDescription' | transloco }}</p>
        </hlm-dialog-header>
        <div hlmField>
          <label hlmFieldLabel for="new-passkey-label">{{ 'pages.settings.passkeyLabel' | transloco }}</label>
          <input hlmInput id="new-passkey-label" autocomplete="off" [value]="label()" (input)="label.set($any($event.target).value)" />
        </div>
        <app-reauth [busy]="busy()" [error]="error()" (submitted)="add($event)" />
      </hlm-dialog-content>
    </hlm-dialog>

    <!-- Rename -->
    <hlm-dialog [state]="renaming() ? 'open' : 'closed'" (stateChanged)="$event === 'closed' && renaming.set(null)">
      <hlm-dialog-content *hlmDialogPortal="let ctx" class="sm:max-w-sm">
        <form class="flex flex-col gap-4" (submit)="$event.preventDefault(); rename()">
          <hlm-dialog-header>
            <h2 hlmDialogTitle>{{ 'pages.settings.renamePasskey' | transloco }}</h2>
          </hlm-dialog-header>
          <input hlmInput autocomplete="off" maxlength="60" [attr.aria-label]="'pages.settings.passkeyLabel' | transloco" [value]="label()" (input)="label.set($any($event.target).value)" />
          <hlm-dialog-footer>
            <button hlmBtn type="button" variant="outline" (click)="renaming.set(null)">{{ 'pages.tasks.cancel' | transloco }}</button>
            <button hlmBtn type="submit" [disabled]="!label().trim()">{{ 'pages.tasks.save' | transloco }}</button>
          </hlm-dialog-footer>
        </form>
      </hlm-dialog-content>
    </hlm-dialog>

    <!-- Remove -->
    <hlm-alert-dialog [state]="toRemove() ? 'open' : 'closed'" (stateChanged)="$event === 'closed' && toRemove.set(null)">
      <hlm-alert-dialog-content *hlmAlertDialogPortal="let ctx">
        <hlm-alert-dialog-header>
          <h2 hlmAlertDialogTitle>{{ 'pages.settings.removePasskeyTitle' | transloco }}</h2>
          <p hlmAlertDialogDescription>{{ 'pages.settings.removePasskeyDescription' | transloco: { label: toRemove()?.label } }}</p>
        </hlm-alert-dialog-header>
        <hlm-alert-dialog-footer>
          <button hlmAlertDialogCancel>{{ 'pages.tasks.cancel' | transloco }}</button>
          <button hlmAlertDialogAction variant="destructive" (click)="remove(); ctx.close()">
            {{ 'pages.settings.removePasskey' | transloco }}
          </button>
        </hlm-alert-dialog-footer>
      </hlm-alert-dialog-content>
    </hlm-alert-dialog>
  `,
})
export class PasskeysCard {
  protected readonly vault = inject(VaultService);
  private readonly prefs = inject(PreferencesService);
  private readonly transloco = inject(TranslocoService);

  protected readonly adding = signal(false);
  protected readonly renaming = signal<KeySlot | null>(null);
  protected readonly toRemove = signal<KeySlot | null>(null);
  protected readonly label = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected site(slot: KeySlot): string {
    return slotRpId(slot);
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.prefs.lang(), { dateStyle: 'medium' }).format(new Date(iso));
  }

  protected openAdd(): void {
    this.label.set(this.transloco.translate('pages.settings.passkeyLabelDefault'));
    this.error.set(null);
    this.adding.set(true);
  }

  protected async add(auth: ReAuth): Promise<void> {
    const label = this.label().trim() || this.transloco.translate('pages.settings.passkeyLabelDefault');
    this.busy.set(true);
    this.error.set(null);
    try {
      await this.vault.addPasskey(label, auth);
      this.adding.set(false);
      toast.success(this.transloco.translate('pages.settings.passkeyAdded'));
    } catch (error) {
      console.error(error);
      this.error.set(errorKey(error));
    } finally {
      this.busy.set(false);
    }
  }

  protected openRename(slot: KeySlot): void {
    this.label.set(slot.label);
    this.renaming.set(slot);
  }

  protected async rename(): Promise<void> {
    const slot = this.renaming();
    const label = this.label().trim();
    if (!slot || !label) return;
    this.renaming.set(null);
    await this.vault.renamePasskey(slot.id, label);
  }

  /** Reads the target synchronously: closing the dialog right after clears `toRemove`. */
  protected async remove(): Promise<void> {
    const slot = this.toRemove();
    if (!slot) return;
    try {
      await this.vault.removePasskey(slot.id);
      toast.success(this.transloco.translate('pages.settings.passkeyRemoved'));
    } catch (error) {
      toast.error(this.transloco.translate(errorKey(error)));
    }
  }
}
