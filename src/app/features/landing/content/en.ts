import type { LandingContent } from '../landing-content';

export const en: LandingContent = {
  lang: 'en',
  meta: {
    title: 'Locry — End-to-end encrypted notes and tasks, unlocked with a passkey',
    description:
      'Locry is an open-source, serverless notes and to-do app that runs in your browser. Markdown notes, tasks, passkey login, AES-256 encryption, encrypted sync across devices and private in-browser AI search.',
    ogImageAlt: 'The Locry note editor: a Markdown note with live preview, notes and tasks in the sidebar',
  },
  nav: {
    features: 'Features',
    security: 'Security',
    sync: 'Sync',
    selfHost: 'Self-host',
    faq: 'FAQ',
    open: 'Open Locry',
    skip: 'Skip to content',
  },
  sections: {
    overview: 'Overview',
    features: 'Features',
    tasks: 'Tasks',
    security: 'Security',
    vaults: 'Vaults',
    sync: 'Sync',
    search: 'Smart search',
    compare: 'Comparison',
    selfHost: 'Self-hosting',
    faq: 'FAQ',
  },
  ui: {
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    language: 'Language',
    flow: 'Unlock flow',
    terminal: 'Terminal',
  },
  hero: {
    eyebrow: 'Open source · Serverless · Works offline',
    title: 'Your notes and tasks,',
    accent: 'locked with your key only.',
    lead:
      'Locry is an end-to-end encrypted notes and to-do app that runs in your browser. No account, no password, no server: your vault opens with your fingerprint, face or device PIN — with a passkey.',
    start: 'Start for free',
    resume: 'Open your vault',
    github: 'View on GitHub',
    badges: ['AES-256-GCM', 'Passkeys (WebAuthn PRF)', 'Markdown', 'PWA', '11 languages'],
    screenshotAlt: 'The Markdown editor in Locry: note list on the left, editor and live preview on the right',
    phoneAlt: 'Locry on a phone: the note list',
  },
  summary: {
    title: 'Locry at a glance',
    text:
      'Locry is a free, open-source web app that keeps your notes and tasks on your device, encrypted with a key only you can unlock. Nothing is sent to a server; if you want, it backs up and syncs with your other devices through Google Drive, still encrypted.',
    facts: [
      { term: 'What it is', detail: 'Markdown notes and to-do lists in one app' },
      { term: 'Price', detail: 'Free and open source' },
      { term: 'Account', detail: 'None; you sign in with a passkey' },
      { term: 'Encryption', detail: 'AES-256-GCM per record; the key is derived from your passkey' },
      { term: 'Where data lives', detail: 'On your device, in the browser’s encrypted storage' },
      { term: 'Sync', detail: 'Optional, end-to-end encrypted through Google Drive' },
      { term: 'Platforms', detail: 'Modern browsers; installable on macOS, Windows, Linux, iOS and Android (PWA)' },
      { term: 'Languages', detail: 'English, Turkish, Chinese, Spanish, Arabic, Portuguese, Indonesian, French, Japanese, Russian and German' },
    ],
  },
  features: {
    title: 'Everything you need to take notes, without giving up your privacy',
    lead: 'Locry looks simple but is complete for everyday use. Every feature works inside your encrypted vault.',
    items: [
      {
        icon: 'lucideNotebookPen',
        title: 'Markdown notes',
        text: 'Edit, split and preview modes; toolbar and shortcuts, tags, pinning, archive and checkable task lists.',
      },
      {
        icon: 'lucideListTodo',
        title: 'Tasks',
        text: 'Inbox, Today, Upcoming and Completed views; colored lists, subtasks, priorities, due dates and drag and drop.',
      },
      {
        icon: 'lucideFingerprint',
        title: 'Passkey sign-in',
        text: 'No password. The vault is decrypted with a passkey you unlock by fingerprint, face or device PIN; a recovery key is your backup.',
      },
      {
        icon: 'lucideLayers',
        title: 'Multiple vaults',
        text: 'Fully separate vaults such as Personal and Work, each with its own passkeys, recovery key, backups and settings.',
      },
      {
        icon: 'lucideRefreshCw',
        title: 'Phone and computer',
        text: 'End-to-end encrypted sync through Google Drive. Deletions carry over and conflicting edits are never lost.',
      },
      {
        icon: 'lucideSparkles',
        title: 'Smart search',
        text: 'Search by meaning, not just words. The AI model runs in your browser; your notes are never sent to an AI service.',
      },
      {
        icon: 'lucideArchive',
        title: 'Encrypted backups',
        text: 'Single-file, compressed and encrypted .locry backups, to a file or to Google Drive, automatically if you like.',
      },
      {
        icon: 'lucideWifiOff',
        title: 'Offline and installable',
        text: 'Opens without internet. Install it on your desktop or home screen like an app.',
      },
      {
        icon: 'lucideCommand',
        title: 'Keyboard friendly',
        text: '⌘K command palette, “/” to search, N for a new note, T for a new task and G shortcuts to navigate.',
      },
    ],
  },
  security: {
    title: 'How does the encryption work?',
    lead:
      'In Locry, trust rests on math, not on a server. The key exists only on your device, and only in memory while the vault is open.',
    steps: [
      {
        title: '1. Passkey',
        text: 'When you unlock, your device uses the WebAuthn PRF extension to produce a secret unique to your passkey. It never leaves the device.',
      },
      {
        title: '2. Key',
        text: 'HKDF-SHA-256 derives a key from that secret, which unwraps your vault’s random 256-bit key.',
      },
      {
        title: '3. Records',
        text: 'Every note and task is encrypted separately with AES-256-GCM, bound to its type and id.',
      },
    ],
    tableTitle: 'Security model',
    rows: [
      ['Vault key', 'Random 256 bits; in memory only, non-extractable'],
      ['Sign-in', 'Passkey (WebAuthn PRF) → HKDF-SHA-256'],
      ['Recovery', '256-bit recovery key in a separate key slot'],
      ['Data', 'AES-256-GCM per record, with authenticated context (AAD)'],
      ['Backups and sync', 'gzip + AES-256-GCM; authenticated header'],
      ['Preview', 'Sanitized with DOMPurify, remote images blocked, Content Security Policy'],
      ['Auto-lock', 'The key is wiped from memory after the idle time you choose'],
    ],
    note: 'If you lose both your passkeys and your recovery key, nobody — not even Locry — can access your data. That is not a flaw; it is the design.',
  },
  vaults: {
    title: 'Personal and work, in separate vaults',
    text:
      'Each vault is independent: its own encryption key, passkeys, recovery key, backups and settings. Switching vaults locks the open one; one vault’s data is never visible from another.',
    bullets: [
      'Pick a vault on the lock screen; the last one is remembered',
      'Give vaults a name and color; switch from the sidebar in one click',
      'Restoring a backup merges into the same vault, or adds it as a new one',
    ],
    alt: 'The Locry lock screen: choosing a vault and unlocking with a passkey',
  },
  sync: {
    title: 'The same vault on your phone and your computer',
    lead:
      'There is no Locry server for sync. Each device writes its own encrypted copy of the vault to a hidden app folder in your Google Drive and merges the copies of your other devices.',
    bullets: [
      'Google only sees encrypted files; never content, titles or tags',
      'Notes and tasks you delete are deleted on your other devices too',
      'If a note changed on two devices, the older version is kept as a “(conflict)” note',
      'Added passkeys and the vault’s name and color sync as well',
      'Runs while the app is open: on unlock, when you return to the tab and after changes',
    ],
    stepsTitle: 'How to set it up',
    steps: [
      'On your computer: Settings → Sync across devices → Turn on sync.',
      'On your phone, open Locry at the same address and add it to the home screen.',
      'Restore from backup → Google Drive → pick your vault under Synced vaults.',
      'Unlock with your synced passkey or your recovery key; sync starts by itself.',
    ],
    alt: 'Sync across devices in Locry settings, with the devices syncing the vault',
  },
  search: {
    title: 'AI that searches by meaning and keeps your privacy',
    text:
      'Search for “vacation plans” and find your “Hotel booking in Lisbon” note too. The default model is Google’s EmbeddingGemma, and Settings offers five multilingual models to choose from. The model is downloaded once and runs entirely in your browser.',
    bullets: [
      'Keyword and semantic search together, in any of the app’s languages',
      'Vectors are stored encrypted and stay out of backups and sync',
      '“Similar notes” suggestions; ⌘K to search from anywhere',
      'Opt-in: nothing is downloaded unless you turn it on',
    ],
    alt: 'The Locry search page: semantic results across notes and tasks',
  },
  tasks: {
    title: 'Tasks, right next to your notes',
    text: 'See what to do in the Today view, never miss overdue work, and link tasks to the notes they belong to.',
    bullets: [
      'Smart views: Inbox, Today, Upcoming, Completed',
      'Colored lists, subtasks, priorities and due dates',
      'Drag-and-drop ordering, quick add with T',
    ],
    alt: 'Tasks in Locry: the Today view with priorities and due dates',
  },
  selfHost: {
    title: 'Run it on your own server',
    lead:
      'Locry is open source and consists of static files only. It runs in Docker with one command, and can serve your own domain with automatic HTTPS.',
    code: 'git clone https://github.com/emreerkangames/locry.git\ncd locry\ncp .env.example .env\ndocker compose up -d --build',
    notes: [
      'The container holds no data: notes stay encrypted in the browser, so removing the container changes nothing.',
      'Non-root user, read-only file system, dropped capabilities.',
      'With COMPOSE_PROFILES=https and LOCRY_DOMAIN, Caddy gets the certificate automatically.',
    ],
    github: 'Source code and setup docs',
  },
  compare: {
    title: 'Locry compared with typical cloud note apps',
    lead: 'Most note apps keep your data on their servers and can read it. Locry makes that impossible from the start.',
    headers: ['', 'Typical cloud note app', 'Locry'],
    rows: [
      ['Where your data lives', 'On the company’s servers', 'On your device, encrypted'],
      ['Who can read it', 'The service provider', 'Only you'],
      ['Sign-in', 'Email and password', 'Passkey, no password'],
      ['Account', 'Required', 'Not needed'],
      ['Offline', 'Limited', 'Full'],
      ['AI search', 'Notes are sent to a server', 'Runs in your browser'],
      ['Source code', 'Closed', 'Open'],
    ],
  },
  faq: {
    title: 'Frequently asked questions',
    items: [
      {
        q: 'What is Locry?',
        a: 'Locry is a free, open-source app that runs in your browser and stores Markdown notes and tasks end-to-end encrypted. It needs no account or password; the vault opens with a passkey.',
      },
      {
        q: 'Where is my data stored?',
        a: 'On your device, encrypted, in the browser’s IndexedDB storage. Locry has no server that keeps your data. If you turn on Google Drive backups or sync, only encrypted files go to Drive.',
      },
      {
        q: 'Is Locry free?',
        a: 'Yes. Locry is free and open source; the source code is on GitHub. You can also run it on your own server with Docker.',
      },
      {
        q: 'What is a passkey, and why is there no password?',
        a: 'A passkey is a phishing-resistant way to sign in with your fingerprint, face or device PIN. Locry derives its encryption key from the passkey through the WebAuthn PRF extension, so there is no password to guess or leak.',
      },
      {
        q: 'What happens if I lose my passkey?',
        a: 'You open the vault with the 256-bit recovery key you saved during setup and add a new passkey. If you lose both your passkeys and the recovery key, nobody can access the data.',
      },
      {
        q: 'How do I sync between my phone and my computer?',
        a: 'Turn on Sync across devices in Settings; on your phone, open Locry at the same address and choose Restore from backup → Google Drive → your vault under Synced vaults. Each device writes its own encrypted copy to Drive and merges the others.',
      },
      {
        q: 'Can Google read my notes?',
        a: 'No. Backup and sync files are encrypted with AES-256-GCM on your device before they reach Drive. Locry only accesses its own hidden app folder (drive.appdata) and cannot see your other Drive files.',
      },
      {
        q: 'Does the AI search send my notes anywhere?',
        a: 'No. The multilingual language model is downloaded once and runs in a Web Worker in your browser. Your notes are never sent to an AI service.',
      },
      {
        q: 'Does it work offline?',
        a: 'Yes. Locry is an installable web app (PWA) and works offline after the first visit. Only Drive sync and the first model download need the internet.',
      },
      {
        q: 'Which browsers and devices are supported?',
        a: 'Browsers that support passkeys with the PRF extension: Chrome and Edge 118+, Safari 18+. iCloud Keychain, Google Password Manager, 1Password or a hardware security key work.',
      },
      {
        q: 'Can I export my data?',
        a: 'Yes. Download a single-file encrypted .locry backup from Settings; it opens on another device or address with a passkey or the recovery key.',
      },
    ],
  },
  cta: {
    title: 'Keep your notes yours.',
    text: 'Setup takes a minute: name your vault, create a passkey, save your recovery key.',
    start: 'Use Locry for free',
    github: 'See the source code',
  },
  footer: {
    tagline: 'End-to-end encrypted notes and tasks.',
    openSource: 'Open source',
    madeWith: 'Built with Angular, Web Crypto and WebAuthn, without a server.',
    links: 'Links',
  },
  howTo: {
    name: 'Create an encrypted vault in Locry',
    description: 'Steps to create an end-to-end encrypted notes and tasks vault in Locry that opens with a passkey.',
    steps: [
      { name: 'Open Locry', text: 'Open Locry in your browser and click “Start for free”.' },
      { name: 'Name your vault', text: 'Pick a name and a color for the vault, for example “Personal”.' },
      { name: 'Create a passkey', text: 'Create a passkey with your fingerprint, face or device PIN.' },
      { name: 'Save the recovery key', text: 'Save the recovery key in your password manager and confirm one of its groups.' },
    ],
  },
};
