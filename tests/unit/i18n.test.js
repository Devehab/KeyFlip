const test = require('node:test');
const assert = require('node:assert/strict');
const i18n = require('../../src/core/i18n.js');

const placeholders = (v) => [...JSON.stringify(v).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).filter((k) => k !== 'n').sort();

test('Arabic and English have the same keys and placeholders', () => {
  const en = i18n.STRINGS.en;
  const ar = i18n.STRINGS.ar;
  assert.deepEqual(Object.keys(ar).sort(), Object.keys(en).sort());
  for (const k of Object.keys(en)) assert.deepEqual([...new Set(placeholders(ar[k]))], [...new Set(placeholders(en[k]))], k);
});

test('no empty strings', () => {
  for (const lang of ['en', 'ar']) {
    for (const [k, v] of Object.entries(i18n.STRINGS[lang])) {
      if (typeof v === 'string') assert.ok(v.trim(), `${lang}.${k}`);
      else assert.ok(v.other, `${lang}.${k} plural needs "other"`);
    }
  }
});

test('Arabic plurals', () => {
  assert.equal(i18n.t('ar', 'toastFlipped', { n: 1 }), 'تم قلب حرف واحد');
  assert.equal(i18n.t('ar', 'toastFlipped', { n: 2 }), 'تم قلب حرفين');
  assert.equal(i18n.t('ar', 'toastFlipped', { n: 5 }), 'تم قلب 5 أحرف');
  assert.equal(i18n.t('ar', 'toastFlipped', { n: 11 }), 'تم قلب 11 حرفاً');
  assert.equal(i18n.t('ar', 'toastFlipped', { n: 100 }), 'تم قلب 100 حرف');
  assert.equal(i18n.t('en', 'toastFlipped', { n: 1 }), 'Flipped 1 character');
  assert.equal(i18n.t('en', 'toastFlipped', { n: 1234 }), 'Flipped 1,234 characters');
});

test('language resolution', () => {
  assert.equal(i18n.resolve('ar'), 'ar');
  assert.equal(i18n.resolve('en', 'ar-JO'), 'en');
  assert.equal(i18n.resolve('auto', 'ar-JO'), 'ar');
  assert.equal(i18n.resolve('auto', 'fr-FR'), 'en');
  assert.equal(i18n.dir('ar'), 'rtl');
});

test('missing keys fall back to the key name', () => {
  assert.equal(i18n.t('ar', 'doesNotExist'), 'doesNotExist');
});
