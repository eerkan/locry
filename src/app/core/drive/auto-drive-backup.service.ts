import { DestroyRef, Injectable, effect, inject, untracked } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { toast } from '@spartan-ng/brain/sonner';
import { EncryptedStore } from '../storage/encrypted-store.service';
import { VaultService } from '../vault/vault.service';
import { DriveService } from './drive.service';

/** Often enough for the shortest schedule (5 minutes). */
const CHECK_INTERVAL_MS = 60_000;

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
  private readonly store = inject(EncryptedStore);
  private promptedThisUnlock = false;
  private running = false;
  /** Local change counter at the last automatic backup of this session. */
  private changesAtLastBackup: number | null = null;

  constructor() {
    effect(() => {
      const unlocked = this.vault.isUnlocked();
      untracked(() => {
        this.promptedThisUnlock = false;
        this.changesAtLastBackup = null;
        if (unlocked) setTimeout(() => void this.check(), 3000);
      });
    });
    const timer = setInterval(() => void this.check(), CHECK_INTERVAL_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  async check(now = Date.now()): Promise<void> {
    if (this.running || !this.drive.autoBackupDue(now)) return;
    // Frequent schedules would otherwise upload identical copies and prune the older,
    // different ones away: skip when nothing changed since the last automatic backup.
    const changes = this.store.changes();
    if (changes === this.changesAtLastBackup) return;
    if (this.drive.hasValidToken()) {
      this.running = true;
      try {
        await this.drive.backupNow({ interactive: false });
        this.changesAtLastBackup = changes;
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
