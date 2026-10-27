# Locry — Project Plan

An encrypted **todo list** and **Markdown notes** app that runs entirely in the browser, with no backend.

## Core principles

- **No backend.** All data lives in the browser (IndexedDB). The only outgoing traffic: Google Drive backups the user explicitly starts, and downloading the embedding model on first use.
- **Everything encrypted.** No plain text on disk (IndexedDB) or in backups. The decryption key lives only in memory, while the vault is open.
- **No password, a passkey instead.** For recovery, a recovery key shown once.
- **Interface:** Angular 22 + Spartan UI + Tailwind v4, TR/EN switchable at runtime.

## Technology choices

| Topic | Choice | Why |
|---|---|---|
| UI | Angular 22 (standalone, signals, zoneless), Spartan UI (vega), Tailwind v4 | Existing setup |
| Icons | `@ng-icons/lucide` | Works with Spartan |
| i18n | `@jsverse/transloco` | Language switching at runtime (Angular's built-in i18n is compile-time) |
| Storage | IndexedDB (`idb`) | Large data, binary data, quota |
| Cryptography | Web Crypto API (AES-256-GCM, HKDF-SHA-256) | Built into the browser, no extra dependency |
| Passkey | WebAuthn + **PRF extension** | The standard way to derive an encryption key from a passkey |
| Compression | `CompressionStream('gzip')` | Built into the browser |
| Markdown | `marked` + `DOMPurify` | Fast, output sanitized against XSS |
| Semantic search | `@huggingface/transformers` (Web Worker, WebGPU → WASM fallback), `multilingual-e5-small` | In the browser, multilingual (TR/EN), ~120 MB |
| Drive | Google Identity Services (token client) + Drive REST v3, `drive.appdata` scope | Needs no backend, only the app's own hidden folder |
| Tests | Vitest (Angular CLI) + `fake-indexeddb` | |

## Security architecture

### Key hierarchy

```
Vault Key (VK)  — random 256 bits, encrypts all data, never stored in plain form
 ├─ Key slot: passkey #1  →  KEK = HKDF(PRF output, salt)  →  AES-GCM(KEK, VK)
 ├─ Key slot: passkey #2  →  ...
 └─ Key slot: recovery    →  KEK = HKDF(recovery key, 256 bits)  →  AES-GCM(KEK, VK)
```

- **Unlocking with a passkey:** `navigator.credentials.get()` + `prf.eval` → a 32-byte secret from the authenticator → KEK → VK is unwrapped. User verification (biometrics/PIN) is required.
- **Recovery key:** 256 random bits, shown grouped in Crockford Base32 (e.g. `7K3M-Q9XA-...`), only once during setup; the user is asked to confirm it.
- **Can passkeys be backed up?** A passkey's private key never leaves the authenticator; iCloud Keychain / Google Password Manager / 1Password sync it. Backups include the **key slots** (passkey ID + VK wrapped with that passkey), so a synced passkey can open the backup on another device. With no passkey at all, the recovery key opens it.
- **rpId** is `localhost`; passkeys stay valid as long as the app runs on the same origin (`http://localhost:4200`).
- **Without PRF support** (old browser/authenticator) setup stops with a clear error message; there is no fallback to an unencrypted mode.

### Record encryption

- Every record (note, task, setting, embedding) is encrypted separately: `AES-GCM(VK, iv=random 96 bits, aad = "locry:v1:<type>:<id>")`.
  Thanks to the AAD, swapping one encrypted record for another is detected.
- The only things kept in plain form in IndexedDB: record ID, type, and the vault header (key slots, version). The header holds an encrypted check value to confirm it can be decrypted.
- **Auto-lock:** after inactivity (10 min by default, adjustable) and manually; locking drops the VK from memory. After a page reload the vault opens locked.

### Backup file (`.locry`)

```
[magic "LOCRY" + version] [header JSON: key slots, iv, creation date] [AES-GCM( gzip( JSON of all records ) )]
```

- Compressed first, then encrypted. Embeddings are not included in backups (they are recomputed on restore).
- Restore: with a passkey or the recovery key; **merge** or **replace**.
- The same format is used for local file export/import and for Google Drive.

## Phases

### Phase 1 — Foundation and secure vault ✅ done
- App skeleton: sidebar layout, routing, light/dark theme, TR/EN
- Crypto core: AES-GCM, HKDF, key slots, Base32 recovery key
- Encrypted IndexedDB storage layer
- Creating and unlocking a vault with a passkey (PRF), unlocking with the recovery key
- Setup wizard, lock screen, recovery screen, auto-lock, route guard
- Unit tests (crypto, key slots, storage)

### Phase 2 — Notes and tasks ✅ done
- ✅ Markdown notes: edit/split/preview modes, toolbar and shortcuts (⌘B/⌘I/⌘K),
  list continuation, ticking task boxes from the preview, tags, pinning, archive, autosave,
  automatic deletion of empty notes, search insensitive to Turkish characters
- ✅ Preview security: sanitized with DOMPurify, external images are not loaded, links get `noopener noreferrer`
- ✅ Tasks: Inbox / Today (including overdue) / Upcoming / Completed views,
  colored user lists (deleting one moves its tasks to the Inbox), drag-and-drop ordering,
  priority, due date, subtasks, description, link to a note, today's task badge in the sidebar
- ✅ Notes and tasks share the encrypted collection infrastructure (`injectEncryptedCollection`)
- ✅ Text search in the notes list (in memory, over decrypted data); a shared search page for notes and tasks came with Phase 5

### Phase 3 — Backups and passkey management ✅ done
- ✅ `.locry` export/import: gzip + AES-256-GCM, bound to the header through AAD; merge (last writer wins) / replace,
  atomic write in a single IndexedDB transaction
- ✅ Starting from a backup on the setup screen of a new device (with a synced passkey or the backup's recovery key)
- ✅ Settings: add a passkey (re-verifying with an existing passkey or the recovery key; registering the same device
  twice is blocked) / rename / remove (the last passkey is protected), renew the recovery key
  (the old one stays valid until the new one is confirmed), last backup date

### Phase 4 — Google Drive ✅ done
- ✅ The user's own Google Cloud Client ID (with setup steps), GIS token model, `drive.appdata` scope;
  the Google script loads only when Drive is used, the access token lives only in memory and is dropped on lock
- ✅ Back up to Drive (resumable upload above 5 MB), list, restore (merge/replace), delete;
  the last N backups of this vault are kept, other vaults' backups are left alone
- ✅ Starting from Drive on the setup screen of a new device
- ✅ Automatic backup (daily/weekly, while the app is open); with no token, a clickable notification asks

### Phase 5 — Semantic search (local model) ✅ done
- ✅ Transformers.js 4 in a Web Worker, `Xenova/multilingual-e5-small` (q8, ~120 MB, WASM). Measured: on TR/EN test
  queries the same quality as fp32 (8/9 in first place), better than `paraphrase-multilingual-MiniLM-L12-v2`.
  The ONNX runtime ships with the app (no CDN); the only network access is downloading the model.
- ✅ Optional (off by default); notes and tasks are split into chunks and embedded, vectors are stored encrypted,
  only changed documents are recomputed, vectors are not included in backups
- ✅ Hybrid search: keyword + meaning; the semantic threshold follows the query's own score distribution (z-score)
- ✅ Search page (All/Notes/Tasks, highlighted excerpts), ⌘K command palette, "similar notes" in a note,
  jumping straight from search to a task, smart search card in Settings

### Phase 6 — Polish ✅ done
- ✅ PWA: installable, opens offline (Angular service worker), new version notice, Locry icons
  (regular + maskable); local production server with `yarn serve:prod` (localhost only)
- ✅ Content Security Policy (CSP); persistent storage request and usage info
- ✅ Keyboard shortcuts (`?` for help), returning to the previous page after unlocking (`?next=`, protected against
  open redirects), translated page titles
- ✅ Lighthouse: accessibility / best practices / SEO 100

### Phase 7 — Multiple vaults ✅ done
Decisions: vaults are fully independent (separate key, passkeys, recovery key, backups and settings);
only one is open at a time.
- ✅ The vault registry is a separate IndexedDB (`locry-vaults`): ID, name, color, order. Name and color are
  unencrypted so the lock screen can show them; content and keys are encrypted as always.
- ✅ Each vault has its own IndexedDB (`locry-vault-<vaultId>`); the single-vault version's `locry` database is
  registered as a vault on first launch, no data is moved.
- ✅ Vault picker on the lock screen (remembers the last one used), "New vault", "Add vault from backup"; a vault
  switcher in the sidebar (locks the open vault and goes to the chosen one's lock screen); name / color / delete in
  Settings (re-verifying with a passkey or the recovery key; file and Drive backups are left alone).
- ✅ Passkeys appear in password managers as "Locry · <vault name>". The planned "find the vault from the passkey"
  was not built: each vault has a different PRF salt, and supplying the right salt before a passkey is chosen needs
  `evalByCredential` (Safari support unclear); the same `user.id` can overwrite the old passkey in some password managers.
- ✅ Per-vault preferences (last backup, Drive automatic backup / retention, smart search); language, theme, auto-lock
  and Client ID are app-wide. The vector index lives in the vault's own database.
- ✅ The vault's name and color travel inside the backup's encrypted content. Restoring from the lock screen: if a
  vault with the same ID exists it is opened and merged, otherwise it is added as a new vault.
- ✅ Tests: vault separation and switching, last vault after reload, renaming, registering the old database,
  deletion, adding a separate vault from a backup and merging into the same vault.

### Phase 8 — Sync across devices (phone + computer) ✅ done
Decisions: HTTPS on your own domain (Caddy profile), automatic sync through Drive, a copy on conflict.
- ✅ **Deletion records:** deleting notes, tasks and lists leaves an encrypted deletion record (90 days); vectors and
  sync state stay on the device only, are not synced and are not included in backups.
- ✅ **Sync files:** each device writes only its own file (`appDataFolder`, backup format + deletion records;
  `locrySync`, vault and device ID as app properties). Unchanged content is not uploaded again;
  files already seen are skipped by `modifiedTime`. Sync copies don't appear in the backup list and are not pruned.
- ✅ **Three-way merge:** the last agreed version of each record is kept locally, encrypted. A change on one side
  is taken; when both sides changed, an edit beats a deletion, for notes the older version becomes a "(conflict)"
  copy, for tasks the latest change wins. Reordering tasks now updates `updatedAt`.
- ✅ **Vault header:** passkey slots are merged; removed slots and the old recovery key don't come back thanks to
  `removedSlotIds`. The header is the AAD of the file opened with the vault key, so it cannot be altered. The vault's
  name and color are synced too (with timestamps).
- ✅ **Timing:** on unlock, on returning to the tab, 30 s after a change, every 5 minutes; only while open.
  With no token, no pop-up opens in the background; the sidebar says "Connect to Google to sync".
- ✅ **Interface:** sync card in Settings (on/off, status, last sync, syncing devices), status indicator in the
  sidebar, a notification when a conflict happens in the background.
- ✅ **New device:** "Synced vaults" on the restore screen → the vault is added and its sync turned on.
- ✅ **Mobile:** picking a page from the menu closes the side menu; notes, tasks, settings and the lock screen were
  checked on narrow screens. Docs: setup steps and how it works in the README.
- ✅ Tests: merge rules, header merging, end-to-end sync with two fake devices (edit, delete,
  conflict, passkeys and vault name), waiting without a token, keeping sync copies apart from backups.

### Phase 9 — Landing page, SEO and AI search ✅ done
Decisions: `/` Turkish, `/en` English landing; app addresses unchanged (entry `/app`); open source (GitHub);
real screenshots. (Phase 12 later made English the default.)
- ✅ Angular static prerendering (`outputMode: static`) + hydration only for `/` and `/en`; other routes render on
  the client from `index.csr.html`. Code using the vault, IndexedDB, `localStorage` and `location` doesn't run on the
  server. Incremental hydration and event replay are off (they need an inline script, which the CSP forbids).
- ✅ Content: hero, Locry in brief (a quotable definition + facts), features, tasks, encryption diagram and
  security model, multiple vaults, sync, smart search, comparison, self-hosting, FAQ, CTA.
  If this device has a vault, the buttons become "Open your vault" (after hydration).
- ✅ SEO: meta, canonical, hreflang, OG/Twitter cards, JSON-LD (SoftwareApplication, SoftwareSourceCode,
  WebSite, WebPage, FAQPage, HowTo), robots.txt, sitemap.xml, llms.txt, noindex on app pages.
  Addresses are filled in on the server from `LOCRY_SITE_URL` / `LOCRY_DOMAIN`.
- ✅ Images: `scripts/screenshots.mjs` (Chrome + virtual passkey + sample data, TR/EN, light/dark, AVIF/WebP,
  1080/2160 srcset), `scripts/og-images.mjs`. The theme script runs before first paint (no flicker).
- ✅ Server: prerendered pages, brotli/gzip, only hashed files cached long-term; the service worker fetches the
  landing page from the network.
- ✅ Fixed along the way: a race between loading and writing in encrypted collections (new test), a centering fix in
  semantic search for short documents that "resemble everything" (TR correct first result 7/12 → 9/12, EN 7/11 → 10/11,
  unrelated matches halved), Markdown table lines in search excerpts.
- ✅ Lighthouse: desktop 100/100/100/100; mobile performance 92–94, accessibility / best practices / SEO 100.

### Phase 10 — Selectable embedding models ✅ done
- ✅ Five models, chosen per vault: EmbeddingGemma 300M (default, q4 `no_gather` — the browser's WASM runtime lacks
  plain q4's GatherBlockQuantized operation), Multilingual E5 Small / Base, Snowflake Arctic Embed M v2.0,
  BGE-M3. The model catalog holds the repository, loading format, pooling, prefixes, size and calibration.
- ✅ Measured (TR/EN, 23 queries): correct note in first place Gemma 20/23, E5 Small/Base 19/23, Arctic and BGE-M3 16/23.
  Per-model hubness weight, z threshold, absolute floor for few documents, and a similar-notes floor.
- ✅ In vaults with fewer than 15 documents, the model's absolute floor instead of the z-score.
- ✅ Switching models: a confirmation dialog (size, document count), the worker restarts with the new model, all
  documents are re-embedded, unused model files are removed from the browser cache; vaults opened before stay on E5 Small.
- ✅ Along the way: the production server's compression cache mixed up new HTML of the same length with the old
  version (now keyed to the file's modification time).

### Phase 11 — Merging backups across devices ✅ done
- ✅ Drive backups are tagged with the device ID and name; pruning deletes only this device's backups (before, a
  device that backed up often could delete the backup that was another device's only copy).
- ✅ Before backing up, the newest backups from other devices that this device hasn't merged yet are merged;
  backups carry deletion records too. Automatic backup also runs with no local changes when a new foreign backup exists.
- ✅ Merge engine fixed: "did they change it" is now measured against the state last seen from that device, "did I
  change it" against what this device last published. With the previous single common base, an old copy (an old
  backup, or a device that hadn't seen a new edit yet) could overwrite a newer edit. Downloading a file backup and
  restoring from a backup also count as publish/common state; no needless conflict copy on first contact.
- ✅ Sync and backup run through the same merger, one after the other (`SnapshotMerger`).
- ✅ Tests: merging and keeping the phone's backup, carrying deletions, an old backup not overwriting a new edit,
  automatic backup for a foreign backup with no changes, merge rules.

### Phase 12 — Landing redesign ✅ done
- ✅ Editorial design: Fraunces headings, Geist body text, Geist Mono technical labels; numbered sections, thin
  rules, a single warm accent color; no gradients, glow or card grids. A real flow diagram in the encryption section.
- ✅ Light / dark / system theme (in the header and footer); screenshots follow the chosen theme.
- ✅ Default language English (`/`), Turkish at `/tr`; visitors whose browser language is Turkish are redirected, the
  language picked on the page is remembered and applied to the app as well. `/en` → `/` permanent redirect; hreflang,
  sitemap, llms.txt updated.
- ✅ Fonts under `/fonts`, Latin + Latin Extended only, those on the first screen preloaded (CLS 0).
- Lighthouse: desktop performance 99; mobile 83–88 (the previous system-font design 92–94); other categories 100.

### Phase 13 — 11 languages ✅ done
- ✅ Interface languages: English (default), Turkish and nine more of the most used languages on the web — Chinese
  (simplified), Spanish, Arabic, Portuguese (Brazil), Indonesian, French, Japanese, Russian, German.
  The language list lives in one place (`core/languages.ts`): names, BCP 47 tags, Open Graph locales, direction.
- ✅ On first launch the browser's language is picked (if supported), otherwise English. Settings and the menu show
  language names in their own language.
- ✅ Full right-to-left Arabic: `<html dir="rtl">`, the sidebar and task detail panel switch sides, directional
  arrows are mirrored; physical margins in Spartan components were converted to logical classes.
- ✅ Translation tests: every language has the same keys and the same `{{placeholders}}` as English, none empty.
- ✅ Landing page in 11 languages, each prerendered as its own static HTML (`/`, `/tr`, `/zh`, `/es`, `/ar`, `/pt`,
  `/id`, `/fr`, `/ja`, `/ru`, `/de`); texts load as a separate chunk per language. Language menu in the header, all
  languages in the footer; visitors to `/` are sent to their browser's language. hreflang (11 languages + x-default),
  sitemap, llms.txt and JSON-LD translation links updated.
- ✅ Fonts: Geist Cyrillic for Russian; Chinese, Japanese and Arabic use system fonts (no preloading, italic emphasis
  and letter spacing off, Japanese headings break at phrase boundaries).
- ✅ Screenshots retaken in every language (with that language's sample notes, tasks and search query; the app right
  to left in Arabic). OG cards are drawn as HTML in Chrome, so Arabic and CJK headlines lay out correctly.
- ✅ Along the way: going from the landing page to the app switches the page's language/direction back to the app's;
  the comparison table no longer overflows the page on narrow screens (noticed in Arabic).
- ⚠️ Translations were made with AI; a review by native speakers is recommended.

### Phase 14 — Ask your notes ✅ done
- ✅ Answers to questions from your own notes and tasks: hybrid search (keyword + meaning) finds relevant documents,
  results below 60% of the best one are dropped, the rest go to a small language model as numbered sources; the
  answer streams in, `[n]` citations become note/task links, numbers that aren't sources are dropped.
- ✅ Three models, chosen per device, downloaded once on first use: Qwen3 0.6B (default, thinking mode off),
  Apertus 0.5B (experimental), Gemma 3 1B. Transformers.js + WebGPU, a separate Web Worker; `q4` without `shader-f16`.
  Without WebGPU the feature is disabled with an explanation.
- ✅ Agenda questions are recognized in any language: when the question is closer to the agenda sentences in 11
  languages than to the notes found (same embedding model, document scale), open tasks due within a week become
  sources. With smart search off, only when nothing else is found.
- ✅ With no sources the model is not called ("not found"); repetition loops are cut; Markdown answers become plain text.
- ✅ Privacy: the chat lives only in memory; locking the vault stops the model and clears the chat. Model file
  cleanup is shared between embedding and language models (`model-cache.ts`); neither deletes the other's files.
- ✅ Interface texts in 11 languages; **Ask** in the sidebar, `G` `A` shortcut, an entry in the command palette, a card in Settings.
- ✅ Tests: prompt (source numbers, task status, budget, history), citations, thinking block, loop cutting, the model
  not being called without sources, dropping weak results, agenda, clearing the chat on lock.
- Trials: Qwen3 and Gemma answered in 1–5 s with the right sources; Apertus 0.5B repeated itself and went off topic
  (even with the right chat template and sampling), so it is marked "experimental".

### Phase 15 — Donations ✅ done
- ✅ GitHub Sponsors, Buy Me a Coffee, Ko-fi, Open Collective and crypto addresses; all optional, from `.env`
  (`LOCRY_DONATE_*`), delivered at runtime through `/config.json`: changing them needs no rebuild.
- ✅ Only account names are accepted; the link is always built to the platform's own address (validated twice, on
  the server and in the browser); URLs or malformed values are skipped with a warning. No payment script, iframe or
  third-party request.
- ✅ A "Support Locry" section on the landing page (after hydration, the static HTML stays the same), a card in
  Settings, a copy button for crypto addresses; texts in 11 languages.
- ✅ One invalid setting no longer drops the others (before, a bad Client ID emptied the whole config).
- ✅ README, `.env.example`, `compose.yaml`, and a `.github/FUNDING.yml` for GitHub's "Sponsor" button.

### Phase 16 — GitHub Pages ✅ done
- ✅ `.github/workflows/pages.yml`: on push to `main`, test, build (`--base-href` = the Pages subpath), prepare and
  deploy; `config.json` from repository variables (Google Client ID, donation accounts).
- ✅ `scripts/pages.mjs`: fills in the site address placeholder, `<lang>.html` for language pages, `404.html` for app
  addresses, the `/en` redirect, `.nojekyll`; rebuilds the service worker manifest with the subpath and the language
  page exclusions (ngsw-config doesn't add the subpath to navigation patterns itself).
- ✅ Subpath support: fonts (`url(fonts/…)`, left unresolved at build time through `externalDependencies`), landing
  images, font preloads and in-page links are relative; in the browser, the site address is the canonical link's
  origin + the document base.
- ✅ Tested with a local server that behaves like Pages: language pages, deep links through `404.html`, creating a
  vault, opening a note and reloading, service worker; root (`/`) builds and Docker work unchanged.

### Phase 17 — Launch: legal pages, sharing and visitor counts ✅ done
- ✅ Privacy policy and terms of service in 11 languages (`/privacy`, `/terms`, `/<lang>/…`), prerendered, linked from
  the landing footer and Google's OAuth consent screen; Google API Limited Use statement.
- ✅ Sharing images (Open Graph) redrawn in the landing style for every language, versioned so chat apps refetch them.
- ✅ Flags next to the language choices; the update notice in the page's language; the installed app opens on the
  lock screen instead of the landing page.
- ✅ Visitor counts with GoatCounter (`LOCRY_GOATCOUNTER`), on the public pages only: a single image request, no
  script, no cookies; nothing under Do Not Track, Global Privacy Control, automation or localhost. The app is never
  counted. The privacy policy describes it.
- ✅ README "Try it live" buttons; GitHub "Sponsor" button.

### Phase 18 — Staying connected to Drive, backups per vault ✅ done
- ✅ Google's browser sign-in gives one-hour tokens and no refresh token (that would need a server with a client
  secret). The token and the account's email are now kept in the vault, encrypted, local-only (never synced or backed
  up, deleted on disconnect), so a lock or reload no longer asks again; Google gets the account as `login_hint`, so
  no account picker.
- ✅ Google's window never opens unasked: scheduled backups run by themselves while the token is valid (with the
  usual "Automatic Drive backup done" toast); once it has expired, a toast offers a button, once per unlock, and the
  window then closes by itself. (Renewing on the next click was tried and dropped: a window popping up unasked was
  more disturbing than a button.)
- ✅ Backup list grouped by vault (open vault first, vaults not on this device by short id); "Backups to keep" per
  vault across devices, deleting another device's backup only after merging it.
- ✅ Sync: runs as soon as Drive is connected again; on phones, pending changes upload when the app goes to the background.

### Phase 19 — Motion ✅ done
- ✅ Page transitions with the browser's View Transitions (`withViewTransitions`): only the content area moves, and
  only between sections (Notes → Tasks, lock screen → app); opening another note or task list stays instant.
- ✅ New list items rise in (`animate.enter`); ticking a task pops the box, draws the tick and strikes the title through
  before it moves to Completed (320 ms).
- ✅ Lock screen: the lock snaps shut on entry and shows open for a moment after unlocking.
- ✅ Landing: sections rise in with CSS scroll-driven animations (no JavaScript, prerendered HTML unchanged; skipped
  where unsupported), the key flow lights up stage by stage, screenshots lift on hover.
- ✅ All of it is off with "reduce motion"; 150–420 ms, ease-out.

### Phase 20 — Accessibility ✅ done
- ✅ axe-core 4.14 (WCAG 2.2 AA + best practices) over the landing, legal pages, setup, lock screen, notes, tasks,
  settings, search and Ask, light and dark, Turkish and Arabic: 7 kinds of issues → 0.
- ✅ Markdown preview checkboxes are named after their item; label/name mismatches fixed (support link, language menu,
  vault switcher); empty comparison header cell is a `td`; setup's recovery step has an `h1`; the sidebar is a
  navigation landmark.
- ✅ Contrast: light-theme muted text darkened to 5:1 on grey; note dates and the storage warning fixed.
- ✅ Reordering tasks without dragging (WCAG 2.5.7): move up/down buttons (24 px, always shown on touch screens) and
  Alt+↑/↓, focus kept on the moved task; the drag handle is hidden from screen readers.
- ✅ "Skip to content" in the app, as on the landing page (a button: a #fragment would leave the app under a base path).

## Setup notes

- Requires Node 24 (`.nvmrc`): `nvm use`
- Development: `yarn start` → http://localhost:4200
- Daily use (offline, installable): `yarn serve:prod` → http://localhost:4200
- Passkey PRF support: Chrome/Edge 118+, Safari 18+; on macOS, iCloud Keychain, Google Password Manager, 1Password or a hardware key.
