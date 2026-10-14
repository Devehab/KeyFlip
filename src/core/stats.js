// Usage statistics. Pure functions; storage lives elsewhere.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KeyFlip = root.KeyFlip || {};
  root.KeyFlip.stats = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const KEEP_DAYS = 120;
  // Deleting the wrong text and switching the layout by hand.
  const OVERHEAD_SECONDS = 2;

  function empty() {
    return { flips: 0, chars: 0, seconds: 0, ambiguities: 0, daily: {}, firstAt: null, lastAt: null };
  }

  function dayKey(date) {
    const d = new Date(date);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  // Seconds a person would spend retyping `chars` characters at `wpm` words per minute.
  function secondsFor(chars, wpm) {
    const cpm = Math.max(10, Number(wpm) || 40) * 5;
    return OVERHEAD_SECONDS + (chars / cpm) * 60;
  }

  function sanitize(raw) {
    const s = Object.assign(empty(), raw || {});
    for (const k of ['flips', 'chars', 'seconds', 'ambiguities']) s[k] = Math.max(0, Number(s[k]) || 0);
    if (!s.daily || typeof s.daily !== 'object') s.daily = {};
    return s;
  }

  // Returns a new stats object with one flip added.
  function record(raw, event) {
    const s = sanitize(raw);
    const now = event.now || Date.now();
    const chars = Math.max(0, event.chars | 0);
    const secs = secondsFor(chars, event.wpm);
    s.flips += 1;
    s.chars += chars;
    s.seconds += secs;
    s.ambiguities += Math.max(0, event.ambiguities | 0);
    s.firstAt = s.firstAt || now;
    s.lastAt = now;
    const key = dayKey(now);
    const day = s.daily[key] || { flips: 0, chars: 0, seconds: 0 };
    s.daily = Object.assign({}, s.daily, {
      [key]: { flips: day.flips + 1, chars: day.chars + chars, seconds: day.seconds + secs },
    });
    const keys = Object.keys(s.daily).sort();
    for (const k of keys.slice(0, Math.max(0, keys.length - KEEP_DAYS))) delete s.daily[k];
    return s;
  }

  function lastDays(raw, count, now) {
    const s = sanitize(raw);
    const out = [];
    const d = new Date(now || Date.now());
    d.setDate(d.getDate() - (count - 1));
    for (let i = 0; i < count; i++) {
      const key = dayKey(d);
      out.push(Object.assign({ key, date: new Date(d) }, s.daily[key] || { flips: 0, chars: 0, seconds: 0 }));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }

  function minutes(raw) {
    return Math.round(sanitize(raw).seconds / 60);
  }

  return { empty, dayKey, secondsFor, sanitize, record, lastDays, minutes };
});
