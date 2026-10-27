import { Injectable, signal } from '@angular/core';
import { type DonateConfig, type Donations, donations } from './donate';
import { isGoogleClientId } from './drive/google-auth';

interface RuntimeConfig {
  googleClientId?: string;
  donate?: DonateConfig;
  goatcounter?: string;
}

/** A GoatCounter site code (the <code> in https://<code>.goatcounter.com). */
export const GOATCOUNTER_CODE = /^[a-z0-9][a-z0-9-]{1,49}$/;

const CACHE_KEY = 'locry.runtime-config';
const LOAD_TIMEOUT_MS = 3000;

/**
 * Deployment settings served as /config.json (from .env, see .env.example), read once at
 * startup. The last good copy is cached so the app behaves the same when offline.
 */
@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private readonly _googleClientId = signal<string | null>(null);
  /** Client ID that ships with this installation, if the operator configured one. */
  readonly googleClientId = this._googleClientId.asReadonly();
  private readonly _donations = signal<Donations | null>(null);
  /** Where people can support this installation's maintainer; null when none is configured. */
  readonly donations = this._donations.asReadonly();
  private readonly _goatcounter = signal<string | null>(null);
  /** GoatCounter site code that counts visits to the public pages; null when none is configured. */
  readonly goatcounter = this._goatcounter.asReadonly();

  async load(): Promise<void> {
    let config = this.cached();
    try {
      const response = await fetch('config.json', {
        cache: 'no-store',
        signal: AbortSignal.timeout(LOAD_TIMEOUT_MS),
      });
      if (response.ok) {
        config = (await response.json()) as RuntimeConfig;
        localStorage.setItem(CACHE_KEY, JSON.stringify(config));
      } else if (response.status === 404) {
        // No config served at all: nothing is built in.
        config = {};
        localStorage.removeItem(CACHE_KEY);
      }
    } catch {
      // Offline or slow: keep the cached copy.
    }
    const id = config.googleClientId?.trim();
    this._googleClientId.set(id && isGoogleClientId(id) ? id : null);
    this._donations.set(donations(config.donate));
    const code = config.goatcounter?.trim();
    this._goatcounter.set(code && GOATCOUNTER_CODE.test(code) ? code : null);
  }

  private cached(): RuntimeConfig {
    try {
      return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') as RuntimeConfig;
    } catch {
      return {};
    }
  }
}
