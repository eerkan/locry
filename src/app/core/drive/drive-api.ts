import { DriveError } from './google-auth';

const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
/** Multipart uploads are limited to 5 MB; larger files use a resumable session. */
const MULTIPART_LIMIT = 5 * 1024 * 1024;
const FILE_FIELDS = 'id,name,size,createdTime,modifiedTime,appProperties';

export interface DriveFile {
  id: string;
  name: string;
  size: number;
  createdTime: string;
  modifiedTime: string;
  appProperties: Record<string, string>;
}

interface RawDriveFile {
  id: string;
  name: string;
  size?: string;
  createdTime: string;
  modifiedTime?: string;
  appProperties?: Record<string, string>;
}

export type Fetch = typeof fetch;

/** Minimal Drive v3 client for the hidden appDataFolder. */
export class DriveApi {
  constructor(
    private readonly token: () => string,
    private readonly fetchFn: Fetch = (...args) => fetch(...args),
  ) {}

  /** Lists app files, newest first. */
  async list(): Promise<DriveFile[]> {
    const files: DriveFile[] = [];
    let pageToken: string | undefined;
    do {
      const params = new URLSearchParams({
        spaces: 'appDataFolder',
        fields: `nextPageToken,files(${FILE_FIELDS})`,
        orderBy: 'createdTime desc',
        pageSize: '100',
      });
      if (pageToken) params.set('pageToken', pageToken);
      const body = (await this.json(`${API}/files?${params}`)) as { files?: RawDriveFile[]; nextPageToken?: string };
      files.push(...(body.files ?? []).map(toDriveFile));
      pageToken = body.nextPageToken;
    } while (pageToken);
    return files;
  }

  async upload(name: string, content: Uint8Array<ArrayBuffer>, appProperties: Record<string, string>): Promise<DriveFile> {
    const metadata = { name, parents: ['appDataFolder'], mimeType: 'application/octet-stream', appProperties };
    return this.send('POST', `${UPLOAD_API}/files`, metadata, content);
  }

  /** Replaces the content (and app properties) of an existing file. */
  async update(id: string, content: Uint8Array<ArrayBuffer>, appProperties: Record<string, string>): Promise<DriveFile> {
    return this.send('PATCH', `${UPLOAD_API}/files/${encodeURIComponent(id)}`, { appProperties }, content);
  }

  private async send(
    method: 'POST' | 'PATCH',
    url: string,
    metadata: object,
    content: Uint8Array<ArrayBuffer>,
  ): Promise<DriveFile> {
    return toDriveFile(
      (content.length <= MULTIPART_LIMIT
        ? await this.multipart(method, url, metadata, content)
        : await this.resumable(method, url, metadata, content)) as RawDriveFile,
    );
  }

  async download(id: string): Promise<Uint8Array<ArrayBuffer>> {
    const response = await this.request(`${API}/files/${encodeURIComponent(id)}?alt=media`);
    return new Uint8Array(await response.arrayBuffer());
  }

  async delete(id: string): Promise<void> {
    await this.request(`${API}/files/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  private async multipart(
    method: string,
    url: string,
    metadata: object,
    content: Uint8Array<ArrayBuffer>,
  ): Promise<unknown> {
    const boundary = `locry-${crypto.randomUUID()}`;
    const body = new Blob([
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
      `--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`,
      content,
      `\r\n--${boundary}--`,
    ]);
    return this.json(`${url}?uploadType=multipart&fields=${FILE_FIELDS}`, {
      method,
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    });
  }

  private async resumable(
    method: string,
    url: string,
    metadata: object,
    content: Uint8Array<ArrayBuffer>,
  ): Promise<unknown> {
    const session = await this.request(`${url}?uploadType=resumable&fields=${FILE_FIELDS}`, {
      method,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': 'application/octet-stream',
        'X-Upload-Content-Length': String(content.length),
      },
      body: JSON.stringify(metadata),
    });
    const location = session.headers.get('Location');
    if (!location) throw new DriveError('failed');
    const response = await this.request(location, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: content,
    });
    return response.json();
  }

  private async json(url: string, init?: RequestInit): Promise<unknown> {
    return (await this.request(url, init)).json();
  }

  private async request(url: string, init: RequestInit = {}): Promise<Response> {
    let response: Response;
    try {
      response = await this.fetchFn(url, {
        ...init,
        headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${this.token()}` },
      });
    } catch (error) {
      throw new DriveError('network', error);
    }
    if (response.ok) return response;
    throw new DriveError(errorCode(response.status, await response.text().catch(() => '')));
  }
}

function errorCode(status: number, body: string): ConstructorParameters<typeof DriveError>[0] {
  if (status === 401) return 'unauthorized';
  if (status === 404) return 'notFound';
  if (status === 403 && /quota|storage/i.test(body)) return 'quota';
  if (status === 403) return 'unauthorized';
  return 'failed';
}

function toDriveFile(raw: RawDriveFile): DriveFile {
  return {
    id: raw.id,
    name: raw.name,
    size: Number(raw.size ?? 0),
    createdTime: raw.createdTime,
    modifiedTime: raw.modifiedTime ?? raw.createdTime,
    appProperties: raw.appProperties ?? {},
  };
}
