import { LANGS } from '../../core/languages';
import { LEGAL_DOCS, type PrivacyContent, linkParts, loadLegalContent, loadPrivacyContent, privacyPath, termsPath } from './privacy-content';

/** Sections, paragraphs and the links in them: every language must say the same things. */
function shape(content: PrivacyContent): unknown {
  return content.sections.map((s) => s.body.map((p) => linkParts(p).flatMap((part) => ('url' in part ? [part.url] : []))));
}

describe('privacy policy', () => {
  let all: PrivacyContent[];

  beforeAll(async () => {
    all = await Promise.all(LANGS.map(loadPrivacyContent));
  });

  it('has the same sections, paragraphs and links in every language', () => {
    const [en, ...others] = all;
    for (const content of others) expect(shape(content), content.lang).toEqual(shape(en));
    expect(all.map((c) => c.lang)).toEqual([...LANGS]);
  });

  it('states the Limited Use commitment Google requires, with its policy link, in every language', () => {
    for (const content of all) {
      const text = content.sections.flatMap((s) => s.body).join(' ');
      expect(text, content.lang).toContain('https://developers.google.com/terms/api-services-user-data-policy');
      expect(text, content.lang).toContain('drive.appdata');
    }
  });

  it('keeps titles and descriptions within search result limits', () => {
    for (const content of all) {
      expect(content.meta.title.length, content.lang).toBeLessThanOrEqual(70);
      expect(content.meta.description.length, content.lang).toBeLessThanOrEqual(230);
    }
  });

  it('has the same terms of service in every language, within search result limits', async () => {
    const terms = await Promise.all(LANGS.map((lang) => loadLegalContent('terms', lang)));
    const [en, ...others] = terms;
    for (const content of others) expect(shape(content), content.lang).toEqual(shape(en));
    for (const content of terms) {
      expect(content.lang).toBe(LANGS[terms.indexOf(content)]);
      expect(content.meta.title.length, content.lang).toBeLessThanOrEqual(70);
      expect(content.meta.description.length, content.lang).toBeLessThanOrEqual(230);
      expect(content.sections.flatMap((s) => s.body).join(' '), content.lang).toContain('https://github.com/eerkan/locry/blob/main/LICENSE');
    }
    expect(LEGAL_DOCS).toEqual(['privacy', 'terms']);
  });

  it('turns [label](https://…) into links and leaves other text alone', () => {
    expect(linkParts('See [the policy](https://example.com/p) now.')).toEqual([
      { text: 'See ' },
      { label: 'the policy', url: 'https://example.com/p' },
      { text: ' now.' },
    ]);
    expect(linkParts('No [link](javascript:alert(1)) here.')).toEqual([{ text: 'No [link](javascript:alert(1)) here.' }]);
  });

  it('lives at /privacy in English and /<code>/privacy otherwise', () => {
    expect(privacyPath('en')).toBe('/privacy');
    expect(privacyPath('tr')).toBe('/tr/privacy');
    expect(termsPath('en')).toBe('/terms');
    expect(termsPath('ja')).toBe('/ja/terms');
  });
});
