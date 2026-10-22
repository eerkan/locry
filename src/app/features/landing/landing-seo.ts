import { isPlatformServer } from '@angular/common';
import { DOCUMENT, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { GITHUB_URL, SITE_URL_PLACEHOLDER } from '../../core/site';
import { LANDING_CONTENT, type LandingContent } from './landing-content';

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
    const url = `${site}${content.path}`;
    const image = `${site}/landing/og-${content.lang}.jpg`;
    this.document.documentElement.lang = content.lang;
    this.title.setTitle(content.meta.title);

    const tags: [string, string, string][] = [
      ['name', 'description', content.meta.description],
      ['name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1'],
      ['property', 'og:type', 'website'],
      ['property', 'og:site_name', 'Locry'],
      ['property', 'og:title', content.meta.title],
      ['property', 'og:description', content.meta.description],
      ['property', 'og:url', url],
      ['property', 'og:locale', content.locale],
      ['property', 'og:locale:alternate', content.lang === 'tr' ? 'en_US' : 'tr_TR'],
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

    this.link('canonical', 'canonical', url);
    this.link('alternate-tr', 'alternate', `${site}/`, 'tr');
    this.link('alternate-en', 'alternate', `${site}/en`, 'en');
    this.link('alternate-default', 'alternate', `${site}/`, 'x-default');
    this.jsonLd(structuredData(content, site));
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
  const url = `${site}${content.path}`;
  const other = LANDING_CONTENT[content.lang === 'tr' ? 'en' : 'tr'];
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${site}/#website`,
        url: `${site}/`,
        name: 'Locry',
        inLanguage: ['tr', 'en'],
      },
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: content.meta.title,
        description: content.meta.description,
        inLanguage: content.lang,
        isPartOf: { '@id': `${site}/#website` },
        about: { '@id': `${site}/#app` },
        primaryImageOfPage: `${site}/landing/og-${content.lang}.jpg`,
        workTranslation: { '@id': `${site}${other.path}#webpage` },
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
        inLanguage: ['tr', 'en'],
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        featureList: content.features.items.map((f) => `${f.title}: ${f.text}`),
        screenshot: `${site}/landing/${content.lang}/hero-light.webp`,
        image: `${site}/landing/og-${content.lang}.jpg`,
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
        inLanguage: content.lang,
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
        inLanguage: content.lang,
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
