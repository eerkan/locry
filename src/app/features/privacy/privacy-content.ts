import { DEFAULT_LANG, type Lang } from '../../core/languages';

/** The privacy policy, per language. Links inside the text are written as [label](https://…). */
export interface PrivacyContent {
  lang: Lang;
  meta: { title: string; description: string };
  title: string;
  /** Label before the date of the last change. */
  updated: string;
  intro: string;
  sections: { heading: string; body: string[] }[];
  /** Link back to the landing page. */
  back: string;
}

/** Date of the policy's last change; shown in each language's date format. */
export const PRIVACY_UPDATED = '2026-10-27';

/** /privacy in English, /<code>/privacy in the other languages. */
export function privacyPath(lang: Lang): string {
  return lang === DEFAULT_LANG ? '/privacy' : `/${lang}/privacy`;
}

/** One chunk per language, so the page only downloads its own text. */
export function loadPrivacyContent(lang: Lang): Promise<PrivacyContent> {
  switch (lang) {
    case 'tr':
      return import('./content/tr').then((m) => m.tr);
    case 'zh':
      return import('./content/zh').then((m) => m.zh);
    case 'es':
      return import('./content/es').then((m) => m.es);
    case 'ar':
      return import('./content/ar').then((m) => m.ar);
    case 'pt':
      return import('./content/pt').then((m) => m.pt);
    case 'id':
      return import('./content/id').then((m) => m.id);
    case 'fr':
      return import('./content/fr').then((m) => m.fr);
    case 'ja':
      return import('./content/ja').then((m) => m.ja);
    case 'ru':
      return import('./content/ru').then((m) => m.ru);
    case 'de':
      return import('./content/de').then((m) => m.de);
    default:
      return import('./content/en').then((m) => m.en);
  }
}

/** Splits text into plain parts and [label](https://…) links. */
export function linkParts(text: string): ({ text: string } | { label: string; url: string })[] {
  const parts: ({ text: string } | { label: string; url: string })[] = [];
  let last = 0;
  for (const match of text.matchAll(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index) });
    parts.push({ label: match[1], url: match[2] });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
