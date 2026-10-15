// Runs before the page paints: applies the saved theme and sends a first-time
// visitor whose browser prefers Arabic to the Arabic page.
(function () {
  'use strict';
  var d = document.documentElement;
  var get = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var theme = get('kf-theme');
  if (theme === 'light' || theme === 'dark') d.setAttribute('data-theme', theme);

  if (d.getAttribute('data-page') !== 'home' || d.lang !== 'en') return;
  if (get('kf-lang') || /[?&]lang=en\b/.test(location.search)) return;
  var langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
  if (/^ar\b/i.test(langs[0] || '')) location.replace('ar/' + location.hash);
})();
