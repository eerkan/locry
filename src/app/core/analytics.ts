import { Injectable, inject } from '@angular/core';
import { RuntimeConfigService } from './runtime-config.service';

export interface Visit {
  path: string;
  title: string;
  /** The page the visitor came from, only when it is another site. */
  referrer: string;
  screen: string;
}

/** GoatCounter's counting address for one visit; no script needed, an image request is enough. */
export function countUrl(code: string, visit: Visit): string {
  const query = new URLSearchParams({ p: visit.path, t: visit.title, r: visit.referrer, s: visit.screen, rnd: Math.random().toString(36).slice(2) });
  return `https://${code}.goatcounter.com/count?${query}`;
}

/**
 * Counts visits to the public pages (landing, privacy, terms) with GoatCounter when this
 * installation configured a site code: no cookies, nothing stored, no script from elsewhere.
 * Never called inside the app, so nothing about vaults, notes or tasks is ever counted.
 */
@Injectable({ providedIn: 'root' })
export class Analytics {
  private readonly runtime = inject(RuntimeConfigService);

  /** Counts the page currently shown. Call it in the browser only, after rendering. */
  pageview(): void {
    const code = this.runtime.goatcounter();
    if (!code || !countable()) return;
    let referrer = '';
    try {
      if (document.referrer && new URL(document.referrer).origin !== location.origin) referrer = document.referrer;
    } catch {
      // Not a URL: leave it out.
    }
    const visit: Visit = {
      path: location.pathname,
      title: document.title,
      referrer,
      screen: `${screen.width},${screen.height},${devicePixelRatio || 1}`,
    };
    const image = new Image();
    image.referrerPolicy = 'no-referrer';
    image.src = countUrl(code, visit);
  }
}

/** Not counted: visitors asking not to be tracked, automated browsers and local development. */
function countable(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.doNotTrack === '1' || nav.globalPrivacyControl === true || nav.webdriver) return false;
  return !/^(localhost|127\.0\.0\.1|\[::1\]|.*\.localhost|.*\.test)$/.test(location.hostname);
}
