const test = require('node:test');
const assert = require('node:assert/strict');
const { isWord, size } = require('../../src/core/dictionary.js');

test('knows common words with b and gh', () => {
  for (const w of ['right', 'night', 'though', 'ghost', 'book', 'about', 'problem', 'number', 'web', 'keyboard']) assert.ok(isWord(w), w);
});

test('handles case, punctuation and simple suffixes', () => {
  for (const w of ['Right!', '"Books"', 'lights', 'brightly', 'robbed', 'bigger', 'libraries', 'building', "brother's"]) assert.ok(isWord(w), w);
});

test('rejects the wrong reading of لا', () => {
  for (const w of ['ribt', 'nibt', 'bost', 'dought', 'ghook', 'ghaghdad', '']) assert.ok(!isWord(w), w);
});

test('word list is a sensible size', () => {
  assert.ok(size > 500 && size < 3000, String(size));
});
