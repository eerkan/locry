import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Logo } from '../shared/logo';
import { PreferencesMenu } from '../shared/preferences-menu';

/** Layout for the screens shown while the vault is empty or locked. */
@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, Logo, PreferencesMenu, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-muted/40 flex min-h-svh flex-col">
      <header class="flex items-center justify-between px-6 py-4">
        <app-logo />
        <app-preferences-menu />
      </header>
      <main class="flex flex-1 items-center justify-center px-4 pb-16 [view-transition-name:page]">
        <div class="w-full max-w-md">
          <router-outlet />
        </div>
      </main>
      <footer class="text-muted-foreground pb-6 text-center text-xs">{{ 'app.tagline' | transloco }}</footer>
    </div>
  `,
})
export class AuthLayout {}
