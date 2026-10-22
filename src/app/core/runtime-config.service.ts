import { Injectable, signal } from '@angular/core';
import { isGoogleClientId } from './drive/google-auth';

interface RuntimeConfig {
  googleClientId?: string;
}

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
  }

  private cached(): RuntimeConfig {
    try {
      return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') as RuntimeConfig;
    } catch {
      return {};
    }
  }
}
