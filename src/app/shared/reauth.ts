import { ChangeDetectionStrategy, Component, input, linkedSignal, output, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFingerprint, lucideKeyRound, lucideTriangleAlert } from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import type { ReAuth } from '../core/vault/vault.service';

/**
 * Lets the user prove access with a passkey (default) or the recovery key. The parent runs
 * the actual operation and passes back `busy` and `error`.
 */
@Component({
  selector: 'app-reauth',
  imports: [HlmAlertImports, HlmButton, HlmSpinner, NgIcon, TranslocoPipe],
  providers: [provideIcons({ lucideFingerprint, lucideKeyRound, lucideTriangleAlert })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-3' },
  template: `
    @if (error()) {
      <div hlmAlert variant="destructive">
        <ng-icon name="lucideTriangleAlert" />
        <p hlmAlertDescription>{{ error()! | transloco }}</p>
      </div>
    }
    @if (method() === 'passkey' && allowPasskey()) {
      <button hlmBtn class="w-full" [disabled]="busy()" (click)="submitted.emit({ method: 'passkey' })">
        @if (busy()) {
          <hlm-spinner />
        } @else {
          <ng-icon name="lucideFingerprint" />
        }
        {{ passkeyLabel() | transloco }}
      </button>
      @if (allowRecovery()) {
        <button hlmBtn variant="link" size="sm" (click)="method.set('recovery')">{{ 'reauth.useRecovery' | transloco }}</button>
      }
    } @else {
      <label for="reauth-recovery" class="text-sm font-medium">{{ 'reauth.recoveryLabel' | transloco }}</label>
      <textarea
        id="reauth-recovery"
        rows="3"
        spellcheck="false"
        autocomplete="off"
        class="border-input bg-background focus-visible:ring-ring/50 w-full resize-none rounded-md border px-3 py-2 font-mono text-sm tracking-wider uppercase outline-none focus-visible:ring-[3px]"
        placeholder="XXXX-XXXX-XXXX-…"
        [value]="recoveryKey()"
        (input)="recoveryKey.set($any($event.target).value)"
      ></textarea>
      <button
        hlmBtn
        class="w-full"
        [disabled]="busy() || !recoveryKey().trim()"
        (click)="submitted.emit({ method: 'recovery', recoveryKey: recoveryKey() })"
      >
        @if (busy()) {
          <hlm-spinner />
        } @else {
          <ng-icon name="lucideKeyRound" />
        }
        {{ 'reauth.continue' | transloco }}
      </button>
      @if (allowPasskey()) {
        <button hlmBtn variant="link" size="sm" (click)="method.set('passkey')">{{ 'reauth.usePasskey' | transloco }}</button>
      }
    }
  `,
})
export class ReAuthPrompt {
  readonly busy = input(false);
  /** Translation key of the error to show, if any. */
  readonly error = input<string | null>(null);
  readonly passkeyLabel = input('reauth.withPasskey');
  readonly allowRecovery = input(true);
  /** False when no passkey can work here (e.g. they belong to another site): recovery key only. */
  readonly allowPasskey = input(true);
  readonly submitted = output<ReAuth>();

  protected readonly method = linkedSignal<'passkey' | 'recovery'>(() => (this.allowPasskey() ? 'passkey' : 'recovery'));
  protected readonly recoveryKey = signal('');
}
