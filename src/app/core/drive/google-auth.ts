import { DOCUMENT, Injectable, inject } from '@angular/core';

export const DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
/** Refresh a little early so a request never starts with a token about to expire. */
const EXPIRY_MARGIN_MS = 60_000;

/** Error codes surfaced to the UI (translated under `errors.drive.*`). */
export type DriveErrorCode =
  | 'notConfigured'
  | 'scriptLoad'
  | 'popupBlocked'
  | 'popupClosed'
  | 'consentDenied'
  | 'scopeMissing'
  | 'unauthorized'
  | 'quota'
  | 'notFound'
  | 'network'
  | 'failed';

export class DriveError extends Error {
  constructor(
    readonly code: DriveErrorCode,
    cause?: unknown,
  ) {
    super(`Drive error: ${code}`, { cause });
  }
}

export interface AccessToken {
  value: string;
  expiresAt: number;
}

// Minimal typings for the parts of Google Identity Services we use.
interface TokenResponse {
  access_token?: string;
  expires_in?: number | string;
  error?: string;
  error_description?: string;
}
interface TokenClient {
  requestAccessToken(override?: { prompt?: string }): void;
}
interface GoogleOAuth2 {
  initTokenClient(config: {
    client_id: string;
    scope: string;
    prompt?: string;
    callback: (response: TokenResponse) => void;
    error_callback?: (error: { type: string }) => void;
  }): TokenClient;
  hasGrantedAllScopes(response: TokenResponse, ...scopes: string[]): boolean;
  revoke(token: string, done?: () => void): void;
}
declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GoogleOAuth2 } };
  }
}

/**
 * Google OAuth through the GIS token model: no backend and no client secret. The script is
 * only loaded when Drive is first used, and access tokens live in memory only.
 */
@Injectable({ providedIn: 'root' })
export class GoogleAuth {
  private readonly document = inject(DOCUMENT);
  private scriptPromise?: Promise<GoogleOAuth2>;

  /**
   * Opens Google's consent popup (or reuses an earlier grant) and returns an access token.
   * Must be called from a user gesture, otherwise browsers block the popup.
   */
  async requestToken(clientId: string, options: { forceConsent?: boolean } = {}): Promise<AccessToken> {
    if (!clientId.trim()) throw new DriveError('notConfigured');
    const oauth2 = await this.load();
    return new Promise<AccessToken>((resolve, reject) => {
      const client = oauth2.initTokenClient({
        client_id: clientId.trim(),
        scope: DRIVE_APPDATA_SCOPE,
        callback: (response) => {
          if (response.error || !response.access_token) {
            reject(new DriveError(response.error === 'access_denied' ? 'consentDenied' : 'failed', response));
          } else if (!oauth2.hasGrantedAllScopes(response, DRIVE_APPDATA_SCOPE)) {
            reject(new DriveError('scopeMissing'));
          } else {
            const seconds = Number(response.expires_in ?? 3600);
            resolve({ value: response.access_token, expiresAt: Date.now() + seconds * 1000 - EXPIRY_MARGIN_MS });
          }
        },
        error_callback: (error) =>
          reject(new DriveError(error.type === 'popup_failed_to_open' ? 'popupBlocked' : 'popupClosed', error)),
      });
      // Empty prompt: consent is only shown the first time for this client and scope.
      client.requestAccessToken({ prompt: options.forceConsent ? 'consent' : '' });
    });
  }

  /** Revokes the grant so the next connection asks for consent again. */
  async revoke(token: string): Promise<void> {
    const oauth2 = await this.load();
    await new Promise<void>((resolve) => oauth2.revoke(token, resolve));
  }

  private load(): Promise<GoogleOAuth2> {
    const existing = this.document.defaultView?.google?.accounts?.oauth2;
    if (existing) return Promise.resolve(existing);
    this.scriptPromise ??= new Promise<GoogleOAuth2>((resolve, reject) => {
      const script = this.document.createElement('script');
      script.src = GIS_SCRIPT_URL;
      script.async = true;
      script.onload = () => {
        const oauth2 = this.document.defaultView?.google?.accounts?.oauth2;
        if (oauth2) resolve(oauth2);
        else reject(new DriveError('scriptLoad'));
      };
      script.onerror = () => {
        this.scriptPromise = undefined;
        script.remove();
        reject(new DriveError('scriptLoad'));
      };
      this.document.head.append(script);
    });
    return this.scriptPromise;
  }
}
