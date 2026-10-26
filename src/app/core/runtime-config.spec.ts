import { TestBed } from '@angular/core/testing';
import { IDBFactory } from 'fake-indexeddb';
import { DriveService } from './drive/drive.service';
import { GoogleAuth } from './drive/google-auth';
import { PreferencesService } from './preferences.service';
import { RuntimeConfigService } from './runtime-config.service';

const BUILT_IN = '111-builtin.apps.googleusercontent.com';
const CUSTOM = '222-custom.apps.googleusercontent.com';

function serve(response: (() => Promise<Response>) | Response): void {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
    typeof response === 'function' ? response() : response.clone(),
  );
}

describe('RuntimeConfigService', () => {
  let config: RuntimeConfigService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    config = TestBed.inject(RuntimeConfigService);
  });

  afterEach(() => vi.restoreAllMocks());

  it('reads the built-in Client ID and remembers it for offline use', async () => {
    serve(Response.json({ googleClientId: BUILT_IN }));
    await config.load();
    expect(config.googleClientId()).toBe(BUILT_IN);

    serve(() => Promise.reject(new TypeError('Failed to fetch')));
    const offline = TestBed.runInInjectionContext(() => new RuntimeConfigService());
    await offline.load();
    expect(offline.googleClientId()).toBe(BUILT_IN);
  });

  it('reads donation accounts and keeps them for offline use', async () => {
    serve(Response.json({ donate: { github: 'emre', crypto: [{ label: 'BTC', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' }] } }));
    await config.load();
    expect(config.donations()!.links.map((l) => l.url)).toEqual(['https://github.com/sponsors/emre']);
    expect(config.donations()!.crypto).toHaveLength(1);

    serve(() => Promise.reject(new TypeError('Failed to fetch')));
    const offline = TestBed.runInInjectionContext(() => new RuntimeConfigService());
    await offline.load();
    expect(offline.donations()!.links).toHaveLength(1);
  });

  it('forgets the cached value when the server has no config', async () => {
    serve(Response.json({ googleClientId: BUILT_IN }));
    await config.load();
    serve(new Response('Not found', { status: 404 }));
    await config.load();
    expect(config.googleClientId()).toBeNull();
  });

  it('ignores values that are not Client IDs', async () => {
    serve(Response.json({ googleClientId: 'not-a-client-id' }));
    await config.load();
    expect(config.googleClientId()).toBeNull();
  });
});

describe('DriveService Client ID choice', () => {
  let requested: string[];

  async function setup(builtIn: string | null, custom: string): Promise<DriveService> {
    globalThis.indexedDB = new IDBFactory();
    localStorage.clear();
    requested = [];
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: GoogleAuth,
          useValue: {
            requestToken: async (clientId: string) => {
              requested.push(clientId);
              throw new Error('stop after recording the Client ID');
            },
          },
        },
      ],
    });
    serve(builtIn ? Response.json({ googleClientId: builtIn }) : new Response('', { status: 404 }));
    await TestBed.inject(RuntimeConfigService).load();
    TestBed.inject(PreferencesService).setDrive({ driveClientId: custom });
    return TestBed.inject(DriveService);
  }

  afterEach(() => vi.restoreAllMocks());

  it('uses the built-in Client ID by default', async () => {
    const drive = await setup(BUILT_IN, '');
    expect([drive.configured(), drive.hasBuiltInClientId(), drive.customClientId()]).toEqual([true, true, null]);
    await drive.connect().catch(() => undefined);
    expect(requested).toEqual([BUILT_IN]);
  });

  it("prefers the user's own Client ID", async () => {
    const drive = await setup(BUILT_IN, CUSTOM);
    await drive.connect().catch(() => undefined);
    expect(requested).toEqual([CUSTOM]);
  });

  it('is not configured without any Client ID', async () => {
    const drive = await setup(null, '');
    expect(drive.configured()).toBe(false);
  });
});
