import { Injectable, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { type ActivatedRouteSnapshot, type RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { PreferencesService } from './preferences.service';

/** Route `title`s are translation keys; the document title is "<page> · Locry" in the active language. */
@Injectable({ providedIn: 'root' })
export class LocryTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly transloco = inject(TranslocoService);
  private readonly prefs = inject(PreferencesService);
  /** Translation key of the page title; null when the page sets its own title (landing). */
  private readonly key = signal<string | undefined | null>(undefined);

  constructor() {
    super();
    effect(() => {
      const key = this.key();
      this.prefs.lang(); // re-translate on language change
      if (key === null) return;
      const page = key ? this.transloco.translate(key) : '';
      this.title.setTitle(page && page !== key ? `${page} · Locry` : 'Locry');
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    let route: ActivatedRouteSnapshot | null = snapshot.root;
    while (route) {
      if (route.data['ownTitle']) return this.key.set(null);
      route = route.firstChild;
    }
    this.key.set(this.buildTitle(snapshot));
  }
}
