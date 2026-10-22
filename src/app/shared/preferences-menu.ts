import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLanguages, lucideMonitor, lucideMoon, lucideSun } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { type Lang, PreferencesService, type Theme } from '../core/preferences.service';

/** Language and theme picker, available on the lock screens and in the app shell. */
@Component({
  selector: 'app-preferences-menu',
  imports: [HlmButton, HlmDropdownMenuImports, NgIcon, TranslocoPipe],
  providers: [provideIcons({ lucideLanguages, lucideSun, lucideMoon, lucideMonitor })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      hlmBtn
      variant="ghost"
      size="icon-sm"
      [hlmDropdownMenuTrigger]="menu"
      [attr.aria-label]="'common.language' | transloco"
    >
      <ng-icon [name]="themeIcon()" />
    </button>

    <ng-template #menu>
      <hlm-dropdown-menu class="w-44">
        <hlm-dropdown-menu-label>{{ 'common.language' | transloco }}</hlm-dropdown-menu-label>
        <hlm-dropdown-menu-group>
          @for (lang of langs; track lang) {
            <button hlmDropdownMenuRadio [checked]="prefs.lang() === lang" (triggered)="prefs.setLang(lang)">
              <hlm-dropdown-menu-radio-indicator />
              {{ 'lang.' + lang | transloco }}
            </button>
          }
        </hlm-dropdown-menu-group>
        <hlm-dropdown-menu-separator />
        <hlm-dropdown-menu-label>{{ 'common.theme' | transloco }}</hlm-dropdown-menu-label>
        <hlm-dropdown-menu-group>
          @for (theme of themes; track theme) {
            <button hlmDropdownMenuRadio [checked]="prefs.theme() === theme" (triggered)="prefs.setTheme(theme)">
              <hlm-dropdown-menu-radio-indicator />
              {{ 'theme.' + theme | transloco }}
            </button>
          }
        </hlm-dropdown-menu-group>
      </hlm-dropdown-menu>
    </ng-template>
  `,
})
export class PreferencesMenu {
  protected readonly prefs = inject(PreferencesService);
  protected readonly langs: Lang[] = ['tr', 'en'];
  protected readonly themes: Theme[] = ['light', 'dark', 'system'];

  protected themeIcon(): string {
    const theme = this.prefs.theme();
    return theme === 'light' ? 'lucideSun' : theme === 'dark' ? 'lucideMoon' : 'lucideMonitor';
  }
}
