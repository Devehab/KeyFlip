// Shared helpers for the popup, options and welcome pages.
(function (root) {
  'use strict';
  const KF = root.KeyFlip;
  const { settings: Settings, stats: Stats, i18n, layouts, shortcut: Shortcut, platform, converter, dictionary } = KF;

  const ICONS = {
    swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h12l-4-4M17 17H5l4 4"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="3"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    keyboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M10 13h4M7 16h10"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.8 3h3.1l-6.8 7.8 8 10.2h-6.3l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.8 3h6.4l4.4 5.9L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.4V9h3.4v1.6c.5-.9 1.6-1.8 3.4-1.8 3.6 0 4.2 2.4 4.2 5.4v6.3ZM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2ZM7.1 20.5H3.5V9h3.6v11.5ZM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6c0 .9.8 1.7 1.8 1.7h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0Z"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>',
  };

  // Set once the extension has a public Chrome Web Store page.
  const STORE_URL = '';

  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => [...(el || document).querySelectorAll(sel)];

  function hydrateIcons(rootEl) {
    $$('[data-icon]', rootEl).forEach((el) => {
      const svg = ICONS[el.getAttribute('data-icon')];
      if (svg && !el.querySelector('svg')) el.insertAdjacentHTML('afterbegin', svg);
    });
  }

  const ctx = { cfg: Settings.sanitize(), lang: 'en', os: platform.detectOS(), stats: Stats.empty() };

  function t(key, vars) {
    return i18n.t(ctx.lang, key, Object.assign({
      shortcut: Shortcut.format(ctx.cfg.shortcut, ctx.os),
      default: Shortcut.format(Shortcut.DEFAULT, ctx.os),
      undo: Shortcut.undo(ctx.os),
    }, vars));
  }

  function applyChrome() {
    ctx.lang = i18n.resolve(ctx.cfg.uiLanguage);
    document.documentElement.setAttribute('data-theme', Settings.resolveTheme(ctx.cfg.theme));
    i18n.apply(document, ctx.lang, {
      shortcut: Shortcut.format(ctx.cfg.shortcut, ctx.os),
      default: Shortcut.format(Shortcut.DEFAULT, ctx.os),
      undo: Shortcut.undo(ctx.os),
    });
    document.documentElement.setAttribute('data-os', ctx.os);
  }

  // Loads state, renders, and re-renders on any settings/stats change.
  async function init(render) {
    hydrateIcons(document);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const got = await chrome.storage.local.get([Settings.KEY, Settings.STATS_KEY]);
      ctx.cfg = Settings.sanitize(got[Settings.KEY]);
      ctx.stats = Stats.sanitize(got[Settings.STATS_KEY]);
      if (ctx.cfg.os) ctx.os = ctx.cfg.os;
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local') return;
        if (changes[Settings.KEY]) ctx.cfg = Settings.sanitize(changes[Settings.KEY].newValue);
        if (changes[Settings.STATS_KEY]) ctx.stats = Stats.sanitize(changes[Settings.STATS_KEY].newValue);
        if (changes[Settings.KEY] || changes[Settings.STATS_KEY]) { applyChrome(); render(ctx, changes); }
      });
    }
    if (typeof matchMedia === 'function') {
      matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyChrome());
    }
    applyChrome();
    render(ctx, null);
    document.documentElement.classList.add('ready');
    return ctx;
  }

  async function save(patch) {
    ctx.cfg = Settings.sanitize(Object.assign({}, ctx.cfg, patch));
    await Settings.save(patch);
    return ctx.cfg;
  }

  let toastTimer = null;
  function toast(message) {
    let el = $('.page-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'page-toast';
      el.setAttribute('role', 'status');
      document.body.append(el);
    }
    el.innerHTML = ICONS.check;
    el.append(document.createTextNode(message));
    el.querySelector('svg').style.cssText = 'width:16px;height:16px;color:#3ccf7f';
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
  }

  // ---------- form bindings ----------

  function bindSwitch(input, key, after) {
    input.checked = !!ctx.cfg[key];
    if (input.dataset.bound) return;
    input.dataset.bound = '1';
    input.addEventListener('change', async () => {
      await save({ [key]: input.checked });
      toast(t('saved'));
      if (after) after(input.checked);
    });
  }

  function bindSeg(container, key, after) {
    $$('button', container).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === String(ctx.cfg[key]))));
    if (container.dataset.bound) return;
    container.dataset.bound = '1';
    container.addEventListener('click', async (e) => {
      const b = e.target.closest('button[data-value]');
      if (!b) return;
      await save({ [key]: b.dataset.value });
      $$('button', container).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      if (after) after(b.dataset.value);
    });
  }

  function fillLayoutSelect(select, value, short) {
    const os = ctx.os === 'mac' ? 'mac' : 'pc';
    select.textContent = '';
    for (const g of layouts.grouped()) {
      const og = document.createElement('optgroup');
      og.label = ctx.lang === 'ar' ? g.meta.ar : `${g.meta.en} · ${g.meta.native}`;
      for (const item of g.items) {
        const o = document.createElement('option');
        o.value = item.id;
        const mark = item.platform === os ? ' ★' : '';
        o.textContent = layouts.name(item.id, ctx.lang, short) + mark;
        og.append(o);
      }
      select.append(og);
    }
    select.value = value;
  }

  // Two selects + swap button that keep layoutA/layoutB in sync.
  function bindPair(selA, selB, swapBtn, after, short) {
    fillLayoutSelect(selA, ctx.cfg.layoutA, short);
    fillLayoutSelect(selB, ctx.cfg.layoutB, short);
    if (selA.dataset.bound) return;
    selA.dataset.bound = '1';
    const commit = async (a, b) => {
      if (a === b) b = a === 'en-us' ? (ctx.os === 'mac' ? 'ar-mac' : 'ar-101') : 'en-us';
      await save({ layoutA: a, layoutB: b });
      selA.value = ctx.cfg.layoutA;
      selB.value = ctx.cfg.layoutB;
      toast(t('saved'));
      if (after) after();
    };
    selA.addEventListener('change', () => commit(selA.value, selB.value));
    selB.addEventListener('change', () => commit(selA.value, selB.value));
    if (swapBtn) swapBtn.addEventListener('click', () => commit(selB.value, selA.value));
  }

  // ---------- visual pieces ----------

  function shortcutHtml(sc) {
    return Shortcut.parts(sc || ctx.cfg.shortcut, ctx.os)
      .map((p) => `<span class="kbd">${escapeHtml(p)}</span>`).join('<i>+</i>');
  }

  function selectAllHtml() {
    return Shortcut.selectAll(ctx.os).split(' + ').map((p) => `<span class="kbd">${escapeHtml(p)}</span>`).join('<i>+</i>');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function renderKeyboard(container, idA, idB, shift) {
    const a = layouts.get(idA);
    const b = layouts.get(idB);
    const level = shift ? 1 : 0;
    const pick = (l, code) => {
      const p = l.keys[code];
      if (!p) return '';
      return p[level] != null ? p[level] : p[0];
    };
    container.textContent = '';
    container.classList.add('keyboard');
    for (const row of layouts.ROWS) {
      const r = document.createElement('div');
      r.className = 'kb-row';
      for (const code of row) {
        const k = document.createElement('div');
        k.className = 'kb-key';
        const ca = pick(a, code);
        const cb = pick(b, code);
        if (ca === cb) k.classList.add('same');
        k.title = `${ca}  ⇄  ${cb}`;
        const sa = document.createElement('span');
        sa.className = 'a';
        sa.textContent = ca;
        const sb = document.createElement('span');
        sb.className = 'b';
        sb.textContent = cb;
        k.append(sa, sb);
        r.append(k);
      }
      container.append(r);
    }
  }

  function renderKpis(container, s) {
    const n = (v) => i18n.fmt(ctx.lang, v);
    container.innerHTML = `
      <div class="kpi hero"><b>${n(Stats.minutes(s))}</b><span>${escapeHtml(t('statMinutes'))}</span></div>
      <div class="kpi"><b>${n(s.flips)}</b><span>${escapeHtml(t('statFlips'))}</span></div>
      <div class="kpi"><b>${n(s.chars)}</b><span>${escapeHtml(t('statChars'))}</span></div>`;
  }

  // Minutes saved per day over the last two weeks.
  function renderChart(container, s) {
    const days = Stats.lastDays(s, 14);
    const max = Math.max(1, ...days.map((d) => d.seconds));
    const today = Stats.dayKey(Date.now());
    const wd = new Intl.DateTimeFormat(ctx.lang === 'ar' ? 'ar-u-nu-latn' : 'en', { weekday: 'narrow' });
    const full = new Intl.DateTimeFormat(ctx.lang === 'ar' ? 'ar-u-nu-latn' : 'en', { weekday: 'long', day: 'numeric', month: 'short' });
    container.className = 'chart';
    container.innerHTML = days.map((d) => {
      const h = Math.round((d.seconds / max) * 100);
      const cls = ['bar', d.flips ? 'has' : '', d.key === today ? 'today' : ''].join(' ');
      const tip = `${full.format(d.date)} · ${t('chartTip', { minutes: Math.round(d.seconds / 6) / 10, flips: d.flips })}`;
      return `<div class="${cls}" title="${escapeHtml(tip)}"><i style="height:${Math.max(4, h)}%"></i><small>${escapeHtml(wd.format(d.date))}</small></div>`;
    }).join('');
  }

  // ---------- sharing ----------

  function shareText(s) {
    const text = t('shareText', { minutes: Stats.minutes(s), flips: s.flips });
    return STORE_URL ? `${text}\n${STORE_URL}` : text;
  }

  function shareLinks(s) {
    const text = encodeURIComponent(shareText(s));
    return {
      x: `https://x.com/intent/post?text=${text}`,
      whatsapp: `https://wa.me/?text=${text}`,
      linkedin: STORE_URL ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(STORE_URL)}` : '',
    };
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  // 1200x630 card, drawn locally.
  async function shareCanvas(s) {
    await document.fonts.ready;
    const c = document.createElement('canvas');
    c.width = 1200;
    c.height = 630;
    const g = c.getContext('2d');
    const rtl = ctx.lang === 'ar';
    const grad = g.createLinearGradient(0, 0, 1200, 630);
    grad.addColorStop(0, '#7b4dff');
    grad.addColorStop(0.55, '#5e5bf6');
    grad.addColorStop(1, '#14c2e8');
    g.fillStyle = grad;
    g.fillRect(0, 0, 1200, 630);
    const glow = g.createRadialGradient(180, 60, 0, 180, 60, 700);
    glow.addColorStop(0, 'rgba(255,255,255,.28)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, 1200, 630);
    const logo = await loadImage(chrome.runtime.getURL('assets/logo/keyflip-logo-512.png'));
    const font = (w, px) => `${w} ${px}px "Readex Pro", system-ui, sans-serif`;
    g.direction = rtl ? 'rtl' : 'ltr';
    g.textAlign = rtl ? 'right' : 'left';
    const x0 = rtl ? 1120 : 80;
    g.drawImage(logo, rtl ? 1120 - 84 : 80, 64, 84, 84);
    g.fillStyle = '#fff';
    g.font = font(700, 40);
    g.fillText('KeyFlip', rtl ? 1120 - 104 : 184, 120);
    g.font = font(800, 150);
    g.fillText(i18n.fmt(ctx.lang, Stats.minutes(s)), x0, 330);
    g.font = font(500, 40);
    g.fillStyle = 'rgba(255,255,255,.9)';
    g.fillText(t('shareCardHeadline'), x0, 390);
    const boxY = 450;
    const items = [[s.flips, t('shareCardFlips')], [s.chars, t('shareCardChars')]];
    items.forEach(([v, label], i) => {
      const bx = rtl ? 1120 - 500 - i * 520 : 80 + i * 520;
      g.fillStyle = 'rgba(255,255,255,.16)';
      roundRect(g, bx, boxY, 500, 110, 26);
      g.fill();
      g.fillStyle = '#fff';
      g.font = font(700, 46);
      g.fillText(i18n.fmt(ctx.lang, v), rtl ? bx + 470 : bx + 30, boxY + 58);
      g.font = font(500, 24);
      g.fillStyle = 'rgba(255,255,255,.85)';
      g.fillText(label, rtl ? bx + 470 : bx + 30, boxY + 92);
    });
    return c;
  }

  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  async function downloadShareImage(s) {
    const c = await shareCanvas(s);
    const a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = 'keyflip-stats.png';
    a.click();
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { return false; }
  }

  // ---------- quick flip (no page needed) ----------

  function quickFlip(text) {
    if (!text.trim()) return null;
    const pair = converter.createPair(ctx.cfg.layoutA, ctx.cfg.layoutB);
    const r = converter.analyze(text, pair);
    const known = layouts.get(r.to).lang === 'en' ? dictionary.isWord : null;
    const picks = r.words.map((w) => converter.autoPick(w, known) || w.candidates[0]);
    return { text: r.render(converter.choicesFrom(picks)), from: r.from, to: r.to, changed: r.changed };
  }

  // ---------- website access ----------

  const ALL_SITES = { origins: ['<all_urls>'] };

  async function hasSiteAccess() {
    try { return await chrome.permissions.contains(ALL_SITES); } catch (e) { return true; }
  }

  // Shows `banner` when the user restricted KeyFlip's site access, with a
  // one-click fix (must run from a click, as permissions.request requires).
  async function bindAccessBanner(banner) {
    const refresh = async () => { banner.hidden = await hasSiteAccess(); };
    const btn = banner.querySelector('button');
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = '1';
      btn.addEventListener('click', async () => {
        try { await chrome.permissions.request(ALL_SITES); } catch (e) { /* dismissed */ }
        refresh();
      });
    }
    if (chrome.permissions && chrome.permissions.onAdded && !banner.dataset.listening) {
      banner.dataset.listening = '1';
      chrome.permissions.onAdded.addListener(refresh);
      chrome.permissions.onRemoved.addListener(refresh);
    }
    await refresh();
  }

  // ---------- layout detection ----------

  // Reads the keyboard layout that is active right now. Chrome exposes it through
  // the Keyboard Map API; typed keys are used to confirm it (and as a fallback).
  async function activeLayoutMap() {
    if (!navigator.keyboard || typeof navigator.keyboard.getLayoutMap !== 'function') return null;
    try {
      const map = await navigator.keyboard.getLayoutMap();
      const out = [];
      for (const code of layouts.CODES) {
        const key = map.get(code);
        if (key) out.push({ code, key, shift: false });
      }
      return out.length >= 20 ? out : null;
    } catch (e) {
      return null;
    }
  }

  function rankLayouts(samples) {
    const os = ctx.os === 'mac' ? 'mac' : 'pc';
    const pref = (id) => {
      const meta = layouts.CATALOG.find((l) => l.id === id);
      return meta.platform === os ? 2 : meta.platform === 'any' ? 1 : 0;
    };
    return layouts.matchKeystrokes(samples).sort((a, b) => b.score - a.score || pref(b.id) - pref(a.id));
  }

  function bindDetector(input, resultEl, useBtn, onUse) {
    let typed = [];
    let best = null;
    const show = (text, ok) => {
      resultEl.textContent = text;
      resultEl.classList.toggle('ok', !!ok);
    };
    async function update() {
      best = null;
      useBtn.hidden = true;
      if (!typed.length) return show('');
      const map = await activeLayoutMap();
      // Only the last few keys count, so switching keyboards mid-way just works.
      const recent = typed.slice(-4);
      // Trust the full map only when it agrees with what was actually typed.
      const agrees = map && recent.every((s) => s.shift || map.some((m) => m.code === s.code && m.key === s.key));
      const samples = agrees ? map : recent;
      if (!agrees && recent.length < 3) return show(t('detectNeedMore'));
      const top = rankLayouts(samples)[0];
      if (!top || top.score < 0.75) return show(t('detectNoMatch'));
      const name = layouts.name(top.id, ctx.lang);
      if (top.id === ctx.cfg.layoutA) return show(t('detectIsFirst', { name }));
      if (top.id === ctx.cfg.layoutB) return show(t('detectAlready', { name }), true);
      best = top.id;
      show(t('detectResult', { name }), true);
      useBtn.hidden = false;
    }
    input.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
      if (e.key === 'Backspace') { typed.pop(); update(); return; }
      if (!e.key || e.key.length > 2) return;
      typed.push({ code: e.code, key: e.key, shift: e.shiftKey });
      if (typed.length > 40) typed = typed.slice(-40);
      update();
    });
    input.addEventListener('input', () => { if (!input.value) { typed = []; update(); } });
    useBtn.addEventListener('click', async () => {
      if (!best) return;
      await save({ layoutB: best, layoutA: ctx.cfg.layoutA === best ? 'en-us' : ctx.cfg.layoutA });
      toast(t('saved'));
      useBtn.hidden = true;
      show(t('detectAlready', { name: layouts.name(best, ctx.lang) }), true);
      if (onUse) onUse(best);
    });
  }

  KF.page = {
    ICONS, STORE_URL, ctx, $, $$, t, init, save, toast, hydrateIcons, escapeHtml,
    bindSwitch, bindSeg, bindPair, fillLayoutSelect, shortcutHtml, selectAllHtml,
    renderKeyboard, renderKpis, renderChart,
    shareText, shareLinks, shareCanvas, downloadShareImage, copy, quickFlip, bindDetector,
    hasSiteAccess, bindAccessBanner,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
