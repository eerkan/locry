import { ChangeDetectionStrategy, Component, afterNextRender, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft } from '@ng-icons/lucide';
import { Analytics } from '../../core/analytics';
import { LANGS, LANGUAGE_NAMES, LANGUAGE_TAGS, direction, type Lang } from '../../core/languages';
import { Flag } from '../../shared/flag';
import { landingPath } from '../landing/landing-content';
import { LandingSeo } from '../landing/landing-seo';
import { LEGAL_UPDATED, type LegalContent, type LegalDoc, legalPath, linkParts } from './privacy-content';

/**
 * A public legal document (privacy policy or terms of service), in every interface language
 * (/privacy, /tr/terms, …). Prerendered like the landing pages, so it reads without JavaScript;
 * Google's OAuth consent screen links to both.
 */
@Component({
  selector: 'app-privacy-page',
  imports: [Flag, NgIcon, RouterLink],
  providers: [provideIcons({ lucideArrowLeft })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  styles: `
    :host {
      --paper: #f6f5f1;
      --ink: #16150f;
      --soft: #57554c;
      --rule: #dcd9cf;
      --accent: #b03f0c;
    }
    :host-context(.dark) {
      --paper: #0f0f0e;
      --ink: #ecebe5;
      --soft: #aeaba1;
      --rule: #2b2a25;
      --accent: #f0894a;
    }
    /* As on the landing page: no tracking for joined letters, no monospace for scripts it lacks. */
    [lang='ar'] * {
      letter-spacing: normal !important;
    }
    [lang='zh-Hans'] .font-code,
    [lang='ja'] .font-code,
    [lang='ar'] .font-code {
      font-family: 'Geist Mono Variable', ui-sans-serif, system-ui, sans-serif;
    }
  `,
  template: `
    @let t = content();
    <div class="font-text min-h-svh bg-[var(--paper)] text-[var(--ink)] antialiased" [attr.lang]="tags[t.lang]" [attr.dir]="dir()">
      <header class="border-b border-[var(--rule)]">
        <div class="mx-auto flex h-14 max-w-3xl items-center justify-between gap-6 px-5 sm:px-6">
          <a [routerLink]="home()" dir="ltr" class="font-display text-[22px] leading-none font-[560] tracking-[-0.02em]" aria-label="Locry"
            >Locry<span class="text-[var(--accent)]">.</span></a
          >
          <a [routerLink]="home()" class="flex items-center gap-1.5 text-[14px] text-[var(--soft)] transition-colors hover:text-[var(--ink)]">
            <ng-icon name="lucideArrowLeft" class="rtl:-scale-x-100" aria-hidden="true" />{{ t.back }}
          </a>
        </div>
      </header>

      <main id="main" class="mx-auto max-w-3xl px-5 py-14 sm:px-6 md:py-20">
        <h1 class="font-display text-[40px] leading-[1.05] font-[440] tracking-[-0.02em] sm:text-[52px]">{{ t.title }}</h1>
        <p class="font-code mt-4 text-[12px] tracking-[0.08em] text-[var(--soft)] uppercase">
          {{ t.updated }}: <time [attr.datetime]="updatedIso()">{{ updatedLabel() }}</time>
        </p>
        <p class="mt-8 text-[18px] leading-[1.65]">{{ t.intro }}</p>

        @for (section of t.sections; track section.heading; let i = $index) {
          <section class="mt-12 border-t border-[var(--rule)] pt-8" [attr.aria-labelledby]="doc() + '-' + i">
            <h2 [id]="doc() + '-' + i" class="font-display text-[24px] leading-tight font-[460]">{{ section.heading }}</h2>
            @for (paragraph of section.body; track $index) {
              <p class="mt-4 text-[16px] leading-[1.7] text-[var(--soft)]">
                @for (part of parts(paragraph); track $index) {
                  @if ('url' in part) {
                    <a [href]="part.url" rel="noopener noreferrer" target="_blank" class="text-[var(--ink)] underline decoration-[var(--rule)] underline-offset-4 hover:decoration-[var(--ink)]">{{
                      part.label
                    }}</a>
                  } @else {
                    {{ part.text }}
                  }
                }
              </p>
            }
          </section>
        }
      </main>

      <footer class="border-t border-[var(--rule)]">
        <nav class="mx-auto flex max-w-3xl flex-wrap gap-x-5 gap-y-2 px-5 py-6 text-[13.5px] text-[var(--soft)] sm:px-6" aria-label="Language">
          @for (lang of langs; track lang) {
            <a
              [routerLink]="path(lang)"
              [attr.hreflang]="tags[lang]"
              [attr.lang]="tags[lang]"
              class="inline-flex items-center gap-2"
              [class]="t.lang === lang ? 'text-[var(--ink)]' : 'hover:text-[var(--ink)]'"
              [attr.aria-current]="t.lang === lang ? 'page' : null"
              ><app-flag [lang]="lang" />{{ names[lang] }}</a
            >
          }
        </nav>
      </footer>
    </div>
  `,
})
export class PrivacyPage {
  /** From the route's data and resolver. */
  readonly lang = input.required<Lang>();
  readonly doc = input.required<LegalDoc>();
  readonly content = input.required<LegalContent>();

  protected readonly langs = LANGS;
  protected readonly names = LANGUAGE_NAMES;
  protected readonly tags = LANGUAGE_TAGS;
  protected readonly path = (lang: Lang) => legalPath(this.doc(), lang);
  protected readonly updatedIso = computed(() => LEGAL_UPDATED[this.doc()]);
  protected readonly home = computed(() => landingPath(this.content().lang));
  protected readonly dir = computed(() => direction(this.content().lang));
  protected readonly updatedLabel = computed(() =>
    new Intl.DateTimeFormat(LANGUAGE_TAGS[this.content().lang], { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(this.updatedIso())),
  );

  constructor() {
    const seo = inject(LandingSeo);
    effect(() => {
      const t = this.content();
      const doc = this.doc();
      seo.applyPage({ lang: t.lang, title: t.meta.title, description: t.meta.description, path: (lang) => legalPath(doc, lang) });
    });
    const analytics = inject(Analytics);
    afterNextRender(() => analytics.pageview());
  }

  protected parts(text: string) {
    return linkParts(text);
  }
}
