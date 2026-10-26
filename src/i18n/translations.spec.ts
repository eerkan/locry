import { detectLang, direction, langFromTag, LANGS, type Lang } from '../app/core/languages';
import { ar } from './ar';
import { de } from './de';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { id } from './id';
import { ja } from './ja';
import { pt } from './pt';
import { ru } from './ru';
import { tr } from './tr';
import { zh } from './zh';

const ALL: Record<Lang, object> = { en, tr, zh, es, ar, pt, id, fr, ja, ru, de };

/** Every leaf string keyed by its dotted path. */
function flatten(value: unknown, prefix = '', out = new Map<string, string>()): Map<string, string> {
  if (typeof value === 'string') {
    out.set(prefix, value);
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) flatten(child, prefix ? `${prefix}.${key}` : key, out);
  }
  return out;
}

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort();
}

describe('translations', () => {
  const reference = flatten(en);

  for (const lang of LANGS) {
    it(`${lang} has the same keys and placeholders as English`, () => {
      const strings = flatten(ALL[lang]);
      expect([...strings.keys()].sort()).toEqual([...reference.keys()].sort());
      for (const [key, text] of reference) {
        expect(placeholders(strings.get(key) ?? ''), `${lang}: ${key}`).toEqual(placeholders(text));
        expect((strings.get(key) ?? '').trim().length, `${lang}: ${key} is empty`).toBeGreaterThan(0);
      }
    });
  }

  it('detects the browser language by its primary subtag', () => {
    expect(detectLang(['pt-PT', 'en'])).toBe('pt');
    expect(detectLang(['zh-CN'])).toBe('zh');
    expect(detectLang(['nl-NL', 'de-AT'])).toBe('de');
    expect(detectLang(['nl'])).toBe('en');
    expect(detectLang([])).toBe('en');
  });

  it('reads the language of an <html lang> tag', () => {
    expect(langFromTag('zh-Hans')).toBe('zh');
    expect(langFromTag('pt-BR')).toBe('pt');
    expect(langFromTag('tr')).toBe('tr');
    expect(langFromTag('en-GB')).toBe('en');
    expect(langFromTag('nl')).toBeNull();
    expect(langFromTag('')).toBeNull();
  });

  it('writes Arabic right to left', () => {
    expect(direction('ar')).toBe('rtl');
    expect(direction('en')).toBe('ltr');
  });
});
