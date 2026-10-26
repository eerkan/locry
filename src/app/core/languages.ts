/**
 * Interface languages: Turkish plus the ten most used languages on the web. English is the
 * default and the fallback.
 */
export const LANGS = ['en', 'tr', 'zh', 'es', 'ar', 'pt', 'id', 'fr', 'ja', 'ru', 'de'] as const;
export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = 'en';

/** Each language in its own name, as shown in language pickers. */
export const LANGUAGE_NAMES: Record<Lang, string> = {
  en: 'English',
  tr: 'Türkçe',
  zh: '简体中文',
  es: 'Español',
  ar: 'العربية',
  pt: 'Português (Brasil)',
  id: 'Bahasa Indonesia',
  fr: 'Français',
  ja: '日本語',
  ru: 'Русский',
  de: 'Deutsch',
};

/** English names, for instructions to language models (which follow English best). */
export const LANGUAGE_ENGLISH_NAMES: Record<Lang, string> = {
  en: 'English',
  tr: 'Turkish',
  zh: 'Simplified Chinese',
  es: 'Spanish',
  ar: 'Arabic',
  pt: 'Brazilian Portuguese',
  id: 'Indonesian',
  fr: 'French',
  ja: 'Japanese',
  ru: 'Russian',
  de: 'German',
};

/** BCP 47 tags for `<html lang>`, hreflang and date/number formatting. */
export const LANGUAGE_TAGS: Record<Lang, string> = {
  en: 'en',
  tr: 'tr',
  zh: 'zh-Hans',
  es: 'es',
  ar: 'ar',
  pt: 'pt-BR',
  id: 'id',
  fr: 'fr',
  ja: 'ja',
  ru: 'ru',
  de: 'de',
};

/** Open Graph locales. */
export const OG_LOCALES: Record<Lang, string> = {
  en: 'en_US',
  tr: 'tr_TR',
  zh: 'zh_CN',
  es: 'es_ES',
  ar: 'ar_AR',
  pt: 'pt_BR',
  id: 'id_ID',
  fr: 'fr_FR',
  ja: 'ja_JP',
  ru: 'ru_RU',
  de: 'de_DE',
};

const RTL: ReadonlySet<Lang> = new Set(['ar']);

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

export function direction(lang: Lang): 'rtl' | 'ltr' {
  return RTL.has(lang) ? 'rtl' : 'ltr';
}

/** The first of the browser's preferred languages we support (by primary subtag), else English. */
export function detectLang(preferred: readonly string[]): Lang {
  for (const tag of preferred) {
    const primary = tag.toLowerCase().split('-')[0];
    if (isLang(primary)) return primary;
  }
  return DEFAULT_LANG;
}
