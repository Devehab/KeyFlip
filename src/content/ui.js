// In-page UI (floating button, toast, ambiguity chooser, read card).
// Everything lives in one shadow root so page styles can't leak in or out.
(function (root) {
  'use strict';
  const KF = root.KeyFlip;

  const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h11l-3.2-3.2M17 17H6l3.2 3.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.8 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 2.9 1.1-6.3-4.6-4.4 6.3-.9L12 2.8Z"/></svg>';

  const CSS = `
:host { all: initial; }
.kf { position: fixed; inset: 0 auto auto 0; width: 0; height: 0; z-index: 2147483647;
  font: 500 13px/1.45 system-ui, -apple-system, "Segoe UI", "SF Pro Text", Tahoma, "Noto Sans Arabic", "Noto Sans", sans-serif;
  --bg: #ffffff; --fg: #17152b; --muted: #6b6884; --line: rgba(23, 21, 43, .10);
  --chip: #f3f1ff; --chip-fg: #3b2bb8; --accent: #6c47ff; --accent-2: #19c3e6;
  --grad: linear-gradient(135deg, #6c47ff 0%, #8b5cf6 45%, #19c3e6 100%);
  --shadow: 0 18px 48px -12px rgba(40, 24, 120, .35), 0 4px 14px rgba(23, 21, 43, .10);
  color: var(--fg); -webkit-font-smoothing: antialiased; }
.kf[data-theme="dark"] { --bg: #1b1930; --fg: #f2f0ff; --muted: #a29fc2; --line: rgba(255, 255, 255, .10);
  --chip: #2a2650; --chip-fg: #d2c8ff; --shadow: 0 18px 48px -12px rgba(0, 0, 0, .6), 0 4px 14px rgba(0, 0, 0, .35); }
* { box-sizing: border-box; }
button { font: inherit; color: inherit; cursor: pointer; border: 0; background: none; }
svg { width: 16px; height: 16px; flex: none; }

.fab { position: fixed; display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px 0 10px;
  border-radius: 999px; background: var(--bg); box-shadow: var(--shadow); border: 1px solid var(--line);
  opacity: 0; transform: translateY(6px) scale(.92); transition: opacity .16s ease, transform .18s cubic-bezier(.2, .9, .3, 1.3);
  pointer-events: none; white-space: nowrap; }
.fab.show { opacity: 1; transform: none; pointer-events: auto; }
.fab:hover { border-color: transparent; background: linear-gradient(var(--bg), var(--bg)) padding-box, var(--grad) border-box; border: 1px solid transparent; }
.fab .ic { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: var(--grad); color: #fff; }
.fab .ic svg { width: 14px; height: 14px; }
.fab .lbl { font-weight: 700; }
.fab .dir { color: var(--muted); font-weight: 600; font-size: 12px; direction: ltr; unicode-bidi: isolate; }
.tip { position: fixed; max-width: 320px; padding: 8px 12px; border-radius: 12px; background: var(--fg); color: var(--bg);
  font-size: 13px; line-height: 1.5; box-shadow: var(--shadow); opacity: 0; transform: translateY(4px);
  transition: opacity .14s ease, transform .14s ease; pointer-events: none; unicode-bidi: plaintext; overflow-wrap: anywhere; }
.tip.show { opacity: 1; transform: none; }

.toast { position: fixed; left: 50%; bottom: 28px; transform: translate(-50%, 16px); display: flex; align-items: center; gap: 10px;
  padding: 10px 16px 10px 12px; border-radius: 14px; background: #17152b; color: #fff; box-shadow: var(--shadow);
  opacity: 0; transition: opacity .2s ease, transform .25s cubic-bezier(.2, .9, .3, 1.2); pointer-events: none; }
.toast.show { opacity: 1; transform: translate(-50%, 0); }
.toast .ic { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 8px; background: var(--grad); }
.toast small { color: #b9b5d6; font-weight: 500; margin-inline-start: 4px; }
.toast .act { pointer-events: auto; display: inline-flex; align-items: center; gap: 6px; height: 28px; margin-inline-start: 6px; padding: 0 11px;
  border: 0; border-radius: 9px; background: #fff; color: #17152b; font: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer; }
.toast .act:hover { background: #efebff; }
.toast:not(.show) .act { pointer-events: none; }
.toast .act svg { width: 14px; height: 14px; color: #f2a000; }

.overlay { position: fixed; inset: 0; width: 100vw; height: 100vh; display: grid; place-items: center; padding: 16px;
  background: rgba(16, 12, 40, .38); backdrop-filter: blur(6px); animation: fade .16s ease; }
@keyframes fade { from { opacity: 0; } }
@keyframes pop { from { opacity: 0; transform: translateY(10px) scale(.97); } }
.dialog { width: min(460px, 100%); max-height: min(560px, calc(100vh - 32px)); display: flex; flex-direction: column;
  background: var(--bg); border-radius: 20px; box-shadow: var(--shadow); border: 1px solid var(--line); overflow: hidden;
  animation: pop .22s cubic-bezier(.2, .9, .3, 1.2); }
.dh { display: flex; gap: 12px; padding: 18px 20px 12px; }
.dh .ic { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 12px; background: var(--grad); color: #fff; flex: none; }
.dh h2 { margin: 0; font-size: 16px; font-weight: 750; letter-spacing: -.01em; }
.dh p { margin: 2px 0 0; color: var(--muted); font-size: 12.5px; }
.rows { padding: 4px 20px 8px; overflow: auto; display: grid; gap: 10px; }
.row { display: grid; gap: 8px; padding: 12px; border-radius: 14px; border: 1px solid var(--line); }
.row.active { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(108, 71, 255, .15); }
.src { font: 600 12px/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: var(--muted); unicode-bidi: plaintext; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 12px; background: var(--chip);
  color: var(--chip-fg); font-size: 15px; font-weight: 700; border: 2px solid transparent; unicode-bidi: plaintext; }
.chip .k { font: 700 10px/1 ui-monospace, monospace; padding: 3px 5px; border-radius: 5px; background: var(--bg); color: var(--muted); }
.chip[aria-pressed="true"] { border-color: var(--accent); background: var(--bg); }
.chip.focus { outline: 2px dashed var(--accent-2); outline-offset: 2px; }
.preview { margin: 4px 20px 0; padding: 10px 12px; border-radius: 12px; background: var(--chip); color: var(--fg);
  font-size: 13px; max-height: 84px; overflow: auto; unicode-bidi: plaintext; overflow-wrap: anywhere; }
.preview b { display: block; font-size: 11px; color: var(--muted); font-weight: 700; margin-bottom: 2px; }
.df { display: flex; align-items: center; gap: 8px; padding: 14px 20px 18px; }
.df .hint { flex: 1; color: var(--muted); font-size: 11.5px; }
.btn { height: 36px; padding: 0 16px; border-radius: 11px; font-weight: 700; }
.btn.ghost { color: var(--muted); }
.btn.ghost:hover { background: var(--chip); }
.btn.primary { color: #fff; background: var(--grad); box-shadow: 0 6px 16px -6px rgba(108, 71, 255, .7); }

.card { position: fixed; width: min(360px, calc(100vw - 24px)); background: var(--bg); border-radius: 16px; box-shadow: var(--shadow);
  border: 1px solid var(--line); animation: pop .2s ease; overflow: hidden; }
.card header { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--line); }
.card header .ic { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 7px; background: var(--grad); color: #fff; }
.card header .ic svg { width: 13px; height: 13px; }
.card header b { flex: 1; font-size: 12.5px; }
.card header .dir { color: var(--muted); font-size: 12px; direction: ltr; unicode-bidi: isolate; }
.card .body { padding: 12px 14px; font-size: 15px; line-height: 1.6; max-height: 200px; overflow: auto; unicode-bidi: plaintext; overflow-wrap: anywhere; }
.card footer { display: flex; justify-content: flex-end; gap: 6px; padding: 0 10px 10px; }
.card .btn { height: 32px; padding: 0 12px; font-size: 12.5px; }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
`;

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function create() {
    let host = null;
    let shadow = null;
    let layer = null;
    let fab = null;
    let tip = null;
    let toastEl = null;
    let toastTimer = null;
    let card = null;
    let dialog = null;
    let state = { lang: 'en', theme: 'light', vars: {} };
    let onFab = null;

    const t = (key, vars) => KF.i18n.t(state.lang, key, Object.assign({}, state.vars, vars));

    function ensure() {
      if (host && host.isConnected) return;
      host = document.createElement('keyflip-ui');
      host.setAttribute('data-keyflip', '');
      shadow = host.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = CSS;
      layer = el('div', 'kf');
      shadow.append(style, layer);
      (document.documentElement || document.body).appendChild(host);
      fab = null; tip = null; toastEl = null; card = null;
      applyState();
    }

    function applyState() {
      if (!layer) return;
      layer.setAttribute('data-theme', state.theme);
      layer.setAttribute('dir', KF.i18n.dir(state.lang));
      layer.setAttribute('lang', state.lang);
    }

    function setState(next) {
      state = Object.assign({}, state, next);
      applyState();
    }

    function contains(node) {
      return !!host && (node === host || (node && host.contains(node)));
    }

    function inUi(event) {
      return !!host && typeof event.composedPath === 'function' && event.composedPath().includes(host);
    }

    function clampX(x, w) {
      return Math.max(8, Math.min(x, window.innerWidth - w - 8));
    }

    // anchor: { x, y, bottom, align: 'start' | 'end' | 'center' }
    function place(node, anchor, gap, below) {
      const w = node.offsetWidth;
      const h = node.offsetHeight;
      let x = anchor.x;
      if (anchor.align === 'end') x -= w;
      else if (anchor.align === 'center') x -= w / 2;
      const under = (anchor.bottom || anchor.y) + gap;
      let y = below ? under : anchor.y - h - gap;
      if (below && y + h > window.innerHeight - 8) y = anchor.y - h - gap;
      if (!below && y < 8) y = under;
      node.style.left = clampX(x, w) + 'px';
      node.style.top = Math.max(8, Math.min(y, window.innerHeight - h - 8)) + 'px';
    }

    function showFab(anchor, info) {
      ensure();
      if (!fab) {
        fab = el('button', 'fab', `<span class="ic">${ICON}</span><span class="lbl"></span><span class="dir"></span>`);
        fab.type = 'button';
        fab.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); });
        fab.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); if (onFab) onFab(); });
        fab.addEventListener('mouseenter', () => tip && tip.textContent && tip.classList.add('show'));
        fab.addEventListener('mouseleave', () => tip && tip.classList.remove('show'));
        tip = el('div', 'tip');
        layer.append(fab, tip);
      }
      fab.querySelector('.lbl').textContent = t('fabFlip');
      fab.querySelector('.dir').textContent = `${KF.layouts.badge(info.from)} → ${KF.layouts.badge(info.to)}`;
      fab.title = t('fabTitle');
      fab.setAttribute('aria-label', t('fabTitle'));
      tip.textContent = info.preview.length > 140 ? info.preview.slice(0, 140) + '…' : info.preview;
      place(fab, anchor, 10);
      tip.style.left = fab.style.left;
      tip.style.top = (parseFloat(fab.style.top) + fab.offsetHeight + 8) + 'px';
      requestAnimationFrame(() => fab && fab.classList.add('show'));
    }

    function hideFab() {
      if (fab) fab.classList.remove('show');
      if (tip) tip.classList.remove('show');
    }

    function fabVisible() {
      return !!fab && fab.classList.contains('show');
    }

    // A hidden bubble keeps no clickable button behind.
    function hideToast() {
      if (!toastEl) return;
      toastEl.classList.remove('show');
      const act = toastEl.querySelector('.act');
      if (act) act.remove();
    }

    // `action` ({ label, onClick }) adds one button and keeps the bubble longer.
    function toast(message, sub, action) {
      ensure();
      if (!toastEl) {
        toastEl = el('div', 'toast');
        toastEl.setAttribute('role', 'status');
        toastEl.setAttribute('aria-live', 'polite');
        layer.append(toastEl);
      }
      toastEl.innerHTML = `<span class="ic">${ICON}</span><span></span>`;
      toastEl.lastChild.textContent = message;
      if (sub) {
        const s = document.createElement('small');
        s.textContent = sub;
        toastEl.lastChild.append(s);
      }
      if (action) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'act';
        b.innerHTML = STAR;
        b.append(action.label);
        b.addEventListener('click', () => {
          hideToast();
          action.onClick();
        });
        toastEl.append(b);
      }
      clearTimeout(toastTimer);
      requestAnimationFrame(() => toastEl.classList.add('show'));
      toastTimer = setTimeout(hideToast, action ? 7000 : 2400);
    }

    function closeCard() {
      if (card) { card.remove(); card = null; }
    }

    function showCard(anchor, info) {
      ensure();
      closeCard();
      card = el('div', 'card');
      card.setAttribute('role', 'dialog');
      card.innerHTML = `<header><span class="ic">${ICON}</span><b></b><span class="dir"></span></header>
        <div class="body"></div><footer><button class="btn ghost" data-a="close"></button><button class="btn primary" data-a="copy"></button></footer>`;
      card.querySelector('b').textContent = t('cardTitle');
      card.querySelector('.dir').textContent = `${KF.layouts.badge(info.from)} → ${KF.layouts.badge(info.to)}`;
      card.querySelector('.body').textContent = info.text;
      const copyBtn = card.querySelector('[data-a="copy"]');
      copyBtn.textContent = t('copy');
      card.querySelector('[data-a="close"]').textContent = t('close');
      card.addEventListener('mousedown', (e) => e.stopPropagation());
      card.addEventListener('click', async (e) => {
        const a = e.target.closest('[data-a]');
        if (!a) return;
        if (a.dataset.a === 'close') return closeCard();
        try {
          await navigator.clipboard.writeText(info.text);
          copyBtn.textContent = t('copied');
          setTimeout(closeCard, 900);
        } catch (err) {
          const range = document.createRange();
          range.selectNodeContents(card.querySelector('.body'));
          const sel = getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      });
      layer.append(card);
      place(card, Object.assign({}, anchor, { align: 'center' }), 10, true);
    }

    // Resolves to { [segmentIndex]: optionIndex } or null when cancelled.
    // Focus stays in the page's editor; keys are captured while open.
    function choose(words, initial, preview) {
      ensure();
      closeDialog();
      return new Promise((resolve) => {
        const picks = words.map((w, i) => initial[i] || 0);
        let row = 0;
        const overlay = el('div', 'overlay');
        const box = el('div', 'dialog');
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-modal', 'true');
        box.innerHTML = `<div class="dh"><span class="ic">${ICON}</span><div><h2></h2><p></p></div></div>
          <div class="rows"></div><div class="preview"><b></b><span></span></div>
          <div class="df"><span class="hint"></span><button class="btn ghost" data-a="cancel"></button><button class="btn primary" data-a="apply"></button></div>`;
        box.querySelector('h2').textContent = t('dlgTitle');
        box.querySelector('.dh p').textContent = t('dlgSubtitle');
        box.querySelector('.preview b').textContent = t('dlgPreview');
        box.querySelector('.hint').textContent = t('dlgHint');
        box.querySelector('[data-a="cancel"]').textContent = t('cancel');
        box.querySelector('[data-a="apply"]').textContent = t('dlgApply');
        const rows = box.querySelector('.rows');
        words.forEach((w, i) => {
          const r = el('div', 'row');
          r.dataset.row = i;
          const src = el('div', 'src');
          src.textContent = w.source;
          const chips = el('div', 'chips');
          w.candidates.forEach((c, j) => {
            const b = el('button', 'chip');
            b.type = 'button';
            b.dataset.row = i;
            b.dataset.opt = j;
            b.innerHTML = '<span class="k"></span><span class="v"></span>';
            b.querySelector('.k').textContent = String(j + 1);
            b.querySelector('.v').textContent = c.text;
            chips.append(b);
          });
          r.append(src, chips);
          rows.append(r);
        });

        function render() {
          box.querySelectorAll('.row').forEach((r) => r.classList.toggle('active', +r.dataset.row === row));
          box.querySelectorAll('.chip').forEach((b) => {
            const on = picks[+b.dataset.row] === +b.dataset.opt;
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
            b.classList.toggle('focus', on && +b.dataset.row === row);
          });
          const text = preview(picks);
          box.querySelector('.preview span').textContent = text.length > 280 ? text.slice(0, 280) + '…' : text;
        }

        function finish(value) {
          window.removeEventListener('keydown', onKey, true);
          closeDialog();
          resolve(value);
        }

        function onKey(e) {
          const k = e.key;
          const handled = ['Escape', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(k) || /^[1-9]$/.test(k);
          if (!handled) return;
          e.preventDefault();
          e.stopImmediatePropagation();
          const n = words[row].candidates.length;
          if (k === 'Escape') return finish(null);
          if (k === 'Enter') return finish(picks);
          if (k === 'ArrowUp' || (k === 'Tab' && e.shiftKey)) row = (row - 1 + words.length) % words.length;
          else if (k === 'ArrowDown' || k === 'Tab') row = (row + 1) % words.length;
          else if (k === 'ArrowLeft' || k === 'ArrowRight') {
            const forward = (k === 'ArrowRight') !== (state.lang === 'ar');
            picks[row] = (picks[row] + (forward ? 1 : n - 1)) % n;
          } else {
            const j = +k - 1;
            if (j < n) {
              picks[row] = j;
              if (words.length === 1) return finish(picks);
              row = Math.min(row + 1, words.length - 1);
            }
          }
          render();
        }

        box.addEventListener('mousedown', (e) => { if (e.target.closest('button')) e.preventDefault(); });
        box.addEventListener('click', (e) => {
          const chip = e.target.closest('.chip');
          if (chip) {
            row = +chip.dataset.row;
            picks[row] = +chip.dataset.opt;
            if (words.length === 1) return finish(picks);
            render();
            return;
          }
          const a = e.target.closest('[data-a]');
          if (a) finish(a.dataset.a === 'apply' ? picks : null);
        });
        overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) { e.preventDefault(); finish(null); } });
        overlay.append(box);
        layer.append(overlay);
        dialog = overlay;
        window.addEventListener('keydown', onKey, true);
        render();
      });
    }

    function closeDialog() {
      if (dialog) { dialog.remove(); dialog = null; }
    }

    function destroy() {
      clearTimeout(toastTimer);
      if (host) host.remove();
      host = null;
    }

    return {
      setState, showFab, hideFab, fabVisible, toast, showCard, closeCard, choose, contains, inUi, destroy,
      set onFab(fn) { onFab = fn; },
    };
  }

  KF.ui = { create };
})(typeof globalThis !== 'undefined' ? globalThis : this);
