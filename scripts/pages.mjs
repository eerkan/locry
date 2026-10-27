// Prepares a production build for GitHub Pages, which serves files only: no redirects, no
// runtime config, no rewriting. Run after `ng build --base-href <base path>`:
//
//   SITE_URL=https://user.github.io/locry node scripts/pages.mjs
//
// What scripts/serve.mjs does per request happens here once, on the files:
// - the placeholder address in pages, sitemap.xml, robots.txt and llms.txt becomes SITE_URL;
// - every prerendered page also gets a .html next to its folder (tr.html, tr/privacy.html), so
//   /tr is served as is instead of being redirected to /tr/;
// - 404.html is the app shell, so app routes such as /notes open the app;
// - /en (the old English address) points to the English page at the root;
// - the service worker manifest is rebuilt, since the edited files changed their hashes.
// config.json is written before the build (scripts/write-config.mjs, from the environment).
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, relative, resolve, sep } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, process.env.DIST ?? 'dist/locry/browser');
const PLACEHOLDER = 'https://locry.invalid';
const WITH_SITE_URL = new Set(['.html', '.txt', '.xml']);

const site = (process.env.SITE_URL ?? '').trim().replace(/\/+$/, '');
if (!/^https?:\/\/[\w.-]+(:\d+)?(\/[\w.~-]+)*$/.test(site)) {
  console.error('Set SITE_URL to the public address, e.g. https://user.github.io/locry');
  process.exit(1);
}
const basePath = `${new URL(site).pathname.replace(/\/$/, '')}/`;
const baseHref = readFileSync(join(dist, 'index.csr.html'), 'utf8').match(/<base href="([^"]*)"/)?.[1];
if (baseHref !== basePath) {
  console.error(`The build's base href is ${baseHref}, but SITE_URL needs ${basePath}: build with --base-href ${basePath}`);
  process.exit(1);
}

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else yield path;
  }
}

let replaced = 0;
for (const file of files(dist)) {
  if (!WITH_SITE_URL.has(extname(file))) continue;
  const text = readFileSync(file, 'utf8');
  if (!text.includes(PLACEHOLDER)) continue;
  writeFileSync(file, text.replaceAll(PLACEHOLDER, site));
  replaced++;
}

// Prerendered pages: /tr and /tr/privacy are served from tr.html and tr/privacy.html (GitHub
// Pages adds .html), without the redirect to a trailing slash that tr/index.html would need.
const pages = [...files(dist)]
  .filter((file) => file.endsWith(`${sep}index.html`) && file !== join(dist, 'index.html'))
  .map((file) => relative(dist, file).slice(0, -`${sep}index.html`.length));
for (const page of pages) copyFileSync(join(dist, page, 'index.html'), join(dist, `${page}.html`));

copyFileSync(join(dist, 'index.csr.html'), join(dist, '404.html'));

writeFileSync(
  join(dist, 'en.html'),
  `<!doctype html>
<html lang="en">
<meta charset="utf-8" />
<title>Locry</title>
<link rel="canonical" href="${site}/" />
<meta http-equiv="refresh" content="0; url=./" />
<a href="./">Locry</a>
</html>
`,
);

// Without it GitHub Pages runs Jekyll, which skips files starting with "_".
writeFileSync(join(dist, '.nojekyll'), '');

// File paths get the base path from ngsw-config itself, navigation patterns do not: without
// it "!/tr" would not match /locry/tr and the worker would answer it with the app shell.
const swConfig = JSON.parse(readFileSync(join(root, 'ngsw-config.json'), 'utf8'));
swConfig.navigationUrls = swConfig.navigationUrls.map((pattern) =>
  pattern.replace(/^(!?)\//, `$1${basePath}`),
);
const swConfigFile = join(mkdtempSync(join(tmpdir(), 'locry-ngsw-')), 'ngsw-config.json');
writeFileSync(swConfigFile, JSON.stringify(swConfig));
// The tool resolves its arguments against the working directory: pass them relative to it.
execFileSync(join(root, 'node_modules/.bin/ngsw-config'), [relative(root, dist), relative(root, swConfigFile), basePath], {
  cwd: root,
  stdio: 'inherit',
});

console.log(`GitHub Pages: ${site} (base ${basePath}); ${replaced} files with the site address, ${pages.length} pages, 404.html, en.html`);
