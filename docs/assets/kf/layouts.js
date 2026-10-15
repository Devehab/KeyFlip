// Layout catalog: display metadata on top of the generated key tables.
(function (root, factory) {
  const data = typeof module === 'object' && module.exports
    ? require('./layouts.data.js')
    : root.KeyFlip.layoutData;
  const api = factory(data);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KeyFlip = root.KeyFlip || {};
  root.KeyFlip.layouts = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (data) {
  'use strict';

  // Physical keys in visual order (used by the keyboard preview).
  const ROWS = [
    ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal'],
    ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash'],
    ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote'],
    ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash'],
  ];
  const CODES = ROWS.flat();

  const LANGUAGES = {
    en: { native: 'English', en: 'English', ar: 'الإنجليزية', script: 'latin' },
    ar: { native: 'العربية', en: 'Arabic', ar: 'العربية', script: 'arabic' },
    fa: { native: 'فارسی', en: 'Persian', ar: 'الفارسية', script: 'arabic' },
    ur: { native: 'اردو', en: 'Urdu', ar: 'الأردية', script: 'arabic' },
    he: { native: 'עברית', en: 'Hebrew', ar: 'العبرية', script: 'hebrew' },
    fr: { native: 'Français', en: 'French', ar: 'الفرنسية', script: 'latin' },
    de: { native: 'Deutsch', en: 'German', ar: 'الألمانية', script: 'latin' },
    ru: { native: 'Русский', en: 'Russian', ar: 'الروسية', script: 'cyrillic' },
    tr: { native: 'Türkçe', en: 'Turkish', ar: 'التركية', script: 'latin' },
  };

  // platform: which OS ships this layout ('pc' = Windows, Linux, ChromeOS; 'any' = everywhere).
  const CATALOG = [
    { id: 'en-us', lang: 'en', platform: 'any', en: 'English — US (QWERTY)', ar: 'الإنجليزية — US (QWERTY)', short: { en: 'English (US)', ar: 'الإنجليزية (US)' } },
    { id: 'en-gb', lang: 'en', platform: 'any', en: 'English — UK', ar: 'الإنجليزية — UK', short: { en: 'English (UK)', ar: 'الإنجليزية (UK)' } },
    { id: 'ar-101', lang: 'ar', platform: 'pc', en: 'Arabic (101) — Windows, Linux, ChromeOS', ar: 'العربية (101) — ويندوز، لينكس، كروم', short: { en: 'Arabic (101)', ar: 'العربية (101)' } },
    { id: 'ar-mac', lang: 'ar', platform: 'mac', en: 'Arabic — Mac', ar: 'العربية — ماك', short: { en: 'Arabic (Mac)', ar: 'العربية (ماك)' } },
    { id: 'ar-mac-qwerty', lang: 'ar', platform: 'mac', en: 'Arabic QWERTY — Mac', ar: 'العربية QWERTY — ماك', short: { en: 'Arabic QWERTY', ar: 'العربية QWERTY' } },
    { id: 'fa', lang: 'fa', platform: 'pc', en: 'Persian — Windows', ar: 'الفارسية — ويندوز' },
    { id: 'fa-mac', lang: 'fa', platform: 'mac', en: 'Persian — Mac', ar: 'الفارسية — ماك' },
    { id: 'ur', lang: 'ur', platform: 'pc', en: 'Urdu — Windows', ar: 'الأردية — ويندوز' },
    { id: 'he', lang: 'he', platform: 'pc', en: 'Hebrew — Windows', ar: 'العبرية — ويندوز' },
    { id: 'he-mac', lang: 'he', platform: 'mac', en: 'Hebrew — Mac', ar: 'العبرية — ماك' },
    { id: 'fr-azerty', lang: 'fr', platform: 'pc', en: 'French — AZERTY (Windows)', ar: 'الفرنسية — AZERTY (ويندوز)' },
    { id: 'fr-mac', lang: 'fr', platform: 'mac', en: 'French — AZERTY (Mac)', ar: 'الفرنسية — AZERTY (ماك)' },
    { id: 'de-qwertz', lang: 'de', platform: 'pc', en: 'German — QWERTZ (Windows)', ar: 'الألمانية — QWERTZ (ويندوز)' },
    { id: 'de-mac', lang: 'de', platform: 'mac', en: 'German — QWERTZ (Mac)', ar: 'الألمانية — QWERTZ (ماك)' },
    { id: 'ru', lang: 'ru', platform: 'pc', en: 'Russian — ЙЦУКЕН (Windows)', ar: 'الروسية — ЙЦУКЕН (ويندوز)' },
    { id: 'ru-mac', lang: 'ru', platform: 'mac', en: 'Russian — ЙЦУКЕН (Mac)', ar: 'الروسية — ЙЦУКЕН (ماك)' },
    { id: 'tr-q', lang: 'tr', platform: 'any', en: 'Turkish — Q', ar: 'التركية — Q' },
  ];

  const byId = new Map(CATALOG.map((l) => [l.id, l]));

  function get(id) {
    const meta = byId.get(id);
    if (!meta || !data[id]) return null;
    return Object.assign({}, meta, data[id]);
  }

  function name(id, uiLang, short) {
    const meta = byId.get(id);
    if (!meta) return id;
    const key = uiLang === 'ar' ? 'ar' : 'en';
    if (short) return meta.short ? meta.short[key] : meta[key].replace(/ — /, ' · ').replace(/\s*\((Windows|ويندوز)\)$/, '');
    return meta[key];
  }

  // Short badge for compact UI, e.g. "EN" / "ع".
  function badge(id) {
    const meta = byId.get(id);
    if (!meta) return '?';
    return { ar: 'ع', fa: 'فا', ur: 'اُ', he: 'עב' }[meta.lang] || meta.lang.toUpperCase();
  }

  function defaultsFor(os) {
    return { layoutA: 'en-us', layoutB: os === 'mac' ? 'ar-mac' : 'ar-101' };
  }

  // Grouped by language for <select> menus.
  function grouped() {
    const groups = [];
    for (const lang of Object.keys(LANGUAGES)) {
      const items = CATALOG.filter((l) => l.lang === lang);
      if (items.length) groups.push({ lang, meta: LANGUAGES[lang], items });
    }
    return groups;
  }

  // Ranks layouts by how well they explain observed keystrokes
  // ([{ code, key, shift }] from keydown events).
  function matchKeystrokes(samples, candidateIds) {
    const ids = candidateIds || CATALOG.map((l) => l.id);
    const usable = samples.filter((s) => s && s.key && s.key.length <= 2 && CODES.includes(s.code));
    return ids.map((id) => {
      const keys = data[id].keys;
      let hits = 0;
      for (const s of usable) {
        const pair = keys[s.code];
        if (!pair) continue;
        const expected = s.shift ? (pair[1] != null ? pair[1] : pair[0]) : pair[0];
        if (expected === s.key) hits++;
      }
      return { id, hits, total: usable.length, score: usable.length ? hits / usable.length : 0 };
    }).sort((x, y) => y.score - x.score || x.id.localeCompare(y.id));
  }

  return {
    ROWS, CODES, LANGUAGES, CATALOG, get, name, badge, defaultsFor, grouped, matchKeystrokes,
    ids: CATALOG.map((l) => l.id),
  };
});
