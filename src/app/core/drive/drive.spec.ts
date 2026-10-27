import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { IDBFactory } from 'fake-indexeddb';
import { BackupService } from '../backup/backup.service';
import { randomBytes } from '../crypto/bytes';
import { PreferencesService } from '../preferences.service';
import { EncryptedStore } from '../storage/encrypted-store.service';
import { LocryDb } from '../storage/locry-db';
import { PasskeyClient } from '../vault/passkey';
import { VaultService } from '../vault/vault.service';
import { DriveApi } from './drive-api';
import { AutoDriveBackupService } from './auto-drive-backup.service';
import { readBackup, openBackup } from '../backup/backup-format';
import { DRIVE_FETCH, DriveService } from './drive.service';
import { GoogleAuth } from './google-auth';
import { FakeDrive, FakeGoogleAuth } from './fake-drive.testing';

describe('DriveApi', () => {
  it('uses a resumable session for files over 5 MB', async () => {
    const drive = new FakeDrive();
    const api = new DriveApi(() => drive.validToken, drive.fetch);
    const big = new Uint8Array(6 * 1024 * 1024);
    big.set(randomBytes(1024));
    const file = await api.upload('big.locry', big, { locryVaultId: 'v' });
    expect(drive.requests).toEqual(['POST /upload/drive/v3/files', `PUT /upload/session/session-0`]);
    expect(file.size).toBe(big.length);
    expect(Array.from((await api.download(file.id)).slice(0, 1024))).toEqual(Array.from(big.slice(0, 1024)));
  });

  it('maps HTTP errors to drive error codes', async () => {
    const drive = new FakeDrive();
    await expect(new DriveApi(() => 'stale', drive.fetch).list()).rejects.toMatchObject({ code: 'unauthorized' });
    await expect(new DriveApi(() => drive.validToken, drive.fetch).download('nope')).rejects.toMatchObject({ code: 'notFound' });
    const offline = new DriveApi(() => 'x', () => Promise.reject(new TypeError('Failed to fetch')));
    await expect(offline.list()).rejects.toMatchObject({ code: 'network' });
  });
});

describe('DriveService', () => {
  let fakeDrive: FakeDrive;
  let fakeAuth: FakeGoogleAuth;
  let vault: VaultService;
  let drive: DriveService;
  let store: EncryptedStore;
  let prefs: PreferencesService;

  beforeEach(async () => {
    globalThis.indexedDB = new IDBFactory();
    localStorage.clear();
    fakeDrive = new FakeDrive();
    fakeAuth = new FakeGoogleAuth(fakeDrive);
    const prf = randomBytes(32);
    TestBed.configureTestingModule({
      providers: [
        { provide: DRIVE_FETCH, useValue: fakeDrive.fetch },
        { provide: GoogleAuth, useValue: fakeAuth },
        { provide: TranslocoService, useValue: { translate: (key: string) => key } },
        {
          provide: PasskeyClient,
          useValue: {
            register: async () => ({ credentialId: 'c', prfOutput: new Uint8Array(prf) }),
            assert: async () => ({ credentialId: 'c', prfOutput: new Uint8Array(prf) }),
          },
        },
      ],
    });
    vault = TestBed.inject(VaultService);
    drive = TestBed.inject(DriveService);
    store = TestBed.inject(EncryptedStore);
    prefs = TestBed.inject(PreferencesService);
    prefs.setDrive({ driveClientId: 'id.apps.googleusercontent.com' });
    await vault.init();
    await vault.completeSetup(await vault.prepareVault('Mac'));
  });

  afterEach(() => TestBed.inject(LocryDb).close());

  it('uploads encrypted backups tagged with the vault id and prunes old ones of this vault only', async () => {
    prefs.setDrive({ driveKeep: 2 });
    fakeDrive.files.push({
      id: 'foreign',
      name: 'locry-backup-old.locry',
      createdTime: '2020-01-01T00:00:00.000Z',
      modifiedTime: '2020-01-01T00:00:00.000Z',
      appProperties: { locryVaultId: 'another-vault' },
      content: new Uint8Array([1]),
    });
    await store.put('note', 'n1', { title: 'Gizli not' });

    await drive.connect();
    for (let i = 0; i < 3; i++) await drive.backupNow();

    const ours = fakeDrive.files.filter((f) => f.appProperties['locryVaultId'] === vault.header()!.vaultId);
    expect(ours).toHaveLength(2);
    expect(fakeDrive.files.some((f) => f.id === 'foreign')).toBe(true);
    expect(new TextDecoder().decode(ours[0].content)).not.toContain('Gizli');
    expect(ours[0].name).toMatch(/^locry-backup-\d{4}-\d{2}-\d{2}-\d{6}\.locry$/);
    expect(drive.files()!.map((f) => f.fromThisVault)).toEqual([true, true, false]);
    expect(prefs.lastDriveBackupAt()).toBe(ours.at(-1)!.createdTime);
  });

  it('restores a backup downloaded from Drive', async () => {
    await store.put('note', 'n1', { title: 'v1', updatedAt: '2026-01-01' });
    await drive.backupNow();
    await store.delete('n1');

    const backups = TestBed.inject(BackupService);
    const sealed = await drive.download(drive.files()![0]);
    await backups.restore(await backups.open(sealed, { method: 'current' }), 'merge');
    expect(await store.get('note', 'n1')).toEqual({ title: 'v1', updatedAt: '2026-01-01' });
  });

  it('asks for a token only when needed and never without a click', async () => {
    await expect(drive.backupNow({ interactive: false })).rejects.toMatchObject({ code: 'unauthorized' });
    expect(fakeAuth.calls).toBe(0);

    await drive.backupNow();
    await drive.backupNow({ interactive: false });
    expect(fakeAuth.calls).toBe(1);
  });

  it('drops the token on 401 and when the vault locks', async () => {
    await drive.connect();
    expect(drive.connected()).toBe(true);

    // Revoked or expired on Google's side while it still looks valid locally.
    fakeDrive.validToken = 'token-2';
    await expect(drive.refresh()).rejects.toMatchObject({ code: 'unauthorized' });
    expect(drive.connected()).toBe(false);
    // The next interactive call asks for a fresh token and works again.
    await drive.refresh();
    expect(drive.connected()).toBe(true);
    expect(fakeAuth.calls).toBe(2);

    await drive.connect();
    vault.lock();
    TestBed.tick();
    expect(drive.connected()).toBe(false);
    expect(drive.files()).toBeNull();
  });

  it('knows when an automatic backup is due', () => {
    expect(drive.autoBackupDue()).toBe(false); // off by default
    prefs.setDrive({ driveAutoBackup: 'daily' });
    expect(drive.autoBackupDue()).toBe(true); // never backed up
    prefs.setDrive({ lastDriveBackupAt: new Date().toISOString() });
    expect(drive.autoBackupDue()).toBe(false);
    expect(drive.autoBackupDue(Date.now() + 25 * 3600_000)).toBe(true);
    prefs.setDrive({ driveAutoBackup: 'weekly' });
    expect(drive.autoBackupDue(Date.now() + 25 * 3600_000)).toBe(false);
    prefs.setDrive({ driveAutoBackup: '5m' });
    expect(drive.autoBackupDue(Date.now() + 4 * 60_000)).toBe(false);
    expect(drive.autoBackupDue(Date.now() + 6 * 60_000)).toBe(true);
    prefs.setDrive({ driveAutoBackup: 'hourly' });
    expect(drive.autoBackupDue(Date.now() + 30 * 60_000)).toBe(false);
    expect(drive.autoBackupDue(Date.now() + 61 * 60_000)).toBe(true);
  });

  it('skips automatic backups when nothing changed since the last one', async () => {
    const auto = TestBed.inject(AutoDriveBackupService);
    const backups = () => fakeDrive.files.filter((f) => f.appProperties['locryVaultId']).length;
    await drive.connect();
    prefs.setDrive({ driveAutoBackup: '5m' });
    await store.put('note', 'n1', { title: 'ilk' });

    await auto.check();
    expect(backups()).toBe(1);
    // Due again, but the vault did not change.
    await auto.check(Date.now() + 6 * 60_000);
    expect(backups()).toBe(1);

    await store.put('note', 'n1', { title: 'değişti' });
    await auto.check(Date.now() + 6 * 60_000);
    expect(backups()).toBe(2);
  });

  it('keeps the token encrypted in the vault across a lock, never in backups, and remembers the account', async () => {
    await drive.connect();
    expect(fakeAuth.loginHint).toBeNull();
    vault.lock();
    TestBed.tick();
    expect(drive.connected()).toBe(false);

    await vault.unlockWithPasskey();
    TestBed.tick();
    await vi.waitFor(() => expect(drive.connected()).toBe(true));
    expect(fakeAuth.calls).toBe(1);

    // A backup holds no token.
    await drive.backupNow();
    const sealed = readBackup(fakeDrive.files.at(-1)!.content as Uint8Array<ArrayBuffer>);
    const records = await openBackup(sealed, vault.requireKey());
    expect(records.map((r) => r.type)).not.toContain('drive-token');

    // Asking again names the account, so Google skips the account picker.
    fakeDrive.validToken = 'token-2';
    await expect(drive.refresh()).rejects.toMatchObject({ code: 'unauthorized' });
    await drive.refresh();
    expect(fakeAuth.loginHint).toBe('someone@example.com');
  });

  it('keeps the newest backups of this vault from any device, but never one it has not merged', async () => {
    prefs.setDrive({ driveKeep: 1 });
    const vaultId = vault.header()!.vaultId;
    // Another device's backup that cannot be read here, so it was never merged.
    fakeDrive.files.push({
      id: 'phone-unmerged',
      name: 'locry-backup-phone.locry',
      createdTime: '2020-01-01T00:00:00.000Z',
      modifiedTime: '2020-01-01T00:00:00.000Z',
      appProperties: { locryVaultId: vaultId, locryDeviceId: 'phone' },
      content: new Uint8Array([1, 2, 3]),
    });
    await drive.backupNow();
    await drive.backupNow();
    const left = fakeDrive.files.filter((f) => f.appProperties['locryVaultId'] === vaultId).map((f) => f.id);
    expect(left).toHaveLength(2);
    expect(left).toContain('phone-unmerged');
  });
});
