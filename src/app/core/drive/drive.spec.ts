import { TestBed } from '@angular/core/testing';
import { IDBFactory } from 'fake-indexeddb';
import { BackupService } from '../backup/backup.service';
import { randomBytes } from '../crypto/bytes';
import { PreferencesService } from '../preferences.service';
import { EncryptedStore } from '../storage/encrypted-store.service';
import { LocryDb } from '../storage/locry-db';
import { PasskeyClient } from '../vault/passkey';
import { VaultService } from '../vault/vault.service';
import { DriveApi } from './drive-api';
import { DRIVE_FETCH, DriveService } from './drive.service';
import { GoogleAuth } from './google-auth';

interface StoredFile {
  id: string;
  name: string;
  createdTime: string;
  appProperties: Record<string, string>;
  content: Uint8Array;
}

/** In-memory Drive v3 (appDataFolder only) behind a fetch function. */
class FakeDrive {
  files: StoredFile[] = [];
  validToken = 'token-1';
  requests: string[] = [];
  private clock = Date.parse('2026-10-22T10:00:00Z');
  private sessions = new Map<string, object>();

  fetch = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
    const url = new URL(String(input));
    const method = init.method ?? 'GET';
    this.requests.push(`${method} ${url.pathname}`);
    if ((init.headers as Record<string, string>)['Authorization'] !== `Bearer ${this.validToken}`) {
      return new Response('{"error":"invalid"}', { status: 401 });
    }

    if (method === 'GET' && url.pathname === '/drive/v3/files') {
      const sorted = [...this.files].sort((a, b) => b.createdTime.localeCompare(a.createdTime));
      return Response.json({ files: sorted.map((f) => this.meta(f)) });
    }
    if (method === 'POST' && url.pathname === '/upload/drive/v3/files') {
      if (url.searchParams.get('uploadType') === 'resumable') {
        const id = `session-${this.sessions.size}`;
        this.sessions.set(id, JSON.parse(String(init.body)));
        return new Response(null, { status: 200, headers: { Location: `https://www.googleapis.com/upload/session/${id}` } });
      }
      const { metadata, content } = await parseMultipart(init);
      return Response.json(this.meta(this.store(metadata, content)));
    }
    if (method === 'PUT' && url.pathname.startsWith('/upload/session/')) {
      const metadata = this.sessions.get(url.pathname.split('/').pop()!)!;
      const content = new Uint8Array(init.body as Uint8Array);
      return Response.json(this.meta(this.store(metadata as { name: string; appProperties: Record<string, string> }, content)));
    }
    const id = decodeURIComponent(url.pathname.split('/').pop()!);
    const file = this.files.find((f) => f.id === id);
    if (!file) return new Response('{}', { status: 404 });
    if (method === 'DELETE') {
      this.files = this.files.filter((f) => f.id !== id);
      return new Response(null, { status: 204 });
    }
    return new Response(new Uint8Array(file.content));
  };

  private store(metadata: { name: string; appProperties?: Record<string, string> }, content: Uint8Array): StoredFile {
    this.clock += 60_000;
    const file = {
      id: `file-${this.files.length + 1}-${this.clock}`,
      name: metadata.name,
      createdTime: new Date(this.clock).toISOString(),
      appProperties: metadata.appProperties ?? {},
      content,
    };
    this.files.push(file);
    return file;
  }

  private meta(f: StoredFile) {
    return { id: f.id, name: f.name, size: String(f.content.length), createdTime: f.createdTime, appProperties: f.appProperties };
  }
}

async function parseMultipart(init: RequestInit): Promise<{ metadata: { name: string }; content: Uint8Array }> {
  const boundary = String((init.headers as Record<string, string>)['Content-Type']).split('boundary=')[1];
  // Read the Blob directly: jsdom's Blob is not understood by Node's Response.
  const bytes = new Uint8Array(await (init.body as Blob).arrayBuffer());
  const text = new TextDecoder('latin1').decode(bytes);
  const parts = text.split(`--${boundary}`);
  const metadata = JSON.parse(parts[1].split('\r\n\r\n')[1].trim());
  const start = text.indexOf('\r\n\r\n', text.indexOf(parts[2])) + 4;
  const end = text.lastIndexOf(`\r\n--${boundary}--`);
  return { metadata, content: bytes.slice(start, end) };
}

class FakeGoogleAuth {
  calls = 0;
  constructor(private readonly drive: FakeDrive) {}
  async requestToken() {
    this.calls++;
    return { value: this.drive.validToken, expiresAt: Date.now() + 3_600_000 };
  }
  async revoke() {}
}

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
  });
});
