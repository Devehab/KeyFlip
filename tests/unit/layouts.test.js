const test = require('node:test');
const assert = require('node:assert/strict');
const layouts = require('../../src/core/layouts.js');
const data = require('../../src/core/layouts.data.js');

test('catalog and generated data match', () => {
  assert.deepEqual([...layouts.ids].sort(), Object.keys(data).sort());
  assert.equal(new Set(layouts.ids).size, layouts.ids.length);
});

test('every layout covers all 47 typing keys on the base level', () => {
  for (const id of layouts.ids) {
    const l = layouts.get(id);
    for (const code of layouts.CODES) {
      assert.ok(l.keys[code], `${id} is missing ${code}`);
      assert.equal(typeof l.keys[code][0], 'string', `${id} ${code} base`);
    }
  }
});

test('every layout has English and Arabic names and a known language', () => {
  for (const meta of layouts.CATALOG) {
    assert.ok(meta.en && meta.ar, meta.id);
    assert.ok(layouts.LANGUAGES[meta.lang], meta.id);
    assert.ok(['any', 'pc', 'mac'].includes(meta.platform), meta.id);
    assert.ok(layouts.name(meta.id, 'en', true).length <= 26, `${meta.id} short name too long`);
  }
});

test('reference keys match the published layouts', () => {
  const k = (id, code) => layouts.get(id).keys[code];
  assert.deepEqual(k('ar-101', 'KeyB'), ['لا', 'لآ']);
  assert.deepEqual(k('ar-101', 'KeyH'), ['ا', 'أ']);
  assert.deepEqual(k('ar-101', 'Backquote'), ['ذ', 'ّ']);
  assert.deepEqual(k('ar-mac', 'KeyB'), ['ز', 'أ']);
  assert.deepEqual(k('ar-mac', 'BracketRight'), ['ة', '{']);
  assert.deepEqual(k('ru', 'KeyQ'), ['й', 'Й']);
  assert.equal(k('he', 'KeyT')[0], 'א');
  assert.deepEqual(k('fr-azerty', 'KeyQ'), ['a', 'A']);
  assert.deepEqual(k('de-qwertz', 'KeyY'), ['z', 'Z']);
});

test('defaults depend on the operating system', () => {
  assert.deepEqual(layouts.defaultsFor('mac'), { layoutA: 'en-us', layoutB: 'ar-mac' });
  assert.deepEqual(layouts.defaultsFor('win'), { layoutA: 'en-us', layoutB: 'ar-101' });
  assert.deepEqual(layouts.defaultsFor('linux'), { layoutA: 'en-us', layoutB: 'ar-101' });
});

test('keystroke matching tells Windows and Mac Arabic apart', () => {
  const typed = (id, codes) => codes.map((code) => ({ code, key: layouts.get(id).keys[code][0], shift: false }));
  const codes = ['KeyZ', 'KeyX', 'BracketRight', 'KeyB', 'Quote', 'KeyM', 'Comma'];
  assert.equal(layouts.matchKeystrokes(typed('ar-101', codes))[0].id, 'ar-101');
  assert.equal(layouts.matchKeystrokes(typed('ar-mac', codes))[0].id, 'ar-mac');
  assert.equal(layouts.matchKeystrokes(typed('ru', codes))[0].id, 'ru');
});

test('grouped() lists every layout once', () => {
  const ids = layouts.grouped().flatMap((g) => g.items.map((i) => i.id));
  assert.deepEqual([...ids].sort(), [...layouts.ids].sort());
});

test('badges', () => {
  assert.equal(layouts.badge('ar-101'), 'ع');
  assert.equal(layouts.badge('en-us'), 'EN');
  assert.equal(layouts.badge('ru'), 'RU');
});
