/**
 * Public address of this installation as written into prerendered pages. The server replaces
 * it with the real origin (from LOCRY_SITE_URL or LOCRY_DOMAIN) when serving, so one build
 * works on any domain. `.invalid` is reserved and never resolves.
 */
export const SITE_URL_PLACEHOLDER = 'https://locry.invalid';

export const GITHUB_URL = 'https://github.com/emreerkangames/locry';
