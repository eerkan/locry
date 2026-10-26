import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LANGUAGE_FLAGS, type Lang } from '../core/languages';

/**
 * The flag of a language, as a small decorative image (the language's name is always next to
 * it). The path is relative to the document's base, so it also works under a subpath.
 */
@Component({
  selector: 'app-flag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex shrink-0' },
  template: `<img
    [src]="src()"
    alt=""
    width="20"
    height="15"
    loading="lazy"
    decoding="async"
    class="h-[15px] w-5 rounded-[2px] object-cover shadow-[0_0_0_1px_rgb(0_0_0/0.12)]"
  />`,
})
export class Flag {
  readonly lang = input.required<Lang>();
  protected readonly src = computed(() => `flags/${LANGUAGE_FLAGS[this.lang()]}.svg`);
}
