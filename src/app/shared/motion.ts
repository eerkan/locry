/** The system asks for less motion (or the environment cannot tell, as in tests). */
export function prefersReducedMotion(): boolean {
  return typeof matchMedia !== 'function' || matchMedia('(prefers-reduced-motion: reduce)').matches;
}
