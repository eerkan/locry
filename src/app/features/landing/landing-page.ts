import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, computed, effect, inject, input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowRight, lucideArrowUpRight, lucideHeart, lucideMonitor, lucideMoon, lucidePlus, lucideSun } from '@ng-icons/lucide';
import { PreferencesService, type Theme } from '../../core/preferences.service';
import { GITHUB_URL } from '../../core/site';
import type { Donations } from '../../core/donate';
import { copyText } from '../../shared/copy-text';
import { Flag } from '../../shared/flag';
import { RuntimeConfigService } from '../../core/runtime-config.service';
import { VaultService } from '../../core/vault/vault.service';
import { LANGS, LANGUAGE_NAMES, LANGUAGE_TAGS, detectLang, direction, isLang, type Lang } from '../../core/languages';
import { landingPath, type LandingContent } from './landing-content';
import { privacyPath, termsPath } from '../privacy/privacy-content';
import { LandingSeo } from './landing-seo';
import { LandingShot } from './landing-shot';

/** Language the visitor picked on the landing page; wins over the browser's language. */
const LANG_CHOICE_KEY = 'locry.landing-lang';

/**
 * Public landing page, in every interface language (English at /, the others at /<code>).
 * Prerendered to static HTML at build time and hydrated in the browser; readable without
 * JavaScript. Visitors on / whose browser prefers another supported language (and who did not
 * pick one) are sent to that language's page.
 */
@Component({
  selector: 'app-landing-page',
  imports: [Flag, LandingShot, NgIcon, NgTemplateOutlet, RouterLink],
  providers: [provideIcons({ lucideArrowRight, lucideArrowUpRight, lucideHeart, lucideMonitor, lucideMoon, lucidePlus, lucideSun })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  styles: `
    :host {
      --paper: #f6f5f1;
      --panel: #edebe4;
      --ink: #16150f;
      --soft: #57554c;
      --rule: #dcd9cf;
      --accent: #b03f0c;
    }
    :host-context(.dark) {
      --paper: #0f0f0e;
      --panel: #181816;
      --ink: #ecebe5;
      --soft: #aeaba1;
      --rule: #2b2a25;
      --accent: #f0894a;
    }
    summary::-webkit-details-marker {
      display: none;
    }
    /* Scripts without italics or with joined letters: no slanted accent, no tracking. */
    [lang='zh-Hans'] em,
    [lang='ja'] em,
    [lang='ar'] em {
      font-style: normal;
    }
    [lang='ar'] * {
      letter-spacing: normal !important;
    }
    /* Break Japanese headings between phrases rather than inside words. */
    [lang='ja'] :is(h1, h2, h3) {
      word-break: auto-phrase;
    }
    /* Geist Mono has no glyphs for these scripts; fall back to the system sans, not a monospace. */
    [lang='zh-Hans'] .font-code,
    [lang='ja'] .font-code,
    [lang='ar'] .font-code {
      font-family: 'Geist Mono Variable', ui-sans-serif, system-ui, sans-serif;
    }
  `,
  template: `
    @let t = content();
    <ng-template #themeSwitch let-display>
    <div role="group" class="items-center rounded-md border border-[var(--rule)] p-0.5" [class]="display" [attr.aria-label]="t.ui.theme">
      @for (option of themes; track option.value) {
        <button
          type="button"
          class="flex size-7 items-center justify-center rounded-[5px] transition-colors hover:text-[var(--ink)]"
          [class]="prefs.theme() === option.value ? 'bg-[var(--panel)]' : 'text-[var(--soft)]'"
          [attr.aria-pressed]="prefs.theme() === option.value"
          [attr.aria-label]="t.ui[option.value]"
          [attr.title]="t.ui[option.value]"
          (click)="prefs.setTheme(option.value)"
        >
          <ng-icon [name]="option.icon" class="text-[15px]" />
        </button>
      }
    </div>
    </ng-template>
    <div class="font-text min-h-svh bg-[var(--paper)] text-[var(--ink)] antialiased" [attr.lang]="tags[t.lang]" [attr.dir]="dir()">
      <a
        [attr.href]="anchor('main')"
        class="sr-only z-50 rounded bg-[var(--ink)] px-3 py-2 text-[var(--paper)] focus:not-sr-only focus:fixed focus:start-3 focus:top-3"
        >{{ t.nav.skip }}</a
      >

      <header class="sticky top-0 z-40 border-b border-[var(--rule)] bg-[color-mix(in_oklab,var(--paper)_88%,transparent)] backdrop-blur">
        <div class="mx-auto flex h-14 max-w-[1200px] items-center gap-8 px-5 sm:px-6">
          <a [routerLink]="path(t.lang)" dir="ltr" class="font-display text-[22px] leading-none font-[560] tracking-[-0.02em]" aria-label="Locry"
            >Locry<span class="text-[var(--accent)]">.</span></a
          >
          <nav class="hidden lg:block" [attr.aria-label]="t.sections.overview">
            <ul class="flex items-center gap-6 text-[13.5px] text-[var(--soft)]">
              <li><a [attr.href]="anchor('features')" class="transition-colors hover:text-[var(--ink)]">{{ t.nav.features }}</a></li>
              <li><a [attr.href]="anchor('security')" class="transition-colors hover:text-[var(--ink)]">{{ t.nav.security }}</a></li>
              <li><a [attr.href]="anchor('sync')" class="transition-colors hover:text-[var(--ink)]">{{ t.nav.sync }}</a></li>
              <li><a [attr.href]="anchor('self-host')" class="transition-colors hover:text-[var(--ink)]">{{ t.nav.selfHost }}</a></li>
              <li><a [attr.href]="anchor('faq')" class="transition-colors hover:text-[var(--ink)]">{{ t.nav.faq }}</a></li>
            </ul>
          </nav>
          <div class="ms-auto flex items-center gap-1.5 sm:gap-3">
            @if (donations()) {
              <a
                [attr.href]="anchor('support')"
                class="flex h-8 items-center gap-1.5 rounded-md px-2 text-[13.5px] text-[var(--soft)] transition-colors hover:text-[var(--ink)]"
                [attr.aria-label]="t.support.title"
              >
                <ng-icon name="lucideHeart" class="text-[15px] text-rose-500" aria-hidden="true" /><span class="hidden md:inline">{{ t.nav.support }}</span>
              </a>
            }
            <details #langMenu class="relative">
              <summary
                class="font-code flex h-8 cursor-pointer list-none items-center gap-1.5 rounded-md px-2 text-[12px] tracking-[0.08em] text-[var(--soft)] uppercase transition-colors hover:text-[var(--ink)]"
                [attr.aria-label]="t.ui.language + ': ' + names[t.lang]"
              >
                <app-flag [lang]="t.lang" />{{ t.lang }}
              </summary>
              <ul
                class="absolute end-0 top-full z-50 mt-2 max-h-[70svh] w-56 overflow-y-auto rounded-md border border-[var(--rule)] bg-[var(--paper)] p-1 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.3)]"
              >
                @for (lang of langs; track lang) {
                  <li>
                    <a
                      [routerLink]="path(lang)"
                      [attr.hreflang]="tags[lang]"
                      [attr.lang]="tags[lang]"
                      class="flex items-center justify-between gap-3 rounded-[5px] px-3 py-2 text-[14px] transition-colors hover:bg-[var(--panel)]"
                      [class]="t.lang === lang ? 'font-medium' : 'text-[var(--soft)]'"
                      [attr.aria-current]="t.lang === lang ? 'page' : null"
                      (click)="remember(lang); langMenu.open = false"
                      ><span class="flex items-center gap-2.5"><app-flag [lang]="lang" />{{ names[lang] }}</span
                      ><span class="font-code text-[11px] text-[var(--soft)] uppercase" aria-hidden="true">{{ lang }}</span></a
                    >
                  </li>
                }
              </ul>
            </details>
            <ng-container *ngTemplateOutlet="themeSwitch; context: { $implicit: 'hidden sm:flex' }" />
            <a
              [href]="github"
              rel="noopener"
              class="hidden size-8 items-center justify-center rounded-md text-[var(--soft)] transition-colors hover:text-[var(--ink)] sm:flex"
              aria-label="GitHub"
            >
              <svg viewBox="0 0 24 24" class="size-[18px]" fill="currentColor" aria-hidden="true"><path [attr.d]="githubPath" /></svg>
            </a>
            <a
              routerLink="/app"
              class="flex h-9 items-center rounded-md bg-[var(--ink)] px-3.5 text-[13.5px] font-medium text-[var(--paper)] transition-opacity hover:opacity-85"
              >{{ hasVault() ? t.hero.resume : t.nav.open }}</a
            >
          </div>
        </div>
      </header>

      <main id="main">
        <!-- Hero -->
        <section class="border-b border-[var(--rule)]" aria-labelledby="hero-title">
          <div class="mx-auto grid max-w-[1200px] gap-10 px-5 pt-14 pb-12 sm:px-6 md:pt-24 lg:grid-cols-12">
            <div class="lg:col-span-7">
              <p class="font-code flex items-center gap-2.5 text-[12px] tracking-[0.12em] text-[var(--soft)] uppercase">
                <span class="size-1.5 bg-[var(--accent)]" aria-hidden="true"></span>{{ t.hero.eyebrow }}
              </p>
              <h1
                id="hero-title"
                class="font-display mt-6 text-[44px] leading-[1.02] font-[440] tracking-[-0.025em] text-balance sm:text-[62px] lg:text-[74px]"
              >
                {{ t.hero.title }}
                <em class="font-[380] text-[var(--accent)]">{{ t.hero.accent }}</em>
              </h1>
            </div>
            <div class="flex flex-col justify-end gap-7 lg:col-span-5 lg:pb-2">
              <p class="text-[17px] leading-[1.65] text-[var(--soft)]">{{ t.hero.lead }}</p>
              <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
                <a
                  routerLink="/app"
                  class="group inline-flex h-11 items-center gap-2 rounded-md bg-[var(--ink)] px-5 text-[15px] font-medium text-[var(--paper)] transition-opacity hover:opacity-85"
                >
                  {{ hasVault() ? t.hero.resume : t.hero.start }}
                  <ng-icon name="lucideArrowRight" class="transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
                </a>
                <a [href]="github" rel="noopener" [class]="textLink">
                  {{ t.hero.github }}
                  <ng-icon name="lucideArrowUpRight" class="text-[var(--soft)] rtl:-scale-x-100" />
                </a>
              </div>
              <p class="font-code text-[12px] leading-relaxed text-[var(--soft)]">
                @for (badge of t.hero.badges; track badge; let last = $last) {
                  {{ badge }}
                  @if (!last) {
                    <span class="mx-1.5" aria-hidden="true">/</span>
                  }
                }
              </p>
            </div>
          </div>
          <div class="relative mx-auto max-w-[1200px] px-5 pb-16 sm:px-6 md:pb-24">
            <figure class="hidden rounded-[10px] border border-[var(--rule)] bg-[var(--panel)] p-1.5 sm:block md:p-2">
              <div class="overflow-hidden rounded-[6px] border border-[var(--rule)]">
                <app-landing-shot [lang]="t.lang" name="hero" [width]="1440" [height]="900" [alt]="t.hero.screenshotAlt" [theme]="shotTheme()" eager />
              </div>
            </figure>
            <!-- On phones the phone screenshot replaces the desktop one; on larger screens it overlaps it. -->
            <figure
              class="mx-auto w-3/4 max-w-72 overflow-hidden rounded-[26px] border-[6px] border-[#1b1a16] bg-[#1b1a16] shadow-[0_0_0_1px_var(--rule),0_24px_48px_-24px_rgb(0_0_0/0.35)] sm:absolute sm:end-12 sm:bottom-6 sm:w-[21%] sm:max-w-60 md:bottom-12"
            >
              <app-landing-shot [lang]="t.lang" name="phone" [width]="780" [height]="1688" [alt]="t.hero.phoneAlt" [theme]="shotTheme()" eager />
            </figure>
          </div>
        </section>

        <!-- 01 Overview -->
        <section class="border-b border-[var(--rule)]" aria-labelledby="summary-title">
          <div [class]="row">
            <p [class]="label">01 — {{ t.sections.overview }}</p>
            <div>
              <h2 id="summary-title" [class]="h2">{{ t.summary.title }}</h2>
              <p class="font-display mt-6 max-w-3xl text-[22px] leading-[1.45] font-[380] sm:text-[26px]">{{ t.summary.text }}</p>
              <dl class="mt-12 grid gap-x-10 sm:grid-cols-2">
                @for (fact of t.summary.facts; track fact.term) {
                  <div class="grid grid-cols-[140px_1fr] gap-4 border-t border-[var(--rule)] py-3.5 text-[15px]">
                    <dt class="font-code pt-0.5 text-[12px] tracking-[0.08em] text-[var(--soft)] uppercase">{{ fact.term }}</dt>
                    <dd>{{ fact.detail }}</dd>
                  </div>
                }
              </dl>
            </div>
          </div>
        </section>

        <!-- 02 Features -->
        <section id="features" class="scroll-mt-14 border-b border-[var(--rule)]" aria-labelledby="features-title">
          <div [class]="row">
            <p [class]="label">02 — {{ t.sections.features }}</p>
            <div>
              <h2 id="features-title" [class]="h2">{{ t.features.title }}</h2>
              <p [class]="lead">{{ t.features.lead }}</p>
              <ol class="mt-12 grid gap-px border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-2 lg:grid-cols-3">
                @for (feature of t.features.items; track feature.title; let i = $index) {
                  <li class="bg-[var(--paper)] p-6">
                    <span class="font-code text-[12px] text-[var(--soft)]">2.{{ i + 1 }}</span>
                    <h3 class="mt-3 text-[17px] font-medium tracking-[-0.01em]">{{ feature.title }}</h3>
                    <p class="mt-2 text-[14.5px] leading-[1.6] text-[var(--soft)]">{{ feature.text }}</p>
                  </li>
                }
              </ol>
            </div>
          </div>
        </section>

        <!-- 03 Tasks -->
        <section class="border-b border-[var(--rule)]" aria-labelledby="tasks-title">
          <div [class]="row">
            <p [class]="label">03 — {{ t.sections.tasks }}</p>
            <div class="grid items-start gap-10 xl:grid-cols-[1fr_1.35fr]">
              <div>
                <h2 id="tasks-title" [class]="h2">{{ t.tasks.title }}</h2>
                <p [class]="lead">{{ t.tasks.text }}</p>
                <ul [class]="list">
                  @for (item of t.tasks.bullets; track item) {
                    <li [class]="listItem"><span [class]="dash" aria-hidden="true">—</span>{{ item }}</li>
                  }
                </ul>
              </div>
              <figure [class]="frame">
                <app-landing-shot [lang]="t.lang" name="tasks" [width]="1440" [height]="900" [alt]="t.tasks.alt" [theme]="shotTheme()" sizes="(min-width: 1280px) 620px, 100vw" />
              </figure>
            </div>
          </div>
        </section>

        <!-- 04 Security -->
        <section id="security" class="scroll-mt-14 border-b border-[var(--rule)]" aria-labelledby="security-title">
          <div [class]="row">
            <p [class]="label">04 — {{ t.sections.security }}</p>
            <div>
              <h2 id="security-title" [class]="h2">{{ t.security.title }}</h2>
              <p [class]="lead">{{ t.security.lead }}</p>

              <figure class="mt-12 rounded-[8px] border border-[var(--rule)] bg-[var(--panel)] p-5 sm:p-7">
                <figcaption class="font-code text-[12px] tracking-[0.08em] text-[var(--soft)] uppercase">{{ t.ui.flow }}</figcaption>
                <ol class="font-code mt-5 flex flex-wrap items-center gap-x-3 gap-y-3 text-[13px]">
                  @for (stage of flow; track stage; let last = $last) {
                    <li class="flex items-center gap-3">
                      <span class="rounded-[5px] border bg-[var(--paper)] px-3 py-2" [class]="last ? 'border-[var(--accent)]' : 'border-[var(--rule)]'">{{
                        stage
                      }}</span>
                      @if (!last) {
                        <ng-icon name="lucideArrowRight" class="text-[var(--soft)] rtl:-scale-x-100" aria-hidden="true" />
                      }
                    </li>
                  }
                </ol>
              </figure>

              <ol class="mt-10 grid gap-8 md:grid-cols-3">
                @for (step of t.security.steps; track step.title) {
                  <li class="border-t border-[var(--ink)] pt-4">
                    <h3 class="text-[16px] font-medium">{{ step.title }}</h3>
                    <p class="mt-2 text-[14.5px] leading-[1.6] text-[var(--soft)]">{{ step.text }}</p>
                  </li>
                }
              </ol>

              <div class="mt-14 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
                <table class="w-full text-start text-[14.5px]">
                  <caption class="font-code mb-3 text-start text-[12px] tracking-[0.08em] text-[var(--soft)] uppercase">{{ t.security.tableTitle }}</caption>
                  <tbody>
                    @for (row of t.security.rows; track row[0]) {
                      <tr class="border-t border-[var(--rule)]">
                        <th scope="row" class="w-44 py-3 pe-4 align-top font-medium">{{ row[0] }}</th>
                        <td class="py-3 text-[var(--soft)]">{{ row[1] }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
                <aside class="self-start border-s-2 border-[var(--accent)] py-1 ps-5 text-[16px] leading-[1.6]">
                  {{ t.security.note }}
                </aside>
              </div>
            </div>
          </div>
        </section>

        <!-- 05 Vaults -->
        <section class="border-b border-[var(--rule)]" aria-labelledby="vaults-title">
          <div [class]="row">
            <p [class]="label">05 — {{ t.sections.vaults }}</p>
            <div class="grid items-start gap-10 xl:grid-cols-[1.35fr_1fr]">
              <figure [class]="frame + ' order-2 xl:order-1'">
                <app-landing-shot [lang]="t.lang" name="vaults" [width]="1440" [height]="900" [alt]="t.vaults.alt" [theme]="shotTheme()" sizes="(min-width: 1280px) 620px, 100vw" />
              </figure>
              <div class="order-1 xl:order-2">
                <h2 id="vaults-title" [class]="h2">{{ t.vaults.title }}</h2>
                <p [class]="lead">{{ t.vaults.text }}</p>
                <ul [class]="list">
                  @for (item of t.vaults.bullets; track item) {
                    <li [class]="listItem"><span [class]="dash" aria-hidden="true">—</span>{{ item }}</li>
                  }
                </ul>
              </div>
            </div>
          </div>
        </section>

        <!-- 06 Sync -->
        <section id="sync" class="scroll-mt-14 border-b border-[var(--rule)]" aria-labelledby="sync-title">
          <div [class]="row">
            <p [class]="label">06 — {{ t.sections.sync }}</p>
            <div>
              <h2 id="sync-title" [class]="h2">{{ t.sync.title }}</h2>
              <p [class]="lead">{{ t.sync.lead }}</p>
              <div class="mt-12 grid items-start gap-12 xl:grid-cols-2">
                <div class="flex flex-col gap-10">
                  <ul class="flex flex-col gap-3">
                    @for (item of t.sync.bullets; track item) {
                      <li [class]="listItem"><span [class]="dash" aria-hidden="true">—</span>{{ item }}</li>
                    }
                  </ul>
                  <div>
                    <h3 class="font-code text-[12px] tracking-[0.08em] text-[var(--soft)] uppercase">{{ t.sync.stepsTitle }}</h3>
                    <ol class="mt-4">
                      @for (step of t.sync.steps; track step; let i = $index) {
                        <li class="grid grid-cols-[36px_1fr] border-t border-[var(--rule)] py-3 text-[15px]">
                          <span class="font-code text-[13px] text-[var(--accent)]">0{{ i + 1 }}</span>
                          <span>{{ step }}</span>
                        </li>
                      }
                    </ol>
                  </div>
                </div>
                <figure [class]="frame">
                  <app-landing-shot [lang]="t.lang" name="sync" [width]="1440" [height]="900" [alt]="t.sync.alt" [theme]="shotTheme()" sizes="(min-width: 1280px) 520px, 100vw" />
                </figure>
              </div>
            </div>
          </div>
        </section>

        <!-- 07 Smart search -->
        <section class="border-b border-[var(--rule)]" aria-labelledby="search-title">
          <div [class]="row">
            <p [class]="label">07 — {{ t.sections.search }}</p>
            <div class="grid items-start gap-10 xl:grid-cols-[1fr_1.35fr]">
              <div>
                <h2 id="search-title" [class]="h2">{{ t.search.title }}</h2>
                <p [class]="lead">{{ t.search.text }}</p>
                <ul [class]="list">
                  @for (item of t.search.bullets; track item) {
                    <li [class]="listItem"><span [class]="dash" aria-hidden="true">—</span>{{ item }}</li>
                  }
                </ul>
              </div>
              <figure [class]="frame">
                <app-landing-shot [lang]="t.lang" name="search" [width]="1440" [height]="900" [alt]="t.search.alt" [theme]="shotTheme()" sizes="(min-width: 1280px) 620px, 100vw" />
              </figure>
            </div>
          </div>
        </section>

        <!-- 08 Comparison -->
        <section class="border-b border-[var(--rule)]" aria-labelledby="compare-title">
          <div [class]="row">
            <p [class]="label">08 — {{ t.sections.compare }}</p>
            <div>
              <h2 id="compare-title" [class]="h2">{{ t.compare.title }}</h2>
              <p [class]="lead">{{ t.compare.lead }}</p>
              <div class="mt-12 overflow-x-auto">
                <table class="w-full min-w-[560px] text-start text-[15px]">
                  <thead>
                    <tr class="font-code border-b border-[var(--ink)] text-[12px] tracking-[0.08em] uppercase">
                      @for (header of t.compare.headers; track $index) {
                        <th scope="col" class="py-3 pe-4 font-normal" [class]="$last ? 'text-[var(--accent)]' : 'text-[var(--soft)]'">{{ header }}</th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of t.compare.rows; track row[0]) {
                      <tr class="border-b border-[var(--rule)]">
                        <th scope="row" class="py-3.5 pe-4 font-medium">{{ row[0] }}</th>
                        <td class="py-3.5 pe-4 text-[var(--soft)]">{{ row[1] }}</td>
                        <td class="py-3.5 font-medium">{{ row[2] }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <!-- 09 Self-hosting -->
        <section id="self-host" class="scroll-mt-14 border-b border-[var(--rule)]" aria-labelledby="self-host-title">
          <div [class]="row">
            <p [class]="label">09 — {{ t.sections.selfHost }}</p>
            <div class="grid items-start gap-10 xl:grid-cols-2">
              <div>
                <h2 id="self-host-title" [class]="h2">{{ t.selfHost.title }}</h2>
                <p [class]="lead">{{ t.selfHost.lead }}</p>
                <ul [class]="list">
                  @for (note of t.selfHost.notes; track note) {
                    <li [class]="listItem"><span [class]="dash" aria-hidden="true">—</span>{{ note }}</li>
                  }
                </ul>
                <a [href]="github" rel="noopener" [class]="textLink + ' mt-8'">
                  {{ t.selfHost.github }}
                  <ng-icon name="lucideArrowUpRight" class="text-[var(--soft)] rtl:-scale-x-100" />
                </a>
              </div>
              <figure class="overflow-hidden rounded-[8px] border border-[var(--rule)] bg-[var(--panel)]">
                <figcaption class="font-code border-b border-[var(--rule)] px-4 py-2.5 text-[12px] tracking-[0.08em] text-[var(--soft)] uppercase">
                  {{ t.ui.terminal }}
                </figcaption>
                <pre dir="ltr" class="font-code overflow-x-auto p-5 text-[13.5px] leading-[1.9]"><code>@for (line of codeLines(); track $index) {<span class="text-[var(--soft)] select-none">$ </span>{{ line }}
}</code></pre>
              </figure>
            </div>
          </div>
        </section>

        <!-- 10 FAQ -->
        <section id="faq" class="scroll-mt-14 border-b border-[var(--rule)]" aria-labelledby="faq-title">
          <div [class]="row">
            <p [class]="label">10 — {{ t.sections.faq }}</p>
            <div>
              <h2 id="faq-title" [class]="h2">{{ t.faq.title }}</h2>
              <div class="mt-10 border-b border-[var(--rule)]">
                @for (item of t.faq.items; track item.q; let first = $first) {
                  <details class="group border-t border-[var(--rule)]" [open]="first">
                    <summary class="flex cursor-pointer list-none items-start justify-between gap-6 py-5">
                      <h3 class="font-display text-[19px] leading-snug font-[460] sm:text-[21px]">{{ item.q }}</h3>
                      <ng-icon name="lucidePlus" class="mt-1.5 shrink-0 text-[var(--soft)] transition-transform group-open:rotate-45" />
                    </summary>
                    <p class="max-w-3xl pb-6 text-[15.5px] leading-[1.7] text-[var(--soft)]">{{ item.a }}</p>
                  </details>
                }
              </div>
            </div>
          </div>
        </section>

        <!-- Closing call to action -->
        <section aria-labelledby="cta-title">
          <div class="mx-auto flex max-w-[1200px] flex-col gap-8 px-5 py-24 sm:px-6 md:flex-row md:items-end md:justify-between md:py-32">
            <div class="max-w-2xl">
              <h2 id="cta-title" class="font-display text-[44px] leading-[1.02] font-[440] tracking-[-0.025em] sm:text-[60px]">{{ t.cta.title }}</h2>
              <p class="mt-5 text-[17px] leading-[1.65] text-[var(--soft)]">{{ t.cta.text }}</p>
            </div>
            <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
              <a
                routerLink="/app"
                class="group inline-flex h-11 items-center gap-2 rounded-md bg-[var(--ink)] px-5 text-[15px] font-medium text-[var(--paper)] transition-opacity hover:opacity-85"
              >
                {{ hasVault() ? t.hero.resume : t.cta.start }}
                <ng-icon name="lucideArrowRight" class="transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
              </a>
              <a [href]="github" rel="noopener" [class]="textLink">
                {{ t.cta.github }}
                <ng-icon name="lucideArrowUpRight" class="text-[var(--soft)] rtl:-scale-x-100" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer class="border-t border-[var(--rule)]">
        <!-- Only in the browser (after hydration): the accounts come from this installation's config. -->
        @if (donations(); as donations) {
          <section id="support" class="scroll-mt-14 border-b border-[var(--rule)]" aria-labelledby="support-title">
            <div class="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-10 sm:px-6 md:flex-row md:justify-between">
              <div class="max-w-md">
                <h2 id="support-title" class="font-display text-[22px] leading-tight font-[460]">{{ t.support.title }}</h2>
                <p class="mt-2 text-[15px] leading-[1.6] text-[var(--soft)]">{{ t.support.text }}</p>
              </div>
              <div class="flex flex-col gap-4 md:items-end">
                @if (donations.links.length) {
                  <ul class="flex flex-wrap gap-2">
                    @for (link of donations.links; track link.platform) {
                      <li>
                        <a
                          [href]="link.url"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--rule)] px-3.5 text-[14px] transition-colors hover:border-[var(--ink)]"
                          >{{ link.name }}<ng-icon name="lucideArrowUpRight" class="text-[var(--soft)] rtl:-scale-x-100"
                        /></a>
                      </li>
                    }
                  </ul>
                }
                @if (donations.crypto.length) {
                  <div class="flex w-full max-w-md flex-col gap-1.5">
                    <p class="font-code text-[12px] tracking-[0.08em] text-[var(--soft)] uppercase">{{ t.support.crypto }}</p>
                    @for (wallet of donations.crypto; track wallet.label + wallet.address) {
                      <div class="flex items-center gap-3 rounded-md border border-[var(--rule)] px-3 py-2 text-[13px]">
                        <span class="w-14 shrink-0 font-medium">{{ wallet.label }}</span>
                        <code #address dir="ltr" class="font-code min-w-0 flex-1 truncate text-[var(--soft)]">{{ wallet.address }}</code>
                        <button type="button" class="shrink-0 text-[12px] underline underline-offset-2" (click)="copy(wallet.address, address)">
                          {{ copied() === wallet.address ? t.support.copied : t.support.copy }}
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </section>
        }
        <div class="mx-auto flex max-w-[1200px] flex-col gap-8 px-5 py-10 text-[14px] text-[var(--soft)] sm:px-6 md:flex-row md:justify-between">
          <div class="flex max-w-md flex-col gap-3">
            <span dir="ltr" class="font-display text-[20px] font-[560] tracking-[-0.02em] text-[var(--ink)]">Locry<span class="text-[var(--accent)]">.</span></span>
            <p>{{ t.footer.tagline }} {{ t.footer.madeWith }}</p>
            <ng-container *ngTemplateOutlet="themeSwitch; context: { $implicit: 'flex self-start' }" />
          </div>
          <nav [attr.aria-label]="t.footer.links" class="font-code flex flex-wrap gap-x-6 gap-y-2 text-[12px] tracking-[0.08em] uppercase">
            <a [attr.href]="anchor('features')" class="hover:text-[var(--ink)]">{{ t.nav.features }}</a>
            <a [attr.href]="anchor('security')" class="hover:text-[var(--ink)]">{{ t.nav.security }}</a>
            <a [attr.href]="anchor('faq')" class="hover:text-[var(--ink)]">{{ t.nav.faq }}</a>
            <a [href]="github" rel="noopener" class="hover:text-[var(--ink)]">GitHub</a>
            <a [routerLink]="privacy(t.lang)" class="hover:text-[var(--ink)]">{{ t.footer.privacy }}</a>
            <a [routerLink]="terms(t.lang)" class="hover:text-[var(--ink)]">{{ t.footer.terms }}</a>
          </nav>
        </div>
        <nav
          class="mx-auto flex max-w-[1200px] flex-wrap gap-x-5 gap-y-2 border-t border-[var(--rule)] px-5 py-6 text-[13.5px] text-[var(--soft)] sm:px-6"
          [attr.aria-label]="t.ui.language"
        >
          @for (lang of langs; track lang) {
            <a
              [routerLink]="path(lang)"
              [attr.hreflang]="tags[lang]"
              [attr.lang]="tags[lang]"
              class="inline-flex items-center gap-2"
              [class]="t.lang === lang ? 'text-[var(--ink)]' : 'hover:text-[var(--ink)]'"
              [attr.aria-current]="t.lang === lang ? 'page' : null"
              (click)="remember(lang)"
              ><app-flag [lang]="lang" />{{ names[lang] }}</a
            >
          }
        </nav>
      </footer>
    </div>
  `,
})
export class LandingPage {
  /** From the route's data: `en` at /, the others at /<code>. */
  readonly lang = input.required<Lang>();
  /** Resolved by the route, so each page only loads its own language. */
  readonly content = input.required<LandingContent>();
  protected readonly prefs = inject(PreferencesService);
  private readonly router = inject(Router);
  private readonly vault = inject(VaultService);

  protected readonly langs = LANGS;
  protected readonly names = LANGUAGE_NAMES;
  protected readonly tags = LANGUAGE_TAGS;
  protected readonly path = landingPath;
  protected readonly privacy = privacyPath;
  protected readonly terms = termsPath;
  /**
   * In-page links carry the page's own path, relative to the document's base: a bare "#faq"
   * on /tr would point at the base (/#faq) and leave the page. Relative, so it also works
   * under a subpath ("tr#faq" with base /locry/).
   */
  protected anchor(id: string): string {
    return `${landingPath(this.lang()).slice(1)}#${id}`;
  }
  protected readonly dir = computed(() => direction(this.content().lang));
  protected readonly github = GITHUB_URL;
  protected readonly githubPath =
    'M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z';
  protected readonly themes: { value: Theme; icon: string }[] = [
    { value: 'light', icon: 'lucideSun' },
    { value: 'dark', icon: 'lucideMoon' },
    { value: 'system', icon: 'lucideMonitor' },
  ];
  /** How a passkey becomes the key of each record (technical names, the same in every language). */
  protected readonly flow = ['Passkey', 'WebAuthn PRF', 'HKDF-SHA-256', 'Vault key · 256 bit', 'AES-256-GCM'];
  protected readonly codeLines = computed(() => this.content().selfHost.code.split('\n'));
  /** Screenshots follow a theme picked here; with "system" they follow the OS. */
  protected readonly shotTheme = computed(() => {
    const theme = this.prefs.theme();
    return theme === 'system' ? null : theme;
  });
  /** Set in the browser only (after hydration), so the prerendered HTML stays the same for everyone. */
  protected readonly hasVault = signal(false);
  protected readonly donations = signal<Donations | null>(null);
  protected readonly copied = signal<string | null>(null);
  private readonly runtime = inject(RuntimeConfigService);

  // Shared class lists of the numbered sections.
  protected readonly row = 'mx-auto grid max-w-[1200px] gap-6 px-5 py-16 sm:px-6 md:grid-cols-[190px_1fr] md:gap-10 md:py-24 [&>*]:min-w-0';
  protected readonly label = 'font-code pt-2 text-[12px] tracking-[0.12em] text-[var(--soft)] uppercase';
  protected readonly h2 = 'font-display max-w-3xl text-[34px] leading-[1.06] font-[440] tracking-[-0.02em] text-balance sm:text-[44px]';
  protected readonly lead = 'mt-5 max-w-2xl text-[17px] leading-[1.65] text-[var(--soft)]';
  protected readonly list = 'mt-8 flex flex-col gap-3';
  protected readonly listItem = 'grid grid-cols-[22px_1fr] text-[15.5px] leading-[1.6]';
  protected readonly dash = 'text-[var(--accent)]';
  protected readonly frame = 'block rounded-[10px] border border-[var(--rule)] bg-[var(--panel)] p-1.5 [&_img]:rounded-[6px]';
  protected readonly textLink =
    'inline-flex items-center gap-1 text-[15px] underline decoration-[var(--rule)] underline-offset-4 hover:decoration-[var(--ink)]';

  constructor() {
    const seo = inject(LandingSeo);
    effect(() => seo.apply(this.content()));
    // The app beyond this page speaks the interface language again.
    inject(DestroyRef).onDestroy(() => this.prefs.applyDocumentLanguage());
    afterNextRender(() => {
      // Installed as an app, Locry opens on the app (theme-init.js does this on page loads;
      // this covers navigating here inside the app).
      if (isInstalledApp()) {
        void this.router.navigateByUrl('/app', { replaceUrl: true });
        return;
      }
      this.hasVault.set(this.vault.vaults().length > 0);
      this.donations.set(this.runtime.donations());
      this.followBrowserLanguage();
    });
  }

  protected async copy(address: string, element: HTMLElement): Promise<void> {
    if (!(await copyText(address, element))) return;
    this.copied.set(address);
    setTimeout(() => this.copied.update((c) => (c === address ? null : c)), 2000);
  }

  /** Remembers a language picked on the page, for this page and the app. */
  protected remember(lang: Lang): void {
    try {
      localStorage.setItem(LANG_CHOICE_KEY, lang);
    } catch {
      // Private mode: the choice just is not remembered.
    }
    this.prefs.setLang(lang);
  }

  /** On /, show the browser's language when we have it, unless the visitor picked one. */
  private followBrowserLanguage(): void {
    if (this.lang() !== 'en') return;
    let chosen: string | null = null;
    try {
      chosen = localStorage.getItem(LANG_CHOICE_KEY);
    } catch {
      chosen = null;
    }
    const lang = isLang(chosen) ? chosen : detectLang(navigator.languages?.length ? navigator.languages : [navigator.language]);
    if (lang !== 'en') void this.router.navigateByUrl(landingPath(lang), { replaceUrl: true });
  }
}

/** Running as an installed app (home screen or desktop) rather than in a browser tab. */
function isInstalledApp(): boolean {
  return (
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    matchMedia(
      '(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui), (display-mode: window-controls-overlay)',
    ).matches
  );
}
