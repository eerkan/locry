import { isPlatformServer } from '@angular/common';
import { DOCUMENT, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { GITHUB_URL, SITE_URL_PLACEHOLDER } from '../../core/site';
import { DEFAULT_LANG, LANGS, LANGUAGE_TAGS, OG_LOCALES, direction, type Lang } from '../../core/languages';
import { landingPath, type LandingContent } from './landing-content';

/** First-screen fonts per script; CJK and Arabic headlines use system fonts, so nothing to preload. */
function firstScreenFonts(lang: Lang): string[] {
  switch (lang) {
    case 'zh':
    case 'ja':
    case 'ar':
      return [];
    case 'ru':
      return ['geist-cyrillic-wght-normal'];
    case 'tr':
      // Turkish also needs Latin Extended (ş, ğ) in the body font.
      return ['fraunces-latin-wght-normal', 'fraunces-latin-wght-italic', 'geist-latin-wght-normal', 'geist-latin-ext-wght-normal'];
    default:
      return ['fraunces-latin-wght-normal', 'fraunces-latin-wght-italic', 'geist-latin-wght-normal'];
  }
}

/**
 * Head tags for a landing page: title, description, canonical and language alternates, Open
 * Graph / Twitter cards and JSON-LD structured data. Runs during prerendering, so crawlers get
 * everything without executing JavaScript, and again in the browser (idempotently).
 */
@Injectable({ providedIn: 'root' })
export class LandingSeo {
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly server = isPlatformServer(inject(PLATFORM_ID));

  apply(content: LandingContent): void {
    const site = this.siteOrigin();
    const url = `${site}${landingPath(content.lang)}`;
    const image = `${site}/landing/og-${content.lang}.jpg`;
    this.document.documentElement.lang = LANGUAGE_TAGS[content.lang];
    this.document.documentElement.dir = direction(content.lang);
    this.title.setTitle(content.meta.title);

    const tags: [string, string, string][] = [
      ['name', 'description', content.meta.description],
      ['name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1'],
      ['property', 'og:type', 'website'],
      ['property', 'og:site_name', 'Locry'],
      ['property', 'og:title', content.meta.title],
      ['property', 'og:description', content.meta.description],
      ['property', 'og:url', url],
      ['property', 'og:locale', OG_LOCALES[content.lang]],
      ['property', 'og:image', image],
      ['property', 'og:image:width', '1200'],
      ['property', 'og:image:height', '630'],
      ['property', 'og:image:alt', content.meta.ogImageAlt],
      ['name', 'twitter:card', 'summary_large_image'],
      ['name', 'twitter:title', content.meta.title],
      ['name', 'twitter:description', content.meta.description],
      ['name', 'twitter:image', image],
      ['name', 'twitter:image:alt', content.meta.ogImageAlt],
    ];
    for (const [attr, key, value] of tags) this.meta.updateTag({ [attr]: key, content: value }, `${attr}="${key}"`);
    this.meta.getTags('property="og:locale:alternate"').forEach((tag) => this.meta.removeTagElement(tag));
    for (const lang of LANGS) {
      if (lang !== content.lang) this.meta.addTag({ property: 'og:locale:alternate', content: OG_LOCALES[lang] });
    }

    this.link('canonical', 'canonical', url);
    for (const lang of LANGS) this.link(`alternate-${lang}`, 'alternate', `${site}${landingPath(lang)}`, LANGUAGE_TAGS[lang]);
    this.link('alternate-default', 'alternate', `${site}${landingPath(DEFAULT_LANG)}`, 'x-default');
    this.jsonLd(structuredData(content, site));
    // Fonts of the first screen, so the headline does not reflow when they arrive.
    const fonts = firstScreenFonts(content.lang);
    this.document.head.querySelectorAll('link[data-seo^="font-"]').forEach((link, i) => i >= fonts.length && link.remove());
    fonts.forEach((font, i) => this.preload(`font-${i}`, `/fonts/${font}.woff2`));
  }

  private preload(id: string, href: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>(`link[data-seo="${id}"]`);
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('data-seo', id);
      link.setAttribute('rel', 'preload');
      link.setAttribute('as', 'font');
      link.setAttribute('type', 'font/woff2');
      link.setAttribute('crossorigin', '');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  /**
   * Prerendering writes the placeholder, which the server replaces with the real address. In
   * the browser, keep that address (from the canonical link) rather than writing it back.
   */
  private siteOrigin(): string {
    if (this.server) return SITE_URL_PLACEHOLDER;
    const canonical = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;
    return canonical ? new URL(canonical).origin : this.document.location.origin;
  }

  private link(id: string, rel: string, href: string, hreflang?: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>(`link[data-seo="${id}"]`);
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('data-seo', id);
      this.document.head.appendChild(link);
    }
    link.setAttribute('rel', rel);
    link.setAttribute('href', href);
    if (hreflang) link.setAttribute('hreflang', hreflang);
  }

  /** A data block, never executed, so the Content Security Policy does not apply to it. */
  private jsonLd(data: object): void {
    let script = this.document.head.querySelector<HTMLScriptElement>('script[data-seo="jsonld"]');
    if (!script) {
      script = this.document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-seo', 'jsonld');
      this.document.head.appendChild(script);
    }
    // Escape "<" so the JSON can never close the script element.
    script.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
  }
}

function structuredData(content: LandingContent, site: string): object {
  const url = `${site}${landingPath(content.lang)}`;
  const image = `${site}/landing/og-${content.lang}.jpg`;
  const languages = LANGS.map((lang) => LANGUAGE_TAGS[lang]);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${site}/#website`,
        url: `${site}/`,
        name: 'Locry',
        inLanguage: languages,
      },
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: content.meta.title,
        description: content.meta.description,
        inLanguage: LANGUAGE_TAGS[content.lang],
        isPartOf: { '@id': `${site}/#website` },
        about: { '@id': `${site}/#app` },
        primaryImageOfPage: image,
        ...(content.lang === DEFAULT_LANG
          ? { workTranslation: LANGS.filter((l) => l !== DEFAULT_LANG).map((l) => ({ '@id': `${site}${landingPath(l)}#webpage` })) }
          : { translationOfWork: { '@id': `${site}${landingPath(DEFAULT_LANG)}#webpage` } }),
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${site}/#app`,
        name: 'Locry',
        url: `${site}/`,
        description: content.summary.text,
        applicationCategory: 'ProductivityApplication',
        applicationSubCategory: 'Note-taking and to-do app',
        operatingSystem: 'Web browser, macOS, Windows, Linux, iOS, Android',
        browserRequirements: 'Passkeys with the WebAuthn PRF extension: Chrome or Edge 118+, Safari 18+',
        inLanguage: languages,
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        featureList: content.features.items.map((f) => `${f.title}: ${f.text}`),
        screenshot: `${site}/landing/${content.lang}/hero-light.webp`,
        image,
        sameAs: [GITHUB_URL],
      },
      {
        '@type': 'SoftwareSourceCode',
        '@id': `${site}/#source`,
        name: 'Locry',
        codeRepository: GITHUB_URL,
        programmingLanguage: ['TypeScript', 'Angular'],
        runtimePlatform: 'Web browser',
        targetProduct: { '@id': `${site}/#app` },
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        inLanguage: LANGUAGE_TAGS[content.lang],
        mainEntity: content.faq.items.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
      {
        '@type': 'HowTo',
        '@id': `${url}#howto`,
        name: content.howTo.name,
        description: content.howTo.description,
        inLanguage: LANGUAGE_TAGS[content.lang],
        totalTime: 'PT1M',
        tool: [{ '@type': 'HowToTool', name: 'Passkey' }],
        step: content.howTo.steps.map((step, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: step.name,
          text: step.text,
        })),
      },
    ],
  };
}
