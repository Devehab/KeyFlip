(function () {
  'use strict';
  const KF = globalThis.KeyFlip;
  const P = KF.page;
  const { $, $$, t } = P;
  const { stats: Stats, shortcut: Shortcut, layouts, platform, settings: Settings } = KF;

  let recording = false;

  function renderKeyboards(ctx) {
    P.bindPair($('#layout-a'), $('#layout-b'), $('#swap'));
    P.renderKeyboard($('#keyboard'), ctx.cfg.layoutA, ctx.cfg.layoutB, $('#shift').checked);
    $('#legend-a').textContent = layouts.name(ctx.cfg.layoutA, ctx.lang);
    $('#legend-b').textContent = layouts.name(ctx.cfg.layoutB, ctx.lang);
    $('#os-chip span:last-child').textContent = t('osDetected', { os: platform.label(ctx.os, ctx.lang) });
    const usesArabic = [ctx.cfg.layoutA, ctx.cfg.layoutB].some((id) => layouts.get(id).lang === 'ar');
    $('#mac-note').hidden = !usesArabic;
  }

  function renderShortcut(ctx) {
    $('#recorder-combo').innerHTML = P.shortcutHtml();
    $('#side-combo').innerHTML = P.shortcutHtml();
    if (!recording) $('#recorder-hint').textContent = t('shortcutRecord');
    $('#shortcut-desc').textContent = t(ctx.os === 'mac' ? 'shortcutDescMac' : 'shortcutDesc');
    $('#shortcut-reset').hidden = Shortcut.format(ctx.cfg.shortcut) === Shortcut.format(Shortcut.DEFAULT);
  }

  function renderSites(ctx) {
    const ul = $('#sites');
    ul.textContent = '';
    if (!ctx.cfg.disabledSites.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = t('sitesEmpty');
      ul.append(li);
      return;
    }
    for (const host of ctx.cfg.disabledSites) {
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.textContent = host;
      const btn = document.createElement('button');
      btn.className = 'btn btn-ghost btn-sm';
      btn.textContent = t('remove');
      btn.addEventListener('click', () => P.save({ disabledSites: P.ctx.cfg.disabledSites.filter((h) => h !== host) }));
      li.append(span, btn);
      ul.append(li);
    }
  }

  function renderStats(ctx) {
    const s = ctx.stats;
    P.renderKpis($('#kpis'), s);
    P.renderChart($('#chart'), s);
    $('#share-text').textContent = P.shareText(s);
    const links = P.shareLinks(s);
    $('#share-x').href = links.x;
    $('#share-wa').href = links.whatsapp;
    $('#share-li').hidden = !links.linkedin;
    if (links.linkedin) $('#share-li').href = links.linkedin;
    P.shareCanvas(s).then((c) => {
      const g = $('#share-preview').getContext('2d');
      g.clearRect(0, 0, 1200, 630);
      g.drawImage(c, 0, 0);
    });
    $('#wpm').value = ctx.cfg.typingWpm;
    $('#wpm-desc').textContent = t('wpmDesc', { wpm: ctx.cfg.typingWpm });
  }

  function render(ctx) {
    P.bindSwitch($('#enabled'), 'enabled');
    P.bindSeg($('#ui-language'), 'uiLanguage');
    P.bindSeg($('#theme'), 'theme');
    for (const key of ['showFab', 'fabOnReadOnly', 'contextMenu', 'showToast']) P.bindSwitch($('#' + key), key);
    P.bindSeg($('#noSelection'), 'noSelection');
    $$('#ambiguity .opt').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.value === ctx.cfg.ambiguity)));
    $$('#ambiguity .opt').forEach((b) => b.setAttribute('role', 'radio'));
    renderKeyboards(ctx);
    renderShortcut(ctx);
    renderSites(ctx);
    renderStats(ctx);
    $('#version').textContent = chrome.runtime.getManifest().version;
  }

  function setupNav() {
    const links = $$('#nav a');
    const mark = () => {
      let current = links[0];
      for (const a of links) {
        const sec = $(a.getAttribute('href'));
        if (sec && sec.getBoundingClientRect().top < 160) current = a;
      }
      links.forEach((a) => a.classList.toggle('active', a === current));
    };
    document.addEventListener('scroll', mark, { passive: true });
    mark();
  }

  function setupRecorder() {
    const rec = $('#recorder');
    const warn = $('#shortcut-warn');
    const stop = () => {
      recording = false;
      rec.classList.remove('recording');
      $('#recorder-hint').textContent = t('shortcutRecord');
    };
    rec.addEventListener('click', () => {
      recording = true;
      warn.hidden = true;
      rec.classList.add('recording');
      $('#recorder-hint').textContent = t('shortcutRecording');
    });
    rec.addEventListener('blur', stop);
    rec.addEventListener('keydown', async (e) => {
      if (!recording) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') return stop();
      if (/^(Control|Shift|Alt|Meta|OS)/.test(e.code)) return;
      const sc = Shortcut.fromEvent(e);
      if (!sc) { warn.textContent = t(P.ctx.os === 'mac' ? 'shortcutInvalidMac' : 'shortcutInvalid'); warn.hidden = false; return; }
      if (Shortcut.isReserved(sc)) { warn.textContent = t('shortcutReserved'); warn.hidden = false; return; }
      await P.save({ shortcut: sc });
      stop();
      P.toast(t('saved'));
    });
    $('#shortcut-reset').addEventListener('click', async () => {
      await P.save({ shortcut: Shortcut.DEFAULT });
      P.toast(t('saved'));
    });
  }

  async function main() {
    $('#shift').addEventListener('change', () => renderKeyboards(P.ctx));
    await P.init(render);
    P.bindAccessBanner($('#access-banner'));
    setupNav();
    setupRecorder();
    P.bindDetector($('#detect-input'), $('#detect-result'), $('#detect-use'));

    $('#ambiguity').addEventListener('click', async (e) => {
      const b = e.target.closest('.opt');
      if (!b) return;
      await P.save({ ambiguity: b.dataset.value });
      P.toast(t('saved'));
    });
    $('#wpm').addEventListener('input', (e) => { $('#wpm-desc').textContent = t('wpmDesc', { wpm: +e.target.value }); });
    $('#wpm').addEventListener('change', async (e) => { await P.save({ typingWpm: +e.target.value }); P.toast(t('saved')); });
    $('#share-copy').addEventListener('click', async () => { if (await P.copy(P.shareText(P.ctx.stats))) P.toast(t('copied')); });
    $('#share-image').addEventListener('click', () => P.downloadShareImage(P.ctx.stats));
    $('#reset-stats').addEventListener('click', async () => {
      if (!confirm(t('resetStatsConfirm'))) return;
      await chrome.storage.local.set({ [Settings.STATS_KEY]: Stats.empty() });
    });
    $('#reset-settings').addEventListener('click', async () => {
      if (!confirm(t('resetSettingsConfirm'))) return;
      const keep = { os: P.ctx.cfg.os, onboarded: true };
      await chrome.storage.local.set({ [Settings.KEY]: Settings.sanitize(Object.assign({}, layouts.defaultsFor(P.ctx.os), keep)) });
    });
    if (location.hash) {
      const target = $(location.hash);
      if (target) setTimeout(() => target.scrollIntoView(), 50);
    }
  }

  main();
})();
