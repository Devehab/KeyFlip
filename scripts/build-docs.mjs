#!/usr/bin/env node
// Builds the public website pages (GitHub Pages, served from /docs):
//   docs/index.html           landing page
//   docs/privacy/index.html   privacy policy, generated from PRIVACY.md
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = 'https://github.com/Devehab/KeyFlip';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/(^|[\s(])(https:\/\/[^\s<)]+)/g, '$1<a href="$2">$2</a>');
}

// Just enough Markdown for PRIVACY.md: headings, paragraphs, lists, rules.
function markdown(md) {
  const out = [];
  let list = false;
  const close = () => { if (list) { out.push('</ul>'); list = false; } };
  for (const line of md.split('\n')) {
    if (/^###\s/.test(line)) { close(); out.push(`<h3>${inline(line.slice(4))}</h3>`); }
    else if (/^##\s/.test(line)) { close(); out.push(`<h2>${inline(line.slice(3))}</h2>`); }
    else if (/^-\s/.test(line)) { if (!list) { out.push('<ul>'); list = true; } out.push(`<li>${inline(line.slice(2))}</li>`); }
    else if (/^---\s*$/.test(line)) { close(); }
    else if (!line.trim()) { close(); }
    else { close(); out.push(`<p>${inline(line)}</p>`); }
  }
  close();
  return out.join('\n');
}

const CSS = `
:root { --bg: #f7f5ff; --card: #fff; --text: #16132e; --muted: #5d5976; --line: #e8e4f6; --accent: #5b33f2; }
@media (prefers-color-scheme: dark) { :root { --bg: #0e0d19; --card: #17162a; --text: #f2f0ff; --muted: #a5a2c4; --line: #2a2748; --accent: #a894ff; } }
* { box-sizing: border-box; }
body { margin: 0; font: 17px/1.7 "Inter", "Cairo", system-ui, -apple-system, "Segoe UI", sans-serif; color: var(--text);
  background: radial-gradient(900px 500px at 100% 0, rgba(20,194,232,.14), transparent 60%), radial-gradient(900px 500px at 0 0, rgba(123,77,255,.16), transparent 60%), var(--bg); }
[lang="ar"], [dir="rtl"] { font-family: "Cairo", "Inter", system-ui, sans-serif; }
a { color: var(--accent); }
header { max-width: 880px; margin: 0 auto; padding: 32px 20px 0; display: flex; align-items: center; gap: 12px; }
header img { width: 44px; height: 44px; }
header b { font-size: 22px; letter-spacing: -.02em; }
header nav { margin-inline-start: auto; display: flex; gap: 8px; }
header nav button, header nav a { font: inherit; font-size: 14px; font-weight: 700; padding: 8px 14px; border-radius: 999px; border: 1px solid var(--line); background: var(--card); color: var(--text); cursor: pointer; text-decoration: none; }
header nav button[aria-pressed="true"] { background: var(--accent); color: #fff; border-color: transparent; }
main { max-width: 880px; margin: 24px auto 64px; padding: 36px 40px; background: var(--card); border: 1px solid var(--line); border-radius: 24px; box-shadow: 0 30px 60px -36px rgba(46,26,140,.35); }
@media (max-width: 640px) { main { padding: 24px 18px; margin: 16px 12px 40px; } }
h1 { font-size: 34px; line-height: 1.2; margin: 0 0 6px; letter-spacing: -.02em; }
.date { color: var(--muted); margin: 0 0 24px; }
h2 { display: none; }
h3 { font-size: 20px; margin: 28px 0 6px; }
ul { padding-inline-start: 22px; }
li { margin: 4px 0; }
code { font-size: 14px; background: rgba(123,77,255,.10); padding: 1px 6px; border-radius: 6px; }
section[hidden] { display: none; }
.hero { text-align: center; padding: 56px 20px 24px; }
.hero img { width: 120px; height: 120px; filter: drop-shadow(0 20px 30px rgba(108,71,255,.35)); }
.hero h1 { font-size: 52px; margin: 18px 0 6px; }
.hero p { font-size: 22px; color: var(--muted); margin: 4px 0; }
.demo { display: inline-flex; gap: 14px; align-items: center; margin: 24px 0; font-size: 26px; font-weight: 800; }
.demo span { padding: 10px 18px; border-radius: 14px; background: var(--card); border: 1px solid var(--line); }
.demo .g { font-family: ui-monospace, monospace; color: var(--muted); text-decoration: line-through; }
.links { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin: 12px 0 40px; }
.links a { padding: 12px 22px; border-radius: 14px; font-weight: 800; text-decoration: none; background: var(--card); border: 1px solid var(--line); color: var(--text); }
.links a.primary { background: linear-gradient(135deg, #7b4dff, #14c2e8); color: #fff; border: 0; }
footer { text-align: center; color: var(--muted); font-size: 14px; padding: 0 20px 40px; }`;

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&family=Inter:wght@400;700;800&display=swap" rel="stylesheet">';

function privacyPage() {
  const md = readFileSync(join(root, 'PRIVACY.md'), 'utf8');
  const [, en, ar] = md.split(/^## (?:English|العربية)\s*$/m);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>KeyFlip — Privacy Policy · سياسة الخصوصية</title>
<meta name="description" content="KeyFlip works entirely on your device. It never collects, sells or shares your data.">
<link rel="icon" href="../assets/icon-128.png">${FONTS}
<style>${CSS}</style>
</head>
<body>
<header><img src="../assets/icon-128.png" alt=""><b>KeyFlip</b>
  <nav><button data-l="en" aria-pressed="true">English</button><button data-l="ar" aria-pressed="false">العربية</button><a href="../">Home</a></nav></header>
<main>
  <section id="en" lang="en" dir="ltr"><h1>Privacy Policy</h1><p class="date">Effective date: October 14, 2026</p>${markdown(en)}</section>
  <section id="ar" lang="ar" dir="rtl" hidden><h1>سياسة الخصوصية</h1><p class="date">تاريخ السريان: 14 أكتوبر 2026</p>${markdown(ar)}</section>
</main>
<script>
  const show = (l) => { for (const s of document.querySelectorAll('section')) s.hidden = s.id !== l;
    for (const b of document.querySelectorAll('[data-l]')) b.setAttribute('aria-pressed', String(b.dataset.l === l)); };
  document.querySelectorAll('[data-l]').forEach((b) => b.addEventListener('click', () => { show(b.dataset.l); history.replaceState(null, '', '#' + b.dataset.l); }));
  show(location.hash === '#ar' || (!location.hash && navigator.language.startsWith('ar')) ? 'ar' : 'en');
</script>
</body>
</html>
`;
}

function homePage() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>KeyFlip — Wrong Keyboard Layout Fixer</title>
<meta name="description" content="Typed in the wrong keyboard language? Select the text and press Ctrl+Q. KeyFlip fixes it in place — no retyping.">
<link rel="icon" href="assets/icon-128.png">${FONTS}
<style>${CSS}</style>
</head>
<body>
<div class="hero">
  <img src="assets/logo-512.png" alt="KeyFlip logo">
  <h1>KeyFlip</h1>
  <p>Typed in the wrong keyboard language? Flip it — don’t retype it.</p>
  <p dir="rtl" lang="ar">كتبت والكيبورد على اللغة الغلط؟ اقلب النص بدل ما تعيد كتابته.</p>
  <div class="demo" dir="ltr"><span class="g">;dt phg;</span>⇄<span dir="rtl">كيف حالك</span></div>
  <div class="links">
    <a class="primary" id="store" href="${REPO}">Get KeyFlip</a>
    <a href="privacy/">Privacy · الخصوصية</a>
    <a href="${REPO}/issues">Support · الدعم</a>
  </div>
</div>
<footer>Works offline · your text never leaves your device · يعمل بدون إنترنت ونصك لا يغادر جهازك</footer>
</body>
</html>
`;
}

mkdirSync(join(root, 'docs/privacy'), { recursive: true });
mkdirSync(join(root, 'docs/assets'), { recursive: true });
copyFileSync(join(root, 'assets/icons/icon-128.png'), join(root, 'docs/assets/icon-128.png'));
copyFileSync(join(root, 'assets/logo/keyflip-logo-512.png'), join(root, 'docs/assets/logo-512.png'));
writeFileSync(join(root, 'docs/privacy/index.html'), privacyPage());
writeFileSync(join(root, 'docs/index.html'), homePage());
writeFileSync(join(root, 'docs/.nojekyll'), '');
console.log('Wrote docs/index.html and docs/privacy/index.html');
