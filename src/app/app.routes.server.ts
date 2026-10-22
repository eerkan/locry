import { RenderMode, type ServerRoute } from '@angular/ssr';

/**
 * Only the public pages are prerendered at build time (for search engines and AI crawlers).
 * Everything behind the vault renders in the browser only: there is no server at runtime
 * and nothing about a vault ever exists outside the user's browser.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'en', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
