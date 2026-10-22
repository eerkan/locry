import { LANDING_CONTENT } from './landing-content';

/** Shape of a value: arrays by length and item shape, objects by keys, strings as non-empty. */
function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, shape(v)]));
  }
  return typeof value === 'string' ? value.trim().length > 0 : typeof value;
}

describe('landing content', () => {
  const { tr, en } = LANDING_CONTENT;

  it('says the same things in Turkish and English', () => {
    expect(shape(en)).toEqual(shape(tr));
  });

  it('keeps titles and descriptions within search result limits', () => {
    for (const content of [tr, en]) {
      expect(content.meta.title.length).toBeLessThanOrEqual(70);
      expect(content.meta.description.length).toBeGreaterThanOrEqual(120);
      expect(content.meta.description.length).toBeLessThanOrEqual(230);
    }
  });
});
