// KeyFlip website behaviour: Mac-aware shortcuts, theme, scroll reveal, the
// animated hero demo, the live playground (real KeyFlip engine) and the
// language switch on the privacy policy.
(function () {
  'use strict';
  var d = document.documentElement;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var store = function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } };
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent || '';
  var isMac = /mac|iphone|ipad/i.test(platform);

  // ---------- shortcuts as the visitor's keyboard shows them ----------
  if (isMac) {
    $$('[data-combo]').forEach(function (el) {
      var small = el.classList.contains('sm');
      var mod = el.getAttribute('data-combo') === 'undo' ? '⌘' : (small ? '⌃' : '⌃ Control');
      var key = el.getAttribute('data-combo') === 'undo' ? 'Z' : 'Q';
      var k1 = document.createElement('kbd');
      var plus = document.createElement('span');
      var k2 = document.createElement('kbd');
      k1.textContent = mod;
      plus.className = 'plus';
      plus.textContent = '+';
      k2.textContent = key;
      el.replaceChildren(k1, plus, k2);
    });
    $$('[data-combo-text="flip"]').forEach(function (el) { el.textContent = '(⌃Q)'; });
  }

  // ---------- theme and language preference ----------
  var toggle = $('.theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var current = d.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var next = current === 'dark' ? 'light' : 'dark';
      d.setAttribute('data-theme', next);
      store('kf-theme', next);
    });
  }
  $$('[data-set-lang]').forEach(function (a) {
    a.addEventListener('click', function () { store('kf-lang', a.getAttribute('data-set-lang')); });
  });

  // ---------- header and scroll reveal ----------
  var nav = $('.nav');
  var onScroll = function () { if (nav) nav.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Sections fade in as they scroll into view. Only set up here, so the
  // content stays visible if this script never runs.
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    d.classList.add('js');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  // ---------- hero demo ----------
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var demo = $('#demo');
  if (demo) runDemo(demo);

  function runDemo(el) {
    var examples = JSON.parse(el.getAttribute('data-examples'));
    var forms = JSON.parse(el.getAttribute('data-toast-forms'));
    var lang = el.getAttribute('data-lang');
    var rules = new Intl.PluralRules(lang);
    var txt = $('#demo-text', el);
    var state = $('#demo-state', el);
    var toast = $('#demo-toast', el);
    var msg = $('#demo-toast-msg', el);
    var caret = $('.caret', el);
    var labels = { typed: el.getAttribute('data-typed'), fixed: el.getAttribute('data-fixed') };
    var toastFor = function (text) {
      var n = Array.from(text).length;
      return (forms[rules.select(n)] || forms.other).replace('{n}', n);
    };

    var visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(el);
    }
    var ready = function () {
      return new Promise(function (resolve) {
        (function check() { if (visible && !document.hidden) resolve(); else setTimeout(check, 400); })();
      });
    };
    var setState = function (fixed) {
      state.textContent = fixed ? labels.fixed : labels.typed;
      state.classList.toggle('fixed', fixed);
    };

    if (reduced) {
      var i = 0;
      setInterval(function () {
        var ex = examples[i++ % examples.length];
        txt.dir = ex.toDir;
        txt.textContent = ex.to;
        msg.textContent = toastFor(ex.from);
      }, 4000);
      return;
    }

    (async function loop() {
      await sleep(900);
      for (;;) {
        for (var k = 0; k < examples.length; k++) {
          var ex = examples[k];
          await ready();
          toast.classList.remove('show');
          txt.classList.remove('sel');
          caret.classList.remove('off');
          setState(false);
          txt.dir = ex.fromDir;
          txt.textContent = '';
          await sleep(350);
          var chars = Array.from(ex.from);
          for (var c = 1; c <= chars.length; c++) {
            txt.textContent = chars.slice(0, c).join('');
            await sleep(55 + Math.random() * 70);
          }
          await sleep(650);
          caret.classList.add('off');
          txt.classList.add('sel');
          await sleep(550);
          var keys = $$('.demo-keys kbd', el);
          keys[0].classList.add('press');
          await sleep(170);
          keys[1].classList.add('press');
          await sleep(230);
          txt.classList.add('out');
          await sleep(270);
          txt.dir = ex.toDir;
          txt.textContent = ex.to;
          txt.classList.remove('out');
          setState(true);
          await sleep(140);
          keys.forEach(function (key) { key.classList.remove('press'); });
          msg.textContent = toastFor(ex.from);
          toast.classList.add('show');
          await sleep(2700);
          txt.classList.remove('sel');
          await sleep(500);
        }
      }
    })();
  }

  // ---------- live playground ----------
  var play = $('#play');
  var KF = window.KeyFlip;
  if (play && KF && KF.converter && KF.layouts && KF.dictionary) runPlayground(play, KF);

  function runPlayground(root, kf) {
    var lang = root.getAttribute('data-lang');
    var S = JSON.parse(root.getAttribute('data-strings'));
    var ta = $('#play-text', root);
    var selA = $('#kb-a', root);
    var selB = $('#kb-b', root);
    var status = $('#play-status', root);
    var amb = $('#play-amb', root);
    var chips = $$('.play-samples .chip', root);
    var sample = ta.value;
    var last = null;
    var applying = false;
    var name = function (id) { return kf.layouts.name(id, lang, true); };

    function say(text, ok) {
      status.textContent = text;
      status.classList.toggle('ok', !!ok);
    }

    function replace(start, end, text) {
      applying = true;
      ta.focus();
      ta.setSelectionRange(start, end);
      var done = false;
      try { done = document.execCommand('insertText', false, text); } catch (e) { done = false; }
      if (!done || ta.value.slice(start, start + text.length) !== text) ta.setRangeText(text, start, end, 'end');
      ta.setSelectionRange(start, start + text.length);
      applying = false;
      ta.classList.remove('flash');
      void ta.offsetWidth;
      ta.classList.add('flash');
    }

    function flip() {
      var value = ta.value;
      if (!value.trim()) { say(S.empty); return; }
      var start = ta.selectionStart;
      var end = ta.selectionEnd;
      if (start === end) { start = 0; end = value.length; }
      var text = value.slice(start, end);
      if (selA.value === selB.value) { say(S.nothing); return; }
      var result = kf.converter.analyze(text, kf.converter.createPair(selA.value, selB.value));
      if (!result.changed) { say(S.nothing); return; }
      var auto = result.words.map(function (w) { return kf.converter.autoPick(w, kf.dictionary.isWord); });
      var chosen = auto.map(function (pick, i) { return pick || result.words[i].candidates[0]; });
      var out = result.render(kf.converter.choicesFrom(chosen));
      replace(start, end, out);
      last = { start: start, len: out.length, result: result, chosen: chosen, auto: auto.map(Boolean) };
      say(S.detected.replace('{from}', name(result.from)).replace('{to}', name(result.to)), true);
      renderChoices();
    }

    function renderChoices() {
      if (!last || !last.result.words.length) { amb.hidden = true; amb.replaceChildren(); return; }
      var title = document.createElement('p');
      title.textContent = S.choose;
      var rows = last.result.words.map(function (w, i) {
        var row = document.createElement('div');
        row.className = 'amb-word';
        var src = document.createElement('span');
        src.className = 'src';
        src.dir = 'auto';
        src.textContent = w.source;
        row.appendChild(src);
        w.candidates.forEach(function (cand) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'chip';
          b.dir = 'auto';
          b.textContent = cand.text;
          b.setAttribute('aria-pressed', String(cand === last.chosen[i]));
          b.addEventListener('click', function () { choose(i, cand); });
          row.appendChild(b);
        });
        if (last.auto[i]) {
          var tag = document.createElement('span');
          tag.className = 'tag';
          tag.textContent = '✓ ' + S.auto;
          row.appendChild(tag);
        }
        return row;
      });
      amb.replaceChildren.apply(amb, [title].concat(rows));
      amb.hidden = false;
    }

    function choose(i, cand) {
      if (!last) return;
      last.chosen[i] = cand;
      last.auto[i] = false;
      var out = last.result.render(kf.converter.choicesFrom(last.chosen));
      replace(last.start, last.start + last.len, out);
      last.len = out.length;
      renderChoices();
    }

    function forget() {
      last = null;
      amb.hidden = true;
      amb.replaceChildren();
    }

    $('#play-flip', root).addEventListener('click', flip);
    $('#play-reset', root).addEventListener('click', function () {
      ta.value = sample;
      forget();
      say('');
    });
    $('#kb-swap', root).addEventListener('click', function () {
      var a = selA.value;
      selA.value = selB.value;
      selB.value = a;
      forget();
    });
    selA.addEventListener('change', forget);
    selB.addEventListener('change', forget);
    ta.addEventListener('input', function () { if (!applying) { forget(); say(''); } });
    ta.addEventListener('keydown', function (e) {
      if (e.code === 'KeyQ' && e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        flip();
      }
    });
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.toggle('on', c === chip); });
        sample = chip.getAttribute('data-text');
        ta.value = sample;
        selA.value = chip.getAttribute('data-a');
        selB.value = chip.getAttribute('data-b');
        forget();
        say('');
      });
    });
  }

  // ---------- privacy policy language ----------
  var docSwitch = $('.doc-switch');
  if (docSwitch) {
    var show = function (l) {
      $$('.doc').forEach(function (doc) { doc.hidden = doc.id !== 'doc-' + l; });
      $$('[data-doc]', docSwitch).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-doc') === l)); });
    };
    $$('[data-doc]', docSwitch).forEach(function (b) {
      b.addEventListener('click', function () {
        show(b.getAttribute('data-doc'));
        history.replaceState(null, '', '#' + b.getAttribute('data-doc'));
      });
    });
    var prefersAr = /^ar\b/i.test((navigator.languages && navigator.languages[0]) || navigator.language || '');
    show(location.hash === '#ar' || (!location.hash && prefersAr) ? 'ar' : 'en');
  }
})();
