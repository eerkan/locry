import type { LegalContent } from '../privacy-content';

export const en: LegalContent = {
  lang: 'en',
  meta: {
    title: 'Terms of Service — Locry',
    description:
      'The terms for using Locry, the free, open-source encrypted notes and tasks app: your data and keys, acceptable use, third-party services, AI answers, and no warranty.',
  },
  title: 'Terms of Service',
  updated: 'Last updated',
  intro:
    'These terms apply when you use Locry at this address. Locry is a free, open-source notes and tasks app that runs entirely in your browser; there is no account and nothing to buy.',
  sections: [
    {
      heading: 'Using Locry',
      body: ['By using Locry you agree to these terms. If you do not agree, please do not use it.'],
    },
    {
      heading: 'Open source',
      body: [
        'Locry’s source code is available under the [MIT License](https://github.com/eerkan/locry/blob/main/LICENSE). You may use, copy, modify and distribute it under that license; these terms cover the site at this address.',
      ],
    },
    {
      heading: 'Your data and your keys',
      body: [
        'Your notes and tasks are encrypted on your device, and only your passkeys and your recovery key can open them. You are responsible for keeping them safe: if you lose both, nobody, including the developer, can recover your data.',
        'Make backups regularly. Browsers can delete site data, for example when storage runs low or you clear your browsing data.',
      ],
    },
    {
      heading: 'Acceptable use',
      body: [
        'Use Locry only in lawful ways. Do not try to disrupt the site, and do not use it to misuse the third-party services it connects to.',
      ],
    },
    {
      heading: 'Third-party services',
      body: [
        'Optional features rely on Google Drive, Hugging Face and GitHub Pages, whose own terms apply when you use them, such as the [Google Terms of Service](https://policies.google.com/terms) and the [GitHub Terms of Service](https://docs.github.com/site-policy/github-terms/github-terms-of-service).',
      ],
    },
    {
      heading: 'AI answers',
      body: [
        'Smart search results and the answers of “Ask your notes” come from small AI models running on your device. They can be incomplete or wrong; check the sources before relying on them.',
      ],
    },
    {
      heading: 'No warranty',
      body: [
        'Locry is provided “as is”, without warranty of any kind, express or implied, including fitness for a particular purpose and uninterrupted availability.',
        'To the extent permitted by law, the developer is not liable for any loss of data or any other damage arising from the use of Locry.',
      ],
    },
    {
      heading: 'Changes',
      body: [
        'These terms may change. The new version will be published on this page with a new date; using Locry after that means you accept it.',
      ],
    },
    {
      heading: 'Contact',
      body: ['Questions about these terms: open an issue at [github.com/eerkan/locry](https://github.com/eerkan/locry/issues).'],
    },
  ],
  back: 'Back to Locry',
};
