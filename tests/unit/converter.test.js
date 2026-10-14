const test = require('node:test');
const assert = require('node:assert/strict');
const converter = require('../../src/core/converter.js');
const layouts = require('../../src/core/layouts.js');
const dictionary = require('../../src/core/dictionary.js');

const flip = (text, a, b, opts) => converter.convert(text, a, b, opts);

test('English gibberish becomes Arabic (Windows 101)', () => {
  assert.equal(flip(';dt phg;', 'en-us', 'ar-101'), 'كيف حالك');
  assert.equal(flip(';dt phg; dh w]drd?', 'en-us', 'ar-101'), 'كيف حالك يا صديقي؟');
  assert.equal(flip('hgsghl ugd;l', 'en-us', 'ar-101'), 'السلام عليكم');
});

test('Arabic gibberish becomes English', () => {
  assert.equal(flip('شؤؤخعىف', 'en-us', 'ar-101'), 'account');
  assert.equal(flip('اثممخ صخقمي', 'en-us', 'ar-101'), 'hello world');
});

test('flipping twice returns the original text', () => {
  for (const s of [';dt phg;', 'hello world', 'The quick brown fox!', 'شؤؤخعىف']) {
    const once = flip(s, 'en-us', 'ar-101', { strategy: 'single' });
    const twice = flip(once, 'en-us', 'ar-101', { strategy: (w) => w.candidates.find((c) => s.includes(c.text)) });
    assert.equal(twice, s);
  }
});

test('capital letters, symbols and hamza positions', () => {
  assert.equal(flip('H', 'en-us', 'ar-101'), 'أ');
  assert.equal(flip('Y', 'en-us', 'ar-101'), 'إ');
  assert.equal(flip('N', 'en-us', 'ar-101'), 'آ');
  assert.equal(flip('?', 'en-us', 'ar-101'), '؟');
  assert.equal(flip('أإآ', 'en-us', 'ar-101'), 'HYN');
  assert.equal(flip('Hello', 'en-us', 'ar-101'), 'أثممخ');
});

test('digits and spaces pass through between Latin and Arabic 101', () => {
  assert.equal(flip('2024 ,', 'en-us', 'ar-101'), '2024 و');
});

test('Mac Arabic differs from Windows Arabic', () => {
  assert.equal(flip('z]', 'en-us', 'ar-101'), 'ئد');
  assert.equal(flip('z]', 'en-us', 'ar-mac'), 'ظة');
  assert.equal(flip('123', 'en-us', 'ar-mac'), '١٢٣');
  assert.equal(flip('١٢٣', 'en-us', 'ar-mac'), '123');
  assert.equal(flip(';dt phg;', 'en-us', 'ar-mac'), 'كيف حالك');
});

test('lam-alef keys are reported as ambiguous with both readings', () => {
  const pair = converter.createPair('en-us', 'ar-101');
  const r = converter.analyze('قهلاف', pair);
  assert.equal(r.direction, 'backward');
  assert.equal(r.words.length, 1);
  assert.deepEqual(r.words[0].candidates.map((c) => c.text), ['ribt', 'right']);
});

test('smart pick uses the dictionary for لا = b / gh', () => {
  const pair = converter.createPair('en-us', 'ar-101');
  const pick = (text) => {
    const r = converter.analyze(text, pair);
    return r.render(converter.choicesFrom(r.words.map((w) => converter.autoPick(w, dictionary.isWord))));
  };
  assert.equal(pick('قهلاف'), 'right');
  assert.equal(pick('لاخخن'), 'book');
  assert.equal(pick('لاشلايشي'), 'baghdad');
  assert.equal(pick('يخعلاف'), 'doubt');
  assert.equal(pick('لاخسف'), 'ghost');
});

test('shifted lam-alef prefers the single key over mixed case', () => {
  const pair = converter.createPair('en-us', 'ar-101');
  const r = converter.analyze('لأ', pair);
  assert.deepEqual(r.words[0].candidates.map((c) => c.text), ['G', 'gH']);
  assert.equal(converter.autoPick(r.words[0], null).text, 'G');
});

test('unknown words stay unresolved so the user can be asked', () => {
  const pair = converter.createPair('en-us', 'ar-101');
  const r = converter.analyze('ءلاغ', pair);
  assert.equal(converter.autoPick(r.words[0], dictionary.isWord), null);
});

test('presentation-form ligatures are normalised', () => {
  assert.equal(flip('ﻻ', 'en-us', 'ar-101'), 'b');
  assert.equal(flip('ﻷ', 'en-us', 'ar-101'), 'G');
});

test('direction detection', () => {
  const pair = converter.createPair('en-us', 'ar-101');
  assert.equal(converter.detectDirection(';dt phg;', pair), 'forward');
  assert.equal(converter.detectDirection('كيف حالك', pair), 'backward');
  assert.equal(converter.detectDirection('Hi كيف حالك', pair), 'backward');
  assert.equal(converter.detectDirection('12345 !!', pair), null);
});

test('explicit direction overrides detection', () => {
  assert.equal(flip('abc', 'en-us', 'ar-101', { direction: 'backward' }), 'abc');
  assert.equal(flip('abc', 'en-us', 'ar-101', { direction: 'forward' }), 'شلاؤ');
});

test('other scripts: Russian, Hebrew, Persian', () => {
  assert.equal(flip('ghbdtn', 'en-us', 'ru'), 'привет');
  assert.equal(flip('руддщ', 'en-us', 'ru'), 'hello');
  assert.equal(flip('akuo', 'en-us', 'he'), 'שלום');
  assert.equal(flip('sghl', 'en-us', 'fa'), 'سلام');
});

test('French AZERTY dead keys compose and decompose', () => {
  assert.equal(flip('[etre', 'en-us', 'fr-azerty'), 'être');
  assert.equal(flip('être', 'en-us', 'fr-azerty'), '[etre');
  assert.equal(flip('[ ', 'en-us', 'fr-azerty'), '^');
});

test('German QWERTZ swaps Y and Z', () => {
  assert.equal(flip('yz', 'en-us', 'de-qwertz'), 'zy');
});

test('characters with no key are left untouched', () => {
  assert.equal(flip('😀 ;dt', 'en-us', 'ar-101'), '😀 كيف');
  assert.equal(flip('—', 'en-us', 'ar-101'), '—');
});

// Property test: typing random keys in layout A, then flipping, must give
// what layout B would have typed with the same keys.
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

test('round trip over every layout pair with random keystrokes', () => {
  const ids = layouts.ids;
  const random = rng(42);
  let checked = 0;
  for (const idA of ids) {
    for (const idB of ids) {
      if (idA === idB) continue;
      const a = layouts.get(idA);
      const b = layouts.get(idB);
      // Keys whose output is unique in A, single-char, not dead, so the text is unambiguous.
      const seen = new Map();
      for (const code of layouts.CODES) for (const lvl of [0, 1]) {
        const ch = a.keys[code] && a.keys[code][lvl];
        if (ch != null) seen.set(ch, (seen.get(ch) || 0) + 1);
      }
      const keys = [];
      for (const code of layouts.CODES) for (const lvl of [0, 1]) {
        const ch = a.keys[code] && a.keys[code][lvl];
        const out = b.keys[code] && (b.keys[code][lvl] != null ? b.keys[code][lvl] : b.keys[code][0]);
        if (ch == null || out == null || [...ch].length !== 1 || seen.get(ch) > 1) continue;
        if (a.dead.includes(ch) || b.dead.includes(out)) continue;
        if (ch.normalize('NFC') !== ch || /\p{M}/u.test(ch)) continue;
        keys.push([ch, out]);
      }
      const seq = Array.from({ length: 30 }, () => keys[Math.floor(random() * keys.length)]);
      const typed = seq.map((k) => k[0]).join('');
      const expected = seq.map((k) => k[1]).join('');
      const pair = converter.createPair(idA, idB);
      const segs = converter.segment(typed, pair.forward);
      // Some keys type several letters (لا), so a segment may have two readings;
      // the expected text must be reachable by picking one reading per segment.
      let positions = new Set([0]);
      for (const seg of segs) {
        const next = new Set();
        for (const pos of positions) for (const opt of seg.out) if (expected.startsWith(opt, pos)) next.add(pos + opt.length);
        positions = next;
      }
      assert.ok(positions.has(expected.length), `${idA} -> ${idB}: "${typed}" should give "${expected}"`);
      if (segs.every((sg) => sg.out.length === 1)) assert.equal(converter.render(segs, null, b), expected);
      checked++;
    }
  }
  assert.equal(checked, layouts.ids.length * (layouts.ids.length - 1));
});
