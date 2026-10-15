#!/usr/bin/env node
// Builds the public website that GitHub Pages serves from /docs:
//   docs/index.html, docs/ar/index.html   landing page (English, Arabic)
//   docs/privacy/index.html               privacy policy, generated from PRIVACY.md
//   docs/404.html, docs/sitemap.xml, docs/assets/*
// Page sources live in website/. The live demo runs the extension's own engine,
// copied from src/core, so the site always behaves exactly like the extension.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { landing, privacyPage, notFound, esc } from '../website/page.mjs';
import { COPY } from '../website/copy.mjs';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'docs');
const web = join(root, 'website');

const SITE = 'https://devehab.github.io/KeyFlip/';
const BASE_PATH = '/KeyFlip/';
const REPO = 'https://github.com/Devehab/KeyFlip';
// Chrome Web Store listing. Fill this in once KeyFlip is approved, then run
// `npm run docs`: every "Get KeyFlip" button switches to the store.
const STORE_URL = '';

const { version: VERSION } = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
const converter = require('../src/core/converter.js');
const layouts = require('../src/core/layouts.js');
const dictionary = require('../src/core/dictionary.js');

// ---------- data computed from the real engine ----------

const RTL = /[֐-ࣿיִ-﷿ﹰ-ﻼ]/;
const dirOf = (s) => (RTL.test(s) ? 'rtl' : 'ltr');

function flip(text, other) {
  const result = converter.analyze(text, converter.createPair('en-us', other));
  const picks = result.words.map((w) => converter.autoPick(w, dictionary.isWord) || w.candidates[0]);
  return result.render(converter.choicesFrom(picks));
}

const HERO = {
  en: [[';dt phg;', 'ar-101'], ['اثممخ صخقمي', 'ar-101'], ['hgsghl ugd;l', 'ar-101'], ['ghbdtn', 'ru']],
  ar: [[';dt phg;', 'ar-101'], ['hgsghl ugd;l', 'ar-101'], ['اثممخ صخقمي', 'ar-101'], ['ghbdtn', 'ru']],
};
const examples = (lang) => HERO[lang].map(([from, other]) => {
  const to = flip(from, other);
  return { from, to, fromDir: dirOf(from), toDir: dirOf(to) };
});

const TOAST_FORMS = {
  en: { one: 'Flipped {n} character', other: 'Flipped {n} characters' },
  ar: { zero: 'لم يتغير شيء', one: 'تم قلب حرف واحد', two: 'تم قلب حرفين', few: 'تم قلب {n} أحرف', many: 'تم قلب {n} حرفاً', other: 'تم قلب {n} حرف' },
};
const toastFor = (lang) => (text) => {
  const n = Array.from(text).length;
  const forms = TOAST_FORMS[lang];
  return (forms[new Intl.PluralRules(lang).select(n)] || forms.other).replace('{n}', n);
};

const MAC_KEYS = ['KeyV', 'KeyB', 'KeyN', 'KeyM'];
const macDiff = MAC_KEYS.map((code) => ({
  label: code.replace('Key', ''),
  win: layouts.get('ar-101').keys[code][0],
  mac: layouts.get('ar-mac').keys[code][0],
}));

const GLYPHS = { en: 'A', ar: 'ض', fa: 'پ', ur: 'ے', he: 'א', fr: 'É', de: 'ß', ru: 'Ж', tr: 'Ş' };
const VARIANTS = {
  'en-us': ['US', 'US'], 'en-gb': ['UK', 'UK'],
  'ar-101': ['Windows (101)', 'ويندوز (101)'], 'ar-mac': ['Mac', 'ماك'], 'ar-mac-qwerty': ['Mac QWERTY', 'ماك QWERTY'],
  fa: ['Windows', 'ويندوز'], 'fa-mac': ['Mac', 'ماك'], ur: ['Windows', 'ويندوز'],
  he: ['Windows', 'ويندوز'], 'he-mac': ['Mac', 'ماك'],
  'fr-azerty': ['AZERTY · Windows', 'AZERTY · ويندوز'], 'fr-mac': ['AZERTY · Mac', 'AZERTY · ماك'],
  'de-qwertz': ['QWERTZ · Windows', 'QWERTZ · ويندوز'], 'de-mac': ['QWERTZ · Mac', 'QWERTZ · ماك'],
  ru: ['Windows', 'ويندوز'], 'ru-mac': ['Mac', 'ماك'], 'tr-q': ['Q', 'Q'],
};
for (const g of layouts.grouped()) for (const it of g.items) if (!VARIANTS[it.id]) throw new Error(`No website label for layout ${it.id}`);

// ---------- privacy policy (just enough Markdown for PRIVACY.md) ----------

function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/(^|[\s(])(https:\/\/[^\s<)]+)/g, '$1<a href="$2">$2</a>');
}
function markdown(md) {
  const html = [];
  let list = false;
  const close = () => { if (list) { html.push('</ul>'); list = false; } };
  for (const line of md.split('\n')) {
    if (/^###\s/.test(line)) { close(); html.push(`<h3>${inline(line.slice(4))}</h3>`); }
    else if (/^##\s/.test(line)) { close(); html.push(`<h2>${inline(line.slice(3))}</h2>`); }
    else if (/^-\s/.test(line)) { if (!list) { html.push('<ul>'); list = true; } html.push(`<li>${inline(line.slice(2))}</li>`); }
    else if (/^---\s*$/.test(line) || !line.trim()) { close(); }
    else { close(); html.push(`<p>${inline(line)}</p>`); }
  }
  close();
  return html.join('\n');
}

// ---------- assets ----------

function copyAssets() {
  const a = join(out, 'assets');
  for (const dir of ['', 'fonts', 'img', 'kf', 'video']) mkdirSync(join(a, dir), { recursive: true });
  for (const f of ['site.css', 'site.js', 'early.js']) copyFileSync(join(web, f), join(a, f));
  for (const f of readdirSync(join(web, 'img'))) copyFileSync(join(web, 'img', f), join(a, 'img', f));
  for (const f of ['layouts.data.js', 'layouts.js', 'converter.js', 'dictionary.js']) copyFileSync(join(root, 'src/core', f), join(a, 'kf', f));

  const fonts = join(root, 'store/assets-src/fonts');
  const FONT_FILES = {
    'jakarta-latin.woff2': 'plus-jakarta-sans-latin-wght-normal.woff2',
    'jakarta-latin-ext.woff2': 'plus-jakarta-sans-latin-ext-wght-normal.woff2',
    'cairo-arabic.woff2': 'cairo-arabic-wght-normal.woff2',
    'cairo-latin.woff2': 'cairo-latin-wght-normal.woff2',
    'rubik-cyrillic.woff2': 'rubik-cyrillic-wght-normal.woff2',
    'rubik-hebrew.woff2': 'rubik-hebrew-wght-normal.woff2',
    'vazirmatn-arabic.woff2': 'vazirmatn-arabic-wght-normal.woff2',
  };
  for (const [to, from] of Object.entries(FONT_FILES)) copyFileSync(join(fonts, from), join(a, 'fonts', to));
  for (const f of readdirSync(fonts).filter((n) => n.startsWith('OFL-'))) copyFileSync(join(fonts, f), join(a, 'fonts', f));

  copyFileSync(join(root, 'assets/logo/keyflip-logo.svg'), join(a, 'logo.svg'));
  copyFileSync(join(root, 'assets/logo/keyflip-logo-512.png'), join(a, 'logo-512.png'));
  copyFileSync(join(root, 'assets/icons/icon-128.png'), join(a, 'icon-128.png'));
  copyFileSync(join(root, 'assets/icons/icon-16.png'), join(a, 'icon-16.png'));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(root, 'assets/logo/keyflip-logo-1024.png'), '-vf', 'scale=180:180:flags=lanczos', join(a, 'icon-180.png')]);

  const video = join(root, 'store/assets/video');
  for (const lang of ['en', 'ar']) {
    copyFileSync(join(video, `keyflip-promo-${lang}.mp4`), join(a, 'video', `promo-${lang}.mp4`));
    copyFileSync(join(video, `keyflip-promo-${lang}-poster.jpg`), join(a, 'video', `promo-${lang}.jpg`));
  }

  // Early-access download: the same ZIP that goes to the store.
  if (!STORE_URL) {
    execFileSync(process.execPath, [join(root, 'scripts/package.mjs')], { stdio: 'ignore' });
    mkdirSync(join(out, 'download'), { recursive: true });
    copyFileSync(join(root, 'dist', `keyflip-${VERSION}.zip`), join(out, 'download', 'keyflip.zip'));
  }
}

// Social preview cards (1200×630), drawn with the site's own fonts.
async function renderOgImages() {
  const { chromium } = require('@playwright/test');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  const fonts = pathToFileURL(join(out, 'assets/fonts')).href;
  const logo = pathToFileURL(join(out, 'assets/logo.svg')).href;
  for (const lang of ['en', 'ar']) {
    const ar = lang === 'ar';
    const title = ar ? 'كتبت والكيبورد على اللغة الغلط؟ <span>اقلبها.</span>' : 'Typed in the wrong keyboard language? <span>Flip it.</span>';
    const line = ar ? 'مجاني · خاص · يعمل بدون إنترنت' : 'Free · Private · Works offline';
    const html = `<!doctype html><html lang="${lang}" dir="${ar ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><style>
@font-face { font-family: L; src: url(${fonts}/jakarta-latin.woff2); font-weight: 200 800; }
@font-face { font-family: A; src: url(${fonts}/cairo-arabic.woff2); font-weight: 200 1000; }
@font-face { font-family: A; src: url(${fonts}/cairo-latin.woff2); font-weight: 200 1000; unicode-range: U+0000-00FF, U+2000-206F; }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; overflow: hidden; color: #fff; font-family: ${ar ? 'A, L' : 'L, A'}, sans-serif;
  background: radial-gradient(700px 420px at 12% 8%, rgba(123,77,255,.55), transparent 60%), radial-gradient(700px 460px at 95% 100%, rgba(20,194,232,.4), transparent 60%), #100d24; }
.dots { position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,.12) 1.4px, transparent 1.4px); background-size: 28px 28px; }
.in { position: relative; height: 100%; padding: 64px 64px; display: grid; grid-template-columns: 1.1fr .9fr; gap: 44px; align-items: center; }
.brand { display: flex; align-items: center; gap: 14px; font: 800 34px L, sans-serif; letter-spacing: -.02em; }
.brand img { width: 60px; height: 60px; border-radius: 16px; }
h1 { font-size: ${ar ? 60 : 62}px; line-height: ${ar ? 1.35 : 1.06}; font-weight: 800; letter-spacing: ${ar ? 0 : '-.03em'}; margin: 34px 0 22px; }
h1 span { background: linear-gradient(135deg,#b9a3ff,#5fe0ff); -webkit-background-clip: text; color: transparent; }
p { font-size: 26px; color: #cfcaf0; font-weight: 600; }
.card { background: #fff; color: #16132e; border-radius: 28px; padding: 30px; box-shadow: 0 40px 80px -30px rgba(0,0,0,.7); direction: ltr; }
.row { display: flex; align-items: center; justify-content: center; gap: 16px; font: 700 30px L, A, sans-serif; white-space: nowrap; }
.bad { color: #8a85a6; text-decoration: line-through; text-decoration-thickness: 3px; }
.good { font-family: A, sans-serif; font-size: 38px; }
.arrow { color: #6a3dff; font-size: 34px; }
.keys { display: flex; justify-content: center; gap: 10px; margin-top: 22px; font: 800 26px L, sans-serif; color: #2b2550; }
kbd { font: inherit; padding: 10px 18px; border-radius: 14px; background: linear-gradient(#fff,#efecfb); border: 1px solid #d9d3f1; box-shadow: 0 5px 0 #d0c9ee; }
.plus { align-self: center; color: #8a85a6; }
</style></head><body><div class="dots"></div><div class="in">
<div><div class="brand"><img src="${logo}" alt="">KeyFlip</div><h1>${title}</h1><p>${line}</p></div>
<div class="card"><div class="row"><span class="bad">;dt phg;</span><span class="arrow">→</span><span class="good" dir="rtl">كيف حالك</span></div>
<div class="keys"><kbd>Ctrl</kbd><span class="plus">+</span><kbd>Q</kbd></div></div>
</div></body></html>`;
    const file = join(tmpdir(), `keyflip-og-${lang}.html`);
    writeFileSync(file, html);
    await page.goto(pathToFileURL(file).href);
    await page.evaluate(() => document.fonts.ready);
    const png = join(tmpdir(), `keyflip-og-${lang}.png`);
    await page.screenshot({ path: png });
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-pix_fmt', 'rgb24', join(out, 'assets', `og-${lang}.png`)]);
    rmSync(file);
    rmSync(png);
  }
  await browser.close();
}

// ---------- pages ----------

function context(lang, rootPath) {
  return {
    lang,
    site: SITE,
    root: rootPath,
    repo: REPO,
    other: lang === 'ar' ? `${rootPath}` : `${rootPath}ar/`,
    storeUrl: STORE_URL,
    zipUrl: `${rootPath}download/keyflip.zip`,
    examples: examples(lang),
    toastForms: TOAST_FORMS[lang],
    toastFor: toastFor(lang),
    macDiff,
    groups: layouts.grouped(),
    glyphs: GLYPHS,
    variant: (it) => VARIANTS[it.id][lang === 'ar' ? 1 : 0],
    layoutName: (id) => layouts.name(id, lang, true),
    version: VERSION,
    builtOn: new Intl.DateTimeFormat(lang === 'ar' ? 'ar-u-nu-latn' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date()),
  };
}

function sitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const alt = (path) => `<xhtml:link rel="alternate" hreflang="en" href="${SITE}${path}"/><xhtml:link rel="alternate" hreflang="ar" href="${SITE}ar/${path}"/>`;
  const urls = [
    `<url><loc>${SITE}</loc><lastmod>${today}</lastmod>${alt('')}</url>`,
    `<url><loc>${SITE}ar/</loc><lastmod>${today}</lastmod>${alt('')}</url>`,
    `<url><loc>${SITE}privacy/</loc><lastmod>${today}</lastmod></url>`,
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
}

for (const dir of ['assets', 'ar', 'privacy', 'download']) rmSync(join(out, dir), { recursive: true, force: true });
mkdirSync(join(out, 'ar'), { recursive: true });
mkdirSync(join(out, 'privacy'), { recursive: true });
copyAssets();

writeFileSync(join(out, 'index.html'), landing(context('en', '')));
writeFileSync(join(out, 'ar', 'index.html'), landing(context('ar', '../')));

const md = readFileSync(join(root, 'PRIVACY.md'), 'utf8');
const [, en, ar] = md.split(/^## (?:English|العربية)\s*$/m);
writeFileSync(join(out, 'privacy', 'index.html'), privacyPage(context('en', '../'), { en: markdown(en), ar: markdown(ar) }));
writeFileSync(join(out, '404.html'), notFound(context('en', BASE_PATH)));
writeFileSync(join(out, 'sitemap.xml'), sitemap());
writeFileSync(join(out, '.nojekyll'), '');

await renderOgImages();

if (COPY.en.dir !== 'ltr' || COPY.ar.dir !== 'rtl') throw new Error('copy.mjs: wrong text direction');
console.log(`Wrote the website to docs/ (${STORE_URL ? 'store link' : 'early-access download'})`);
