#!/usr/bin/env node
// Generates every Chrome Web Store image from the real extension:
//   store/assets/screenshots/<locale>/0N-*.png   1280x800, 5 per locale
//   store/assets/promo/small-tile-440x280.png, marquee-1400x560.png
//   store/assets/icon/store-icon-128.png, edge-logo-300.png
// Usage: node scripts/build-store-assets.mjs [locale ...]
import { chromium } from '@playwright/test';
import http from 'node:http';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, existsSync, statSync, createReadStream, copyFileSync, rmSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { slides, fontCss } from './store-slides.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const converter = require('../src/core/converter.js');
const Stats = require('../src/core/stats.js');
const LOCALES = JSON.parse(readFileSync(join(root, 'store/assets-src/locales.json'), 'utf8'));
const OUT = join(root, 'store/assets');
const RAW = join(tmpdir(), 'keyflip-raw');
const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(LOCALES);

const TYPES = { '.html': 'text/html; charset=utf-8', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.js': 'text/javascript' };
const server = http.createServer((req, res) => {
  const file = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const context = await chromium.launchPersistentContext('', {
  channel: 'chromium',
  headless: true,
  deviceScaleFactor: 2,
  args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`],
});
const ours = (w) => /^chrome-extension:\/\/[a-p]{32}\/src\/background\/service-worker\.js$/.test(w.url());
let sw = context.serviceWorkers().find(ours);
while (!sw) {
  const w = await context.waitForEvent('serviceworker');
  if (ours(w)) sw = w;
}
const extId = new URL(sw.url()).host;
for (let i = 0; i < 50; i++) {
  const ok = await sw.evaluate(() => chrome.storage.local.get('settings').then((r) => !!(r.settings && r.settings.os)));
  if (ok) break;
  await new Promise((r) => setTimeout(r, 100));
}
for (const p of context.pages()) await p.close();

const setSettings = (patch) => sw.evaluate((p) => self.KeyFlip.settings.save(p), patch);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function sampleStats() {
  let s = Stats.empty();
  const now = Date.now();
  const pattern = [3, 5, 2, 6, 4, 7, 3, 5, 8, 4, 6, 9, 5, 7];
  pattern.forEach((n, i) => {
    for (let k = 0; k < n; k++) s = Stats.record(s, { chars: 38 + ((k * 17 + i * 11) % 70), ambiguities: k % 4 === 0 ? 1 : 0, wpm: 40, now: now - (13 - i) * 86400000 });
  });
  return s;
}

const dataUrl = (file) => `data:image/png;base64,${readFileSync(file).toString('base64')}`;

// ---------- 1. raw captures of the real UI ----------

async function captureLocale(code, L) {
  const dir = join(RAW, code);
  mkdirSync(dir, { recursive: true });
  const gibberish = converter.convert(L.phrase, 'en-us', L.layoutB, { direction: 'backward' });
  await setSettings({
    uiLanguage: L.ui, theme: 'light', layoutA: 'en-us', layoutB: L.layoutB, os: 'win',
    ambiguity: 'smart', showFab: true, showToast: true, enabled: true, disabledSites: [],
  });
  await sw.evaluate((s) => chrome.storage.local.set({ stats: s }), sampleStats());

  // Floating button next to selected gibberish.
  const page = await context.newPage();
  await page.setViewportSize({ width: 1060, height: 640 });
  await page.goto(`${BASE}/store/assets-src/demo-compose.html`);
  await page.evaluate(() => document.fonts.ready);
  await wait(500);
  const body = page.locator('#body');
  await body.fill(gibberish);
  await body.focus();
  await page.keyboard.press('Control+KeyA');
  await page.locator('keyflip-ui .fab.show').waitFor();
  await wait(400);
  await page.locator('keyflip-ui .fab').screenshot({ path: join(dir, 'fab.png') });

  // The "which word did you mean?" chooser (Arabic listings only).
  if (L.layoutB.startsWith('ar')) {
    await setSettings({ ambiguity: 'ask' });
    await wait(300);
    await body.fill('غخع شقث قهلاف');
    await body.focus();
    await page.keyboard.press('Control+KeyA');
    await page.keyboard.press('Control+KeyQ');
    const dlg = page.locator('keyflip-ui .dialog');
    await dlg.waitFor();
    await wait(500);
    await dlg.screenshot({ path: join(dir, 'dialog.png') });
    await page.keyboard.press('Escape');
    await setSettings({ ambiguity: 'smart' });
  }
  await page.close();

  // Settings: layouts + key map.
  const opt = await context.newPage();
  await opt.setViewportSize({ width: 1280, height: 1000 });
  await opt.goto(`chrome-extension://${extId}/src/ui/options/options.html#keyboards`);
  await wait(600);
  await opt.evaluate(() => { document.querySelector('#keymap').open = true; });
  await wait(300);
  const cards = opt.locator('#keyboards .card');
  const a = await cards.nth(0).boundingBox();
  const b = await opt.locator('#keymap').boundingBox();
  await opt.screenshot({ path: join(dir, 'keyboards.png'), clip: { x: a.x - 2, y: a.y - 2, width: a.width + 4, height: Math.min(b.y + b.height, a.y + 760) - a.y + 4 } });
  await opt.close();

  // Popup as it looks on a normal website.
  const pop = await context.newPage();
  await pop.setViewportSize({ width: 380, height: 760 });
  await pop.goto(`chrome-extension://${extId}/src/ui/popup/popup.html`);
  await wait(700);
  await pop.evaluate(() => {
    const { i18n } = window.KeyFlip;
    const lang = document.documentElement.lang;
    document.querySelector('#site-label').textContent = i18n.t(lang, 'popupSiteOn', { site: 'mail.example.com' });
    document.querySelector('#site-row').hidden = false;
    document.querySelector('#site-enabled').checked = true;
    document.querySelector('#quick').open = false;
  });
  await wait(200);
  const h = await pop.evaluate(() => Math.ceil(document.querySelectorAll('.popup > .card')[2].getBoundingClientRect().bottom + 12));
  await pop.screenshot({ path: join(dir, 'popup.png'), clip: { x: 0, y: 0, width: 380, height: h } });
  await pop.close();
}

const FONT_CSS = fontCss(BASE);

async function renderHtml(page, html, file, w, h) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => !document.querySelector('h1') || document.body.dataset.fit === '1');
  await wait(200);
  const tmp = file + '.tmp.png';
  await page.screenshot({ path: tmp, clip: { x: 0, y: 0, width: w, height: h } });
  // Flatten to 24-bit RGB PNG (no alpha) as the store expects.
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-pix_fmt', 'rgb24', file]);
  rmSync(tmp);
}

// ---------- 3. promo tiles (no words, so they work in every language) ----------

function tileHtml(w, h) {
  const big = h > 300;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}
  * { margin: 0; box-sizing: border-box; }
  body { width: ${w}px; height: ${h}px; overflow: hidden; font-family: "Plus Jakarta Sans", "Cairo", system-ui; position: relative;
    background: radial-gradient(${w * 0.6}px ${h}px at 15% 10%, rgba(255,255,255,.28), transparent 60%), linear-gradient(135deg, #7b4dff 0%, #5e5bf6 52%, #14c2e8 100%); }
  .logo { position: absolute; left: ${big ? 120 : 26}px; top: 50%; transform: translateY(-50%); width: ${big ? 300 : 136}px; filter: drop-shadow(0 24px 40px rgba(20, 8, 90, .45)); }
  .word { position: absolute; left: ${big ? 470 : 180}px; top: ${big ? 140 : 66}px; color: #fff; font-weight: 800; font-size: ${big ? 96 : 48}px; letter-spacing: -0.03em; }
  .flip { position: absolute; left: ${big ? 470 : 180}px; top: ${big ? 290 : 148}px; display: flex; align-items: center; gap: ${big ? 22 : 8}px; direction: ltr; white-space: nowrap; }
  .pill { height: ${big ? 84 : 42}px; padding: 0 ${big ? 30 : 11}px; border-radius: ${big ? 24 : 12}px; white-space: nowrap; background: rgba(255,255,255,.18); color: #fff; display: flex; align-items: center;
    font-size: ${big ? 40 : 17}px; font-weight: 600; border: 1.5px solid rgba(255,255,255,.35); }
  .pill.on { background: #fff; color: #4b2fe0; font-family: "Cairo", sans-serif; font-weight: 800; }
  .pill.gib { font-family: "DejaVu Sans Mono", monospace; }
  .arrow { color: #fff; font-size: ${big ? 46 : 20}px; font-weight: 700; }
  .keys { position: absolute; right: ${big ? 110 : 0}px; bottom: ${big ? 70 : 0}px; display: ${big ? 'flex' : 'none'}; gap: 12px; align-items: center; direction: ltr; }
  .key { min-width: 96px; height: 96px; padding: 0 20px; border-radius: 22px; background: #fff; color: #2b2550; display: grid; place-items: center; font: 800 34px "Plus Jakarta Sans", system-ui; box-shadow: 0 8px 0 rgba(30, 10, 120, .35); }
  .plus { color: #fff; font: 800 34px "Plus Jakarta Sans", sans-serif; }
  </style></head><body>
  <img class="logo" src="${BASE}/assets/logo/keyflip-logo-512.png">
  <div class="word">KeyFlip</div>
  <div class="flip"><span class="pill gib">;dt phg;</span><span class="arrow">⇄</span><span class="pill on" dir="rtl">كيف حالك</span></div>
  <div class="keys"><span class="key">Ctrl</span><span class="plus">+</span><span class="key">Q</span></div>
  </body></html>`;
}

// ---------- run ----------

// Final images are rendered in a separate 1x browser so they are exactly the store sizes.
const browser1x = await chromium.launch();
const composer = await browser1x.newPage({ deviceScaleFactor: 1 });
for (const code of wanted) {
  const L = LOCALES[code];
  if (!L) throw new Error(`Unknown locale ${code}`);
  await captureLocale(code, L);
  const dir = join(OUT, 'screenshots', code);
  mkdirSync(dir, { recursive: true });
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const raw = (f) => dataUrl(join(RAW, code, f));
  for (const [name, html] of slides(L, BASE, raw)) {
    await renderHtml(composer, html, join(dir, `${name}.png`), 1280, 800);
  }
  console.log(`✔ ${code}: 5 screenshots`);
}
await context.close();

// Promo tiles and icons.
const p1 = composer;
mkdirSync(join(OUT, 'promo'), { recursive: true });
await renderHtml(p1, tileHtml(440, 280), join(OUT, 'promo', 'small-tile-440x280.png'), 440, 280);
await renderHtml(p1, tileHtml(1400, 560), join(OUT, 'promo', 'marquee-1400x560.png'), 1400, 560);
mkdirSync(join(OUT, 'icon'), { recursive: true });
copyFileSync(join(root, 'assets/icons/icon-128.png'), join(OUT, 'icon', 'store-icon-128.png'));
const svg = readFileSync(join(root, 'assets/logo/keyflip-logo.svg'), 'utf8');
await p1.setViewportSize({ width: 300, height: 300 });
await p1.setContent(`<body style="margin:0;background:transparent"><img style="width:300px;height:300px;display:block" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"></body>`);
await p1.waitForFunction(() => document.images[0].complete);
await p1.screenshot({ path: join(OUT, 'icon', 'edge-logo-300.png'), omitBackground: true, clip: { x: 0, y: 0, width: 300, height: 300 } });
await browser1x.close();
server.close();
console.log('✔ promo tiles and icons');
