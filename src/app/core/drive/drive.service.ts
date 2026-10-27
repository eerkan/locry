import { Injectable, InjectionToken, computed, effect, inject, signal, untracked } from '@angular/core';
import { BACKUP_FORMAT_VERSION, type SealedBackup, backupFileName, openBackup } from '../backup/backup-format';
import { BackupService } from '../backup/backup.service';
import { type DriveAutoBackup, PreferencesService } from '../preferences.service';
import { RuntimeConfigService } from '../runtime-config.service';
import { deviceId, deviceName } from '../sync/device';
import { type MergeSummary, SnapshotMerger } from '../sync/snapshot-merger';
import { EncryptedStore } from '../storage/encrypted-store.service';
import { DRIVE_TOKEN_TYPE } from '../sync/sync-records';
import { VaultService } from '../vault/vault.service';
import { type DriveFile, DriveApi, type Fetch } from './drive-api';
import { type AccessToken, DriveError, GoogleAuth } from './google-auth';

/** Overridable fetch, so tests can talk to a fake Drive. */
export const DRIVE_FETCH = new InjectionToken<Fetch>('DRIVE_FETCH', {
  providedIn: 'root',
  factory: () => (...args: Parameters<Fetch>) => fetch(...args),
});

const AUTO_BACKUP_INTERVAL_MS: Record<Exclude<DriveAutoBackup, 'off'>, number> = {
  '5m': 5 * 60_000,
  '15m': 15 * 60_000,
  '30m': 30 * 60_000,
  hourly: 3600_000,
  daily: 24 * 3600_000,
  weekly: 7 * 24 * 3600_000,
};

/** A token this close to expiry is renewed on the next click, before work needs it. */
export const RENEW_AHEAD_MS = 10 * 60_000;

/** What is kept (encrypted with the vault key, on this device only) between unlocks. */
interface StoredDriveToken {
  token: AccessToken | null;
  /** The Google account's email: lets Google skip the account picker next time. */
  account: string | null;
}

/** Sync snapshots carry this app property; they are not listed as backups. */
export function isSyncFile(file: DriveFile): boolean {
  return file.appProperties['locrySync'] === '1';
}

/** A Drive backup file plus what we know about it without downloading. */
export interface DriveBackup extends DriveFile {
  /** Made from the vault on this device. */
  fromThisVault: boolean;
  /** Platform and browser of the device that made it, e.g. "iPhone · Safari"; empty for older backups. */
  device: string;
  fromThisDevice: boolean;
}

export interface BackupResult extends MergeSummary {
  file: DriveFile;
}

/**
 * Backs up `.locry` files to the user's Google Drive app-data folder and restores them.
 * Talks to Google directly from the browser. The short-lived access token (one hour) and the
 * account's email are kept in the vault, encrypted like everything else and never synced or
 * backed up, so Drive keeps working after a lock or reload; in memory only while unlocked.
 */
@Injectable({ providedIn: 'root' })
export class DriveService {
  private readonly auth = inject(GoogleAuth);
  private readonly prefs = inject(PreferencesService);
  private readonly backups = inject(BackupService);
  private readonly vault = inject(VaultService);
  private readonly runtime = inject(RuntimeConfigService);
  private readonly merger = inject(SnapshotMerger);
  private readonly store = inject(EncryptedStore);
  private readonly deviceId = deviceId();
  private readonly api = new DriveApi(() => this.requireToken(), inject(DRIVE_FETCH));

  private readonly token = signal<AccessToken | null>(null);
  private readonly account = signal<string | null>(null);
  /** One Google popup at a time: a click that renews and a button that asks share it. */
  private pendingToken: Promise<AccessToken> | null = null;
  private readonly _files = signal<DriveFile[] | null>(null);
  private readonly _busy = signal(false);

  /** The user's own Client ID (advanced setting), if they entered one. */
  readonly customClientId = computed(() => this.prefs.driveClientId().trim() || null);
  /** The user's own Client ID wins over the one built into this installation. */
  readonly clientId = computed(() => this.customClientId() ?? this.runtime.googleClientId());
  readonly hasBuiltInClientId = computed(() => !!this.runtime.googleClientId());
  readonly configured = computed(() => !!this.clientId());
  readonly connected = computed(() => !!this.token());
  /**
   * Drive was used from this vault before and background work wants it (sync or scheduled
   * backups), so an expired token may be renewed on the user's next click.
   */
  readonly wantsRenewal = computed(
    () => this.configured() && this.vault.isUnlocked() && !!this.account() && (this.prefs.sync() || this.prefs.driveAutoBackup() !== 'off'),
  );
  readonly busy = this._busy.asReadonly();
  /** Backups in Drive, newest first; null until listed. */
  readonly files = computed<DriveBackup[] | null>(() => {
    const files = this._files();
    const vaultId = this.vault.header()?.vaultId;
    return (
      files
        ?.filter((f) => !isSyncFile(f))
        .map((f) => ({
          ...f,
          fromThisVault: !!vaultId && f.appProperties['locryVaultId'] === vaultId,
          device: f.appProperties['locryDevice'] ?? '',
          fromThisDevice: f.appProperties['locryDeviceId'] === this.deviceId,
        })) ?? null
    );
  });
  /**
   * Sync snapshots in Drive (one per vault and device), newest change first; they live in
   * the same folder but are managed by the sync engine.
   */
  readonly syncSnapshots = computed<DriveFile[] | null>(
    () =>
      this._files()
        ?.filter(isSyncFile)
        .sort((a, b) => b.modifiedTime.localeCompare(a.modifiedTime)) ?? null,
  );

  constructor() {
    // Forget the token and the listing whenever the vault locks; pick the kept token up again on unlock.
    let seenLocks = this.vault.lockCount();
    effect(() => {
      const locks = this.vault.lockCount();
      if (locks === seenLocks) return;
      seenLocks = locks;
      untracked(() => this.forget());
    });
    effect(() => {
      if (!this.vault.isUnlocked()) return;
      this.vault.activeVault();
      untracked(() => void this.restoreToken());
    });
    effect(() => {
      if (this.wantsRenewal()) untracked(() => this.auth.preload());
    });
  }

  /** Asks Google for access (popup on first use) and lists the backups. Call from a click. */
  async connect(): Promise<void> {
    await this.run(async () => {
      await this.obtainToken();
      await this.loadFiles();
    });
  }

  /** Revokes the grant and forgets the token and the account. */
  async disconnect(): Promise<void> {
    const token = this.token();
    this.forget();
    if (this.vault.isUnlocked()) await this.store.delete(DRIVE_TOKEN_TYPE).catch(() => undefined);
    if (token) await this.auth.revoke(token.value).catch(() => undefined);
  }

  /** Whether the token is missing or about to expire while background work wants it. */
  renewalDue(now = Date.now()): boolean {
    const token = this.token();
    return this.wantsRenewal() && (!token || token.expiresAt - now < RENEW_AHEAD_MS);
  }

  /**
   * Renews the token for the known account. Call from a click: with the earlier grant and the
   * account hint, Google's popup closes by itself.
   */
  async renew(): Promise<void> {
    await this.obtainToken();
  }

  async refresh(): Promise<void> {
    await this.run(() => this.withToken(true, () => this.loadFiles()));
  }

  /**
   * Uploads a fresh backup of the vault and prunes old ones of this vault beyond the
   * configured limit. With `interactive: false` it never opens a popup and fails instead.
   */
  async backupNow(options: { interactive: boolean } = { interactive: true }): Promise<BackupResult> {
    return this.run(() =>
      this.withToken(options.interactive, () =>
        this.merger.exclusive(async () => {
          const vaultId = this.vault.header()?.vaultId ?? '';
          const merged = await this.mergeOtherDevices(vaultId);
          const content = await this.backups.export();
          const uploaded = await this.api.upload(backupFileName(new Date(), true), content, {
            locryVaultId: vaultId,
            locryDeviceId: this.deviceId,
            locryDevice: deviceName(),
            locryFormat: String(BACKUP_FORMAT_VERSION),
          });
          this.prefs.setDrive({ lastDriveBackupAt: uploaded.createdTime || new Date().toISOString() });
          await this.loadFiles();
          await this.prune(vaultId);
          return { file: uploaded, ...merged };
        }),
      ),
    );
  }

  /** Whether another device backed this vault up since this device last merged its backups. */
  async otherDevicesBackedUp(): Promise<boolean> {
    const vaultId = this.vault.header()?.vaultId ?? '';
    const files = await this.withToken(false, () => this.api.list());
    const state = await this.merger.loadState();
    return files.some((f) => {
      const device = f.appProperties['locryDeviceId'];
      return (
        !isSyncFile(f) &&
        f.appProperties['locryVaultId'] === vaultId &&
        !!device &&
        device !== this.deviceId &&
        this.merger.isNew(state, device, f.createdTime)
      );
    });
  }

  /**
   * Before backing up, brings in what other devices backed up since this device last looked
   * (their newest backup each), so a backup never drops changes made on the phone.
   */
  private async mergeOtherDevices(vaultId: string): Promise<MergeSummary> {
    const files = await this.api.list();
    this._files.set(files.filter((f) => f.name.endsWith('.locry')));
    const newest = new Map<string, DriveFile>();
    for (const file of files) {
      const device = file.appProperties['locryDeviceId'];
      if (isSyncFile(file) || file.appProperties['locryVaultId'] !== vaultId || !device || device === this.deviceId) continue;
      if ((newest.get(device)?.createdTime ?? '') < file.createdTime) newest.set(device, file);
    }
    const state = await this.merger.loadState();
    const total: MergeSummary = { received: 0, conflicts: 0 };
    for (const [deviceId, file] of newest) {
      if (!this.merger.isNew(state, deviceId, file.createdTime)) continue;
      let sealed: SealedBackup;
      let records;
      try {
        sealed = this.backups.read(await this.api.download(file.id));
        if (sealed.header.vault.vaultId !== vaultId) continue;
        records = await openBackup(sealed, this.vault.requireKey());
      } catch (error) {
        if (error instanceof DriveError) throw error;
        console.warn('Skipping unreadable backup of another device', file.id, error);
        continue;
      }
      const merged = await this.merger.merge(state, { deviceId, at: file.createdTime }, sealed.header.vault, records);
      total.received += merged.received;
      total.conflicts += merged.conflicts;
    }
    await this.merger.saveState(state);
    return total;
  }

  /** Downloads and parses a backup (not decrypted yet). */
  async download(file: DriveFile): Promise<SealedBackup> {
    return this.run(() => this.withToken(true, async () => this.backups.read(await this.api.download(file.id))));
  }

  async remove(file: DriveFile): Promise<void> {
    await this.run(() =>
      this.withToken(true, async () => {
        await this.api.delete(file.id);
        this._files.update((files) => files?.filter((f) => f.id !== file.id) ?? null);
      }),
    );
  }

  /** Whether an automatic backup is due according to the user's schedule. */
  autoBackupDue(now = Date.now()): boolean {
    const schedule = this.prefs.driveAutoBackup();
    if (schedule === 'off' || !this.configured() || !this.vault.isUnlocked()) return false;
    const last = this.prefs.lastDriveBackupAt();
    return !last || now - new Date(last).getTime() >= AUTO_BACKUP_INTERVAL_MS[schedule];
  }

  /**
   * Runs Drive calls with a token (asking for one only when `interactive`), without marking
   * the service busy. For background work such as sync.
   */
  withApi<T>(interactive: boolean, task: (api: DriveApi) => Promise<T>): Promise<T> {
    return this.withToken(interactive, () => task(this.api));
  }

  /** True while a valid token is in memory, so a backup can run without a popup. */
  hasValidToken(): boolean {
    const token = this.token();
    return !!token && token.expiresAt > Date.now();
  }

  /**
   * Keeps the newest `driveKeep` backups of this vault, whichever device made them; other
   * vaults keep their own count. Another device's backup is only deleted once its changes
   * were merged here (and so are in the backup just uploaded).
   */
  private async prune(vaultId: string): Promise<void> {
    const keep = Math.max(1, this.prefs.driveKeep());
    const state = await this.merger.loadState();
    const vaultBackups = (this._files() ?? []).filter((f) => !isSyncFile(f) && f.appProperties['locryVaultId'] === vaultId);
    const stale = vaultBackups.slice(keep).filter((f) => {
      const device = f.appProperties['locryDeviceId'];
      return device === this.deviceId || (!!device && !this.merger.isNew(state, device, f.createdTime));
    });
    for (const file of stale) await this.api.delete(file.id);
    if (stale.length) {
      const removed = new Set(stale.map((f) => f.id));
      this._files.update((files) => files?.filter((f) => !removed.has(f.id)) ?? null);
    }
  }

  private async loadFiles(): Promise<void> {
    const files = await this.api.list();
    this._files.set(files.filter((f) => f.name.endsWith('.locry')));
  }

  /** Ensures a valid token (asking again when interactive), runs `task`, and drops the token on 401. */
  private async withToken<T>(interactive: boolean, task: () => Promise<T>): Promise<T> {
    if (!this.hasValidToken()) {
      if (!interactive) throw new DriveError('unauthorized');
      await this.obtainToken();
    }
    try {
      return await task();
    } catch (error) {
      if (error instanceof DriveError && error.code === 'unauthorized') this.dropToken();
      throw error;
    }
  }

  /** Asks Google for a token (sharing a request already in flight), keeps it and learns the account. */
  private async obtainToken(): Promise<AccessToken> {
    this.pendingToken ??= this.auth
      .requestToken(this.clientId() ?? '', { loginHint: this.account() })
      .finally(() => (this.pendingToken = null));
    const token = await this.pendingToken;
    this.token.set(token);
    if (!this.account()) {
      try {
        this.account.set(await this.api.accountEmail());
      } catch (error) {
        console.warn('Could not read the Google account', error);
      }
    }
    await this.saveToken();
    return token;
  }

  private dropToken(): void {
    this.token.set(null);
    void this.saveToken();
  }

  private async saveToken(): Promise<void> {
    if (!this.vault.isUnlocked()) return;
    const value: StoredDriveToken = { token: this.token(), account: this.account() };
    await this.store.put(DRIVE_TOKEN_TYPE, DRIVE_TOKEN_TYPE, value).catch((error) => console.warn('Could not keep the Drive token', error));
  }

  private async restoreToken(): Promise<void> {
    const vaultId = this.vault.header()?.vaultId;
    let stored: StoredDriveToken | undefined;
    try {
      stored = await this.store.get<StoredDriveToken>(DRIVE_TOKEN_TYPE, DRIVE_TOKEN_TYPE);
    } catch {
      return;
    }
    // Still the same vault, and nobody got a newer token meanwhile.
    if (!stored || this.vault.header()?.vaultId !== vaultId || this.token()) return;
    this.account.set(stored.account);
    if (stored.token && stored.token.expiresAt > Date.now()) this.token.set(stored.token);
  }

  private async run<T>(task: () => Promise<T>): Promise<T> {
    this._busy.set(true);
    try {
      return await task();
    } finally {
      this._busy.set(false);
    }
  }

  private requireToken(): string {
    const token = this.token();
    if (!token) throw new DriveError('unauthorized');
    return token.value;
  }

  private forget(): void {
    this.token.set(null);
    this.account.set(null);
    this._files.set(null);
  }
}
