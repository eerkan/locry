import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';

/**
 * A real screenshot of the app in AVIF with a WebP fallback. Follows the visitor's system
 * light/dark preference, or the theme chosen on the page (`theme`). Width and height are set
 * so the layout does not shift while loading.
 */
@Component({
  selector: 'app-landing-shot',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <picture>
      <source type="image/avif" [attr.media]="darkMedia()" [attr.srcset]="srcset(darkSide(), 'avif')" [attr.sizes]="sizes()" />
      <source type="image/webp" [attr.media]="darkMedia()" [attr.srcset]="srcset(darkSide(), 'webp')" [attr.sizes]="sizes()" />
      <source type="image/avif" [attr.srcset]="srcset(lightSide(), 'avif')" [attr.sizes]="sizes()" />
      <img
        class="block h-auto w-full"
        [attr.src]="base() + '-' + lightSide() + '.webp'"
        [attr.srcset]="srcset(lightSide(), 'webp')"
        [attr.sizes]="sizes()"
        [attr.width]="width()"
        [attr.height]="height()"
        [attr.alt]="alt()"
        [attr.loading]="eager() ? 'eager' : 'lazy'"
        [attr.fetchpriority]="eager() ? 'high' : null"
        decoding="async"
      />
    </picture>
  `,
})
export class LandingShot {
  readonly lang = input.required<string>();
  readonly name = input.required<string>();
  readonly width = input.required<number>();
  readonly height = input.required<number>();
  readonly alt = input.required<string>();
  /** Above the fold: load right away with high priority. */
  readonly eager = input(false, { transform: booleanAttribute });
  /** Rendered width, for picking the 1080 px or the full-size file. */
  readonly sizes = input('(min-width: 1152px) 1100px, 100vw');
  /** A theme chosen on the page; null follows the system preference. */
  readonly theme = input<'light' | 'dark' | null>(null);

  /** Relative to the document's base, so the page also works under a subpath. */
  protected readonly base = computed(() => `landing/${this.lang()}/${this.name()}`);
  /** With a chosen theme, every source shows that theme; otherwise the media query picks. */
  protected readonly darkMedia = computed(() => (this.theme() ? null : '(prefers-color-scheme: dark)'));
  protected readonly darkSide = computed(() => this.theme() ?? 'dark');
  protected readonly lightSide = computed(() => this.theme() ?? 'light');

  /** Desktop screenshots also come in a half-size variant; the phone one is small already. */
  protected srcset(theme: 'light' | 'dark', format: 'avif' | 'webp'): string {
    const full = `${this.base()}-${theme}.${format}`;
    return this.name() === 'phone' ? full : `${this.base()}-${theme}-1080.${format} 1080w, ${full} 2160w`;
  }
}
