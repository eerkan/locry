import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArchive,
  lucideArrowRight,
  lucideCheck,
  lucideChevronDown,
  lucideCommand,
  lucideFingerprint,
  lucideKeyRound,
  lucideLayers,
  lucideListTodo,
  lucideLock,
  lucideNotebookPen,
  lucideRefreshCw,
  lucideServer,
  lucideShieldCheck,
  lucideSparkles,
  lucideWifiOff,
} from '@ng-icons/lucide';
import { GITHUB_URL } from '../../core/site';
import { VaultService } from '../../core/vault/vault.service';
import { Logo } from '../../shared/logo';
import { LANDING_CONTENT, type LandingLang } from './landing-content';
import { LandingSeo } from './landing-seo';
import { LandingShot } from './landing-shot';

/**
 * Public landing page (Turkish at /, English at /en). Prerendered to static HTML at build
 * time and hydrated in the browser; readable without JavaScript.
 */
@Component({
  selector: 'app-landing-page',
  imports: [LandingShot, Logo, NgIcon, RouterLink],
  providers: [
    provideIcons({
      lucideArchive,
      lucideArrowRight,
      lucideCheck,
      lucideChevronDown,
      lucideCommand,
      lucideFingerprint,
      lucideKeyRound,
      lucideLayers,
      lucideListTodo,
      lucideLock,
      lucideNotebookPen,
      lucideRefreshCw,
      lucideServer,
      lucideShieldCheck,
      lucideSparkles,
      lucideWifiOff,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-h-svh bg-background text-foreground' },
  styles: `
    .glow {
      background:
        radial-gradient(60% 50% at 50% 0%, color-mix(in oklab, var(--color-violet-500) 22%, transparent), transparent 70%),
        radial-gradient(40% 40% at 85% 20%, color-mix(in oklab, var(--color-sky-500) 16%, transparent), transparent 70%);
    }
  `,
  template: `
    @let t = content();
    <a
      href="#main"
      class="bg-primary text-primary-foreground sr-only z-50 rounded-md px-3 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >{{ t.nav.skip }}</a
    >

    <header class="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <nav class="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6" [attr.aria-label]="'Locry'">
        <a [routerLink]="t.path" class="shrink-0" aria-label="Locry"><app-logo /></a>
        <ul class="text-muted-foreground hidden items-center gap-5 text-sm md:flex">
          <li><a href="#features" class="hover:text-foreground transition-colors">{{ t.nav.features }}</a></li>
          <li><a href="#security" class="hover:text-foreground transition-colors">{{ t.nav.security }}</a></li>
          <li><a href="#sync" class="hover:text-foreground transition-colors">{{ t.nav.sync }}</a></li>
          <li><a href="#self-host" class="hover:text-foreground transition-colors">{{ t.nav.selfHost }}</a></li>
          <li><a href="#faq" class="hover:text-foreground transition-colors">{{ t.nav.faq }}</a></li>
        </ul>
        <div class="ms-auto flex items-center gap-2">
          <a
            [routerLink]="t.nav.otherLang"
            [attr.hreflang]="t.lang === 'tr' ? 'en' : 'tr'"
            class="text-muted-foreground hover:text-foreground rounded-md px-2 py-1.5 text-sm transition-colors"
            >{{ t.nav.otherLangLabel }}</a
          >
          <a
            [href]="github"
            rel="noopener"
            class="text-muted-foreground hover:text-foreground hidden rounded-md p-2 transition-colors sm:inline-flex"
            aria-label="GitHub"
          >
            <svg viewBox="0 0 24 24" class="size-5" fill="currentColor" aria-hidden="true"><path [attr.d]="githubPath" /></svg>
          </a>
          <a routerLink="/app" class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3.5 py-2 text-sm font-medium transition-colors">
            {{ hasVault() ? t.hero.resume : t.nav.open }}
          </a>
        </div>
      </nav>
    </header>

    <main id="main">
      <!-- Hero -->
      <section class="glow relative overflow-hidden" aria-labelledby="hero-title">
        <div class="mx-auto max-w-6xl px-4 pt-16 pb-10 text-center sm:px-6 sm:pt-24">
          <p class="text-muted-foreground mx-auto mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs sm:text-sm">
            <ng-icon name="lucideShieldCheck" class="text-emerald-500" />
            {{ t.hero.eyebrow }}
          </p>
          <h1 id="hero-title" class="mx-auto max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            {{ t.hero.title }}
            <span class="bg-gradient-to-r from-violet-500 to-sky-500 bg-clip-text text-transparent">{{ t.hero.accent }}</span>
          </h1>
          <p class="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg text-pretty">{{ t.hero.lead }}</p>
          <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a routerLink="/app" class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-11 items-center gap-2 rounded-lg px-5 font-medium shadow-sm transition-colors">
              {{ hasVault() ? t.hero.resume : t.hero.start }}
              <ng-icon name="lucideArrowRight" />
            </a>
            <a [href]="github" rel="noopener" class="bg-background hover:bg-accent inline-flex h-11 items-center gap-2 rounded-lg border px-5 font-medium transition-colors">
              <svg viewBox="0 0 24 24" class="size-4" fill="currentColor" aria-hidden="true"><path [attr.d]="githubPath" /></svg>
              {{ t.hero.github }}
            </a>
          </div>
          <ul class="text-muted-foreground mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
            @for (badge of t.hero.badges; track badge) {
              <li class="inline-flex items-center gap-1.5"><ng-icon name="lucideCheck" class="text-emerald-500" />{{ badge }}</li>
            }
          </ul>
        </div>
        <div class="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div class="bg-card hidden overflow-hidden rounded-xl border shadow-2xl shadow-violet-500/10 sm:block">
            <app-landing-shot [lang]="t.lang" name="hero" [width]="1440" [height]="900" [alt]="t.hero.screenshotAlt" eager />
          </div>
          <!-- On phones the phone screenshot replaces the desktop one; on larger screens it overlaps it. -->
          <div
            class="bg-card mx-auto w-3/4 max-w-72 overflow-hidden rounded-[1.75rem] border-4 border-zinc-900 shadow-2xl sm:absolute sm:right-8 sm:-bottom-2 sm:w-[22%] sm:max-w-60 dark:border-zinc-700"
          >
            <app-landing-shot [lang]="t.lang" name="phone" [width]="780" [height]="1688" [alt]="t.hero.phoneAlt" eager />
          </div>
        </div>
      </section>

      <!-- Summary: a plain, quotable definition plus key facts -->
      <section class="border-y bg-muted/30" aria-labelledby="summary-title">
        <div class="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 id="summary-title" class="text-2xl font-semibold tracking-tight sm:text-3xl">{{ t.summary.title }}</h2>
            <p class="text-muted-foreground mt-4 text-lg">{{ t.summary.text }}</p>
          </div>
          <dl class="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            @for (fact of t.summary.facts; track fact.term) {
              <div class="bg-background rounded-lg border p-4">
                <dt class="text-muted-foreground text-xs font-medium tracking-wide uppercase">{{ fact.term }}</dt>
                <dd class="mt-1 text-sm font-medium">{{ fact.detail }}</dd>
              </div>
            }
          </dl>
        </div>
      </section>

      <!-- Features -->
      <section id="features" class="scroll-mt-20" aria-labelledby="features-title">
        <div class="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div class="mx-auto max-w-2xl text-center">
            <h2 id="features-title" class="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{{ t.features.title }}</h2>
            <p class="text-muted-foreground mt-4 text-lg">{{ t.features.lead }}</p>
          </div>
          <ul class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @for (feature of t.features.items; track feature.title) {
              <li class="bg-card hover:border-foreground/20 rounded-xl border p-6 transition-colors">
                <span class="bg-primary/5 text-primary flex size-10 items-center justify-center rounded-lg border">
                  <ng-icon [name]="feature.icon" class="text-lg" />
                </span>
                <h3 class="mt-4 font-semibold">{{ feature.title }}</h3>
                <p class="text-muted-foreground mt-2 text-sm leading-relaxed">{{ feature.text }}</p>
              </li>
            }
          </ul>
        </div>
      </section>

      <!-- Tasks -->
      <section class="border-t" aria-labelledby="tasks-title">
        <div class="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 id="tasks-title" class="text-3xl font-semibold tracking-tight">{{ t.tasks.title }}</h2>
            <p class="text-muted-foreground mt-4 text-lg">{{ t.tasks.text }}</p>
            <ul class="mt-6 flex flex-col gap-3">
              @for (item of t.tasks.bullets; track item) {
                <li class="flex gap-3"><ng-icon name="lucideCheck" class="mt-1 shrink-0 text-emerald-500" />{{ item }}</li>
              }
            </ul>
          </div>
          <div class="bg-card overflow-hidden rounded-xl border shadow-xl">
            <app-landing-shot [lang]="t.lang" name="tasks" [width]="1440" [height]="900" [alt]="t.tasks.alt" sizes="(min-width: 1024px) 640px, 100vw" />
          </div>
        </div>
      </section>

      <!-- Security -->
      <section id="security" class="scroll-mt-20 border-t bg-zinc-950 text-zinc-50" aria-labelledby="security-title">
        <div class="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div class="max-w-2xl">
            <p class="inline-flex items-center gap-2 text-sm text-emerald-400"><ng-icon name="lucideLock" />AES-256-GCM · WebAuthn PRF · HKDF</p>
            <h2 id="security-title" class="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{{ t.security.title }}</h2>
            <p class="mt-4 text-lg text-zinc-400">{{ t.security.lead }}</p>
          </div>
          <ol class="mt-12 grid gap-4 md:grid-cols-3">
            @for (step of t.security.steps; track step.title; let i = $index) {
              <li class="relative rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
                <ng-icon [name]="securityIcons[i]" class="text-2xl text-violet-400" />
                <h3 class="mt-4 font-semibold">{{ step.title }}</h3>
                <p class="mt-2 text-sm leading-relaxed text-zinc-400">{{ step.text }}</p>
              </li>
            }
          </ol>
          <div class="mt-12 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <table class="w-full overflow-hidden rounded-xl border border-zinc-800 text-left text-sm">
              <caption class="mb-3 text-left font-semibold">{{ t.security.tableTitle }}</caption>
              <tbody class="divide-y divide-zinc-800">
                @for (row of t.security.rows; track row[0]) {
                  <tr>
                    <th scope="row" class="w-40 bg-zinc-900/60 px-4 py-3 font-medium text-zinc-300">{{ row[0] }}</th>
                    <td class="px-4 py-3 text-zinc-400">{{ row[1] }}</td>
                  </tr>
                }
              </tbody>
            </table>
            <aside class="flex flex-col justify-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
              <ng-icon name="lucideKeyRound" class="text-2xl text-amber-400" />
              <p class="text-zinc-300">{{ t.security.note }}</p>
            </aside>
          </div>
        </div>
      </section>

      <!-- Vaults -->
      <section class="border-t" aria-labelledby="vaults-title">
        <div class="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
          <div class="bg-card order-2 overflow-hidden rounded-xl border shadow-xl lg:order-1">
            <app-landing-shot [lang]="t.lang" name="vaults" [width]="1440" [height]="900" [alt]="t.vaults.alt" sizes="(min-width: 1024px) 600px, 100vw" />
          </div>
          <div class="order-1 lg:order-2">
            <ng-icon name="lucideLayers" class="text-primary text-2xl" />
            <h2 id="vaults-title" class="mt-3 text-3xl font-semibold tracking-tight">{{ t.vaults.title }}</h2>
            <p class="text-muted-foreground mt-4 text-lg">{{ t.vaults.text }}</p>
            <ul class="mt-6 flex flex-col gap-3">
              @for (item of t.vaults.bullets; track item) {
                <li class="flex gap-3"><ng-icon name="lucideCheck" class="mt-1 shrink-0 text-emerald-500" />{{ item }}</li>
              }
            </ul>
          </div>
        </div>
      </section>

      <!-- Sync -->
      <section id="sync" class="scroll-mt-20 border-t bg-muted/30" aria-labelledby="sync-title">
        <div class="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div class="mx-auto max-w-3xl text-center">
            <ng-icon name="lucideRefreshCw" class="text-primary text-2xl" />
            <h2 id="sync-title" class="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{{ t.sync.title }}</h2>
            <p class="text-muted-foreground mt-4 text-lg">{{ t.sync.lead }}</p>
          </div>
          <div class="mt-12 grid items-start gap-10 lg:grid-cols-2">
            <div class="flex flex-col gap-8">
              <ul class="flex flex-col gap-3">
                @for (item of t.sync.bullets; track item) {
                  <li class="flex gap-3"><ng-icon name="lucideCheck" class="mt-1 shrink-0 text-emerald-500" />{{ item }}</li>
                }
              </ul>
              <div>
                <h3 class="font-semibold">{{ t.sync.stepsTitle }}</h3>
                <ol class="mt-4 flex flex-col gap-3">
                  @for (step of t.sync.steps; track step; let i = $index) {
                    <li class="flex gap-3">
                      <span class="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">{{ i + 1 }}</span>
                      <span class="text-muted-foreground">{{ step }}</span>
                    </li>
                  }
                </ol>
              </div>
            </div>
            <div class="bg-card overflow-hidden rounded-xl border shadow-xl">
              <app-landing-shot [lang]="t.lang" name="sync" [width]="1440" [height]="900" [alt]="t.sync.alt" sizes="(min-width: 1024px) 540px, 100vw" />
            </div>
          </div>
        </div>
      </section>

      <!-- Smart search -->
      <section class="border-t" aria-labelledby="search-title">
        <div class="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <ng-icon name="lucideSparkles" class="text-primary text-2xl" />
            <h2 id="search-title" class="mt-3 text-3xl font-semibold tracking-tight">{{ t.search.title }}</h2>
            <p class="text-muted-foreground mt-4 text-lg">{{ t.search.text }}</p>
            <ul class="mt-6 flex flex-col gap-3">
              @for (item of t.search.bullets; track item) {
                <li class="flex gap-3"><ng-icon name="lucideCheck" class="mt-1 shrink-0 text-emerald-500" />{{ item }}</li>
              }
            </ul>
          </div>
          <div class="bg-card overflow-hidden rounded-xl border shadow-xl">
            <app-landing-shot [lang]="t.lang" name="search" [width]="1440" [height]="900" [alt]="t.search.alt" sizes="(min-width: 1024px) 640px, 100vw" />
          </div>
        </div>
      </section>

      <!-- Comparison -->
      <section class="border-t" aria-labelledby="compare-title">
        <div class="mx-auto max-w-4xl px-4 py-20 sm:px-6">
          <h2 id="compare-title" class="text-center text-3xl font-semibold tracking-tight">{{ t.compare.title }}</h2>
          <p class="text-muted-foreground mx-auto mt-4 max-w-2xl text-center text-lg">{{ t.compare.lead }}</p>
          <div class="mt-10 overflow-x-auto rounded-xl border">
            <table class="w-full text-left text-sm">
              <thead class="bg-muted/50">
                <tr>
                  @for (header of t.compare.headers; track $index) {
                    <th scope="col" class="px-4 py-3 font-semibold" [class.text-primary]="$last">{{ header }}</th>
                  }
                </tr>
              </thead>
              <tbody class="divide-y">
                @for (row of t.compare.rows; track row[0]) {
                  <tr>
                    <th scope="row" class="px-4 py-3 font-medium">{{ row[0] }}</th>
                    <td class="text-muted-foreground px-4 py-3">{{ row[1] }}</td>
                    <td class="px-4 py-3 font-medium">
                      <span class="inline-flex items-center gap-1.5"><ng-icon name="lucideCheck" class="text-emerald-500" />{{ row[2] }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- Self-hosting -->
      <section id="self-host" class="scroll-mt-20 border-t bg-muted/30" aria-labelledby="self-host-title">
        <div class="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div>
            <ng-icon name="lucideServer" class="text-primary text-2xl" />
            <h2 id="self-host-title" class="mt-3 text-3xl font-semibold tracking-tight">{{ t.selfHost.title }}</h2>
            <p class="text-muted-foreground mt-4 text-lg">{{ t.selfHost.lead }}</p>
            <ul class="mt-6 flex flex-col gap-3">
              @for (note of t.selfHost.notes; track note) {
                <li class="flex gap-3"><ng-icon name="lucideCheck" class="mt-1 shrink-0 text-emerald-500" />{{ note }}</li>
              }
            </ul>
            <a [href]="github" rel="noopener" class="hover:bg-accent mt-8 inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors">
              <svg viewBox="0 0 24 24" class="size-4" fill="currentColor" aria-hidden="true"><path [attr.d]="githubPath" /></svg>
              {{ t.selfHost.github }}
            </a>
          </div>
          <figure class="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl">
            <div class="flex items-center gap-1.5 border-b border-zinc-800 px-4 py-3" aria-hidden="true">
              <span class="size-3 rounded-full bg-zinc-700"></span>
              <span class="size-3 rounded-full bg-zinc-700"></span>
              <span class="size-3 rounded-full bg-zinc-700"></span>
            </div>
            <pre class="overflow-x-auto p-5 text-sm leading-relaxed text-zinc-100"><code>{{ t.selfHost.code }}</code></pre>
          </figure>
        </div>
      </section>

      <!-- FAQ -->
      <section id="faq" class="scroll-mt-20 border-t" aria-labelledby="faq-title">
        <div class="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <h2 id="faq-title" class="text-center text-3xl font-semibold tracking-tight">{{ t.faq.title }}</h2>
          <div class="mt-10 divide-y rounded-xl border">
            @for (item of t.faq.items; track item.q; let first = $first) {
              <details class="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden" [open]="first">
                <summary class="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  <h3>{{ item.q }}</h3>
                  <ng-icon name="lucideChevronDown" class="text-muted-foreground shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p class="text-muted-foreground mt-3 leading-relaxed">{{ item.a }}</p>
              </details>
            }
          </div>
        </div>
      </section>

      <!-- Final call to action -->
      <section class="glow border-t" aria-labelledby="cta-title">
        <div class="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
          <h2 id="cta-title" class="text-3xl font-semibold tracking-tight sm:text-5xl">{{ t.cta.title }}</h2>
          <p class="text-muted-foreground mx-auto mt-4 max-w-xl text-lg">{{ t.cta.text }}</p>
          <div class="mt-8 flex flex-wrap justify-center gap-3">
            <a routerLink="/app" class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-11 items-center gap-2 rounded-lg px-5 font-medium transition-colors">
              {{ hasVault() ? t.hero.resume : t.cta.start }}
              <ng-icon name="lucideArrowRight" />
            </a>
            <a [href]="github" rel="noopener" class="bg-background hover:bg-accent inline-flex h-11 items-center gap-2 rounded-lg border px-5 font-medium transition-colors">
              {{ t.cta.github }}
            </a>
          </div>
        </div>
      </section>
    </main>

    <footer class="border-t">
      <div class="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div class="flex flex-col gap-2">
          <app-logo />
          <p>{{ t.footer.tagline }} {{ t.footer.madeWith }}</p>
        </div>
        <nav [attr.aria-label]="t.footer.links" class="flex flex-wrap gap-x-5 gap-y-2">
          <a href="#features" class="hover:text-foreground">{{ t.nav.features }}</a>
          <a href="#faq" class="hover:text-foreground">{{ t.nav.faq }}</a>
          <a [href]="github" rel="noopener" class="hover:text-foreground">GitHub · {{ t.footer.openSource }}</a>
          <a [routerLink]="t.nav.otherLang" [attr.hreflang]="t.lang === 'tr' ? 'en' : 'tr'" class="hover:text-foreground">{{ t.nav.otherLangLabel }}</a>
        </nav>
      </div>
    </footer>
  `,
})
export class LandingPage {
  /** From the route's data: `tr` at /, `en` at /en. */
  readonly lang = input.required<LandingLang>();
  protected readonly content = computed(() => LANDING_CONTENT[this.lang()]);
  protected readonly github = GITHUB_URL;
  protected readonly githubPath =
    'M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z';
  protected readonly securityIcons = ['lucideFingerprint', 'lucideKeyRound', 'lucideLock'];

  private readonly vault = inject(VaultService);
  /** Set in the browser only (after hydration), so the prerendered HTML stays the same for everyone. */
  protected readonly hasVault = signal(false);

  constructor() {
    const seo = inject(LandingSeo);
    effect(() => seo.apply(this.content()));
    afterNextRender(() => this.hasVault.set(this.vault.vaults().length > 0));
  }
}
