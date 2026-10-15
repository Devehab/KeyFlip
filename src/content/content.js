// KeyFlip content script: finds the selected text, flips it, and writes it back
// in place (keeping undo history), via shortcut, floating button or menu.
(function (root) {
  'use strict';
  const KF = root.KeyFlip;
  if (!KF || !KF.converter || !KF.ui) return;

  // After an extension update the old copy is orphaned; replace it cleanly.
  if (root.__keyflipInstance) {
    try { root.__keyflipInstance.destroy(); } catch (e) { /* already gone */ }
  }

  const { converter, dictionary, layouts, settings: Settings, i18n, shortcut: Shortcut, platform } = KF;
  const OS = platform.detectOS();
  const TEXT_TYPES = new Set(['', 'text', 'search', 'url', 'tel', 'email']);
  const MAX_CHARS = 50000;

  const cleanups = [];
  const ui = KF.ui.create();
  let cfg = Settings.sanitize();
  let pair = converter.createPair(cfg.layoutA, cfg.layoutB);
  let lang = 'en';
  let busy = false;
  let last = null;
  let pointer = null;
  let fabTimer = null;
  let destroyed = false;

  function on(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    cleanups.push(() => target.removeEventListener(type, fn, opts));
  }

  function alive() {
    try { return !!(root.chrome && chrome.runtime && chrome.runtime.id); } catch (e) { return false; }
  }

  function active() {
    if (destroyed) return false;
    if (!alive()) { destroy(); return false; }
    return cfg.enabled && !cfg.disabledSites.includes(location.hostname);
  }

  function applySettings(next) {
    cfg = next;
    try { pair = converter.createPair(cfg.layoutA, cfg.layoutB); } catch (e) { pair = converter.createPair('en-us', 'ar-101'); }
    lang = i18n.resolve(cfg.uiLanguage);
    ui.setState({
      lang,
      theme: Settings.resolveTheme(cfg.theme),
      vars: { shortcut: Shortcut.format(cfg.shortcut, OS) },
    });
    if (!cfg.showFab) ui.hideFab();
  }

  applySettings(cfg);
  Settings.load().then(applySettings).catch(() => {});
  cleanups.push(Settings.onChange(applySettings));

  // ---------- finding the text ----------

  function deepActive() {
    let a = document.activeElement;
    while (a && a.shadowRoot && a.shadowRoot.activeElement) a = a.shadowRoot.activeElement;
    return a;
  }

  function isTextField(node) {
    if (!node || node.disabled || node.readOnly) return false;
    if (node.tagName === 'TEXTAREA') return true;
    return node.tagName === 'INPUT' && TEXT_TYPES.has((node.getAttribute('type') || '').toLowerCase());
  }

  function editingHost(node) {
    let n = node && node.nodeType === 1 ? node : node && node.parentElement;
    if (!n || !n.isContentEditable) return null;
    while (n.parentElement && n.parentElement.isContentEditable) n = n.parentElement;
    return n;
  }

  // Snapshot of where the user's text is. Kinds: field | editable | readonly.
  function capture() {
    const a = deepActive();
    if (isTextField(a)) {
      if (a.type === 'email') {
        return { kind: 'field', el: a, start: 0, end: a.value.length, email: true, hadSelection: true };
      }
      return { kind: 'field', el: a, start: a.selectionStart, end: a.selectionEnd, hadSelection: a.selectionStart !== a.selectionEnd };
    }
    const sel = document.getSelection();
    if (!sel || !sel.rangeCount) return null;
    const range = sel.getRangeAt(0);
    if (ui.contains(range.commonAncestorContainer)) return null;
    const host = editingHost(range.startContainer);
    if (host) return { kind: 'editable', host, range: range.cloneRange(), hadSelection: !range.collapsed };
    if (!range.collapsed) return { kind: 'readonly', range: range.cloneRange(), text: sel.toString(), hadSelection: true };
    return null;
  }

  function wordBounds(value, caret) {
    let s = caret;
    while (s > 0 && /\s/.test(value[s - 1])) s--;
    let e = s;
    while (s > 0 && !/\s/.test(value[s - 1])) s--;
    if (e === caret) while (e < value.length && !/\s/.test(value[e])) e++;
    return [s, e];
  }

  // Applies the "nothing selected" preference. Returns false if there is nothing to do.
  function expand(t) {
    if (t.hadSelection) return true;
    if (cfg.noSelection === 'none' || t.kind === 'readonly') return false;
    if (t.kind === 'field') {
      const v = t.el.value;
      if (cfg.noSelection === 'field') { t.start = 0; t.end = v.length; } else [t.start, t.end] = wordBounds(v, t.start);
      return t.end > t.start;
    }
    const sel = document.getSelection();
    if (cfg.noSelection === 'field') {
      t.range = document.createRange();
      t.range.selectNodeContents(t.host);
    } else {
      sel.removeAllRanges();
      sel.addRange(t.range);
      sel.modify('move', 'backward', 'word');
      sel.modify('extend', 'forward', 'word');
      t.range = sel.getRangeAt(0).cloneRange();
    }
    return !t.range.collapsed;
  }

  function selectRange(range) {
    const sel = document.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    return sel;
  }

  function readText(t) {
    if (t.kind === 'field') return t.el.value.slice(t.start, t.end);
    if (t.kind === 'readonly') return t.text;
    return selectRange(t.range).toString();
  }

  // ---------- writing it back ----------

  function writeField(t, out) {
    const el = t.el;
    const before = el.value;
    const expected = before.slice(0, t.start) + out + before.slice(t.end);
    el.focus({ preventScroll: true });
    if (t.email) el.select(); else el.setSelectionRange(t.start, t.end);
    let ok = false;
    try { ok = document.execCommand('insertText', false, out); } catch (e) { ok = false; }
    if (!ok || (el.value === before && expected !== before)) {
      if (t.email) el.value = expected;
      else el.setRangeText(out, t.start, t.end, 'end');
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertReplacementText', data: out }));
    }
    if (t.email) return;
    if (t.hadSelection) el.setSelectionRange(t.start, t.start + out.length);
    else el.setSelectionRange(t.start + out.length, t.start + out.length);
  }

  function graphemes(s) {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) return [...new Intl.Segmenter().segment(s)].length;
    return [...s].length;
  }

  function writeEditable(t, out) {
    t.host.focus({ preventScroll: true });
    const sel = selectRange(t.range);
    let ok = false;
    try { ok = document.execCommand('insertText', false, out); } catch (e) { ok = false; }
    if (!ok) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const node = document.createTextNode(out);
      range.insertNode(node);
      t.host.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertReplacementText', data: out }));
      const r = document.createRange();
      if (t.hadSelection) r.selectNodeContents(node); else { r.setStartAfter(node); r.collapse(true); }
      selectRange(r);
      return;
    }
    // Re-select what we inserted so pressing the shortcut again flips it back.
    const n = graphemes(out);
    if (t.hadSelection && n <= 3000 && sel.modify) {
      for (let i = 0; i < n; i++) sel.modify('extend', 'backward', 'character');
      if (sel.toString().replace(/\s+/g, '') !== out.replace(/\s+/g, '')) sel.collapseToEnd();
    }
  }

  // ---------- ambiguity ----------

  function isKnownWordFor(layoutId) {
    const meta = layouts.get(layoutId);
    return meta && meta.lang === 'en' ? dictionary.isWord : null;
  }

  function bestGuess(word, known) {
    const pick = converter.autoPick(word, known);
    return pick ? word.candidates.indexOf(pick) : 0;
  }

  // Returns segment choices, or null if the user cancelled.
  async function resolveChoices(result) {
    const words = result.words;
    if (!words.length) return { choices: {}, asked: 0 };
    const mode = cfg.ambiguity;
    if (mode === 'single') return { choices: converter.choicesFrom(words.map((w) => w.candidates[0])), asked: 0 };
    if (mode === 'double') return { choices: converter.choicesFrom(words.map((w) => w.candidates[w.candidates.length - 1])), asked: 0 };
    const known = isKnownWordFor(result.to);
    const auto = words.map((w) => converter.autoPick(w, known));
    if (mode === 'smart' && auto.every(Boolean)) return { choices: converter.choicesFrom(auto), asked: 0, solved: words.length };
    const pending = mode === 'ask' ? words : words.filter((w, i) => !auto[i]);
    const fixed = mode === 'ask' ? [] : auto.filter(Boolean);
    const initial = pending.map((w) => bestGuess(w, known));
    const merge = (picks) => converter.choicesFrom(fixed.concat(pending.map((w, i) => w.candidates[picks[i]])));
    const picks = await ui.choose(pending, initial, (p) => result.render(merge(p)));
    if (!picks) return null;
    return { choices: merge(picks), asked: pending.length, solved: words.length };
  }

  // ---------- the flip ----------

  function directionFor(text) {
    if (last && text === last.text && Date.now() - last.at < 10 * 60 * 1000) {
      return last.direction === 'forward' ? 'backward' : 'forward';
    }
    return undefined;
  }

  function anchorFor(t) {
    if (t.kind === 'field') {
      const r = t.el.getBoundingClientRect();
      if (pointer && Date.now() - pointer.at < 1500 && pointer.x >= r.left - 4 && pointer.x <= r.right + 4 &&
        pointer.y >= r.top - 4 && pointer.y <= r.bottom + 4) {
        return { x: pointer.x, y: pointer.y - 6, bottom: pointer.y + 14, align: 'center' };
      }
      const rtl = getComputedStyle(t.el).direction === 'rtl';
      return { x: rtl ? r.left : r.right, y: r.top, bottom: r.bottom, align: rtl ? 'start' : 'end' };
    }
    const rects = t.range.getClientRects();
    const rect = rects.length ? rects[rects.length - 1] : t.range.getBoundingClientRect();
    const node = t.range.endContainer.nodeType === 1 ? t.range.endContainer : t.range.endContainer.parentElement;
    const rtl = !!node && getComputedStyle(node).direction === 'rtl';
    return { x: rtl ? rect.left : rect.right, y: (rects[0] || rect).top, bottom: rect.bottom, align: 'center' };
  }

  // Counts the fix. The answer may ask for the one-time "Rate KeyFlip" button.
  function record(chars, solved) {
    try {
      return chrome.runtime.sendMessage({ type: 'keyflip:record', chars, ambiguities: solved || 0 }).catch(() => null);
    } catch (e) {
      return Promise.resolve(null); // extension reloaded
    }
  }

  function rate() {
    try { chrome.runtime.sendMessage({ type: 'keyflip:rate' }).catch(() => {}); } catch (e) { /* reloaded */ }
  }

  async function flip(source) {
    if (busy || !active()) return false;
    const t = capture();
    if (!t) { if (source !== 'fab') ui.toast(i18n.t(lang, 'toastSelectFirst')); return false; }
    if (!expand(t)) { if (source !== 'fab') ui.toast(i18n.t(lang, 'toastSelectFirst')); return false; }
    const text = readText(t);
    if (!text.trim() || text.length > MAX_CHARS) return false;
    const result = converter.analyze(text, pair, { direction: directionFor(text) });
    if (!result.changed) { ui.toast(i18n.t(lang, 'toastNothing')); return false; }

    ui.hideFab();
    busy = true;
    let resolved;
    try {
      resolved = await resolveChoices(result);
    } finally {
      busy = false;
    }
    if (!resolved) {
      if (t.kind === 'field') { t.el.focus({ preventScroll: true }); if (!t.email) t.el.setSelectionRange(t.start, t.end); }
      else if (t.kind === 'editable') { t.host.focus({ preventScroll: true }); selectRange(t.range); }
      return false;
    }
    const out = result.render(resolved.choices);

    if (t.kind === 'readonly') {
      ui.showCard(anchorFor(t), { text: out, from: result.from, to: result.to });
      last = { text: out, direction: result.direction, at: Date.now() };
      return true;
    }

    if (t.kind === 'field') writeField(t, out); else writeEditable(t, out);
    last = { text: out, direction: result.direction, at: Date.now() };
    const n = graphemes(out);
    const recorded = record(n, resolved.solved);
    if (cfg.showToast) {
      const message = i18n.t(lang, 'toastFlipped', { n });
      const sub = i18n.t(lang, 'toastUndo', { undo: Shortcut.undo(OS) });
      ui.toast(message, sub);
      recorded.then((res) => {
        if (res && res.nudge && !destroyed) ui.toast(message, sub, { label: i18n.t(lang, 'rateButton'), onClick: rate });
      });
    }
    return true;
  }

  // ---------- floating button ----------

  function updateFab() {
    if (busy || !active() || !cfg.showFab) return ui.hideFab();
    const t = capture();
    if (!t || !t.hadSelection || (t.kind === 'readonly' && !cfg.fabOnReadOnly)) return ui.hideFab();
    const text = t.kind === 'field' ? t.el.value.slice(t.start, t.end) : t.kind === 'readonly' ? t.text : t.range.toString();
    if (!text.trim() || text.length > MAX_CHARS) return ui.hideFab();
    const result = converter.analyze(text, pair, { direction: directionFor(text) });
    if (!result.changed) return ui.hideFab();
    const known = isKnownWordFor(result.to);
    const choices = converter.choicesFrom(result.words.map((w) => w.candidates[bestGuess(w, known)]));
    ui.showFab(anchorFor(t), { from: result.from, to: result.to, preview: result.render(choices) });
  }

  function scheduleFab() {
    clearTimeout(fabTimer);
    fabTimer = setTimeout(updateFab, 120);
  }

  ui.onFab = () => flip('fab');

  // ---------- events ----------

  function ignored(e) {
    const el = e.target;
    return !!(el && el.closest && el.closest('[data-keyflip-ignore]'));
  }

  on(window, 'keydown', (e) => {
    if (e.isComposing || busy || ui.inUi(e) || ignored(e)) return;
    if (!Shortcut.matches(e, cfg.shortcut)) {
      if (!['Shift', 'Control', 'Alt', 'Meta'].includes(e.key) && ui.fabVisible()) ui.hideFab();
      if (e.key === 'Escape') ui.closeCard();
      return;
    }
    if (!active()) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    flip('shortcut');
  }, true);

  on(document, 'selectionchange', scheduleFab);
  on(document, 'select', scheduleFab, true);
  on(document, 'keyup', (e) => { if (!ui.inUi(e)) scheduleFab(); }, true);
  on(document, 'mouseup', (e) => {
    if (ui.inUi(e)) return;
    pointer = { x: e.clientX, y: e.clientY, at: Date.now() };
    scheduleFab();
  }, true);
  on(document, 'mousedown', (e) => { if (!ui.inUi(e)) ui.closeCard(); }, true);
  on(window, 'scroll', () => ui.hideFab(), { capture: true, passive: true });
  on(window, 'resize', () => ui.hideFab(), { passive: true });
  on(window, 'blur', () => ui.hideFab());

  function onMessage(msg, sender, sendResponse) {
    if (msg && msg.type === 'keyflip:host') {
      if (window === window.top) sendResponse({ host: location.hostname || location.protocol.replace(':', '') });
      return undefined;
    }
    if (!msg || msg.type !== 'keyflip:flip') return undefined;
    if (msg.requireFocus && !document.hasFocus()) return undefined;
    flip(msg.source || 'message').then((ok) => sendResponse({ ok }));
    return true;
  }
  if (alive()) {
    chrome.runtime.onMessage.addListener(onMessage);
    cleanups.push(() => { try { chrome.runtime.onMessage.removeListener(onMessage); } catch (e) { /* gone */ } });
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    clearTimeout(fabTimer);
    cleanups.splice(0).forEach((fn) => { try { fn(); } catch (e) { /* ignore */ } });
    ui.destroy();
    if (root.__keyflipInstance === api) root.__keyflipInstance = null;
  }

  const api = { flip, destroy, get settings() { return cfg; } };
  root.__keyflipInstance = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
