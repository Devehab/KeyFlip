// OS detection, used to pick the right Arabic layout and shortcut labels.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KeyFlip = root.KeyFlip || {};
  root.KeyFlip.platform = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Accepts navigator-like input so it can be unit tested.
  function detectOS(nav) {
    const n = nav || (typeof navigator !== 'undefined' ? navigator : {});
    const hint = String((n.userAgentData && n.userAgentData.platform) || n.platform || '').toLowerCase();
    const ua = String(n.userAgent || '').toLowerCase();
    const s = hint + ' ' + ua;
    if (/cros/.test(s)) return 'cros';
    if (/mac|iphone|ipad/.test(s)) return 'mac';
    if (/win/.test(s)) return 'win';
    if (/android/.test(s)) return 'android';
    if (/linux|x11/.test(s)) return 'linux';
    return 'other';
  }

  // chrome.runtime.getPlatformInfo().os -> our names.
  function fromRuntime(os) {
    return { mac: 'mac', win: 'win', linux: 'linux', cros: 'cros', android: 'android' }[os] || 'other';
  }

  const LABELS = {
    mac: { en: 'macOS', ar: 'ماك' },
    win: { en: 'Windows', ar: 'ويندوز' },
    linux: { en: 'Linux', ar: 'لينكس' },
    cros: { en: 'ChromeOS', ar: 'كروم أو إس' },
    android: { en: 'Android', ar: 'أندرويد' },
    other: { en: 'your system', ar: 'نظامك' },
  };

  function label(os, lang) {
    return (LABELS[os] || LABELS.other)[lang === 'ar' ? 'ar' : 'en'];
  }

  return { detectOS, fromRuntime, label };
});
