import { DEFAULT_LANG, type Lang } from '../../core/languages';

export interface Fact {
  term: string;
  detail: string;
}

export interface Feature {
  icon: string;
  title: string;
  text: string;
}

export interface Faq {
  q: string;
  a: string;
}

/** Everything the landing page says, per language. Kept as data so the page and the structured data agree. */
export interface LandingContent {
  lang: Lang;
  meta: { title: string; description: string; ogImageAlt: string };
  nav: {
    features: string;
    security: string;
    sync: string;
    selfHost: string;
    faq: string;
    open: string;
    skip: string;
  };
  /** Short section labels for the numbered headings. */
  sections: {
    overview: string;
    features: string;
    tasks: string;
    security: string;
    vaults: string;
    sync: string;
    search: string;
    compare: string;
    selfHost: string;
    faq: string;
  };
  ui: { theme: string; light: string; dark: string; system: string; language: string; flow: string; terminal: string };
  hero: {
    eyebrow: string;
    title: string;
    accent: string;
    lead: string;
    start: string;
    resume: string;
    github: string;
    badges: string[];
    screenshotAlt: string;
    phoneAlt: string;
  };
  summary: { title: string; text: string; facts: Fact[] };
  features: { title: string; lead: string; items: Feature[] };
  security: {
    title: string;
    lead: string;
    steps: { title: string; text: string }[];
    tableTitle: string;
    rows: [string, string][];
    note: string;
  };
  vaults: { title: string; text: string; bullets: string[]; alt: string };
  sync: { title: string; lead: string; bullets: string[]; stepsTitle: string; steps: string[]; alt: string };
  search: { title: string; text: string; bullets: string[]; alt: string };
  tasks: { title: string; text: string; bullets: string[]; alt: string };
  selfHost: { title: string; lead: string; code: string; notes: string[]; github: string };
  compare: { title: string; lead: string; headers: [string, string, string]; rows: [string, string, string][] };
  faq: { title: string; items: Faq[] };
  cta: { title: string; text: string; start: string; github: string };
  footer: { tagline: string; openSource: string; madeWith: string; links: string };
  howTo: { name: string; description: string; steps: { name: string; text: string }[] };
}

/** English lives at /, every other language at /<code>. */
export function landingPath(lang: Lang): string {
  return lang === DEFAULT_LANG ? '/' : `/${lang}`;
}

/** One chunk per language, so a page only downloads its own text. */
export function loadLandingContent(lang: Lang): Promise<LandingContent> {
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
