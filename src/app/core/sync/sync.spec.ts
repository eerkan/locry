import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { IDBFactory } from 'fake-indexeddb';
import { BackupService } from '../backup/backup.service';
import { randomBytes } from '../crypto/bytes';
import { openBackup, readBackup } from '../backup/backup-format';
import { AutoDriveBackupService } from '../drive/auto-drive-backup.service';
import { DRIVE_FETCH, DriveService } from '../drive/drive.service';
import { FakeDrive, FakeGoogleAuth } from '../drive/fake-drive.testing';
import { GoogleAuth } from '../drive/google-auth';
import { PreferencesService } from '../preferences.service';
import { EncryptedStore } from '../storage/encrypted-store.service';
import { LocryDb } from '../storage/locry-db';
import type { PasskeyAssertion, PasskeyRegistration } from '../vault/passkey';
import { PasskeyClient } from '../vault/passkey';
import { VaultRegistry } from '../vault/vault-registry';
import { VaultService } from '../vault/vault.service';
import { SyncService, deviceName } from './sync.service';

/** Passkeys synced by a password manager: every device sees the same credentials. */
class SyncedPasskeys {
  private readonly secrets = new Map<string, Uint8Array<ArrayBuffer>>();

  async register(): Promise<PasskeyRegistration> {
    const id = `cred-${this.secrets.size + 1}`;
    this.secrets.set(id, randomBytes(32));
    return { credentialId: id, rpId: 'localhost', prfOutput: new Uint8Array(this.secrets.get(id)!) };
  }

  async assert(options: { credentialIds: string[] }): Promise<PasskeyAssertion> {
    const id = options.credentialIds.find((c) => this.secrets.has(c))!;
    return { credentialId: id, prfOutput: new Uint8Array(this.secrets.get(id)!) };
  }
}

interface Device {
  vault: VaultService;
  store: EncryptedStore;
  sync: SyncService;
  backups: BackupService;
}

describe('SyncService', () => {
  let drive: FakeDrive;
  let passkeys: SyncedPasskeys;
  const databases = new Map<string, IDBFactory>();

  /** Starts (or switches to) a device: its own browser storage, shared Drive and passkeys. */
  async function boot(name: 'laptop' | 'phone'): Promise<Device> {
    if (TestBed.inject(LocryDb, null)) {
      TestBed.inject(LocryDb).close();
      TestBed.inject(VaultRegistry).close();
    }
    TestBed.resetTestingModule();
    if (!databases.has(name)) databases.set(name, new IDBFactory());
    globalThis.indexedDB = databases.get(name)!;
    localStorage.setItem('locry.device-id', `${name}-device`);
    TestBed.configureTestingModule({
      providers: [
        { provide: DRIVE_FETCH, useValue: drive.fetch },
        { provide: GoogleAuth, useValue: new FakeGoogleAuth(drive) },
        { provide: PasskeyClient, useValue: passkeys },
        { provide: TranslocoService, useValue: { translate: (key: string) => (key === 'sync.conflictSuffix' ? 'conflict' : key) } },
      ],
    });
    TestBed.inject(PreferencesService).setDrive({ driveClientId: 'id.apps.googleusercontent.com' });
    const vault = TestBed.inject(VaultService);
    await vault.init();
    if (vault.status() === 'locked') await vault.unlockWithPasskey();
    return {
      vault,
      store: TestBed.inject(EncryptedStore),
      sync: TestBed.inject(SyncService),
      backups: TestBed.inject(BackupService),
    };
  }

  const titles = async (device: Device) =>
    (await device.store.list<{ title: string }>('note')).map((n) => n.title).sort();

  beforeEach(() => {
    localStorage.clear();
    databases.clear();
    drive = new FakeDrive();
    passkeys = new SyncedPasskeys();
  });

  afterEach(() => {
    TestBed.inject(LocryDb).close();
    TestBed.inject(VaultRegistry).close();
  });

  /** A vault on the laptop with sync on, and the same vault on the phone from a backup. */
  async function twoDevices(): Promise<void> {
    const laptop = await boot('laptop');
    await laptop.vault.completeSetup(await laptop.vault.prepareVault('Mac', { name: 'Kişisel' }));
    await laptop.store.put('note', 'n1', { id: 'n1', title: 'Alışveriş', updatedAt: '2026-01-01T00:00:00Z' });
    await laptop.store.put('task', 't1', { id: 't1', title: 'Fatura', updatedAt: '2026-01-01T00:00:00Z' });
    const backup = await laptop.backups.export();
    expect(await laptop.sync.enable()).toMatchObject({ uploaded: true });

    const phone = await boot('phone');
    await phone.backups.restoreAsVault(await phone.backups.open(phone.backups.read(backup), { method: 'passkey' }));
    expect(await phone.sync.enable()).toMatchObject({ received: 0, conflicts: 0, uploaded: true });
  }

  it('uploads one encrypted snapshot per device and lists the devices', async () => {
    await twoDevices();
    const snapshots = drive.files.filter((f) => f.appProperties['locrySync'] === '1');
    expect(snapshots.map((f) => f.appProperties['locryDeviceId']).sort()).toEqual(['laptop-device', 'phone-device']);
    expect(new TextDecoder().decode(snapshots[0].content)).not.toContain('Alışveriş');

    const laptop = await boot('laptop');
    await laptop.sync.syncNow({ interactive: true });
    expect(laptop.sync.devices().map((d) => [d.deviceId, d.self])).toEqual(
      expect.arrayContaining([
        ['laptop-device', true],
        ['phone-device', false],
      ]),
    );
    // Unchanged content is not uploaded again.
    expect(await laptop.sync.syncNow({ interactive: true })).toMatchObject({ uploaded: false });
  });

  it('carries edits, new records and deletions to the other device', async () => {
    await twoDevices();
    const phone = await boot('phone');
    await phone.store.put('note', 'n1', { id: 'n1', title: 'Alışveriş listesi', updatedAt: '2026-01-02T00:00:00Z' });
    await phone.store.put('note', 'n2', { id: 'n2', title: 'Telefondan', updatedAt: '2026-01-02T00:00:00Z' });
    await phone.store.remove('task', 't1');
    await phone.sync.syncNow({ interactive: true });

    const laptop = await boot('laptop');
    expect(await laptop.sync.syncNow({ interactive: true })).toMatchObject({ received: 3, conflicts: 0 });
    expect(await titles(laptop)).toEqual(['Alışveriş listesi', 'Telefondan']);
    expect(await laptop.store.list('task')).toEqual([]);
  });

  it('keeps both versions of a note edited on both devices', async () => {
    await twoDevices();
    const laptop = await boot('laptop');
    await laptop.store.put('note', 'n1', { id: 'n1', title: 'Laptop sürümü', updatedAt: '2026-01-02T00:00:00Z' });
    await laptop.sync.syncNow({ interactive: true });

    const phone = await boot('phone');
    await phone.store.put('note', 'n1', { id: 'n1', title: 'Telefon sürümü', updatedAt: '2026-01-03T00:00:00Z' });
    expect(await phone.sync.syncNow({ interactive: true })).toMatchObject({ conflicts: 1 });
    expect(await titles(phone)).toEqual(['Laptop sürümü (conflict)', 'Telefon sürümü']);

    const back = await boot('laptop');
    await back.sync.syncNow({ interactive: true });
    expect(await titles(back)).toEqual(['Laptop sürümü (conflict)', 'Telefon sürümü']);
  });

  it('shares passkeys added and vault renames made on another device', async () => {
    await twoDevices();
    const phone = await boot('phone');
    await phone.vault.addPasskey('iPhone', { method: 'passkey' });
    await phone.vault.updateProfile(phone.vault.activeVault()!.id, { name: 'Ev', color: 'amber' });
    await phone.sync.syncNow({ interactive: true });

    const laptop = await boot('laptop');
    await laptop.sync.syncNow({ interactive: true });
    expect(laptop.vault.passkeySlots().map((s) => s.label)).toEqual(['Mac', 'iPhone']);
    expect(laptop.vault.activeVault()).toMatchObject({ name: 'Ev', color: 'amber' });
  });

  it('waits for a click when there is no Google token', async () => {
    await twoDevices();
    const laptop = await boot('laptop');
    expect(TestBed.inject(PreferencesService).sync()).toBe(true);
    // A fresh start has no Google token: background sync asks for a click instead of a popup.
    expect(await laptop.sync.syncNow()).toBeNull();
    expect(laptop.sync.status()).toBe('needsAuth');
  });

  it('keeps sync snapshots out of the backup list and its pruning', async () => {
    await twoDevices();
    await boot('laptop');
    const driveService = TestBed.inject(DriveService);
    TestBed.inject(PreferencesService).setDrive({ driveKeep: 1 });
    await driveService.backupNow();
    await driveService.backupNow();
    expect(driveService.files()?.length).toBe(1);
    expect(driveService.syncSnapshots()?.length).toBe(2);
    expect(drive.files.filter((f) => f.appProperties['locrySync'] === '1')).toHaveLength(2);
  });

  describe('Drive backups from several devices (sync off)', () => {
    /** The same vault on the laptop and, restored from a file backup, on the phone. */
    async function sameVaultOnBoth(): Promise<void> {
      const laptop = await boot('laptop');
      await laptop.vault.completeSetup(await laptop.vault.prepareVault('Mac', { name: 'Kişisel' }));
      await laptop.store.put('note', 'n1', { id: 'n1', title: 'Alışveriş', updatedAt: '2026-01-01T00:00:00Z' });
      await laptop.store.put('task', 't1', { id: 't1', title: 'Fatura', updatedAt: '2026-01-01T00:00:00Z' });
      const file = await laptop.backups.export();
      const phone = await boot('phone');
      await phone.backups.restoreAsVault(await phone.backups.open(phone.backups.read(file), { method: 'passkey' }));
    }

    const driveOf = () => TestBed.inject(DriveService);
    const latestBackupOf = async (deviceId: string, device: Device) => {
      const file = drive.files
        .filter((f) => f.appProperties['locryDeviceId'] === deviceId && f.appProperties['locrySync'] !== '1')
        .sort((a, b) => b.createdTime.localeCompare(a.createdTime))[0];
      const records = await openBackup(readBackup(file.content as Uint8Array<ArrayBuffer>), device.vault.requireKey());
      return records.filter((r) => r.type === 'note').map((r) => (r.value as { title: string }).title).sort();
    };

    it('merges what the phone backed up before the laptop backs up, and keeps the phone backup', async () => {
      await sameVaultOnBoth();
      const phone = await boot('phone');
      await phone.store.put('note', 'n2', { id: 'n2', title: 'Telefondan', updatedAt: '2026-01-02T00:00:00Z' });
      await phone.store.remove('task', 't1');
      await driveOf().connect();
      await driveOf().backupNow();

      const laptop = await boot('laptop');
      await laptop.store.put('note', 'n3', { id: 'n3', title: 'Laptoptan', updatedAt: '2026-01-02T00:00:00Z' });
      TestBed.inject(PreferencesService).setDrive({ driveKeep: 1 });
      await driveOf().connect();
      const first = await driveOf().backupNow();
      expect(first.received).toBe(2); // the new note and the deletion
      expect(await titles(laptop)).toEqual(['Alışveriş', 'Laptoptan', 'Telefondan']);
      expect(await laptop.store.list('task')).toEqual([]);
      // The laptop's backup holds both devices' changes...
      expect(await latestBackupOf('laptop-device', laptop)).toEqual(['Alışveriş', 'Laptoptan', 'Telefondan']);

      // ...and pruning its own backups never deletes the phone's.
      await driveOf().backupNow();
      const devices = drive.files.map((f) => f.appProperties['locryDeviceId']).sort();
      expect(devices).toEqual(['laptop-device', 'phone-device']);
      // Nothing new from the phone the second time.
      expect((await driveOf().backupNow()).received).toBe(0);
    });

    it('does not let an older phone backup undo a newer laptop edit', async () => {
      await sameVaultOnBoth();
      const laptop = await boot('laptop');
      await laptop.store.put('note', 'n1', { id: 'n1', title: 'Laptop sürümü', updatedAt: '2026-01-02T00:00:00Z' });
      await driveOf().connect();
      await driveOf().backupNow();

      // The phone never saw that edit; it changes something else and backs up.
      const phone = await boot('phone');
      await phone.store.put('note', 'n2', { id: 'n2', title: 'Telefondan', updatedAt: '2026-01-03T00:00:00Z' });
      await driveOf().connect();
      await driveOf().backupNow();
      // The phone took the laptop's edit while merging before its backup.
      expect(await titles(phone)).toEqual(['Laptop sürümü', 'Telefondan']);

      const back = await boot('laptop');
      await driveOf().connect();
      await driveOf().backupNow();
      expect(await titles(back)).toEqual(['Laptop sürümü', 'Telefondan']);
    });

    it('backs up on schedule to merge a phone backup even when nothing changed here', async () => {
      await sameVaultOnBoth();
      const laptop = await boot('laptop');
      TestBed.inject(PreferencesService).setDrive({ driveAutoBackup: '5m' });
      await driveOf().connect();
      const auto = TestBed.inject(AutoDriveBackupService);
      await auto.check();
      await auto.check(Date.now() + 6 * 60_000);
      const laptopBackups = () => drive.files.filter((f) => f.appProperties['locryDeviceId'] === 'laptop-device').length;
      expect(laptopBackups()).toBe(1); // unchanged: skipped

      const phone = await boot('phone');
      await phone.store.put('note', 'n2', { id: 'n2', title: 'Telefondan', updatedAt: '2026-01-02T00:00:00Z' });
      await driveOf().connect();
      await driveOf().backupNow();

      const again = await boot('laptop');
      TestBed.inject(PreferencesService).setDrive({ driveAutoBackup: '5m' });
      await driveOf().connect();
      const autoAgain = TestBed.inject(AutoDriveBackupService);
      await autoAgain.check(Date.now() + 6 * 60_000);
      expect(await titles(again)).toEqual(['Alışveriş', 'Telefondan']);
      expect(laptopBackups()).toBe(2);
    });
  });

  it('names devices by platform and browser', () => {
    expect(deviceName('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit Version/18.0 Safari/604.1')).toBe(
      'iPhone · Safari',
    );
    expect(deviceName('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit Chrome/140.0 Safari/537.36')).toBe(
      'Mac · Chrome',
    );
  });
});
