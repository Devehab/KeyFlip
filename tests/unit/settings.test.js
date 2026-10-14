const test = require('node:test');
const assert = require('node:assert/strict');
const Settings = require('../../src/core/settings.js');

test('defaults are valid', () => {
  const s = Settings.sanitize();
  assert.equal(s.enabled, true);
  assert.equal(s.layoutA, 'en-us');
  assert.equal(s.layoutB, 'ar-101');
  assert.deepEqual(s.shortcut, { code: 'KeyQ', ctrl: true, alt: false, shift: false, meta: false });
  assert.equal(s.ambiguity, 'smart');
});

test('invalid values fall back to defaults', () => {
  const s = Settings.sanitize({
    uiLanguage: 'xx', theme: 'neon', ambiguity: 'random', noSelection: 'all',
    layoutA: 'nope', layoutB: 'nope', shortcut: { code: 'KeyQ' }, typingWpm: 9999, disabledSites: ['a.com', 'a.com', 3],
  });
  assert.equal(s.uiLanguage, 'auto');
  assert.equal(s.theme, 'auto');
  assert.equal(s.ambiguity, 'smart');
  assert.equal(s.noSelection, 'field');
  assert.equal(s.layoutA, 'en-us');
  assert.equal(s.layoutB, 'ar-101');
  assert.equal(s.shortcut.ctrl, true);
  assert.equal(s.typingWpm, 150);
  assert.deepEqual(s.disabledSites, ['a.com']);
});

test('the two layouts can never be the same', () => {
  assert.notEqual(Settings.sanitize({ layoutA: 'ar-101', layoutB: 'ar-101' }).layoutB, 'ar-101');
  assert.notEqual(Settings.sanitize({ layoutA: 'ru', layoutB: 'ru' }).layoutB, 'ru');
});

test('valid custom shortcut is kept', () => {
  const sc = { code: 'KeyK', ctrl: false, alt: true, shift: true, meta: false };
  assert.deepEqual(Settings.sanitize({ shortcut: sc }).shortcut, sc);
});
