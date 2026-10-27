import { DestroyRef, Injectable, effect, inject, untracked } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { toast } from '@spartan-ng/brain/sonner';
import { EncryptedStore } from '../storage/encrypted-store.service';
import { VaultService } from '../vault/vault.service';
import { DriveTokenRenewal } from './drive-token-renewal.service';
import { type BackupResult, DriveService } from './drive.service';

/** Often enough for the shortest schedule (5 minutes). */
const CHECK_INTERVAL_MS = 60_000;

/**
 * Runs scheduled Drive backups while the app is open and unlocked, announcing each with a
 * toast. Without a valid token it waits for {@link DriveTokenRenewal} to renew it on the next
 * click, then backs up by itself. Only when that cannot work (Drive never used from this vault,
 * or the renewal failed) does a toast offer a button, once per unlock.
 */
@Injectable({ providedIn: 'root' })
export class AutoDriveBackupService {
  private readonly drive = inject(DriveService);
  private readonly vault = inject(VaultService);
  private readonly transloco = inject(TranslocoService);
  private readonly store = inject(EncryptedStore);
  private readonly renewal = inject(DriveTokenRenewal);
  private failuresSeen = 0;
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
    // A renewed token: back up right away if one is due. A failed renewal: offer the button.
    effect(() => {
      const connected = this.drive.connected();
      const failed = this.renewal.failures() !== this.failuresSeen;
      if (connected || failed) untracked(() => setTimeout(() => void this.check(), 0));
    });
    const timer = setInterval(() => void this.check(), CHECK_INTERVAL_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  async check(now = Date.now()): Promise<void> {
    if (this.running || !this.drive.autoBackupDue(now)) return;
    if (this.drive.hasValidToken()) {
      this.running = true;
      try {
        // Frequent schedules would otherwise upload identical copies: skip when nothing changed
        // here and no other device backed up something new to merge.
        const changes = this.store.changes();
        if (changes === this.changesAtLastBackup && !(await this.drive.otherDevicesBackedUp())) return;
        const result = await this.drive.backupNow({ interactive: false });
        this.changesAtLastBackup = this.store.changes();
        announceBackup(result, this.transloco, 'drive.autoBackupDone');
      } catch (error) {
        console.error(error);
      } finally {
        this.running = false;
      }
    } else if (this.drive.wantsRenewal() && this.renewal.failures() === this.failuresSeen) {
      // The next click renews the token; the effect above then backs up.
    } else if (!this.promptedThisUnlock) {
      this.failuresSeen = this.renewal.failures();
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
      announceBackup(await this.drive.backupNow({ interactive: true }), this.transloco, 'drive.backupDone');
    } catch (error) {
      console.error(error);
      toast.error(this.transloco.translate('drive.backupFailed'));
    }
  }
}

/** Toast after a backup; mentions changes merged in from other devices first. */
export function announceBackup(result: BackupResult, transloco: TranslocoService, doneKey: string): void {
  if (result.conflicts) toast.warning(transloco.translate('sync.conflicts', { count: result.conflicts }), { duration: 10_000 });
  toast.success(
    result.received
      ? transloco.translate('drive.backupMerged', { count: result.received })
      : transloco.translate(doneKey),
  );
}
