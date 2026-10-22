// Serves the production build (with its service worker) on http://localhost:4200.
// Same origin as `ng serve`, so passkeys and the encrypted IndexedDB data are shared.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve(import.meta.dirname, '../dist/locry/browser');
const port = Number(process.env.PORT ?? 4200);

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

createServer((req, res) => {
  const urlPath = new URL(req.url ?? '/', 'http://localhost').pathname;
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
}).listen(port, '127.0.0.1', () => {
  console.log(`Locry: http://localhost:${port}`);
});
