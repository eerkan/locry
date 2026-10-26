// Builds the social sharing cards (Open Graph / Twitter / WhatsApp, 1200x630) in the landing
// page's style: public/landing/og-<lang>.jpg. Run after scripts/screenshots.mjs.
//
// Rendered as HTML in Google Chrome with the landing page's own fonts (embedded from
// @fontsource-variable), so every script is set properly: right-to-left Arabic, and Chinese /
// Japanese with the system's fonts as on the page. The text comes from the landing content.
// After changing the cards, raise OG_IMAGE_VERSION in landing-seo.ts: chat apps cache images
// by URL for a long time.
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { LANGS, LANGUAGE_TAGS, direction } from '../src/app/core/languages.ts';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(ROOT, 'public/landing');
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const dataUrl = (file, type) => `data:${type};base64,${readFileSync(file).toString('base64')}`;

/** The landing page's fonts, embedded so the card needs no network. */
function fontFaces() {
  const font = (pkg, file) => dataUrl(join(ROOT, 'node_modules/@fontsource-variable', pkg, 'files', `${file}.woff2`), 'font/woff2');
  const latin = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215';
  const latinExt = 'U+0100-02AF,U+0304,U+0308,U+0329,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
  const cyrillic = 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116';
  const face = (family, style, src, range) =>
    `@font-face{font-family:'${family}';font-style:${style};font-weight:100 900;src:url(${src}) format('woff2');unicode-range:${range}}`;
  return [
    face('Fraunces', 'normal', font('fraunces', 'fraunces-latin-wght-normal'), latin),
    face('Fraunces', 'normal', font('fraunces', 'fraunces-latin-ext-wght-normal'), latinExt),
    face('Fraunces', 'italic', font('fraunces', 'fraunces-latin-wght-italic'), latin),
    face('Fraunces', 'italic', font('fraunces', 'fraunces-latin-ext-wght-italic'), latinExt),
    face('Geist', 'normal', font('geist', 'geist-latin-wght-normal'), latin),
    face('Geist', 'normal', font('geist', 'geist-latin-ext-wght-normal'), latinExt),
    face('Geist', 'normal', font('geist', 'geist-cyrillic-wght-normal'), cyrillic),
    face('Geist Mono', 'normal', font('geist-mono', 'geist-mono-latin-wght-normal'), latin),
    face('Geist Mono', 'normal', font('geist-mono', 'geist-mono-latin-ext-wght-normal'), latinExt),
    face('Geist Mono', 'normal', font('geist-mono', 'geist-mono-cyrillic-wght-normal'), cyrillic),
  ].join('\n');
}

function card(lang, content, shot, fonts) {
  // Scripts without italics or with joined letters: no slant, no tracking (as on the page).
  const plain = ['zh', 'ja', 'ar'].includes(lang);
  return `<!doctype html>
<html lang="${LANGUAGE_TAGS[lang]}" dir="${direction(lang)}">
<style>
  ${fonts}
  * { margin: 0; box-sizing: border-box; }
  /* Right to left, the frame overflowing on the left would make the page scroll to its start. */
  html { overflow: hidden; }
  body {
    width: 1200px; height: 630px; overflow: hidden; position: relative;
    background: #f6f5f1; color: #16150f;
    font-family: 'Geist', -apple-system, 'PingFang SC', 'Hiragino Sans', 'Geeza Pro', sans-serif;
  }
  /* Thin rules like the page's section borders. */
  .rule { position: absolute; inset-inline: 0; height: 1px; background: #dcd9cf; }
  .text { position: absolute; top: 0; bottom: 0; inset-inline-start: 64px; width: 560px; display: flex; flex-direction: column; padding: 56px 0 52px; }
  .brand { font: 560 34px/1 'Fraunces', Georgia, serif; letter-spacing: -0.02em; }
  .brand span { color: #b03f0c; }
  .eyebrow {
    margin-top: auto; display: flex; align-items: center; gap: 12px;
    /* Geist Mono has no CJK or Arabic: those fall back to the system sans, not a monospace. */
    font: 400 15px/1.4 'Geist Mono', ${plain ? '-apple-system, sans-serif' : 'ui-monospace, monospace'}; letter-spacing: ${plain ? '0' : '0.12em'};
    text-transform: uppercase; color: #57554c;
  }
  .eyebrow i { width: 8px; height: 8px; background: #b03f0c; flex: none; }
  h1 {
    margin-top: 22px; font: 440 ${['zh', 'ja'].includes(lang) ? 46 : 64}px/1.08 'Fraunces', ${plain ? "'Hiragino Mincho ProN', 'Songti SC', 'Geeza Pro'," : ''} Georgia, serif;
    letter-spacing: ${plain ? '0' : '-0.025em'}; text-wrap: balance;
  }
  /* The wordmark stays left to right, at the start side of the column. */
  .brand { align-self: flex-start; }
  h1 em { display: block; font-style: ${plain ? 'normal' : 'italic'}; font-weight: 380; color: #b03f0c; }
  .shot {
    position: absolute; top: 72px; inset-inline-start: 676px; width: 760px; padding: 8px;
    border: 1px solid #dcd9cf; border-radius: 14px; background: #edebe4;
    box-shadow: 0 30px 60px -30px rgb(22 21 15 / 0.35);
  }
  .shot img { display: block; width: 100%; border-radius: 8px; border: 1px solid #dcd9cf; }
</style>
<div class="rule" style="top: 0"></div>
<div class="text">
  <div class="brand" dir="ltr">Locry<span>.</span></div>
  <p class="eyebrow"><i></i>${escape(content.hero.eyebrow)}</p>
  <h1>${escape(content.hero.title)} <em>${escape(content.hero.accent)}</em></h1>
</div>
<div class="shot"><img src="${shot}" alt="" /></div>
<script>
  // Long headlines or long words: shrink until the headline fits its column, in both height
  // and width (Arabic and German words cannot break).
  const h1 = document.querySelector('h1');
  const room = document.querySelector('.text').clientHeight - 56 - 52 - 34 - 120;
  const overflows = () => h1.scrollHeight > room || h1.scrollWidth > h1.clientWidth;
  let size = parseFloat(getComputedStyle(h1).fontSize);
  while (overflows() && size > 32) {
    size -= 2;
    h1.style.fontSize = size + 'px';
  }
</script>
</html>`;
}

const fonts = fontFaces();
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const lang of process.env.LANGS?.split(',') ?? LANGS) {
    const content = (await import(`../src/app/features/landing/content/${lang}.ts`))[lang];
    const shot = dataUrl(join(OUT, lang, 'hero-light-1080.webp'), 'image/webp');
    await page.setContent(card(lang, content, shot, fonts), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(OUT, `og-${lang}.jpg`), type: 'jpeg', quality: 86 });
    console.log(`og-${lang}.jpg`);
  }
} finally {
  await browser.close();
}
