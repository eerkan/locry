/** Test doubles for Google Drive: an in-memory Drive v3 behind fetch, and a token source. */

interface StoredFile {
  id: string;
  name: string;
  createdTime: string;
  modifiedTime: string;
  appProperties: Record<string, string>;
  content: Uint8Array;
}

/** In-memory Drive v3 (appDataFolder only) behind a fetch function. */
export class FakeDrive {
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

    if (method === 'GET' && url.pathname === '/drive/v3/about') {
      return Response.json({ user: { emailAddress: 'someone@example.com' } });
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
    if (method === 'PATCH' && url.pathname.startsWith('/upload/drive/v3/files/')) {
      const { metadata, content } = await parseMultipart(init);
      this.clock += 60_000;
      file.content = content;
      file.modifiedTime = new Date(this.clock).toISOString();
      file.appProperties = { ...file.appProperties, ...(metadata as { appProperties?: Record<string, string> }).appProperties };
      return Response.json(this.meta(file));
    }
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
      modifiedTime: new Date(this.clock).toISOString(),
      appProperties: metadata.appProperties ?? {},
      content,
    };
    this.files.push(file);
    return file;
  }

  private meta(f: StoredFile) {
    return {
      id: f.id,
      name: f.name,
      size: String(f.content.length),
      createdTime: f.createdTime,
      modifiedTime: f.modifiedTime,
      appProperties: f.appProperties,
    };
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

export class FakeGoogleAuth {
  calls = 0;
  /** Sign-in hint of the last request. */
  loginHint: string | null | undefined;
  constructor(private readonly drive: FakeDrive) {}
  async requestToken(_clientId: string, options: { loginHint?: string | null } = {}) {
    this.calls++;
    this.loginHint = options.loginHint;
    return { value: this.drive.validToken, expiresAt: Date.now() + 3_600_000 };
  }
  preload() {}
  async revoke() {}
}
