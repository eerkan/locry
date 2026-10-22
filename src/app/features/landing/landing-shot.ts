import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';

/**
 * A real screenshot of the app in AVIF with a WebP fallback, matching the visitor's light or
 * dark preference. Width and height are set so the layout does not shift while loading.
 */
@Component({
  selector: 'app-landing-shot',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <picture>
      <source type="image/avif" media="(prefers-color-scheme: dark)" [attr.srcset]="srcset('dark', 'avif')" [attr.sizes]="sizes()" />
      <source type="image/webp" media="(prefers-color-scheme: dark)" [attr.srcset]="srcset('dark', 'webp')" [attr.sizes]="sizes()" />
      <source type="image/avif" [attr.srcset]="srcset('light', 'avif')" [attr.sizes]="sizes()" />
      <img
        class="block h-auto w-full"
        [attr.src]="base() + '-light.webp'"
        [attr.srcset]="srcset('light', 'webp')"
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
  protected readonly base = computed(() => `/landing/${this.lang()}/${this.name()}`);

  /** Desktop screenshots also come in a half-size variant; the phone one is small already. */
  protected srcset(theme: 'light' | 'dark', format: 'avif' | 'webp'): string {
    const full = `${this.base()}-${theme}.${format}`;
    return this.name() === 'phone' ? full : `${this.base()}-${theme}-1080.${format} 1080w, ${full} 2160w`;
  }
}
