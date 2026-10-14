#!/usr/bin/env node
// Renders the 15-second promo video (1920x1080, 30 fps, H.264) per language:
//   store/assets/video/keyflip-promo-<lang>.mp4
// Usage: node scripts/build-video.mjs [ar|en ...]
import { chromium } from '@playwright/test';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, mkdtempSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const converter = require('../src/core/converter.js');
const FPS = 30;
const SECONDS = 15;
const phrase = 'كيف حالك يا صديقي؟';
const gibberish = converter.convert(phrase, 'en-us', 'ar-101', { direction: 'backward' });
const LANGS = ['العربية', 'English', 'فارسی', 'اردو', 'עברית', 'Français', 'Deutsch', 'Русский', 'Türkçe'];

const COPY = {
  ar: {
    dir: 'rtl', font: 'Cairo', phrase, gibberish,
    title: 'كتبت والكيبورد على اللغة الغلط؟',
    toast: 'تم التصحيح — بدون إعادة كتابة',
    waysTitle: 'ثلاث طرق للتصحيح',
    ways: [['اختصار لوحة المفاتيح', ''], ['الزر العائم', 'بجانب النص المظلّل'], ['زر الماوس الأيمن', 'صحّح لغة الكيبورد']],
    fab: 'اقلب', menu: ['نسخ', 'لصق', 'صحّح لغة الكيبورد'],
    langsTitle: 'يدعم لغات وتخطيطات كثيرة',
    langs: LANGS, platforms: 'ويندوز · ماك · لينكس · كروم بوك',
    tagline: 'اقلب النص بدل ما تعيد كتابته', pills: ['مجاني على Chrome', 'يعمل بدون إنترنت'],
  },
  en: {
    dir: 'ltr', font: 'Plus Jakarta Sans', phrase, gibberish,
    title: 'Typed in the wrong keyboard language?',
    toast: 'Fixed — no retyping',
    waysTitle: 'Three ways to fix it',
    ways: [['Keyboard shortcut', ''], ['Floating button', 'Next to selected text'], ['Right-click', 'Fix keyboard layout']],
    fab: 'Flip', menu: ['Copy', 'Paste', 'Fix keyboard layout'],
    langsTitle: 'Works with many languages and layouts',
    langs: ['English', ...LANGS.filter((l) => l !== 'English')], platforms: 'Windows · Mac · Linux · ChromeOS',
    tagline: 'Flip it — don’t retype it', pills: ['Free for Chrome', 'Works offline'],
  },
};

const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(COPY);
const outDir = join(root, 'store/assets/video');
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });

for (const lang of wanted) {
  const frames = mkdtempSync(join(tmpdir(), `keyflip-video-${lang}-`));
  await page.goto(pathToFileURL(join(root, 'store/assets-src/promo-video.html')).href);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate((c) => window.setup(c), COPY[lang]);
  await page.evaluate(() => document.fonts.ready);
  const total = FPS * SECONDS;
  for (let i = 0; i < total; i++) {
    await page.evaluate((t) => window.render(t), i / FPS);
    await page.screenshot({ path: join(frames, `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 92 });
  }
  const out = join(outDir, `keyflip-promo-${lang}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(frames, 'f%04d.jpg'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
  // A poster frame for the guide / README.
  await page.evaluate((t) => window.render(t), 7.6);
  await page.screenshot({ path: join(outDir, `keyflip-promo-${lang}-poster.jpg`), type: 'jpeg', quality: 90 });
  rmSync(frames, { recursive: true, force: true });
  console.log(`✔ ${out}`);
}
await browser.close();
