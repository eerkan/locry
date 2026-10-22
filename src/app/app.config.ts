import { isPlatformBrowser } from '@angular/common';
import {
  type ApplicationConfig,
  PLATFORM_ID,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideClientHydration, withNoIncrementalHydration } from '@angular/platform-browser';
import { TitleStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { TranslocoService, provideTransloco } from '@jsverse/transloco';
import { provideSpartanHlm } from '@spartan-ng/helm/utils';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { InlineTranslocoLoader } from './core/i18n';
import { LocryTitleStrategy } from './core/title-strategy';
import { PreferencesService } from './core/preferences.service';
import { RuntimeConfigService } from './core/runtime-config.service';
import { VaultService } from './core/vault/vault.service';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    // The landing pages are prerendered; the browser takes over their HTML instead of redrawing it.
    // Plain hydration: incremental hydration and event replay need inline scripts, which the
    // Content Security Policy forbids; the landing page's links and FAQ work without JS anyway.
    provideClientHydration(withNoIncrementalHydration()),
    { provide: TitleStrategy, useClass: LocryTitleStrategy },
    provideSpartanHlm(),
    provideTransloco({
      config: {
        availableLangs: ['tr', 'en'],
        defaultLang: 'tr',
        fallbackLang: 'tr',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: InlineTranslocoLoader,
    }),
    // Render only after the active language is loaded and the vault state is known.
    provideAppInitializer(() => {
      const transloco = inject(TranslocoService);
      const lang = inject(PreferencesService).lang();
      transloco.setActiveLang(lang);
      // Prerendering (build time) only renders public pages: no vault, storage or config there.
      if (!isPlatformBrowser(inject(PLATFORM_ID))) return firstValueFrom(transloco.load(lang)).then(() => undefined);
      return Promise.all([
        firstValueFrom(transloco.load(lang)),
        inject(VaultService).init(),
        inject(RuntimeConfigService).load(),
      ]).then(
        () => undefined,
      );
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
