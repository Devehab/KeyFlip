(function () {
  'use strict';
  const KF = globalThis.KeyFlip;
  const P = KF.page;
  const { $, $$, t } = P;
  const { converter, layouts, platform, shortcut: Shortcut } = KF;

  const LAST = 4;
  // A short sentence per language, typed "correctly" with layout B.
  const PHRASES = {
    ar: 'كيف حالك؟ هذه تجربة سريعة',
    fa: 'سلام، این یک آزمایش است',
    ur: 'یہ ایک تجربہ ہے',
    he: 'שלום, זה מבחן קצר',
    ru: 'привет, это быстрый тест',
    fr: 'bonjour, ceci est un test',
    de: 'hallo, das ist ein test',
    tr: 'merhaba, bu bir deneme',
    en: 'hello, this is a quick test',
  };

  let step = 0;
  let phrase = '';
  let celebrated = false;

  function show(n) {
    step = Math.max(0, Math.min(LAST, n));
    $$('.step').forEach((s) => { s.hidden = +s.dataset.step !== step; });
    $$('#dots li').forEach((d, i) => { d.className = i === step ? 'on' : i < step ? 'done' : ''; });
    $('#nav-row').hidden = step === 0 || step === LAST;
    $('#back').hidden = step <= 1;
    $('#skip').hidden = step === LAST;
    if (step === 3) prepareTry();
  }

  function prepareTry() {
    const { cfg } = P.ctx;
    const target = layouts.get(cfg.layoutB);
    phrase = PHRASES[target.lang] || PHRASES.en;
    const gibberish = converter.convert(phrase, cfg.layoutA, cfg.layoutB, { direction: 'backward' });
    const ta = $('#try');
    if (!ta.dataset.ready || ta.dataset.pair !== cfg.layoutA + '|' + cfg.layoutB) {
      ta.value = gibberish;
      ta.dataset.ready = '1';
      ta.dataset.pair = cfg.layoutA + '|' + cfg.layoutB;
      celebrated = false;
      $('#try-success').hidden = true;
      $('#try-status').hidden = false;
    }
    setTimeout(() => ta.focus(), 60);
  }

  function checkTry() {
    const norm = (s) => converter.normalize(s).trim();
    if (!celebrated && norm($('#try').value) === norm(phrase)) {
      celebrated = true;
      $('#try-success').hidden = false;
      $('#try-status').hidden = true;
      confetti();
      setTimeout(() => show(4), 1800);
    }
  }

  function render(ctx) {
    const os = ctx.os;
    $('#os-chip span:last-child').textContent = t('osDetected', { os: platform.label(os, ctx.lang) });
    P.bindPair($('#layout-a'), $('#layout-b'), $('#swap'), () => { $('#try').dataset.ready = ''; });
    const usesArabic = [ctx.cfg.layoutA, ctx.cfg.layoutB].some((id) => layouts.get(id).lang === 'ar');
    $('#mac-note').hidden = !usesArabic;
    $('#demo-mod').textContent = Shortcut.parts(ctx.cfg.shortcut, os).slice(0, -1).join(' + ') || 'Ctrl';
    $('#done-combo').innerHTML = P.shortcutHtml();
    const selectCombo = `<span class="combo">${P.selectAllHtml()}</span>`;
    $$('.mac-only').forEach((el) => { el.hidden = os !== 'mac'; });
    const body = P.escapeHtml(t('obTryBody', { select: '\u0001', shortcut: '\u0002' }))
      .replace('\u0001', selectCombo)
      .replace('\u0002', `<span class="combo">${P.shortcutHtml()}</span>`);
    $('#try-body').innerHTML = body;
    if (step === 3) prepareTry();
  }

  // Small celebratory burst, drawn on a canvas.
  function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = $('#confetti');
    const g = c.getContext('2d');
    c.width = innerWidth * devicePixelRatio;
    c.height = innerHeight * devicePixelRatio;
    g.scale(devicePixelRatio, devicePixelRatio);
    const colors = ['#7b4dff', '#5e5bf6', '#14c2e8', '#ffb547', '#ff5c8a', '#3ccf7f'];
    const parts = Array.from({ length: 140 }, () => ({
      x: innerWidth / 2, y: innerHeight / 2.4,
      vx: (Math.random() - 0.5) * 16, vy: Math.random() * -14 - 4,
      s: 5 + Math.random() * 6, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
      c: colors[(Math.random() * colors.length) | 0],
    }));
    const start = performance.now();
    (function frame(now) {
      g.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of parts) {
        p.vy += 0.42; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vx *= 0.99;
        g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66); g.restore();
      }
      if (now - start < 2600) requestAnimationFrame(frame); else g.clearRect(0, 0, innerWidth, innerHeight);
    })(start);
  }

  async function finish() {
    await P.save({ onboarded: true });
    window.close();
    setTimeout(() => { location.href = '../options/options.html'; }, 200);
  }

  async function main() {
    await P.init(render);
    P.bindAccessBanner($('#access-banner'));
    $$('.lang-card').forEach((b) => b.addEventListener('click', async () => {
      await P.save({ uiLanguage: b.dataset.lang });
      show(1);
    }));
    $('#next').addEventListener('click', () => show(step + 1));
    $('#back').addEventListener('click', () => show(step - 1));
    $('#skip').addEventListener('click', () => show(LAST));
    $('#finish').addEventListener('click', finish);
    $('#open-settings').addEventListener('click', () => P.save({ onboarded: true }));
    $('#try').addEventListener('input', checkTry);
    P.bindDetector($('#detect-input'), $('#detect-result'), $('#detect-use'));
    const hash = /#step=(\d)/.exec(location.hash);
    show(hash ? +hash[1] : 0);
  }

  main();
})();
