import { DOCUMENT, Injectable, inject } from '@angular/core';
import { SwUpdate, type VersionReadyEvent } from '@angular/service-worker';
import { TranslocoService } from '@jsverse/transloco';
import { toast } from '@spartan-ng/brain/sonner';
import { filter, firstValueFrom } from 'rxjs';
import { langFromTag } from './languages';

/** Offers a reload when the service worker has downloaded a new version of the app. */
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private readonly updates = inject(SwUpdate);
  private readonly transloco = inject(TranslocoService);
  private readonly document = inject(DOCUMENT);

  constructor() {
    if (!this.updates.isEnabled) return;
    this.updates.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => void this.offerReload());
    this.updates.unrecoverable.subscribe(() => location.reload());
  }

  /**
   * In the language on the page: a landing page may be in another language than the app's own
   * setting (a visitor reading /tr with the app set to English), so use <html lang>, which is
   * the app's language everywhere else. Its translations may not be loaded yet.
   */
  private async offerReload(): Promise<void> {
    const lang = langFromTag(this.document.documentElement.lang) ?? this.transloco.getActiveLang();
    await firstValueFrom(this.transloco.load(lang)).catch(() => undefined);
    toast(this.transloco.translate('app.updateReady', {}, lang), {
      duration: Infinity,
      action: { label: this.transloco.translate('app.reload', {}, lang), onClick: () => location.reload() },
    });
  }
}
