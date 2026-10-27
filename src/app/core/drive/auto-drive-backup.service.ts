import { DestroyRef, Injectable, effect, inject, untracked } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { toast } from '@spartan-ng/brain/sonner';
import { EncryptedStore } from '../storage/encrypted-store.service';
import { VaultService } from '../vault/vault.service';
import { type BackupResult, DriveService } from './drive.service';

/** Often enough for the shortest schedule (5 minutes). */
const CHECK_INTERVAL_MS = 60_000;

/**
 * Runs scheduled Drive backups while the app is open and unlocked, announcing each with a
 * toast. Google's window may only open from a click and is never opened unasked, so without
 * a valid token (it lasts an hour and is kept across locks) a toast offers a button instead,
 * once per unlock; with the account known, the window then closes by itself.
 */
@Injectable({ providedIn: 'root' })
export class AutoDriveBackupService {
  private readonly drive = inject(DriveService);
  private readonly vault = inject(VaultService);
  private readonly transloco = inject(TranslocoService);
  private readonly store = inject(EncryptedStore);
  private promptedThisUnlock = false;
  /** The backup in progress; a check arriving meanwhile waits for it, then decides again. */
  private running: Promise<void> | null = null;
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
    // Connected from anywhere (sync, Settings, a kept token after unlocking): back up if one is due.
    effect(() => {
      if (this.drive.connected()) untracked(() => setTimeout(() => void this.check(), 0));
    });
    const timer = setInterval(() => void this.check(), CHECK_INTERVAL_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  async check(now = Date.now()): Promise<void> {
    while (this.running) await this.running;
    // A backup started from a button (Settings or the toast) is already on its way.
    if (!this.drive.autoBackupDue(now) || this.drive.busy()) return;
    if (this.drive.hasValidToken()) {
      this.running = this.backUp().finally(() => (this.running = null));
      await this.running;
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

  private async backUp(): Promise<void> {
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
