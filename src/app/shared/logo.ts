import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLockKeyhole } from '@ng-icons/lucide';

@Component({
  selector: 'app-logo',
  imports: [NgIcon],
  providers: [provideIcons({ lucideLockKeyhole })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex items-center gap-2 font-semibold tracking-tight' },
  template: `
    <span class="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
      <ng-icon name="lucideLockKeyhole" class="text-base" />
    </span>
    <span class="text-lg">Locry</span>
  `,
})
export class Logo {}
