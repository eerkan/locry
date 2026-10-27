import type { PrivacyContent } from '../privacy-content';

export const en: PrivacyContent = {
  lang: 'en',
  meta: {
    title: 'Privacy Policy — Locry',
    description:
      'Locry keeps your notes and tasks encrypted on your device. No server, no account, no tracking. What Locry stores, what Google Drive and AI model downloads involve, and how you stay in control.',
  },
  title: 'Privacy Policy',
  updated: 'Last updated',
  intro:
    'Locry is a free, open-source notes and tasks app that runs entirely in your browser. This policy explains what data it handles. In short: your notes never reach the developer, there is no server that stores them, no account and no tracking.',
  sections: [
    {
      heading: 'What Locry stores, and where',
      body: [
        'Your notes, tasks, lists and settings are stored only on your device, in your browser’s storage (IndexedDB), encrypted with AES-256-GCM. The key is derived from your passkey (or your recovery key) and exists only in your device’s memory while the vault is open. The developer has no access to your data and holds no copy of it.',
        'So the lock screen can be shown before unlocking, a few things are stored on the device unencrypted: vault names and colors, and app preferences such as language and theme.',
      ],
    },
    {
      heading: 'No account, ads or tracking',
      body: [
        'Locry has no sign-up and no user accounts. It uses no advertising, no cookies for tracking and no third-party trackers. The app itself (your vaults, notes, tasks and questions) is never counted or measured.',
        'Only the public pages of this site (the home page, this policy and the terms) count visits with [GoatCounter](https://www.goatcounter.com), open-source analytics that respects privacy: no cookies, nothing stored on your device and no personal data. It records the page address, the site you came from, the screen size, and the browser, operating system and country derived from the request; your IP address is not stored. Visits are not counted when your browser sends Do Not Track or Global Privacy Control.',
      ],
    },
    {
      heading: 'Google Drive (optional)',
      body: [
        'If you connect Google Drive for backups or sync, Locry asks only for the drive.appdata permission: a hidden folder in your Drive that only Locry can access. It cannot see, read or change any of your other Drive files.',
        'Everything is encrypted on your device before it is uploaded, so Google stores only encrypted data, along with file names, sizes, times and a device label (for example “iPhone · Safari”). The access token Google issues is kept only in memory and is dropped when the vault locks. You can disconnect at any time in Settings or in your [Google Account permissions](https://myaccount.google.com/permissions).',
        'Locry’s use and transfer of information received from Google APIs adheres to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements. That information is used only to store and read your own encrypted backups and sync copies; it is not shared with anyone, not used for advertising and not read by humans.',
      ],
    },
    {
      heading: 'AI features (optional)',
      body: [
        'If you turn on smart search or “Ask your notes”, the AI model files are downloaded once from Hugging Face (huggingface.co). As with any download, Hugging Face can see your IP address and which files were requested. Your notes and questions are processed only on your device and are never sent to any AI service.',
      ],
    },
    {
      heading: 'Hosting',
      body: [
        'This site is served by GitHub Pages. Like any web host, GitHub may log technical data such as IP addresses for security purposes; see the [GitHub Privacy Statement](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement). If you use Locry on someone else’s server, its operator’s policies apply to that server.',
      ],
    },
    {
      heading: 'Donations',
      body: [
        'Donation links lead to external platforms (such as GitHub Sponsors or Ko-fi), whose own privacy policies apply. Locry receives no data from them.',
      ],
    },
    {
      heading: 'Your control',
      body: [
        'You can delete your data at any time: delete a vault in Settings, or clear this site’s data in your browser. Backups in Google Drive can be deleted in Settings, and Locry’s access can be revoked in your Google Account. Since the developer holds no data about you, there is nothing to request or delete on our side.',
      ],
    },
    {
      heading: 'Changes',
      body: ['If this policy changes, the new version will be published on this page with a new date.'],
    },
    {
      heading: 'Contact',
      body: ['Questions about this policy: open an issue at [github.com/eerkan/locry](https://github.com/eerkan/locry/issues).'],
    },
  ],
  back: 'Back to Locry',
};
