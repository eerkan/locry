import { Injectable, InjectionToken, computed, effect, inject, signal, untracked } from '@angular/core';
import { BACKUP_FORMAT_VERSION, type SealedBackup, backupFileName } from '../backup/backup-format';
import { BackupService } from '../backup/backup.service';
import { type DriveAutoBackup, PreferencesService } from '../preferences.service';
import { RuntimeConfigService } from '../runtime-config.service';
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

/** Sync snapshots carry this app property; they are not listed as backups. */
export function isSyncFile(file: DriveFile): boolean {
  return file.appProperties['locrySync'] === '1';
}

/** A Drive backup file plus what we know about it without downloading. */
export interface DriveBackup extends DriveFile {
  /** Made from the vault on this device. */
  fromThisVault: boolean;
}

/**
 * Backs up `.locry` files to the user's Google Drive app-data folder and restores them.
 * Talks to Google directly from the browser; the access token is kept in memory only and
 * dropped when the vault locks.
 */
@Injectable({ providedIn: 'root' })
export class DriveService {
  private readonly auth = inject(GoogleAuth);
  private readonly prefs = inject(PreferencesService);
  private readonly backups = inject(BackupService);
  private readonly vault = inject(VaultService);
  private readonly runtime = inject(RuntimeConfigService);
  private readonly api = new DriveApi(() => this.requireToken(), inject(DRIVE_FETCH));

  private readonly token = signal<AccessToken | null>(null);
  private readonly _files = signal<DriveFile[] | null>(null);
  private readonly _busy = signal(false);

  /** The user's own Client ID (advanced setting), if they entered one. */
  readonly customClientId = computed(() => this.prefs.driveClientId().trim() || null);
  /** The user's own Client ID wins over the one built into this installation. */
  readonly clientId = computed(() => this.customClientId() ?? this.runtime.googleClientId());
  readonly hasBuiltInClientId = computed(() => !!this.runtime.googleClientId());
  readonly configured = computed(() => !!this.clientId());
  readonly connected = computed(() => !!this.token());
  readonly busy = this._busy.asReadonly();
  /** Backups in Drive, newest first; null until listed. */
  readonly files = computed<DriveBackup[] | null>(() => {
    const files = this._files();
    const vaultId = this.vault.header()?.vaultId;
    return (
      files
        ?.filter((f) => !isSyncFile(f))
        .map((f) => ({ ...f, fromThisVault: !!vaultId && f.appProperties['locryVaultId'] === vaultId })) ?? null
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
    // Forget the token and the listing whenever the vault locks.
    let seenLocks = this.vault.lockCount();
    effect(() => {
      const locks = this.vault.lockCount();
      if (locks === seenLocks) return;
      seenLocks = locks;
      untracked(() => this.forget());
    });
  }

  /** Asks Google for access (popup on first use) and lists the backups. Call from a click. */
  async connect(): Promise<void> {
    await this.run(async () => {
      this.token.set(await this.auth.requestToken(this.clientId() ?? ''));
      await this.loadFiles();
    });
  }

  /** Revokes the grant and forgets the token. */
  async disconnect(): Promise<void> {
    const token = this.token();
    this.forget();
    if (token) await this.auth.revoke(token.value).catch(() => undefined);
  }

  async refresh(): Promise<void> {
    await this.run(() => this.withToken(true, () => this.loadFiles()));
  }

  /**
   * Uploads a fresh backup of the vault and prunes old ones of this vault beyond the
   * configured limit. With `interactive: false` it never opens a popup and fails instead.
   */
  async backupNow(options: { interactive: boolean } = { interactive: true }): Promise<DriveFile> {
    return this.run(() =>
      this.withToken(options.interactive, async () => {
        const vaultId = this.vault.header()?.vaultId ?? '';
        const content = await this.backups.export();
        const uploaded = await this.api.upload(backupFileName(new Date(), true), content, {
          locryVaultId: vaultId,
          locryFormat: String(BACKUP_FORMAT_VERSION),
        });
        this.prefs.setDrive({ lastDriveBackupAt: uploaded.createdTime || new Date().toISOString() });
        await this.loadFiles();
        await this.prune(vaultId);
        return uploaded;
      }),
    );
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

  private async prune(vaultId: string): Promise<void> {
    const keep = Math.max(1, this.prefs.driveKeep());
    const ours = (this._files() ?? []).filter((f) => !isSyncFile(f) && f.appProperties['locryVaultId'] === vaultId);
    const stale = ours.slice(keep);
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
      this.token.set(await this.auth.requestToken(this.clientId() ?? ''));
    }
    try {
      return await task();
    } catch (error) {
      if (error instanceof DriveError && error.code === 'unauthorized') this.token.set(null);
      throw error;
    }
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
    this._files.set(null);
  }
}
