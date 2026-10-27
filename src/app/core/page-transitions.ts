import type { ActivatedRouteSnapshot, ViewTransitionInfo } from '@angular/router';
import { withViewTransitions } from '@angular/router';

/** First path segment of the deepest route: "notes" for /notes/abc, "tasks" for /tasks/today. */
export function section(snapshot: ActivatedRouteSnapshot): string {
  for (let route: ActivatedRouteSnapshot | null = snapshot; route; route = route.firstChild) {
    if (route.url.length) return route.url[0].path;
  }
  return '';
}

/**
 * Page transitions through the browser's View Transitions (instant where unsupported). Only
 * moving between sections animates (Notes → Tasks, the lock screen → the app); opening another
 * note or task list stays instant, and the styles turn them off when less motion is asked for.
 */
export const pageTransitions = withViewTransitions({
  skipInitialTransition: true,
  onViewTransitionCreated: ({ transition, from, to }: ViewTransitionInfo) => {
    // (Development builds log the skip as an AbortError; production builds stay quiet.)
    if (section(from) === section(to)) transition.skipTransition();
  },
});
