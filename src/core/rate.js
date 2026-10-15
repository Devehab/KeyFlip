// When to ask for a store rating. Only people who really use KeyFlip are
// asked, never more than a few times, and "Don't ask again" is final.
// Pure functions over the usage stats and a small saved state.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KeyFlip = root.KeyFlip || {};
  root.KeyFlip.rate = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const KEY = 'rate';
  const MIN_FLIPS = 20; // fixes before the first ask
  const MIN_DAYS = 3; // ...spread over at least this many days
  const SNOOZE_FLIPS = 40; // "Not now" waits for this many more fixes
  const SNOOZE_DAYS = 10; // ...and this many days
  const MAX_ASKS = 3;

  function empty() {
    return { status: 'new', asks: 0, nextFlips: 0, nextDay: '', nudged: -1 };
  }

  function sanitize(raw) {
    const r = Object.assign(empty(), raw && typeof raw === 'object' ? raw : {});
    if (!['new', 'later', 'done', 'never'].includes(r.status)) r.status = 'new';
    for (const k of ['asks', 'nextFlips']) r[k] = Math.max(0, Number(r[k]) || 0);
    r.nudged = Number.isInteger(r.nudged) ? r.nudged : -1;
    if (typeof r.nextDay !== 'string') r.nextDay = '';
    return r;
  }

  function activeDays(stats) {
    const daily = (stats && stats.daily) || {};
    return Object.keys(daily).filter((k) => daily[k] && daily[k].flips > 0).length;
  }

  function addDays(dayKey, days) {
    const [y, m, d] = dayKey.split('-').map(Number);
    const date = new Date(y, m - 1, d + days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  // Should KeyFlip ask now? `today` is a YYYY-MM-DD day key.
  function due(stats, raw, today) {
    const r = sanitize(raw);
    const flips = (stats && stats.flips) || 0;
    if (r.status === 'done' || r.status === 'never' || r.asks >= MAX_ASKS) return false;
    if (flips < MIN_FLIPS || activeDays(stats) < MIN_DAYS) return false;
    if (r.status === 'later' && (flips < r.nextFlips || today < r.nextDay)) return false;
    return true;
  }

  // The one-time hint in the confirmation bubble, once per round of asking.
  function nudge(stats, raw, today) {
    return due(stats, raw, today) && sanitize(raw).nudged !== sanitize(raw).asks;
  }

  function markNudged(raw) {
    const r = sanitize(raw);
    return Object.assign(r, { nudged: r.asks });
  }

  function later(stats, raw, today) {
    const r = sanitize(raw);
    return Object.assign(r, {
      status: 'later',
      asks: r.asks + 1,
      nextFlips: ((stats && stats.flips) || 0) + SNOOZE_FLIPS,
      nextDay: addDays(today, SNOOZE_DAYS),
    });
  }

  function done(raw) {
    return Object.assign(sanitize(raw), { status: 'done' });
  }

  function never(raw) {
    return Object.assign(sanitize(raw), { status: 'never' });
  }

  return {
    KEY, MIN_FLIPS, MIN_DAYS, SNOOZE_FLIPS, SNOOZE_DAYS, MAX_ASKS,
    empty, sanitize, activeDays, addDays, due, nudge, markNudged, later, done, never,
  };
});
