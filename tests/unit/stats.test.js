const test = require('node:test');
const assert = require('node:assert/strict');
const Stats = require('../../src/core/stats.js');

const DAY = 86400000;
const NOW = new Date(2026, 9, 14, 12).getTime();

test('records flips, characters and time saved', () => {
  let s = Stats.empty();
  s = Stats.record(s, { chars: 200, wpm: 40, now: NOW });
  assert.equal(s.flips, 1);
  assert.equal(s.chars, 200);
  // 200 chars at 40 wpm (200 chars/min) = 60 s, plus 2 s overhead.
  assert.equal(Math.round(s.seconds), 62);
  assert.equal(s.daily[Stats.dayKey(NOW)].flips, 1);
  assert.equal(s.firstAt, NOW);
});

test('time saved scales with typing speed', () => {
  assert.ok(Stats.secondsFor(100, 20) > Stats.secondsFor(100, 80));
  assert.equal(Math.round(Stats.secondsFor(0, 40)), 2);
});

test('lastDays returns a dense series ending today', () => {
  const s = Stats.record(Stats.empty(), { chars: 5, now: NOW - 2 * DAY });
  const days = Stats.lastDays(s, 14, NOW);
  assert.equal(days.length, 14);
  assert.equal(days[13].key, Stats.dayKey(NOW));
  assert.equal(days[11].flips, 1);
});

test('old daily entries are trimmed', () => {
  let s = Stats.empty();
  for (let d = 0; d < 150; d++) s = Stats.record(s, { chars: 1, now: NOW - d * DAY });
  assert.equal(Object.keys(s.daily).length, 120);
  assert.equal(s.flips, 150);
});

test('sanitize repairs bad data', () => {
  const s = Stats.sanitize({ flips: -3, chars: 'x', daily: null });
  assert.equal(s.flips, 0);
  assert.equal(s.chars, 0);
  assert.deepEqual(s.daily, {});
});
