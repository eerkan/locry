import { inject } from '@angular/core';
import { type CanMatchFn, Router, type UrlSegment, type UrlTree } from '@angular/router';
import { type VaultStatus, VaultService } from './vault.service';

const HOME: Record<Exclude<VaultStatus, 'loading'>, string> = {
  empty: '/setup',
  locked: '/unlock',
  unlocked: '/notes',
};

const AUTH_PATHS = ['/setup', '/unlock', '/recover', '/restore'];

/**
 * Matches the route only in the given vault states; otherwise redirects to the state's home.
 * A locked vault remembers the requested page as `?next=` so unlocking returns there.
 */
export function vaultStatusGuard(...allowed: VaultStatus[]): CanMatchFn {
  return async (_route, segments: UrlSegment[]): Promise<boolean | UrlTree> => {
    const vault = inject(VaultService);
    const router = inject(Router);
    await vault.init();
    const status = vault.status();
    if (allowed.includes(status)) return true;
    if (status === 'loading') return router.parseUrl('/');
    const home = router.parseUrl(HOME[status]);
    const requested = '/' + segments.map((s) => s.path).join('/');
    if (status === 'locked' && safeNext(requested)) home.queryParams = { next: requested };
    return home;
  };
}

export function homeForStatus(status: VaultStatus): string | null {
  return status === 'loading' ? null : HOME[status];
}

/**
 * Validates a post-unlock destination: an in-app path that is not an auth screen. Anything
 * else (absolute URLs, "//host", auth pages) is rejected to avoid open redirects and loops.
 */
export function safeNext(next: string | null | undefined): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return null;
  if (next === '/' || AUTH_PATHS.some((p) => next === p || next.startsWith(p + '/') || next.startsWith(p + '?'))) {
    return null;
  }
  return next;
}
