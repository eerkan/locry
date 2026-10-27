import { DOCUMENT, DestroyRef, Injectable, inject, signal } from '@angular/core';
import { DriveService } from './drive.service';
import { DriveError } from './google-auth';

/** After a failed renewal, wait this long before trying on a click again. */
const RETRY_AFTER_MS = 5 * 60_000;
/** The user closed Google's window: leave them alone for longer. */
const RETRY_AFTER_CLOSED_MS = 30 * 60_000;

/**
 * Google's browser sign-in gives one-hour tokens and no refresh token (that would need a
 * server holding a client secret), and its window may only open from a click. So when sync or
 * scheduled backups need Drive and the token is gone or about to expire, the next click in the
 * app renews it: with the earlier grant and the account hint, Google's window closes by itself.
 * Clicks in text fields are left alone so typing is never interrupted.
 */
@Injectable({ providedIn: 'root' })
export class DriveTokenRenewal {
  private readonly drive = inject(DriveService);
  private renewing = false;
  private retryAt = 0;
  private readonly _failures = signal(0);
  /** Bumped when a renewal fails, so scheduled backups can fall back to asking with a button. */
  readonly failures = this._failures.asReadonly();

  constructor() {
    const document = inject(DOCUMENT);
    // Capture phase: runs before the clicked control, which then shares the same Google request.
    const onClick = (event: MouseEvent) => this.onClick(event);
    document.addEventListener('click', onClick, true);
    inject(DestroyRef).onDestroy(() => document.removeEventListener('click', onClick, true));
  }

  private onClick(event: MouseEvent): void {
    const now = Date.now();
    if (this.renewing || now < this.retryAt || !this.drive.renewalDue(now)) return;
    if (isTextEntry(event.target)) return;
    this.renewing = true;
    this.drive
      .renew()
      .catch((error: unknown) => {
        console.warn('Could not renew Google access', error);
        const closed = error instanceof DriveError && (error.code === 'popupClosed' || error.code === 'consentDenied');
        this.retryAt = Date.now() + (closed ? RETRY_AFTER_CLOSED_MS : RETRY_AFTER_MS);
        this._failures.update((n) => n + 1);
      })
      .finally(() => (this.renewing = false));
  }
}

function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest(
    'input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]), textarea, select, [contenteditable=""], [contenteditable="true"], [role=textbox]',
  );
}
