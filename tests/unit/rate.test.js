const test = require('node:test');
const assert = require('node:assert/strict');
const Rate = require('../../src/core/rate.js');
const Store = require('../../src/core/store.js');
const Stats = require('../../src/core/stats.js');

const DAY = 86400000;
const START = new Date(2026, 9, 1, 12).getTime();
const ID = 'abcdefghijklmnopabcdefghijklmnop';

// `flips` fixes spread evenly over `days` days, starting at START.
function used(flips, days) {
  let s = Stats.empty();
  for (let i = 0; i < flips; i++) s = Stats.record(s, { chars: 10, now: START + (i % days) * DAY });
  return s;
}
const today = (offset) => Stats.dayKey(START + offset * DAY);

test('finds the Chrome Web Store listing from the extension ID', () => {
  const listing = Store.detect({ update_url: 'https://clients2.google.com/service/update2/crx' }, ID);
  assert.equal(listing.page, `https://chromewebstore.google.com/detail/${ID}`);
  assert.equal(listing.review, `https://chromewebstore.google.com/detail/keyflip/${ID}/reviews`);
});

test('copies loaded by hand or from elsewhere have no store listing', () => {
  assert.equal(Store.detect({}, ID), null);
  assert.equal(Store.detect({ update_url: 'https://example.com/updates.xml' }, ID), null);
  assert.equal(Store.detect({ update_url: 'https://clients2.google.com/service/update2/crx' }, 'not-an-id'), null);
});

test('asks only after real use: enough fixes on enough different days', () => {
  assert.equal(Rate.due(used(Rate.MIN_FLIPS - 1, 5), null, today(5)), false);
  assert.equal(Rate.due(used(50, Rate.MIN_DAYS - 1), null, today(5)), false);
  assert.equal(Rate.due(used(Rate.MIN_FLIPS, Rate.MIN_DAYS), null, today(5)), true);
});

test('"Not now" waits for more fixes and more days', () => {
  const s = used(25, 4);
  const snoozed = Rate.later(s, null, today(4));
  assert.equal(snoozed.asks, 1);
  assert.equal(Rate.due(s, snoozed, today(4)), false);
  const more = used(25 + Rate.SNOOZE_FLIPS, 6);
  assert.equal(Rate.due(more, snoozed, today(4 + Rate.SNOOZE_DAYS - 1)), false, 'too soon');
  assert.equal(Rate.due(more, snoozed, today(4 + Rate.SNOOZE_DAYS)), true);
});

test('asks a few times at most, and never again after rating or "Don\'t ask again"', () => {
  const s = used(500, 30);
  let r = null;
  for (let i = 0; i < Rate.MAX_ASKS; i++) r = Rate.later(s, r, today(0));
  assert.equal(Rate.due(s, r, today(365)), false);
  assert.equal(Rate.due(s, Rate.done(null), today(365)), false);
  assert.equal(Rate.due(s, Rate.never(null), today(365)), false);
});

test('the bubble hint shows once per round of asking', () => {
  const s = used(30, 5);
  assert.equal(Rate.nudge(s, null, today(5)), true);
  const shown = Rate.markNudged(null);
  assert.equal(Rate.nudge(s, shown, today(5)), false);
  const next = Rate.later(s, shown, today(5));
  const later = used(30 + Rate.SNOOZE_FLIPS, 8);
  assert.equal(Rate.nudge(later, next, today(5 + Rate.SNOOZE_DAYS)), true);
});

test('bad saved state is cleaned up', () => {
  const r = Rate.sanitize({ status: 'weird', asks: -3, nextFlips: 'x', nudged: 1.5, nextDay: 7 });
  assert.deepEqual(r, Rate.empty());
  assert.equal(Rate.addDays('2026-12-28', 10), '2027-01-07');
});
