// User settings: defaults, validation and chrome.storage access.
(function (root, factory) {
  const isNode = typeof module === 'object' && module.exports;
  const deps = isNode
    ? { layouts: require('./layouts.js'), shortcut: require('./shortcut.js') }
    : { layouts: root.KeyFlip.layouts, shortcut: root.KeyFlip.shortcut };
  const api = factory(deps);
  if (isNode) module.exports = api;
  root.KeyFlip = root.KeyFlip || {};
  root.KeyFlip.settings = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (deps) {
  'use strict';
  const { layouts, shortcut } = deps;

  const KEY = 'settings';
  const STATS_KEY = 'stats';

  const DEFAULTS = Object.freeze({
    version: 1,
    enabled: true,
    uiLanguage: 'auto', // auto | ar | en
    theme: 'auto', // auto | light | dark
    layoutA: 'en-us',
    layoutB: 'ar-101',
    shortcut: shortcut.DEFAULT,
    showFab: true,
    fabOnReadOnly: false,
    contextMenu: true,
    showToast: true,
    ambiguity: 'smart', // smart | ask | single | double
    noSelection: 'field', // field | word | none
    typingWpm: 40,
    disabledSites: [],
    os: null,
    onboarded: false,
  });

  const ENUMS = {
    uiLanguage: ['auto', 'ar', 'en'],
    theme: ['auto', 'light', 'dark'],
    ambiguity: ['smart', 'ask', 'single', 'double'],
    noSelection: ['field', 'word', 'none'],
  };

  function sanitize(raw) {
    const s = Object.assign({}, DEFAULTS, raw || {});
    for (const [k, allowed] of Object.entries(ENUMS)) if (!allowed.includes(s[k])) s[k] = DEFAULTS[k];
    for (const k of ['enabled', 'showFab', 'fabOnReadOnly', 'contextMenu', 'showToast', 'onboarded']) s[k] = !!s[k];
    if (!layouts.get(s.layoutA)) s.layoutA = DEFAULTS.layoutA;
    if (!layouts.get(s.layoutB)) s.layoutB = DEFAULTS.layoutB;
    if (s.layoutA === s.layoutB) s.layoutB = s.layoutA === 'ar-101' ? 'en-us' : 'ar-101';
    s.shortcut = shortcut.isValid(s.shortcut) ? Object.assign({}, s.shortcut) : Object.assign({}, shortcut.DEFAULT);
    s.typingWpm = Math.min(150, Math.max(10, Math.round(Number(s.typingWpm) || DEFAULTS.typingWpm)));
    s.disabledSites = Array.isArray(s.disabledSites)
      ? [...new Set(s.disabledSites.filter((h) => typeof h === 'string' && h))]
      : [];
    return s;
  }

  function area() {
    return typeof chrome !== 'undefined' && chrome.storage ? chrome.storage.local : null;
  }

  async function load() {
    const a = area();
    if (!a) return sanitize();
    const got = await a.get(KEY);
    return sanitize(got[KEY]);
  }

  async function save(patch) {
    const a = area();
    const next = sanitize(Object.assign(await load(), patch));
    if (a) await a.set({ [KEY]: next });
    return next;
  }

  // cb(newSettings) whenever settings change in any context.
  function onChange(cb) {
    if (typeof chrome === 'undefined' || !chrome.storage) return () => {};
    const listener = (changes, areaName) => {
      if (areaName === 'local' && changes[KEY]) cb(sanitize(changes[KEY].newValue));
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }

  function resolveTheme(theme) {
    if (theme === 'light' || theme === 'dark') return theme;
    const dark = typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
    return dark ? 'dark' : 'light';
  }

  return { KEY, STATS_KEY, DEFAULTS, ENUMS, sanitize, load, save, onChange, resolveTheme };
});
