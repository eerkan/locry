// Serves the production build (with its service worker) on http://localhost:4200.
// Same origin as `ng serve`, so passkeys and the encrypted IndexedDB data are shared.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
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
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

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
  // Client-side routes (no file extension) get the app shell.
  const file = fileFor(urlPath) ?? (extname(urlPath) ? null : join(root, 'index.html'));
  if (!file) {
    res.writeHead(404).end('Not found');
    return;
  }
  const isShell = file.endsWith('index.html') || file.endsWith('ngsw.json') || file.endsWith('ngsw-worker.js');
  res.writeHead(200, {
    'Content-Type': types[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': isShell ? 'no-cache' : 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  });
  createReadStream(file).pipe(res);
}).listen(port, host, () => {
  console.log(`Locry: http://localhost:${port} (listening on ${host})`);
});

// Exit promptly on `docker stop` (SIGTERM) instead of waiting for the kill timeout.
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => process.exit(0));
