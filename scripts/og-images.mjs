// Builds the social sharing cards (Open Graph / Twitter, 1200x630) from the dark hero
// screenshot: public/landing/og-<lang>.jpg. Run after scripts/screenshots.mjs.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const OUT = resolve(import.meta.dirname, '../public/landing');
const FONT = process.env.OG_FONT ?? '/System/Library/Fonts/Supplemental/Arial.ttf';
const FONT_BOLD = process.env.OG_FONT_BOLD ?? '/System/Library/Fonts/Supplemental/Arial Bold.ttf';

const CARDS = {
  tr: {
    title: ['Notların ve görevlerin,', 'yalnızca senin anahtarınla.'],
    subtitle: 'Uçtan uca şifreli  ·  Passkey ile giriş  ·  Açık kaynak',
  },
  en: {
    title: ['Your notes and tasks,', 'locked with your key only.'],
    subtitle: 'End-to-end encrypted  ·  Passkey sign-in  ·  Open source',
  },
};

const tmp = mkdtempSync(join(tmpdir(), 'locry-og-'));
try {
  for (const [lang, card] of Object.entries(CARDS)) {
    const shot = join(tmp, `${lang}-shot.png`);
    // The top of the app screenshot, with rounded corners and a hairline border.
    execFileSync('magick', [
      join(OUT, lang, 'hero-dark.webp'),
      '-resize', '1072x',
      '-crop', '1072x400+0+0', '+repage',
      '(', '+clone', '-alpha', 'extract', '-fill', 'black', '-colorize', '100',
      '-fill', 'white', '-draw', 'roundrectangle 0,0 1071,520 18,18', ')',
      '-alpha', 'off', '-compose', 'CopyOpacity', '-composite',
      '-fill', 'none', '-stroke', '#3f3f46', '-strokewidth', '2',
      '-draw', 'roundrectangle 1,1 1070,520 18,18',
      shot,
    ]);
    execFileSync('magick', [
      '-size', '1200x630', 'xc:#09090b',
      '(', '-size', '1800x1800', 'radial-gradient:#4c1d95-#09090b', ')',
      '-geometry', '-300-1100', '-compose', 'screen', '-composite',
      '-compose', 'over',
      '-font', FONT_BOLD, '-fill', '#a78bfa', '-pointsize', '26', '-annotate', '+64+78', 'Locry',
      '-fill', '#fafafa', '-pointsize', '50',
      '-annotate', '+64+146', card.title[0],
      '-annotate', '+64+206', card.title[1],
      '-font', FONT, '-fill', '#a1a1aa', '-pointsize', '24', '-annotate', '+66+254', card.subtitle,
      shot, '-geometry', '+64+290', '-composite',
      '-strip', '-quality', '88', '-sampling-factor', '4:4:4', join(OUT, `og-${lang}.jpg`),
    ]);
    console.log(`og-${lang}.jpg`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
