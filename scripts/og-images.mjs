// Builds the social sharing cards (Open Graph / Twitter, 1200x630) from the dark hero
// screenshot: public/landing/og-<lang>.jpg. Run after scripts/screenshots.mjs.
//
// Rendered as HTML in Google Chrome rather than drawn with ImageMagick, so every script is set
// properly: joined, right-to-left Arabic and Chinese/Japanese with the system's fonts. The
// headline and tagline come from the landing page's own text.
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { LANGS, LANGUAGE_TAGS, direction } from '../src/app/core/languages.ts';

const OUT = resolve(import.meta.dirname, '../public/landing');
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function card(lang, content, shot) {
  return `<!doctype html>
<html lang="${LANGUAGE_TAGS[lang]}" dir="${direction(lang)}">
<style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden; position: relative;
    background: radial-gradient(900px 900px at 300px -200px, #4c1d95, #09090b 70%), #09090b;
    font-family: -apple-system, 'Helvetica Neue', Arial, 'PingFang SC', 'Hiragino Sans', 'Geeza Pro', sans-serif;
    color: #fafafa; padding: 0 64px;
  }
  .brand { position: absolute; top: 52px; inset-inline-start: 64px; font: 700 26px/1 -apple-system, Arial, sans-serif; color: #a78bfa; }
  h1 { position: absolute; top: 96px; inset-inline: 64px; font-size: 50px; font-weight: 700; line-height: 60px; white-space: nowrap; }
  p { position: absolute; top: 226px; inset-inline: 66px; font-size: 24px; color: #a1a1aa; white-space: nowrap; }
  .shot {
    position: absolute; top: 290px; inset-inline-start: 64px; width: 1072px; height: 400px; overflow: hidden;
    border-radius: 18px; border: 2px solid #3f3f46;
    background: url(${shot}) top center / 1072px auto no-repeat;
  }
</style>
<div class="brand">Locry</div>
<h1>${escape(content.hero.title)}<br>${escape(content.hero.accent)}</h1>
<p>${escape(content.hero.eyebrow)}</p>
<div class="shot"></div>
<script>
  // Long headlines in some languages: shrink until both lines fit.
  for (const el of document.querySelectorAll('h1, p')) {
    let size = parseFloat(getComputedStyle(el).fontSize);
    while (el.scrollWidth > el.clientWidth && size > 20) {
      size -= 1;
      el.style.fontSize = size + 'px';
      if (el.tagName === 'H1') el.style.lineHeight = Math.round(size * 1.2) + 'px';
    }
  }
</script>
</html>`;
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const lang of process.env.LANGS?.split(',') ?? LANGS) {
    const content = (await import(`../src/app/features/landing/content/${lang}.ts`))[lang];
    const shot = `data:image/webp;base64,${readFileSync(join(OUT, lang, 'hero-dark.webp')).toString('base64')}`;
    await page.setContent(card(lang, content, shot), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(OUT, `og-${lang}.jpg`), type: 'jpeg', quality: 88 });
    console.log(`og-${lang}.jpg`);
  }
} finally {
  await browser.close();
}
