import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';
import { VAULT_COLORS, type VaultColor, type VaultProfile } from '../core/vault/vault-registry';

/** Static class names so Tailwind picks them up. */
export const VAULT_DOT: Record<VaultColor, string> = {
  slate: 'bg-slate-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  green: 'bg-green-500',
  teal: 'bg-teal-500',
  blue: 'bg-blue-500',
  violet: 'bg-violet-500',
  pink: 'bg-pink-500',
};

/** A vault's color dot and name (or the default label for unnamed vaults). */
@Component({
  selector: 'app-vault-label',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0 items-center gap-2' },
  template: `
    <span class="size-2.5 shrink-0 rounded-full" [class]="dot[vault().color]"></span>
    <span class="truncate" [class.hidden]="dotOnly()">{{ vault().name || ('vaults.unnamed' | transloco) }}</span>
  `,
})
export class VaultLabel {
  readonly vault = input.required<VaultProfile>();
  readonly dotOnly = input(false);
  protected readonly dot = VAULT_DOT;
}

/** Row of color swatches. */
@Component({
  selector: 'app-color-picker',
  imports: [NgIcon, TranslocoPipe],
  providers: [provideIcons({ lucideCheck })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-wrap gap-2' },
  template: `
    @for (c of colors; track c) {
      <button
        type="button"
        class="ring-offset-background flex size-7 items-center justify-center rounded-full text-white transition-shadow"
        [class]="dot[c]"
        [class.ring-2]="color() === c"
        [class.ring-ring]="color() === c"
        [class.ring-offset-2]="color() === c"
        [attr.aria-label]="'pages.tasks.colors.' + c | transloco"
        [attr.aria-pressed]="color() === c"
        (click)="color.set(c)"
      >
        @if (color() === c) {
          <ng-icon name="lucideCheck" class="text-sm" />
        }
      </button>
    }
  `,
})
export class ColorPicker {
  readonly color = model.required<VaultColor>();
  protected readonly colors = VAULT_COLORS;
  protected readonly dot = VAULT_DOT;
}
