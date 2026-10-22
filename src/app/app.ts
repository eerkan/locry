import { Component, effect, inject, untracked } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { HlmToasterImports } from '@spartan-ng/helm/sonner';
import { AppUpdateService } from './core/app-update.service';
import { PreferencesService } from './core/preferences.service';
import { AutoLockService } from './core/vault/auto-lock.service';
import { homeForStatus, safeNext } from './core/vault/vault.guard';
import { VaultService } from './core/vault/vault.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HlmToasterImports],
  template: `
    <router-outlet />
    <hlm-toaster [theme]="toasterTheme()" position="bottom-right" richColors />
  `,
})
export class App {
  private readonly vault = inject(VaultService);
  private readonly router = inject(Router);
  private readonly prefs = inject(PreferencesService);

  protected readonly toasterTheme = () => this.prefs.theme();

  constructor() {
    inject(AutoLockService);
    inject(AppUpdateService);
    const transloco = inject(TranslocoService);

    effect(() => transloco.setActiveLang(this.prefs.lang()));

    // When the vault locks (manually or by auto-lock), leave the protected pages. On a
    // fresh load the route guards handle redirects, so only react to new lock events.
    let seenLocks = this.vault.lockCount();
    effect(() => {
      const locks = this.vault.lockCount();
      if (locks === seenLocks) return;
      seenLocks = locks;
      untracked(() => {
        const destination = this.vault.consumeLockDestination();
        if (destination) return void this.router.navigateByUrl(destination, { replaceUrl: true });
        const next = safeNext(this.router.url);
        void this.router.navigate([homeForStatus('locked')], { queryParams: next ? { next } : {}, replaceUrl: true });
      });
    });
  }
}
