#!/usr/bin/env node
// Static checks for things the Chrome Web Store review cares about:
// valid manifest, every referenced file exists, locale limits, no remote code.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const fail = (msg) => errors.push(msg);
const read = (p) => readFileSync(join(root, p), 'utf8');
const manifest = JSON.parse(read('manifest.json'));

// --- manifest basics
if (manifest.manifest_version !== 3) fail('manifest_version must be 3');
if (!/^\d+(\.\d+){0,3}$/.test(manifest.version)) fail(`invalid version "${manifest.version}"`);
const ALLOWED_PERMISSIONS = new Set(['storage', 'contextMenus', 'scripting']);
for (const p of manifest.permissions || []) if (!ALLOWED_PERMISSIONS.has(p)) fail(`unexpected permission "${p}" — justify it before adding`);
if (JSON.stringify(manifest.host_permissions) !== JSON.stringify(['<all_urls>'])) fail('host_permissions must be exactly ["<all_urls>"] (used to re-inject into open tabs)');
if (manifest.content_security_policy) fail('custom CSP is not expected');
if (manifest.externally_connectable) fail('externally_connectable is not expected');
if (manifest.web_accessible_resources) fail('web_accessible_resources are not expected');

// --- referenced files
const refs = new Set();
Object.values(manifest.icons || {}).forEach((f) => refs.add(f));
Object.values((manifest.action && manifest.action.default_icon) || {}).forEach((f) => refs.add(f));
if (manifest.action && manifest.action.default_popup) refs.add(manifest.action.default_popup);
if (manifest.options_ui) refs.add(manifest.options_ui.page);
if (manifest.background) refs.add(manifest.background.service_worker);
for (const cs of manifest.content_scripts || []) [...(cs.js || []), ...(cs.css || [])].forEach((f) => refs.add(f));
for (const f of refs) if (!existsSync(join(root, f))) fail(`missing file referenced by manifest: ${f}`);

// files referenced from HTML pages and importScripts
const htmlFiles = [];
const walk = (dir) => readdirSync(join(root, dir)).forEach((name) => {
  const p = join(dir, name);
  if (statSync(join(root, p)).isDirectory()) walk(p);
  else htmlFiles.push(p);
});
walk('src');
for (const f of htmlFiles.filter((p) => p.endsWith('.html'))) {
  const html = read(f);
  for (const m of html.matchAll(/(?:src|href)="([^"#:]+)"/g)) {
    const target = join(dirname(join(root, f)), m[1]);
    if (!existsSync(target)) fail(`${f}: missing ${m[1]}`);
  }
  if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(html)) fail(`${f}: inline <script> blocks are blocked by MV3 CSP`);
  if (/\son[a-z]+="/i.test(html)) fail(`${f}: inline event handlers are blocked by MV3 CSP`);
}
const sw = read(manifest.background.service_worker);
for (const m of sw.matchAll(/'(\.\.\/[^']+\.js)'/g)) {
  if (!existsSync(join(root, dirname(manifest.background.service_worker), m[1]))) fail(`service worker imports missing ${m[1]}`);
}

// --- no remote code / dynamic code / network
const JS = htmlFiles.filter((p) => p.endsWith('.js'));
const BANNED = [
  [/\beval\s*\(/, 'eval()'],
  [/new\s+Function\s*\(/, 'new Function()'],
  [/\bfetch\s*\(/, 'fetch() — KeyFlip must stay offline'],
  [/XMLHttpRequest/, 'XMLHttpRequest — KeyFlip must stay offline'],
  [/\bimport\s*\(\s*['"`]https?:/, 'remote import()'],
  [/<script[^>]+src=["']https?:/i, 'remote <script>'],
  [/setTimeout\s*\(\s*['"`]/, 'string setTimeout'],
];
for (const f of JS) {
  const src = read(f);
  for (const [re, label] of BANNED) if (re.test(src)) fail(`${f}: uses ${label}`);
}
for (const f of htmlFiles.filter((p) => p.endsWith('.html') || p.endsWith('.css'))) {
  if (/https?:\/\/(?!www\.w3\.org)/.test(read(f).replace(/<!--[\s\S]*?-->/g, ''))) fail(`${f}: references a remote URL`);
}

// --- locales
const locales = readdirSync(join(root, '_locales'));
if (!locales.includes(manifest.default_locale)) fail(`default_locale "${manifest.default_locale}" has no folder`);
const baseKeys = Object.keys(JSON.parse(read(`_locales/${manifest.default_locale}/messages.json`))).sort();
for (const loc of locales) {
  const msgs = JSON.parse(read(`_locales/${loc}/messages.json`));
  const keys = Object.keys(msgs).sort();
  if (keys.join() !== baseKeys.join()) fail(`_locales/${loc}: keys differ from default locale`);
  if (msgs.extName && msgs.extName.message.length > 75) fail(`_locales/${loc}: extName longer than 75 chars`);
  if (msgs.extDescription && msgs.extDescription.message.length > 132) fail(`_locales/${loc}: extDescription longer than 132 chars`);
}
const usedMsgs = [...JSON.stringify(manifest).matchAll(/__MSG_(\w+)__/g)].map((m) => m[1]);
for (const k of usedMsgs) if (!baseKeys.includes(k)) fail(`manifest uses __MSG_${k}__ but it is not defined`);

// --- icons are real PNGs of the right size
for (const [size, file] of Object.entries(manifest.icons)) {
  const buf = readFileSync(join(root, file));
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  if (buf.toString('ascii', 1, 4) !== 'PNG' || w !== +size || h !== +size) fail(`${file} should be a ${size}x${size} PNG (got ${w}x${h})`);
}

if (errors.length) {
  console.error(`✖ ${errors.length} problem(s):\n` + errors.map((e) => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log(`✔ manifest and ${JS.length} scripts, ${locales.length} locales look good (${relative(process.cwd(), root) || '.'})`);
