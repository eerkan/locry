// Serves the production build (prerendered landing pages, app shell, service worker) on
// http://localhost:4200.
// Same origin as `ng serve`, so passkeys and the encrypted IndexedDB data are shared.
import { createReadStream, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { runtimeConfig } from './runtime-config.mjs';

const root = resolve(import.meta.dirname, '../dist/locry/browser');
const port = Number(process.env.PORT ?? 4200);
// Loopback only by default; the Docker image sets HOST=0.0.0.0 and the compose file
// publishes the port on the host's loopback interface instead.
const host = process.env.HOST ?? '127.0.0.1';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

// Prerendered pages and site files mention this placeholder origin; it is replaced with the
// real address when served, so one build works on any domain (see src/app/core/site.ts).
const SITE_PLACEHOLDER = 'https://locry.invalid';
const WITH_SITE_URL = new Set(['.html', '.txt', '.xml']);
/** Prerendered public pages, one per language; every other extensionless path is an app route. */
const LANDING_LANGS = ['tr', 'zh', 'es', 'ar', 'pt', 'id', 'fr', 'ja', 'ru', 'de'];
const PAGES = {
  '/': 'index.html',
  ...Object.fromEntries(LANDING_LANGS.flatMap((lang) => [`/${lang}`, `/${lang}/`].map((path) => [path, `${lang}/index.html`]))),
  // Privacy policy: /privacy in English, /<code>/privacy in the others.
  ...Object.fromEntries(
    ['', ...LANDING_LANGS.map((lang) => `/${lang}`)].flatMap((prefix) =>
      [`${prefix}/privacy`, `${prefix}/privacy/`].map((path) => [path, `${prefix.slice(1)}${prefix ? '/' : ''}privacy/index.html`]),
    ),
  ),
};
/** Old addresses of public pages. */
const MOVED = { '/en': '/', '/en/': '/' };
/** Text worth compressing (images, fonts and wasm are already compressed or not worth it). */
const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.webmanifest', '.svg', '.txt', '.xml', '.wasm']);
const compressed = new Map();

/** Brotli or gzip, if the client accepts it; cached per file version and site origin. */
function encodeBody(req, file, body) {
  const accept = String(req.headers['accept-encoding'] ?? '');
  const encoding = /\bbr\b/.test(accept) ? 'br' : /\bgzip\b/.test(accept) ? 'gzip' : null;
  if (!encoding || body.length < 1024) return { body, encoding: null };
  // The modification time tells builds apart: file names inside the HTML change, not its length.
  const key = `${encoding}:${file}:${statSync(file).mtimeMs}:${body.length}:${req.headers.host}`;
  if (!compressed.has(key)) {
    compressed.set(
      key,
      encoding === 'br'
        ? brotliCompressSync(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 9 } })
        : gzipSync(body, { level: 9 }),
    );
  }
  return { body: compressed.get(key), encoding };
}

/** Build output with a content hash in the name never changes and can be cached for good. */
const HASHED = /-[A-Za-z0-9_-]{8,}\.(js|mjs|css)$/;

/** Public origin for canonical URLs: configured, else the domain, else the request's own. */
function siteOrigin(req) {
  const configured = (process.env.LOCRY_SITE_URL ?? '').trim().replace(/\/+$/, '');
  if (/^https?:\/\/[\w.-]+(:\d+)?$/.test(configured)) return configured;
  const domain = (process.env.LOCRY_DOMAIN ?? '').trim();
  if (/^[\w.-]+$/.test(domain)) return `https://${domain}`;
  const host = req.headers.host ?? '';
  const proto = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  return /^[\w.-]+(:\d+)?$/.test(host) ? `${proto}://${host}` : 'http://localhost';
}

function fileFor(urlPath) {
  const path = resolve(join(root, normalize(decodeURIComponent(urlPath))));
  if (path !== root && !path.startsWith(root + sep)) return null; // no path traversal
  try {
    return statSync(path).isFile() ? path : null;
  } catch {
    return null;
  }
}

// Passkeys (WebAuthn) reject IP addresses as relying-party IDs, so 127.0.0.1 and [::1]
// are sent to the same path on localhost. Docker Desktop links containers as 127.0.0.1.
const LOOPBACK_IP = /^(127\.\d{1,3}\.\d{1,3}\.\d{1,3}|\[::1\])(:\d+)?$/;

// A browser that already installed the app on an IP keeps serving it from its service worker
// and never sees the redirect. When it checks that worker for updates, hand it this one
// instead: it unregisters itself, clears the IP origin's caches and moves open tabs over.
const RETIRE_WORKER = `
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil((async () => {
  await self.registration.unregister();
  for (const name of await caches.keys()) await caches.delete(name);
  for (const client of await self.clients.matchAll({ type: 'window' })) {
    const url = new URL(client.url);
    url.hostname = 'localhost';
    client.navigate(url.href);
  }
})()));
`;

createServer((req, res) => {
  const hostHeader = req.headers.host ?? '';
  if (LOOPBACK_IP.test(hostHeader)) {
    if (req.url === '/ngsw-worker.js') {
      res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(RETIRE_WORKER);
      return;
    }
    const port = hostHeader.match(/:(\d+)$/)?.[1];
    res.writeHead(308, { Location: `http://localhost${port ? `:${port}` : ''}${req.url ?? '/'}` }).end();
    return;
  }

  const urlPath = new URL(req.url ?? '/', 'http://localhost').pathname;

  // Built from the environment on every request, so changing .env only needs a restart.
  if (urlPath === '/config.json') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(runtimeConfig()));
    return;
  }
  if (MOVED[urlPath]) {
    res.writeHead(301, { Location: MOVED[urlPath] }).end();
    return;
  }
  // Public pages are prerendered; other routes without a file extension get the app shell.
  const page = PAGES[urlPath];
  const file = page ? join(root, page) : (fileFor(urlPath) ?? (extname(urlPath) ? null : join(root, 'index.csr.html')));
  if (!file) {
    res.writeHead(404).end('Not found');
    return;
  }
  const ext = extname(file);
  const headers = {
    'Content-Type': types[ext] ?? 'application/octet-stream',
    'Cache-Control': HASHED.test(file)
      ? 'public, max-age=31536000, immutable'
      : file.includes(`${sep}fonts${sep}`)
        ? 'public, max-age=2592000'
        : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    Vary: 'Accept-Encoding',
  };
  if (!COMPRESSIBLE.has(ext)) {
    res.writeHead(200, headers);
    createReadStream(file).pipe(res);
    return;
  }
  let body = readFileSync(file);
  if (WITH_SITE_URL.has(ext)) body = Buffer.from(body.toString('utf8').replaceAll(SITE_PLACEHOLDER, siteOrigin(req)));
  const encoded = encodeBody(req, file, body);
  if (encoded.encoding) headers['Content-Encoding'] = encoded.encoding;
  res.writeHead(200, headers);
  res.end(encoded.body);
}).listen(port, host, () => {
  console.log(`Locry: http://localhost:${port} (listening on ${host})`);
});

// Exit promptly on `docker stop` (SIGTERM) instead of waiting for the kill timeout.
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => process.exit(0));
