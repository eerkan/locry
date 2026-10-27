import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCopy, lucideDownload, lucideShieldCheck, lucideTriangleAlert } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInput } from '@spartan-ng/helm/input';
import { recoveryKeyGroups } from '../core/crypto/recovery-key';
import { downloadFile } from './download';

/**
 * Shows a new recovery key (copy / download) and then asks the user to type back one random
 * group, so we know it was saved before the key is put into use.
 */
@Component({
  selector: 'app-recovery-key-flow',
  imports: [HlmAlertImports, HlmButton, HlmFieldImports, HlmInput, NgIcon, TranslocoPipe],
  providers: [provideIcons({ lucideCopy, lucideDownload, lucideShieldCheck, lucideTriangleAlert })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-4' },
  template: `
    @if (step() === 'show') {
      <div>
        @if (headingLevel() === 1) {
          <h1 class="text-lg font-semibold">{{ 'setup.recoveryTitle' | transloco }}</h1>
        } @else {
          <h2 class="text-lg font-semibold">{{ 'setup.recoveryTitle' | transloco }}</h2>
        }
        <p class="text-muted-foreground text-sm">{{ 'setup.recoveryDescription' | transloco }}</p>
      </div>
      <div
        class="bg-muted grid grid-cols-4 gap-2 rounded-lg p-4 font-mono text-sm tracking-wider select-all"
        data-testid="recovery-key"
      >
        @for (group of groups(); track $index) {
          <span class="text-center">{{ group }}</span>
        }
      </div>
      <div class="flex gap-2">
        <button hlmBtn variant="outline" size="sm" class="flex-1" (click)="copy()">
          <ng-icon name="lucideCopy" />
          {{ 'common.copy' | transloco }}
        </button>
        <button hlmBtn variant="outline" size="sm" class="flex-1" (click)="download()">
          <ng-icon name="lucideDownload" />
          {{ 'common.download' | transloco }}
        </button>
      </div>
      <div hlmAlert>
        <ng-icon name="lucideTriangleAlert" />
        <!-- One level under the flow's title. -->
        <p hlmAlertTitle role="heading" [attr.aria-level]="headingLevel() + 1">{{ 'setup.recoveryWarningTitle' | transloco }}</p>
        <p hlmAlertDescription>{{ 'setup.recoveryWarning' | transloco }}</p>
      </div>
      <button hlmBtn class="w-full" (click)="goToConfirm()">{{ 'setup.savedIt' | transloco }}</button>
    } @else {
      <div>
        @if (headingLevel() === 1) {
          <h1 class="text-lg font-semibold">{{ 'setup.confirmTitle' | transloco }}</h1>
        } @else {
          <h2 class="text-lg font-semibold">{{ 'setup.confirmTitle' | transloco }}</h2>
        }
        <p class="text-muted-foreground text-sm">{{ 'setup.confirmDescription' | transloco: { index: confirmIndex() + 1 } }}</p>
      </div>
      <div hlmField>
        <label hlmFieldLabel for="confirm-group">{{ 'setup.confirmLabel' | transloco: { index: confirmIndex() + 1 } }}</label>
        <input
          hlmInput
          id="confirm-group"
          class="font-mono tracking-wider uppercase"
          autocomplete="off"
          maxlength="4"
          [value]="confirmInput()"
          (input)="confirmInput.set($any($event.target).value)"
          (keydown.enter)="finish()"
        />
        @if (mismatch()) {
          <p class="text-destructive text-sm">{{ 'setup.confirmMismatch' | transloco }}</p>
        }
      </div>
      <div class="flex gap-2">
        <button hlmBtn variant="ghost" (click)="step.set('show')">{{ 'common.back' | transloco }}</button>
        <button hlmBtn class="flex-1" [disabled]="busy() || confirmInput().length < 4" (click)="finish()">
          <ng-icon name="lucideShieldCheck" />
          {{ finishLabel() | transloco }}
        </button>
      </div>
    }
  `,
})
export class RecoveryKeyFlow {
  /** 1 when this flow is the page itself (setup), 2 inside a card. */
  readonly headingLevel = input<1 | 2>(2);
  readonly recoveryKey = input.required<string>();
  readonly finishLabel = input('setup.finish');
  readonly busy = input(false);
  readonly confirmed = output<void>();

  private readonly transloco = inject(TranslocoService);

  protected readonly step = signal<'show' | 'confirm'>('show');
  protected readonly groups = computed(() => recoveryKeyGroups(this.recoveryKey()));
  protected readonly confirmIndex = signal(0);
  protected readonly confirmInput = signal('');
  protected readonly mismatch = signal(false);

  protected async copy(): Promise<void> {
    await navigator.clipboard.writeText(this.recoveryKey());
    toast.success(this.transloco.translate('common.copied'));
  }

  protected download(): void {
    const content = this.transloco.translate('setup.recoveryFileContent', {
      date: new Date().toLocaleString(),
      key: this.recoveryKey(),
    });
    downloadFile(content, this.transloco.translate('setup.recoveryFileName'), 'text/plain;charset=utf-8');
  }

  protected goToConfirm(): void {
    // Ask for a random full group; the last group may be shorter than 4 characters.
    const fullGroups = this.groups().filter((g) => g.length === 4).length;
    this.confirmIndex.set(Math.floor(Math.random() * fullGroups));
    this.confirmInput.set('');
    this.mismatch.set(false);
    this.step.set('confirm');
  }

  protected finish(): void {
    if (this.confirmInput().trim().toUpperCase() !== this.groups()[this.confirmIndex()]) {
      this.mismatch.set(true);
      return;
    }
    this.confirmed.emit();
  }
}
