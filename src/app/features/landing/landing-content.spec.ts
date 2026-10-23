import { LANGS } from '../../core/languages';
import { landingPath, loadLandingContent, type LandingContent } from './landing-content';

/** Shape of a value: arrays by length and item shape, objects by keys, strings as non-empty. */
function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, shape(v)]));
  }
  return typeof value === 'string' ? value.trim().length > 0 : typeof value;
}

describe('landing content', () => {
  let all: LandingContent[];

  beforeAll(async () => {
    all = await Promise.all(LANGS.map(loadLandingContent));
  });

  it('says the same things in every language', () => {
    const [en, ...others] = all;
    for (const content of others) expect(shape(content), content.lang).toEqual(shape(en));
  });

  it('loads each language under its own code', () => {
    expect(all.map((c) => c.lang)).toEqual([...LANGS]);
  });

  it('keeps titles and descriptions within search result limits', () => {
    for (const content of all) {
      expect(content.meta.title.length, content.lang).toBeLessThanOrEqual(70);
      expect(content.meta.description.length, content.lang).toBeGreaterThanOrEqual(content.lang === 'zh' || content.lang === 'ja' ? 50 : 120);
      expect(content.meta.description.length, content.lang).toBeLessThanOrEqual(230);
    }
  });

  it('puts English at / and the others under their code', () => {
    expect(landingPath('en')).toBe('/');
    expect(landingPath('ar')).toBe('/ar');
  });
});
