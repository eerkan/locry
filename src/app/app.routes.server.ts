import { RenderMode, type ServerRoute } from '@angular/ssr';
import { DEFAULT_LANG, LANGS } from './core/languages';
import { LEGAL_DOCS, legalPath } from './features/privacy/privacy-content';

/**
 * Only the public pages are prerendered at build time (for search engines and AI crawlers).
 * Everything behind the vault renders in the browser only: there is no server at runtime
 * and nothing about a vault ever exists outside the user's browser.
 */
export const serverRoutes: ServerRoute[] = [
  ...LANGS.map((lang) => ({ path: lang === DEFAULT_LANG ? '' : lang, renderMode: RenderMode.Prerender as const })),
  ...LEGAL_DOCS.flatMap((doc) => LANGS.map((lang) => ({ path: legalPath(doc, lang).slice(1), renderMode: RenderMode.Prerender as const }))),
  { path: '**', renderMode: RenderMode.Client },
];
