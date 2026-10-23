// Takes the landing page screenshots from the real app, in every interface language, light and dark.
//
//   npx ng serve --port 4320 &          (a dev build: exposes Angular's `ng` debugging API)
//   node scripts/screenshots.mjs        (BASE=http://localhost:4320 by default)
//
// Uses the installed Google Chrome with a virtual passkey authenticator (WebAuthn PRF), a fake
// Google Drive for the sync screenshot, and sample data entered through the app's own stores.
// Output: public/landing/<lang>/<name>-<light|dark>.{avif,webp}. Needs ImageMagick, cwebp and avifenc.
// LANGS=ja,ar limits the languages. Each language downloads the search model (~200 MB) once.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { LANGS, LANGUAGE_TAGS } from '../src/app/core/languages.ts';
import { SAMPLES } from './screenshot-samples.mjs';

const BASE = process.env.BASE ?? 'http://localhost:4320';
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = resolve(import.meta.dirname, '../public/landing');
const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };
const SCALE = 2;
/** Desktop shots are stored at this width (1.5x of the CSS width): sharp on retina, still small. */
const DESKTOP_OUT_WIDTH = 2160;

const day = (offset) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);


/** An in-memory Google Drive (app-data folder) for the sync screenshot. */
function fakeDrive(context) {
  const files = [];
  let clock = Date.now();
  const meta = (f) => ({
    id: f.id,
    name: f.name,
    size: String(f.content.length),
    createdTime: f.createdTime,
    modifiedTime: f.modifiedTime,
    appProperties: f.appProperties,
  });
  const parse = (request) => {
    const body = request.postDataBuffer() ?? Buffer.alloc(0);
    const boundary = request.headers()['content-type'].split('boundary=')[1];
    const text = body.toString('latin1');
    const parts = text.split(`--${boundary}`);
    const metadata = JSON.parse(Buffer.from(parts[1].split('\r\n\r\n')[1].trim(), 'latin1').toString('utf8'));
    const start = text.indexOf('\r\n\r\n', text.indexOf(parts[2])) + 4;
    const end = text.lastIndexOf(`\r\n--${boundary}--`);
    return { metadata, content: body.subarray(start, end) };
  };
  return context.route('https://www.googleapis.com/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    if (method === 'GET' && url.pathname === '/drive/v3/files') return route.fulfill({ json: { files: files.map(meta) } });
    if (method === 'POST' && url.pathname === '/upload/drive/v3/files') {
      const { metadata, content } = parse(request);
      clock += 1000;
      const time = new Date(clock).toISOString();
      const file = { id: `f${files.length}`, name: metadata.name, createdTime: time, modifiedTime: time, appProperties: metadata.appProperties ?? {}, content };
      files.push(file);
      return route.fulfill({ json: meta(file) });
    }
    const file = files.find((f) => f.id === url.pathname.split('/').pop());
    if (!file) return route.fulfill({ status: 404, json: {} });
    if (method === 'PATCH') {
      const { metadata, content } = parse(request);
      Object.assign(file, { content, modifiedTime: new Date((clock += 1000)).toISOString() });
      Object.assign(file.appProperties, metadata.appProperties);
      return route.fulfill({ json: meta(file) });
    }
    return route.fulfill({ body: file.content });
  });
}

/** The app's own strings, so buttons are found by the text a user sees in that language. */
async function strings(lang) {
  return (await import(`../src/i18n/${lang}.ts`))[lang];
}

const exact = (text) => new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);

async function addAuthenticator(page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      hasPrf: true,
      automaticPresenceSimulation: true,
    },
  });
}

/** In-app navigation: a full page load would lock the vault. */
async function navigate(page, path) {
  await page.evaluate((path) => {
    history.pushState(null, '', path);
    dispatchEvent(new PopStateEvent('popstate'));
  }, path);
  await page.waitForTimeout(600);
}

async function setTheme(page, theme) {
  await page.evaluate((dark) => {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  }, theme === 'dark');
  await page.waitForTimeout(250);
}

/** Saves a PNG screenshot as AVIF and WebP, resized to `width`. */
function encode(png, name, width) {
  const resized = png.replace(/\.png$/, `-${width}.png`);
  execFileSync('magick', [png, '-resize', `${width}x`, '-strip', resized]);
  execFileSync('cwebp', ['-quiet', '-q', '80', '-m', '6', resized, '-o', `${name}.webp`]);
  execFileSync('avifenc', ['-q', '55', '-s', '4', '--jobs', 'all', resized, `${name}.avif`], { stdio: 'ignore' });
}

async function shoot(page, dir, tmp, name, width, prepare) {
  for (const theme of ['light', 'dark']) {
    await setTheme(page, theme);
    if (prepare) await prepare(theme);
    await page.addStyleTag({ content: '[data-sonner-toaster]{display:none!important} *{caret-color:transparent!important}' });
    const png = join(tmp, `${name}-${theme}.png`);
    await page.screenshot({ path: png });
    encode(png, join(dir, `${name}-${theme}`), width);
    // Half-size variant for smaller screens (srcset); the phone shot is small already.
    if (width === DESKTOP_OUT_WIDTH) encode(png, join(dir, `${name}-${theme}-1080`), 1080);
    console.log(`  ${name}-${theme}`);
  }
}

async function createVault(page, t, name, color) {
  await page.goto(`${BASE}/setup`);
  await page.locator('#vault-name').fill(name);
  if (color) await page.locator(`app-color-picker button`).nth(color).click();
  await page.getByRole('button', { name: exact(t.setup.createPasskey) }).click();
  await page.getByRole('button', { name: exact(t.setup.savedIt) }).waitFor();
  const groups = (await page.locator('main').innerText()).match(/^[0-9A-Z]{3,4}$/gm);
  await page.getByRole('button', { name: exact(t.setup.savedIt) }).click();
  const index = Number((await page.locator('main label').first().innerText()).match(/\d+/)[0]);
  await page.locator('main input').first().fill(groups[index - 1]);
  await page.getByRole('button', { name: exact(t.setup.finish) }).click();
  await page.waitForURL(/\/notes/);
}

/** Runs a function against the app shell's stores through Angular's dev-mode debugging API. */
function withStores(page, fn, arg) {
  return page.evaluate(
    async ({ source, arg }) => {
      const shell = window.ng.getComponent(document.querySelector('app-shell'));
      return new Function('notes', 'tasks', 'arg', `return (${source})(notes, tasks, arg)`)(shell.notes, shell.tasks, arg);
    },
    { source: fn.toString(), arg },
  );
}

async function seed(page, sample) {
  const ids = await withStores(
    page,
    async (notes, tasks, { sample, dates }) => {
      const lists = [];
      for (const [name, color] of sample.lists) lists.push(await tasks.createList(name, color));
      const noteIds = [];
      for (const note of [...sample.notes].reverse()) noteIds.push((await notes.create(note)).id);
      for (const [title, due, priority, list] of sample.tasks) {
        await tasks.createTask(title, {
          dueDate: dates[due + 1],
          priority,
          listId: list === null ? null : lists[list].id,
        });
      }
      return { hero: noteIds.at(-1) };
    },
    { sample, dates: [day(-1), day(0), day(1), day(2), day(3)] },
  );
  return ids;
}

async function run() {
  const tmp = mkdtempSync(join(tmpdir(), 'locry-shots-'));
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  try {
    for (const lang of process.env.LANGS?.split(',') ?? LANGS) {
      const sample = SAMPLES[lang];
      const t = await strings(lang);
      // Written outside public/ first: the dev server reloads the page when public/ changes.
      const dir = join(tmp, 'out', lang);
      mkdirSync(dir, { recursive: true });
      console.log(lang);

      const context = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: SCALE, locale: LANGUAGE_TAGS[lang] });
      await context.addInitScript(
        ({ lang }) => {
          if (!localStorage.getItem('locry.preferences')) {
            localStorage.setItem(
              'locry.preferences',
              JSON.stringify({ lang, theme: 'light', driveClientId: 'screenshots.apps.googleusercontent.com' }),
            );
          }
          localStorage.setItem('locry.notes.mode', 'split');
          // Google sign-in stand-in for the sync screenshot.
          window.google = {
            accounts: {
              oauth2: {
                initTokenClient: (config) => ({
                  requestAccessToken: () => setTimeout(() => config.callback({ access_token: 'token', expires_in: 3600 }), 50),
                }),
                hasGrantedAllScopes: () => true,
                revoke: (_token, done) => done?.(),
              },
            },
          };
        },
        { lang },
      );
      await fakeDrive(context);
      const page = await context.newPage();
      await addAuthenticator(page);

      await createVault(page, t, sample.vault);
      const { hero } = await seed(page, sample);

      await navigate(page, `/notes/${hero}`);
      await page.locator('app-note-editor').waitFor();
      await page.mouse.move(0, 0);
      await shoot(page, dir, tmp, 'hero', DESKTOP_OUT_WIDTH);

      await navigate(page, '/tasks/today');
      await page.getByRole('main').waitFor();
      await shoot(page, dir, tmp, 'tasks', DESKTOP_OUT_WIDTH);

      // Smart search: downloads the model once (~120 MB), then searches by meaning.
      await navigate(page, `/search?q=${encodeURIComponent(sample.search)}`);
      await page.getByRole('button', { name: exact(t.pages.search.enable) }).click();
      await page.getByRole('main').getByText(t.pages.search.ready).first().waitFor({ timeout: 600_000 });
      // Wait until every note and task has its vectors, not just until the model is loaded.
      await page.waitForFunction(
        () => {
          const index = window.ng.getComponent(document.querySelector('app-semantic-status'))?.index;
          return index && !index.indexing() && index.vectors().size === index.docs().length;
        },
        null,
        { timeout: 300_000, polling: 500 },
      ).catch(() => console.log('  (indexing still running; taking the search shot anyway)'));
      const box = page.getByRole('main').getByRole('searchbox').or(page.getByRole('main').locator('input').first()).first();
      await box.fill('');
      await page.waitForTimeout(300);
      await box.fill(sample.search);
      await page.waitForTimeout(3000);
      await shoot(page, dir, tmp, 'search', DESKTOP_OUT_WIDTH);

      await navigate(page, '/settings');
      await page.getByRole('button', { name: exact(t.sync.enable) }).click();
      await page.locator('#sync app-sync-status-label').waitFor();
      await page.waitForTimeout(1500);
      await page.locator('#sync').evaluate((el) => el.scrollIntoView({ block: 'center' }));
      await shoot(page, dir, tmp, 'sync', DESKTOP_OUT_WIDTH);

      // Phone: same tab (the virtual passkey belongs to it), narrow viewport.
      await page.setViewportSize(PHONE);
      await navigate(page, '/notes');
      await page.waitForTimeout(500);
      await shoot(page, dir, tmp, 'phone', PHONE.width * SCALE);
      await page.setViewportSize(DESKTOP);

      // Vaults: a second vault, then the lock screen with both.
      await page.keyboard.press('Meta+Shift+L');
      await page.waitForURL(/\/unlock/);
      await createVault(page, t, sample.secondVault, 4);
      await page.keyboard.press('Meta+Shift+L');
      await page.waitForURL(/\/unlock/);
      await page.getByRole('radio').first().click();
      await page.mouse.move(0, 0);
      await shoot(page, dir, tmp, 'vaults', DESKTOP_OUT_WIDTH);

      await context.close();
    }
    cpSync(join(tmp, 'out'), OUT, { recursive: true });
  } finally {
    await browser.close();
    rmSync(tmp, { recursive: true, force: true });
  }
}

await run();
