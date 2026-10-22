import {
  type ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
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
