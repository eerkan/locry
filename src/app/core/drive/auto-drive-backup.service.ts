import { DestroyRef, Injectable, effect, inject, untracked } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { toast } from '@spartan-ng/brain/sonner';
import { VaultService } from '../vault/vault.service';
import { DriveService } from './drive.service';

const CHECK_INTERVAL_MS = 5 * 60_000;

/**
 * Runs scheduled Drive backups while the app is open and unlocked. Browsers only allow the
 * Google popup from a click, so without a valid token the user gets a toast with a button
 * instead of a silent backup (once per unlock).
 */
@Injectable({ providedIn: 'root' })
export class AutoDriveBackupService {
  private readonly drive = inject(DriveService);
  private readonly vault = inject(VaultService);
  private readonly transloco = inject(TranslocoService);
  private promptedThisUnlock = false;
  private running = false;

  constructor() {
    effect(() => {
      const unlocked = this.vault.isUnlocked();
      untracked(() => {
        this.promptedThisUnlock = false;
        if (unlocked) setTimeout(() => void this.check(), 3000);
      });
    });
    const timer = setInterval(() => void this.check(), CHECK_INTERVAL_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  async check(): Promise<void> {
    if (this.running || !this.drive.autoBackupDue()) return;
    if (this.drive.hasValidToken()) {
      this.running = true;
      try {
        await this.drive.backupNow({ interactive: false });
        toast.success(this.transloco.translate('drive.autoBackupDone'));
      } catch (error) {
        console.error(error);
      } finally {
        this.running = false;
      }
    } else if (!this.promptedThisUnlock) {
      this.promptedThisUnlock = true;
      toast(this.transloco.translate('drive.autoBackupDue'), {
        duration: 15_000,
        action: {
          label: this.transloco.translate('drive.backupNow'),
          onClick: () => void this.backupFromClick(),
        },
      });
    }
  }

  private async backupFromClick(): Promise<void> {
    try {
      await this.drive.backupNow({ interactive: true });
      toast.success(this.transloco.translate('drive.backupDone'));
    } catch (error) {
      console.error(error);
      toast.error(this.transloco.translate('drive.backupFailed'));
    }
  }
}
