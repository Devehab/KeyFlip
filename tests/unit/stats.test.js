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

test('streaks count consecutive days and tolerate today being empty', () => {
  let s = Stats.empty();
  for (const d of [1, 2, 3]) s = Stats.record(s, { chars: 5, now: NOW - d * DAY });
  assert.equal(Stats.streak(s, NOW), 3);
  s = Stats.record(s, { chars: 5, now: NOW });
  assert.equal(Stats.streak(s, NOW), 4);
  assert.equal(Stats.streak(s, NOW + 3 * DAY), 0);
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

test('achievements unlock', () => {
  let s = Stats.empty();
  assert.ok(Stats.achievements(s, NOW).every((a) => !a.unlocked));
  s = Stats.record(s, { chars: 1200, ambiguities: 10, now: NOW });
  const got = Object.fromEntries(Stats.achievements(s, NOW).map((a) => [a.id, a.unlocked]));
  assert.equal(got.first, true);
  assert.equal(got.chars1k, true);
  assert.equal(got.lam, true);
  assert.equal(got.flips10, false);
});

test('sanitize repairs bad data', () => {
  const s = Stats.sanitize({ flips: -3, chars: 'x', daily: null });
  assert.equal(s.flips, 0);
  assert.equal(s.chars, 0);
  assert.deepEqual(s.daily, {});
});
