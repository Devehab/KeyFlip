(function () {
  'use strict';
  const KF = globalThis.KeyFlip;
  const P = KF.page;
  const { $, t } = P;
  const { stats: Stats } = KF;

  let host = null;

  async function currentHost() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = new URL(tab && tab.url ? tab.url : '');
      return /^(https?|file):$/.test(url.protocol) ? (url.hostname || 'file') : null;
    } catch (e) {
      return null;
    }
  }

  function render(ctx) {
    const { cfg, stats } = ctx;
    const siteOff = host && cfg.disabledSites.includes(host);
    const on = cfg.enabled && !siteOff;
    $('.hero').classList.toggle('off', !on);
    $('#enabled-label').textContent = cfg.enabled ? t('popupEnabled') : t('popupDisabled');
    $('#site-label').textContent = host ? t(on ? 'popupSiteOn' : 'popupSiteOff', { site: host }) : t('popupNoSite');
    $('#status-line').textContent = t('taglineShort');
    $('#status-line').title = t('tagline');
    $('#site-row').hidden = !host || !cfg.enabled;
    $('#site-enabled').checked = !siteOff;
    $('#combo').innerHTML = P.shortcutHtml();
    document.querySelectorAll('.mac-only').forEach((el) => { el.hidden = ctx.os !== 'mac'; });

    P.bindSwitch($('#enabled'), 'enabled');
    P.bindSeg($('#lang'), 'uiLanguage');
    $('#lang').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === ctx.lang)));
    P.bindPair($('#layout-a'), $('#layout-b'), $('#swap'), null, true);

    P.renderKpis($('#kpis'), stats);
    const streak = Stats.streak(stats);
    $('#streak').hidden = streak < 2;
    $('#streak').textContent = '🔥 ' + t('streakDays', { n: streak });
    updateQuick();
  }

  function updateQuick() {
    const out = $('#quick-text');
    const res = P.quickFlip($('#quick-in').value);
    $('#quick-copy').hidden = !res;
    out.classList.toggle('has', !!res);
    out.textContent = res ? res.text : t('popupQuickEmpty');
  }

  async function main() {
    host = await currentHost();
    await P.init(render);

    $('#site-enabled').addEventListener('change', async (e) => {
      const list = P.ctx.cfg.disabledSites.filter((h) => h !== host);
      if (!e.target.checked) list.push(host);
      await P.save({ disabledSites: list });
      render(P.ctx);
    });
    $('#quick-in').addEventListener('input', updateQuick);
    $('#quick-copy').addEventListener('click', async () => {
      if (await P.copy($('#quick-text').textContent)) P.toast(t('copied'));
    });
    const openOptions = (hash) => (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: chrome.runtime.getURL('src/ui/options/options.html' + (hash || '')) });
      window.close();
    };
    $('#open-options').addEventListener('click', openOptions(''));
    $('#open-settings').addEventListener('click', openOptions(''));
    $('#open-stats').addEventListener('click', openOptions('#stats'));
  }

  main();
})();
