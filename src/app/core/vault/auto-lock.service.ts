import { DOCUMENT, DestroyRef, Injectable, effect, inject } from '@angular/core';
import { PreferencesService } from '../preferences.service';
import { VaultService } from './vault.service';

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;

/** Locks the vault after a period without user activity (0 minutes disables it). */
@Injectable({ providedIn: 'root' })
export class AutoLockService {
  private readonly vault = inject(VaultService);
  private readonly prefs = inject(PreferencesService);
  private readonly document = inject(DOCUMENT);
  private timer?: ReturnType<typeof setTimeout>;
  private readonly onActivity = () => this.schedule();

  constructor() {
    effect(() => {
      // Re-arm whenever the vault unlocks or the timeout changes.
      if (this.vault.isUnlocked() && this.prefs.autoLockMinutes() > 0) {
        this.schedule();
      } else {
        clearTimeout(this.timer);
      }
    });

    for (const event of ACTIVITY_EVENTS) {
      this.document.addEventListener(event, this.onActivity, { passive: true, capture: true });
    }
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
      for (const event of ACTIVITY_EVENTS) {
        this.document.removeEventListener(event, this.onActivity, { capture: true });
      }
    });
  }

  private schedule(): void {
    clearTimeout(this.timer);
    const minutes = this.prefs.autoLockMinutes();
    if (!this.vault.isUnlocked() || minutes <= 0) return;
    this.timer = setTimeout(() => this.vault.lock(), minutes * 60_000);
  }
}
