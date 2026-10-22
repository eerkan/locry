// Takes the landing page screenshots from the real app, in Turkish and English, light and dark.
//
//   npx ng serve --port 4320 &          (a dev build: exposes Angular's `ng` debugging API)
//   node scripts/screenshots.mjs        (BASE=http://localhost:4320 by default)
//
// Uses the installed Google Chrome with a virtual passkey authenticator (WebAuthn PRF), a fake
// Google Drive for the sync screenshot, and sample data entered through the app's own stores.
// Output: public/landing/<lang>/<name>-<light|dark>.{avif,webp}. Needs ImageMagick and avifenc.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:4320';
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = resolve(import.meta.dirname, '../public/landing');
const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };
const SCALE = 2;
/** Desktop shots are stored at this width (1.5x of the CSS width): sharp on retina, still small. */
const DESKTOP_OUT_WIDTH = 2160;

const day = (offset) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

const SAMPLES = {
  tr: {
    vault: 'Kişisel',
    secondVault: 'İş',
    lists: [
      ['İş', 'blue'],
      ['Ev', 'green'],
    ],
    notes: [
      {
        title: 'Haftalık planlama',
        pinned: true,
        tags: ['plan', 'iş'],
        content:
          '## Bu haftanın odağı\n\nYeni sürümü **cuma** gününe kadar yayına almak.\n\n- [x] Tasarım incelemesi\n- [x] Şifreleme testleri\n- [ ] Sürüm notlarını yaz\n- [ ] Telefonda eşitlemeyi dene\n\n> Küçük adımlar, her gün.\n\n### Toplantılar\n\n| Gün | Konu |\n|---|---|\n| Salı | Ürün planı |\n| Perşembe | Güvenlik gözden geçirmesi |\n',
      },
      {
        title: 'Antalya otel rezervasyonu',
        tags: ['seyahat'],
        content:
          'Otel rezervasyonu tamam: **12–18 Temmuz**, deniz manzaralı oda.\n\n- [x] Uçak biletleri\n- [ ] Araç kiralama\n- [ ] Kaleiçi’nde akşam yemeği\n',
      },
      {
        title: 'Okuma listesi',
        tags: ['okuma'],
        content: '1. Kürk Mantolu Madonna\n2. Saatleri Ayarlama Enstitüsü\n3. *Deep Work* — Cal Newport\n',
      },
      { title: 'Ekşi mayalı ekmek', tags: ['mutfak'], content: '500 g un, 350 ml su, 100 g maya, 10 g tuz. 12 saat soğuk mayalanma.' },
      { title: 'Kapadokya hafta sonu', tags: ['seyahat'], content: 'Balon turu için sabah 5’te kalkış. Göreme’de mağara otelde iki gece.' },
      { title: 'Doğum günü hediyesi', tags: ['aile'], content: 'Annem için: seramik kursu, bahçe makası ya da sevdiği yazarın yeni kitabı.' },
      { title: 'Yıllık hedefler', tags: ['plan'], content: '- Haftada üç gün koşu\n- Yılda 12 kitap\n- İspanyolca A2 seviyesi' },
      { title: 'Araba bakımı', tags: ['ev'], content: 'Kış lastikleri kasım başında takılacak. Yağ değişimi 15.000 km’de.' },
      { title: 'Bütçe toplantısı', tags: ['iş'], content: 'Pazarlama bütçesi üçüncü çeyrekte yüzde 10 artırılacak. Teklifler cuma günü.' },
      { title: 'Sağlık kontrolü', tags: ['sağlık'], content: 'Kan tahlili sonuçları normal. Bir sonraki kontrol altı ay sonra.' },
      { title: 'Uygulama fikirleri', tags: ['fikir'], content: 'Mutfak envanteri: buzdolabındakileri tarayıp tarif önersin.' },
      { title: 'Ürün toplantısı notları', tags: ['iş'], content: 'Eşitleme özelliği beta kullanıcılarla denenecek. Geri bildirim formu hazırlanacak.' },
    ],
    tasks: [
      ['Sürüm notlarını yaz', 0, 3, 0],
      ['Güvenlik raporunu gönder', -1, 2, 0],
      ['Kira ödemesi', 0, 2, 1],
      ['Dişçi randevusu al', 0, 1, null],
      ['Spor salonu', 0, 0, 1],
      ['Pazar alışverişi', 1, 0, 1],
      ['Ürün sunumunu hazırla', 3, 1, 0],
    ],
    // No word in common with the travel note: the match comes from the meaning.
    search: 'tatil planı',
  },
  en: {
    vault: 'Personal',
    secondVault: 'Work',
    lists: [
      ['Work', 'blue'],
      ['Home', 'green'],
    ],
    notes: [
      {
        title: 'Weekly planning',
        pinned: true,
        tags: ['plan', 'work'],
        content:
          '## This week’s focus\n\nShip the new release by **Friday**.\n\n- [x] Design review\n- [x] Encryption tests\n- [ ] Write the release notes\n- [ ] Try sync on the phone\n\n> Small steps, every day.\n\n### Meetings\n\n| Day | Topic |\n|---|---|\n| Tuesday | Product plan |\n| Thursday | Security review |\n',
      },
      {
        title: 'Hotel booking in Lisbon',
        tags: ['travel'],
        content: 'Hotel booked: **July 12–18**, room with a river view.\n\n- [x] Flights\n- [ ] Rent a car\n- [ ] Dinner in Alfama\n',
      },
      { title: 'Reading list', tags: ['reading'], content: '1. *Deep Work* — Cal Newport\n2. *The Pragmatic Programmer*\n3. *Thinking, Fast and Slow*\n' },
      { title: 'Sourdough bread', tags: ['kitchen'], content: '500 g flour, 350 ml water, 100 g starter, 10 g salt. Cold proof for 12 hours.' },
      { title: 'Weekend in the Alps', tags: ['travel'], content: 'Train to Interlaken on Friday evening. Two nights in a mountain hut.' },
      { title: 'Birthday gift ideas', tags: ['family'], content: 'For Mom: a pottery class, garden shears or the new book by her favorite author.' },
      { title: 'Yearly goals', tags: ['plan'], content: '- Run three times a week\n- Read 12 books\n- Reach Spanish A2' },
      { title: 'Car maintenance', tags: ['home'], content: 'Winter tires go on in early November. Oil change at 15,000 km.' },
      { title: 'Budget meeting', tags: ['work'], content: 'Marketing budget up 10 percent in Q3. Proposals due Friday.' },
      { title: 'Health check-up', tags: ['health'], content: 'Blood test results are normal. Next check-up in six months.' },
      { title: 'App ideas', tags: ['ideas'], content: 'Kitchen inventory: scan the fridge and suggest recipes.' },
      { title: 'Product meeting notes', tags: ['work'], content: 'Sync will be tried with beta users first. Prepare a feedback form.' },
    ],
    tasks: [
      ['Write the release notes', 0, 3, 0],
      ['Send the security report', -1, 2, 0],
      ['Pay the rent', 0, 2, 1],
      ['Book a dentist appointment', 0, 1, null],
      ['Gym', 0, 0, 1],
      ['Grocery shopping', 1, 0, 1],
      ['Prepare the product demo', 3, 1, 0],
    ],
    search: 'vacation plans',
  },
};

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

async function createVault(page, name, color) {
  await page.goto(`${BASE}/setup`);
  await page.locator('#vault-name').fill(name);
  if (color) await page.locator(`app-color-picker button`).nth(color).click();
  await page.getByRole('button', { name: /Create passkey|Geçiş anahtarı oluştur/ }).click();
  await page.getByRole('button', { name: /I saved it|Kaydettim/ }).waitFor();
  const groups = (await page.locator('main').innerText()).match(/^[0-9A-Z]{3,4}$/gm);
  await page.getByRole('button', { name: /I saved it|Kaydettim/ }).click();
  const index = Number((await page.locator('main label').first().innerText()).match(/\d+/)[0]);
  await page.locator('main input').first().fill(groups[index - 1]);
  await page.getByRole('button', { name: /Create vault|Kasayı oluştur/ }).click();
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
    for (const lang of (process.env.LANGS ?? 'tr,en').split(',')) {
      const sample = SAMPLES[lang];
      // Written outside public/ first: the dev server reloads the page when public/ changes.
      const dir = join(tmp, 'out', lang);
      mkdirSync(dir, { recursive: true });
      console.log(lang);

      const context = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: SCALE, locale: lang === 'tr' ? 'tr-TR' : 'en-US' });
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

      await createVault(page, sample.vault);
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
      await page.getByRole('button', { name: /Turn on semantic search|Anlamsal aramayı aç/ }).click();
      await page.getByRole('main').getByText(/Semantic search ready|Anlamsal arama hazır/).first().waitFor({ timeout: 300_000 });
      // Wait until every note and task has its vectors, not just until the model is loaded.
      await page.waitForFunction(
        () => {
          const index = window.ng.getComponent(document.querySelector('app-semantic-status'))?.index;
          return index && !index.indexing() && index.vectors().size === index.docs().length;
        },
        null,
        { timeout: 300_000, polling: 500 },
      );
      const box = page.getByRole('main').getByRole('searchbox').or(page.getByRole('main').locator('input').first()).first();
      await box.fill('');
      await page.waitForTimeout(300);
      await box.fill(sample.search);
      await page.waitForTimeout(3000);
      await shoot(page, dir, tmp, 'search', DESKTOP_OUT_WIDTH);

      await navigate(page, '/settings');
      await page.getByRole('button', { name: /Turn on sync|Eşitlemeyi aç/ }).click();
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
      await createVault(page, sample.secondVault, 4);
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
