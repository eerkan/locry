# Locry

An **encrypted notes and tasks** app that runs entirely in the browser, with no server. Your data stays on your
device, encrypted with a key bound to a passkey; if you want, it syncs with your other devices through Google
Drive, still encrypted.

<p>
  <a href="https://eerkan.github.io/locry/"><img alt="Try Locry live" src="https://img.shields.io/badge/Try_it_live-eerkan.github.io%2Flocry-2563eb?style=for-the-badge&logo=googlechrome&logoColor=white"></a>
  <a href="https://eerkan.github.io/locry/app"><img alt="Open the app" src="https://img.shields.io/badge/Open_the_app-111827?style=for-the-badge&logo=lock&logoColor=white"></a>
</p>

No sign-up, nothing to install: open the link and create a vault with a passkey. Your notes never leave your device
unencrypted.

- Markdown notes (split preview, tags, pinning, archive)
- Tasks (smart views, lists, subtasks, priorities, due dates, drag and drop)
- Passkey sign-in, recovery key, auto-lock
- Multiple independent vaults (e.g. Personal and Work), each with its own passkeys and recovery key
- Compressed, encrypted `.locry` backups; backups to Google Drive
- End-to-end encrypted sync between phone and computer through Google Drive
- Semantic search with in-browser AI (optional), ⌘K command palette
- **Ask your notes:** answers to your questions from your own notes and tasks, with sources, written by a small
  language model running on WebGPU in the browser (optional)
- Installable PWA, works offline, light/dark theme
- Interface in 11 languages: English, Turkish, Chinese, Spanish, Arabic (right to left), Portuguese, Indonesian,
  French, Japanese, Russian, German; the browser's language on first run

## Running

Requires Node 24.

```bash
nvm use
yarn install
```

**Development** (live reload, no service worker):

```bash
yarn start
```

**Everyday use** (production build, works offline, installable):

```bash
yarn serve:prod
```

Both use `http://localhost:4200`; since the address is the same, they share data and passkeys. The root address is
the landing page (`/` in English, other languages under their code such as `/tr` or `/ja`; visitors are sent to
their browser's language); the app opens at `/app` (an installed PWA goes straight there). Use the "Install" icon
in the browser's address bar to install Locry as a desktop app.

> The address matters: passkeys are bound to the `localhost` domain and data to the `http://localhost:4200` origin.
> Open it on another port and you get an empty vault. Passkeys do not work on IP addresses, so `127.0.0.1` (e.g. the
> link in Docker Desktop) is redirected to `localhost` automatically.

### Docker

To run it in a container without installing Node:

```bash
docker compose up -d --build
```

The app opens at `http://localhost:4200` by default. Stop it with `docker compose down`.

The port and the listening address are read from `.env` (defaults apply when it is missing):

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `LOCRY_PORT` | `4200` | Host port → `http://localhost:<port>` |
| `LOCRY_BIND_ADDRESS` | `127.0.0.1` | Interface the port is published on; this machine only |
| `LOCRY_GOOGLE_CLIENT_ID` | empty | Built-in Google Client ID; users just press "Connect with Google" |
| `COMPOSE_PROFILES` | empty | Set to `https` to also start Caddy (automatic HTTPS) |
| `LOCRY_DOMAIN` | empty | Domain Caddy serves, e.g. `locry.example.com` |
| `LOCRY_SITE_URL` | empty | Canonical address of the landing pages; defaults to `https://<LOCRY_DOMAIN>`, else the address you open |
| `LOCRY_DONATE_*` | empty | Donation links, see [Donations](#donations) |
| `LOCRY_GOATCOUNTER` | empty | GoatCounter site code, see [Visitor counts](#visitor-counts) |

- The image is multi-stage: the build runs on Node 24, and the final image holds only the compiled app and a small
  dependency-free server. The container runs as a non-root user, with a read-only file system and dropped
  capabilities.
- By default the port is published on this machine's `127.0.0.1` only; other devices on the network cannot reach
  it. Do not use `0.0.0.0`: passkeys and the service worker need a secure context, which other devices only get
  over HTTPS.
- **The container holds no data.** Notes, tasks and keys stay encrypted in the browser; removing or recreating the
  container does not affect them, so no volume is needed. Use the app's backup features for backups.
- If you change `LOCRY_PORT`, the browser treats it as a different site: you get an empty vault at the new address
  (passkeys work regardless of the port; move old data with a backup). If you use Google Drive, add the new address
  to the OAuth client's "Authorized JavaScript origins".
- On the default port, `yarn start` and the container use the same port; do not run both at once.

### Serving on a domain (HTTPS)

You can also serve Locry on a domain; local use keeps working alongside it. Passkeys, the service worker and
in-browser encryption need a secure context, so a domain **requires HTTPS**. The optional Caddy service in the
Compose file gets and renews the certificate automatically. In `.env`:

```bash
COMPOSE_PROFILES=https
LOCRY_DOMAIN=locry.example.com
```

```bash
docker compose up -d --build
```

The domain's DNS record must point to this server, and ports 80/443 must be reachable from outside.

**Each address is a separate vault.** Passkeys are bound to the address they were created on (`localhost`,
`locry.example.com`), and so is browser data. To move your data:

1. Make a backup on one address (file or Google Drive).
2. On the other address, use **Restore from backup**. The backup's passkeys do not work there, so Locry asks for
   the **recovery key** right away.
3. Right after restoring, create a new passkey for that address (Locry suggests it).

The passkey list in Settings shows which address each passkey belongs to. If you use Google Drive, add the domain
to the OAuth client's *Authorized JavaScript origins* as well.

## Free hosting on GitHub Pages

Locry needs no server, so it runs on GitHub Pages for free (the repository must be public). On every push to `main`,
`.github/workflows/pages.yml` runs the tests, builds the app and publishes it at
`https://<user>.github.io/<repository>/` (or at the root of a custom domain).

One-time setup (repository **Settings**):

1. **Pages → Build and deployment → Source:** `GitHub Actions`.
2. Optional, **Secrets and variables → Actions → Variables** (public values, not secrets):
   `LOCRY_GOOGLE_CLIENT_ID`, donation accounts (`LOCRY_DONATE_*`, see `.env.example`) and `LOCRY_GOATCOUNTER`.
3. If Drive is used, add `https://<user>.github.io` to the "Authorized JavaScript origins" of the Google Cloud
   OAuth client.
4. To let anyone (not only listed test users) connect Drive, publish the OAuth app. Google's **Branding** screen
   then asks for an app home page (`https://<user>.github.io/<repository>/`), a privacy policy
   (`https://<user>.github.io/<repository>/privacy`), terms of service (`…/<repository>/terms`; both built in, in
   all 11 languages) and the domain under
   **Authorized domains**. That domain must be verified in Google Search Console, which checks the site's root
   (`https://<user>.github.io/`): put the verification file Search Console gives you in a separate
   `<user>/<user>.github.io` repository, which GitHub serves at that root.

Pages only serves files, so what `scripts/serve.mjs` does per request, `scripts/pages.mjs` does once on the files
after the build: it writes the site address into the pages, `sitemap.xml` and `llms.txt`; adds each language page
as `tr.html` too, so `/tr` opens without a redirect; adds the app shell as `404.html`, so app addresses such as
`/notes` open; adds a redirect page for `/en`; and rebuilds the service worker manifest (with the base path).
`config.json` is written from the repository variables before the build.

To try the same locally:

```bash
npx ng build --base-href /locry/ && SITE_URL=http://localhost:4332/locry node scripts/pages.mjs
```

Notes: Pages sends no custom HTTP headers (the Content Security Policy is in a meta tag already). Vaults and
passkeys are bound to the address, so a vault on Pages is separate from the one on `localhost` (move data with a
backup and the recovery key). The app also works under a subpath instead of the root: fonts, images and in-page
links use relative addresses.

## Vaults

You can use more than one vault: click the vault name in the sidebar → **New vault**. Each vault has its own
passkeys, recovery key, database, backups and settings; only one is open at a time. Switching vaults locks the open
one. Vault names are not encrypted so they can be shown on the lock screen, so choose names that reveal nothing
about the content. When restoring a backup, it is merged into the vault if that vault is on this device, otherwise
it is added as a separate vault. Deleting a vault only deletes the data on this device; backups are untouched.

## Landing page and SEO

The landing page is generated as static HTML in 11 languages at build time (Angular prerendering + hydration):
`/` (English, default), `/tr`, `/zh`, `/es`, `/ar` (right to left), `/pt`, `/id`, `/fr`, `/ja`, `/ru`, `/de`.
Visitors to `/` who did not pick a language on the page are sent to their browser's language; search engines see
each language as a separate page. The old `/en` address redirects permanently to `/`. The page offers a light /
dark / system theme; the screenshots follow the chosen theme.

Design: Fraunces (headings), Geist (text) and Geist Mono (technical details), served with the app from
`@fontsource-variable` (`fonts/`, no CDN): Latin, Latin Extended and (for text) Cyrillic. Chinese, Japanese and
Arabic use system fonts. The fonts of the first screen are preloaded. Search engines and AI crawlers read all of the
content without running JavaScript; the rest of the app runs only in the browser, and no vault data ever exists on
a server.

- Title, description, canonical, `hreflang` (11 languages + x-default), Open Graph and Twitter cards
  (`landing/og-*.jpg`)
- JSON-LD: `SoftwareApplication`, `SoftwareSourceCode`, `WebSite`, `WebPage`, `FAQPage`, `HowTo`
- `robots.txt` (open to AI crawlers too), `sitemap.xml`, `llms.txt`; app pages are `noindex`
- Addresses are placeholders in the build; the server fills them in from `LOCRY_SITE_URL` / `LOCRY_DOMAIN`, so a
  domain change needs no rebuild. The server compresses text with brotli/gzip.
- Lighthouse (local production server): performance 99 on desktop, 83–88 on mobile (slow 4G simulation);
  accessibility, best practices and SEO 100; layout shift 0.

Screenshots are taken from the real app, with sample data in each language (`scripts/screenshot-samples.mjs`) and
a virtual passkey; buttons are found through the app's own translations. The Open Graph cards are drawn from the
same screenshot as HTML in Chrome (so Arabic and CJK text is set properly). Requires Google Chrome, ImageMagick,
`cwebp` and `avifenc`; each language downloads the search model (~200 MB) once:

```bash
npx ng serve --host 127.0.0.1 --port 4320 &
node scripts/screenshots.mjs   # public/landing/<lang>/*.avif|webp, light and dark (LANGS=ja,ar for some languages)
node scripts/og-images.mjs     # public/landing/og-<lang>.jpg
```

The landing text lives in `src/app/features/landing/content/<lang>.ts` (all languages must have the same shape; a
test checks it), the app's text in `src/i18n/<lang>.ts` (keys and placeholders are checked by a test). The list of
languages is in `src/app/core/languages.ts`; the GitHub address in `src/app/core/site.ts`.

## Security model

| Topic | Implementation |
|---|---|
| Vault key | Random 256 bits, only in memory, as a non-extractable `CryptoKey` |
| Unlocking with a passkey | WebAuthn **PRF** extension → HKDF-SHA-256 → key that unwraps the vault key |
| Recovery | 256-bit recovery key (Base32, with checksum) in a separate key slot |
| Data | Each record separately with AES-256-GCM; record type and id bound through AAD |
| Backups | `gzip` → AES-256-GCM; header bound through AAD, key slots in the header |
| Preview | DOMPurify; remote images are not loaded; plus a Content Security Policy (CSP) |
| Storage | Persistent storage is requested from the browser; its state is shown in Settings |

Only the features you turn on connect anywhere: Google Drive backups and sync (`www.googleapis.com`), and the
one-time downloads of the semantic search model and the "Ask your notes" language model (`huggingface.co`). Your
notes leave the device only encrypted.

Passkey PRF support: Chrome/Edge 118+, Safari 18+; iCloud Keychain, Google Password Manager, 1Password or a
hardware security key.

## Google Drive backups

For users: **Settings → Google Drive → Connect with Google**. Backups are written encrypted to a hidden app folder
in Drive (`appDataFolder`) that only Locry can access.

For this, whoever runs the installation has to get a Google OAuth Client ID **once** and put it in
`LOCRY_GOOGLE_CLIENT_ID` in `.env` (it is not a secret; no client secret is needed):

1. Create a project at [console.cloud.google.com](https://console.cloud.google.com) and enable the **Google Drive API**.
2. **OAuth consent screen**: External; app name, support email and a privacy policy link.
3. **Credentials → Create credentials → OAuth client ID** → *Web application*;
   **Authorized JavaScript origins**: `http://localhost:4200` (plus any other ports you use).
4. Publish the app (*In production*). Locry only asks for the `drive.appdata` scope, which Google classifies as
   non-sensitive, so no security review is needed. In *Testing*, only the listed test users can connect.

**Backups from several devices:** each backup is tagged with the device that made it (shown as e.g. "iPhone ·
Safari"). Before backing up to Drive, a device downloads and merges the newest backups of the same vault from other
devices that it has not merged yet, with the same rules as sync: a stale copy never overwrites a newer edit, an edit
beats a delete, and when a note changed on both sides the older version is kept as a "(conflict)" copy. So the
computer's backup also contains the changes made on the phone. The backup list in Settings is grouped by vault, and
"Backups to keep" counts per vault: with 5 vaults kept at 5, Drive holds up to 25 backups. Pruning keeps the newest N
of the vault, whichever device made them, but deletes another device's backup only once its changes were merged here.
Auto backup also runs when nothing changed on this device but another device made a new backup.

**Staying signed in:** Google's browser sign-in (no server, no client secret) gives one-hour access tokens and no
refresh token, and its window may only open from a click. Locry keeps the token and the account's email in the
vault, encrypted like the notes, on this device only (never synced or backed up; *Disconnect* deletes them), so a
lock or reload doesn't ask again, and Google gets the account as a hint, so there is no account picker. Scheduled
backups run by themselves while the token is valid and show "Automatic Drive backup done". Locry never opens Google's
window unasked: once the token has expired, a notice offers **Back up now** (once per unlock) and the sidebar offers
to reconnect sync; with the account hint and the earlier grant, the window then closes by itself.

The value is read at runtime as `/config.json`: in Docker, change `.env` and run `docker compose up -d`; `yarn start`
and `yarn serve:prod` read `.env` too. When `LOCRY_GOOGLE_CLIENT_ID` is empty, each user can enter their own Client ID
in Settings; that option also stays available under **Advanced** when a built-in ID is set.

## Sync across devices (phone + computer)

Google Drive is the go-between for using one vault on several devices; there is no server.

**Setup**

1. Serve Locry on a domain with HTTPS ([Serving on a domain](#serving-on-a-domain-https)). The phone cannot reach
   `localhost` on the computer, and passkeys are bound to the address, so using the same address on both devices
   (`https://locry.example.com`) is easiest.
2. Add `https://locry.example.com` to the *Authorized JavaScript origins* of the OAuth client in Google Cloud. If the
   app is in *Testing*, add your Google account to *Test users* or publish the app.
3. On the computer: **Settings → Sync across devices → Turn on sync**.
4. On the phone: open the address (iPhone: Safari → Share → *Add to Home Screen*; Android: Chrome → *Install app*),
   choose **Restore from backup → Restore from Google Drive**, pick the vault under *Synced vaults* and open it:
   - if your passkeys sync through iCloud Keychain / Google Password Manager, the same passkey works;
   - if not (another address or another ecosystem), open it with the recovery key; Locry suggests a passkey for
     this device.
   The vault is added and its sync turns on by itself.

**How it works**

- Each device writes its own encrypted copy of the vault to the hidden app folder in Drive and reads and merges the
  other devices' copies. Each file is written by one device only, so devices cannot overwrite each other. Google
  only sees file names, sizes, times and the device type (e.g. "iPhone · Safari").
- Deletions are carried as deletion records (kept for 90 days). When a record was deleted on one device and edited
  on another, the edit wins.
- When the same note was changed on two devices, the newer version stays and the older one is kept as a separate
  note named "(conflict)". For tasks and lists, the last change wins.
- Added/removed passkeys, a renewed recovery key, and the vault's name and color sync too. Smart search vectors do
  not sync; each device computes its own.
- Sync only runs while Locry is open: on unlock, when you return to the tab, ~30 s after a change, and every 5
  minutes. Google access lasts about an hour and is dropped on lock; when it expires, the sidebar shows **Connect to
  Google to sync**, which continues with one click.

## Semantic search

Turn it on from the **Search** page or **Settings → Smart search**. The chosen model is downloaded once, cached in
the browser and runs in a Web Worker (WASM). Vectors are stored encrypted; they are left out of backups and sync.

Each vault chooses its own model (Settings → Smart search → Model):

| Model | Download | Vector | Max. text | License | Note |
|---|---|---|---|---|---|
| **EmbeddingGemma 300M** (default) | 195 MB | 768 | 2,048 tokens | Gemma Terms | Most accurate in the TR/EN test; also runs on phones |
| Multilingual E5 Small | 118 MB | 384 | 512 tokens | MIT | Smallest and fastest |
| Multilingual E5 Base | 279 MB | 768 | 512 tokens | MIT | For computers |
| Snowflake Arctic Embed M v2.0 | 311 MB | 768 | 8,192 tokens | Apache 2.0 | Long texts; for computers |
| BGE-M3 | 568 MB | 1024 | 8,192 tokens | MIT | Largest; for computers |

On sample TR/EN vaults (notes + short tasks, 23 queries), the right note came first: Gemma 20/23, E5 Small 19/23,
E5 Base 19/23, Arctic 16/23, BGE-M3 16/23. Similarity scales differ per model, so the thresholds and the correction
weight for short documents that "resemble everything" are calibrated per model (`embedding-protocol.ts`).

**When the model changes:** the new model is downloaded (unless it already was), and all notes and tasks are
embedded again with it in the background, replacing the old vectors. Keyword search keeps working meanwhile. The
old model's files are deleted from the browser unless another vault on this device uses it. Notes, backups and sync
are untouched; the model choice is per device (a phone can use a lighter model). Vaults that turned on smart search
before models were selectable stay on E5 Small.

## Ask your notes

Open it from the **Ask** page in the sidebar (`G` `A`). The question is first looked up with the hybrid search in
your notes and tasks; the results are numbered and given to a small language model, which writes the answer from
them and cites them like `[1]` (click to open the note or task). Agenda questions such as "What do I have to do
today?" are recognized by meaning (when the question is closer to one of 11 agenda phrases, one per language, than
to the notes found), and the answer is written from the open tasks due within a week. When nothing is found, the
model is not asked at all, so it cannot make anything up: the app says it found nothing.

The model is optional, per device, and downloaded once on first use; it needs WebGPU (Chrome/Edge 113+,
Safari 26+). When the graphics card can compute in 16 bits, `q4f16` weights are used, otherwise the larger `q4`
ones. The conversation lives in memory only; when the vault locks, the model stops and the conversation is cleared.
Notes and questions never leave the device. When the model changes or the feature is turned off, the old model's
files are deleted (Settings → Ask your notes).

| Model | Download (q4f16 / q4) | License | Note |
|---|---|---|---|
| **Qwen3 0.6B** (default) | 570 / 919 MB | Apache 2.0 | Fast; follows instructions best in all 11 languages |
| Gemma 3 1B | 764 / 859 MB | Gemma Terms | Strong in English; good Turkish answers too, but sometimes drifts into English |
| Apertus 0.5B | 517 / 811 MB | Apache 2.0 | Experimental: in our trials, answers were often off topic and slow |

Trials (Apple silicon Mac, Chrome, sample Turkish vault, smart search on): Qwen3 and Gemma wrote their answers in
1–5 seconds and found the right sources for questions such as hotel dates or today's tasks, with an occasional wrong
detail (a limit of small models; the page reminds you to check the sources). Apertus 0.5B repeated itself on the
same questions and took 15–40 seconds; loops are cut now, but the answers are poor.

## Donations

If whoever runs Locry sets donation accounts in `.env` (see `.env.example`), a "Support" button appears in the
landing page header and the app's sidebar, leading to a **Support Locry** section on the landing page and a card in
Settings; with none set, nothing is shown. Supported: GitHub Sponsors, Buy Me a Coffee, Ko-fi, Open Collective
(you give the account name, and the link is always built to the platform's own address) and crypto addresses with a
copy button (`LOCRY_DONATE_CRYPTO=BTC:…,ETH:…`). Platforms and common coins (BTC, ETH, USDT, LTC, SOL, DOGE,
XMR, BNB, ADA, XRP, POL, TON, XLM, DOT, ZEC, DASH, BCH; a label such as `USDT-TRC20` works too) show their logo
([Simple Icons](https://simpleicons.org), CC0, bundled with the app); other coins a generic one. There are no payment scripts, iframes or third-party requests;
links open in a new tab.

```bash
LOCRY_DONATE_GITHUB=username
LOCRY_DONATE_KOFI=username
LOCRY_DONATE_CRYPTO=BTC:bc1q…,ETH:0x…
```

The values reach the browser through the server-generated `/config.json`, so changing them only takes a restart
(`docker compose up -d`), no rebuild. For the **Sponsor** button on the GitHub repository, fill in the lines in
`.github/FUNDING.yml`.

## Visitor counts

To see how many people visit the public pages, create a site at [GoatCounter](https://www.goatcounter.com) (free,
open source) and set its code: `LOCRY_GOATCOUNTER=<code>` for `https://<code>.goatcounter.com`, in `.env` or as a
repository variable for GitHub Pages. The landing, privacy and terms pages then count each visit with a single image
request: no script, no cookies, nothing stored in the browser, and nothing when the browser sends Do Not Track or
Global Privacy Control, or on localhost. The app behind the lock screen is never counted. The privacy policy
describes this; with no code set, nothing is sent.

## Keyboard shortcuts

`?` shows the full list. Highlights: `⌘K` quick search, `/` search page, `N` new note, `T` new task,
`G N` / `G T` / `G A` / `G S` navigation, `⌘⇧L` lock, `⌘\` sidebar.

## Development

```bash
yarn test     # unit tests (Vitest)
yarn build    # production build → dist/locry
```

Architecture and phases: [docs/PLAN.md](docs/PLAN.md) (in Turkish).

## License

[MIT](LICENSE) © 2026 Emre Erkan
