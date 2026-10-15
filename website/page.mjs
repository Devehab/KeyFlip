// HTML for the landing page, the 404 page and the shared header/footer.
// Everything is rendered at build time; site.js only adds behaviour.
import { COPY } from './copy.mjs';

export const ICONS = {
  swap: '<path d="M7 4 3 8l4 4"/><path d="M3 8h14"/><path d="m17 20 4-4-4-4"/><path d="M21 16H7"/>',
  keyboard: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M10 13h4M8 16h8"/>',
  sparkles: '<path d="M12 3.5 13.9 8l4.6 1.9-4.6 1.9L12 16.3l-1.9-4.5L5.5 9.9 10.1 8z"/><path d="M19 15v4M17 17h4M5 3v3M3.5 4.5h3"/>',
  pointer: '<path d="m4 4 7.07 17 2.51-7.39L21 11.07z"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  type: '<rect x="2" y="6" width="20" height="12" rx="3"/><path d="M9 9v6M7.5 9h3M7.5 15h3M13 12h5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
  languages: '<path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  wifiOff: '<path d="m2 2 20 20"/><path d="M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 4.2-2.3M19 12.9a10 10 0 0 0-2.2-1.5M2 8.8a15 15 0 0 1 4.2-2.7M22 8.8A15 15 0 0 0 10.7 5M12 20h.01"/>',
  eyeOff: '<path d="M9.9 9.9a3 3 0 1 0 4.2 4.2"/><path d="M10.7 5.1A10.4 10.4 0 0 1 12 5c7 0 10 7 10 7a13 13 0 0 1-1.7 2.7M6.6 6.6A13.5 13.5 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="m2 2 20 20"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 16v-4M12 16V8M17 16v-7"/>',
  laptop: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/>',
};

export const icon = (name, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const COMBOS = { flip: ['Ctrl', 'Q'], undo: ['Ctrl', 'Z'] };
export const combo = (kind, cls = '') => {
  const [mod, key] = COMBOS[kind];
  return `<span class="combo ${cls}" data-combo="${kind}" dir="ltr"><kbd>${mod}</kbd><span class="plus">+</span><kbd>${key}</kbd></span>`;
};
const fill = (s) => s.replace(/\{shortcut\}/g, combo('flip')).replace(/\{undo\}/g, combo('undo'));

// ---------- shared chrome ----------

function head(ctx, { title, description, path, noindex, page = 'doc' }) {
  const { lang, site, root } = ctx;
  const url = site + path;
  const t = COPY[lang];
  return `<!doctype html>
<html lang="${lang}" dir="${t.dir}" data-page="${page}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="en" href="${site}${path.replace(/^ar\//, '')}">
<link rel="alternate" hreflang="ar" href="${site}ar/${path.replace(/^ar\//, '')}">
<link rel="alternate" hreflang="x-default" href="${site}${path.replace(/^ar\//, '')}">`}
<meta name="theme-color" content="#6a3dff">
<meta name="color-scheme" content="light dark">
<meta property="og:type" content="website">
<meta property="og:site_name" content="KeyFlip">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${site}assets/og-${lang}.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(t.ogAlt)}">
<meta property="og:locale" content="${lang === 'ar' ? 'ar_AR' : 'en_US'}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="${root}assets/logo.svg">
<link rel="icon" type="image/png" sizes="128x128" href="${root}assets/icon-128.png">
<link rel="apple-touch-icon" href="${root}assets/icon-180.png">
<link rel="preload" href="${root}assets/fonts/${lang === 'ar' ? 'cairo-arabic' : 'jakarta-latin'}.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${root}assets/site.css">
<script src="${root}assets/early.js"></script>
</head>`;
}

function header(ctx, { home = '' } = {}) {
  const { lang, root, other } = ctx;
  const t = COPY[lang];
  const ctaHref = `${home}#install`;
  return `<a class="skip" href="#main">${t.skip}</a>
<header class="nav" id="top">
  <div class="wrap nav-in">
    <a class="brand" href="${root}${lang === 'ar' ? 'ar/' : ''}" aria-label="KeyFlip"><img src="${root}assets/logo.svg" width="36" height="36" alt=""><span>KeyFlip</span></a>
    <nav class="nav-links" aria-label="${lang === 'ar' ? 'أقسام الصفحة' : 'Page sections'}">
      <a href="${home}#how">${t.nav.how}</a>
      <a href="${home}#try">${t.nav.try}</a>
      <a href="${home}#features">${t.nav.features}</a>
      <a href="${home}#faq">${t.nav.faq}</a>
    </nav>
    <div class="nav-tools">
      <a class="lang-switch" href="${other}" hreflang="${lang === 'ar' ? 'en' : 'ar'}" lang="${lang === 'ar' ? 'en' : 'ar'}" data-set-lang="${lang === 'ar' ? 'en' : 'ar'}" aria-label="${t.switchLangLabel}">${t.switchLang}</a>
      <button class="icon-btn theme-toggle" type="button" aria-label="${t.themeLabel}" title="${t.themeLabel}">${icon('moon', 'ic i-moon')}${icon('sun', 'ic i-sun')}</button>
      <a class="btn primary sm nav-cta" href="${ctaHref}">${ctx.storeUrl ? t.cta.store : t.cta.soon}</a>
    </div>
  </div>
</header>`;
}

function footer(ctx) {
  const { lang, root, repo } = ctx;
  const t = COPY[lang];
  const privacy = `${root}privacy/${lang === 'ar' ? '#ar' : ''}`;
  return `<footer class="foot">
  <div class="wrap foot-in">
    <div class="foot-brand"><img src="${root}assets/logo.svg" width="32" height="32" alt=""><div><b>KeyFlip</b><p>${t.footer.tagline}</p></div></div>
    <nav class="foot-links" aria-label="${lang === 'ar' ? 'روابط' : 'Links'}">
      <a href="${privacy}">${t.footer.privacy}</a>
      <a href="${repo}/issues">${t.footer.support}</a>
      <a href="${repo}">${t.footer.source}</a>
      <a href="#top">${t.footer.top}</a>
    </nav>
  </div>
  <p class="wrap foot-copy">© 2026 KeyFlip</p>
</footer>`;
}

// ---------- landing page ----------

function hero(ctx) {
  const { lang, examples } = ctx;
  const t = COPY[lang];
  const h = t.hero;
  const first = examples[0];
  const data = esc(JSON.stringify(examples));
  const forms = esc(JSON.stringify(ctx.toastForms));
  return `<section class="hero">
  <div class="hero-bg" aria-hidden="true"><span class="blob b1"></span><span class="blob b2"></span><span class="grid"></span></div>
  <div class="wrap hero-in">
    <div class="hero-copy">
      <p class="eyebrow">${icon('sparkles')}${h.eyebrow}</p>
      <h1>${h.title}</h1>
      <p class="lead">${fill(h.sub)}</p>
      <div class="hero-cta">
        <a class="btn primary lg" href="#install">${icon('download')}${ctx.storeUrl ? t.cta.store : t.cta.soon}</a>
        <a class="btn ghost lg" href="#try">${t.cta.try}${icon('down')}</a>
      </div>
      <ul class="trust">${h.trust.map((x) => `<li>${icon('check')}${x}</li>`).join('')}</ul>
      <p class="browsers">${icon('laptop')}${h.browsers}</p>
    </div>
    <div class="hero-demo">
      <div class="demo" id="demo" role="img" aria-label="${esc(h.demoAria)}" data-examples="${data}" data-toast-forms="${forms}" data-lang="${lang}" data-typed="${esc(h.demoTyped)}" data-fixed="${esc(h.demoFixed)}">
        <div class="win" aria-hidden="true">
          <div class="win-bar"><span class="dots"><i></i><i></i><i></i></span><span class="win-title">${h.demoTitle}</span></div>
          <div class="win-row"><span class="lbl">${h.demoTo}</span><span dir="ltr">sam@example.com</span></div>
          <div class="win-row"><span class="lbl">${h.demoSubject}</span><span>${h.demoSubjectText}</span></div>
          <div class="win-body">
            <p class="state" id="demo-state">${h.demoFixed}</p>
            <div class="field"><span class="txt" id="demo-text" dir="${first.toDir}">${esc(first.to)}</span><span class="caret"></span></div>
          </div>
          <div class="demo-keys">${combo('flip', 'big')}</div>
        </div>
        <div class="toast show" id="demo-toast" aria-hidden="true"><span class="t-ic">${icon('swap')}</span><span id="demo-toast-msg">${esc(ctx.toastFor(first.from))}</span><small>${fill(h.toastUndo)}</small></div>
      </div>
    </div>
  </div>
</section>`;
}

function how(ctx) {
  const t = COPY[ctx.lang].how;
  const [w1, w2, w3] = t.ways;
  return `<section class="section" id="how">
  <div class="wrap">
    <div class="head center"><p class="kicker">${t.kicker}</p><h2>${t.title}</h2></div>
    <div class="ways">
      <article class="way reveal">
        <div class="vis vis-keys">${combo('flip', 'huge')}</div>
        <div class="way-txt"><span class="num">1</span><h3>${w1.title}</h3><p>${fill(w1.body)}</p><p class="note">${w1.note}</p></div>
      </article>
      <article class="way reveal">
        <div class="vis vis-fab">
          <p class="line" dir="ltr"><mark>;dt phg;</mark></p>
          <span class="fab"><span class="fab-ic">${icon('swap')}</span><b>${t.fabFlip}</b><span class="fab-dir" dir="ltr">EN → ع</span></span>
        </div>
        <div class="way-txt"><span class="num">2</span><h3>${w2.title}</h3><p>${fill(w2.body)}</p></div>
      </article>
      <article class="way reveal">
        <div class="vis vis-menu">
          <div class="menu-wrap" aria-hidden="true">
            <ul class="menu">${t.menu.slice(1).map((m) => `<li>${m}</li>`).join('')}<li class="sep"></li><li class="on"><img src="${ctx.root}assets/icon-16.png" width="16" height="16" alt="">${t.menuFlip}<span class="dim" dir="ltr" data-combo-text="flip">(Ctrl+Q)</span></li></ul>
            ${icon('pointer', 'cursor')}
          </div>
        </div>
        <div class="way-txt"><span class="num">3</span><h3>${w3.title}</h3><p>${fill(w3.body)}</p></div>
      </article>
    </div>
  </div>
</section>`;
}

function layoutOptions(ctx, selected) {
  return ctx.groups.map((g) => `<optgroup label="${esc(g.meta[ctx.lang])}">${g.items.map((it) => `<option value="${it.id}"${it.id === selected ? ' selected' : ''}>${esc(ctx.layoutName(it.id))}</option>`).join('')}</optgroup>`).join('');
}

function playground(ctx) {
  const t = COPY[ctx.lang].play;
  const first = t.samples[0];
  return `<section class="section alt" id="try">
  <div class="wrap">
    <div class="head center"><p class="kicker">${t.kicker}</p><h2>${t.title}</h2><p class="sub">${fill(t.sub)}</p></div>
    <div class="play card reveal" id="play" data-lang="${ctx.lang}" data-strings="${esc(JSON.stringify({ detected: t.detected, nothing: t.nothing, empty: t.empty, choose: t.choose, auto: t.auto }))}">
      <div class="play-top">
        <span class="play-lbl">${icon('keyboard')}${t.keyboards}</span>
        <div class="pair">
          <select id="kb-a" aria-label="${esc(t.keyboards)} 1">${layoutOptions(ctx, first.a)}</select>
          <button class="icon-btn" id="kb-swap" type="button" aria-label="${esc(t.swap)}" title="${esc(t.swap)}">${icon('swap')}</button>
          <select id="kb-b" aria-label="${esc(t.keyboards)} 2">${layoutOptions(ctx, first.b)}</select>
        </div>
      </div>
      <label class="sr-only" for="play-text">${t.label}</label>
      <textarea id="play-text" dir="auto" rows="3" spellcheck="false" autocomplete="off" data-keyflip-ignore>${esc(first.text)}</textarea>
      <div class="play-actions">
        <button class="btn primary" id="play-flip" type="button">${icon('swap')}${t.flip}<span class="hint-combo">${combo('flip', 'sm')}</span></button>
        <button class="btn ghost" id="play-reset" type="button">${t.reset}</button>
        <p class="play-status" id="play-status" role="status" aria-live="polite"></p>
      </div>
      <div class="play-amb" id="play-amb" hidden></div>
      <div class="play-samples"><span class="lbl">${t.samplesLabel}</span>${t.samples.map((s, i) => `<button type="button" class="chip${i === 0 ? ' on' : ''}" data-text="${esc(s.text)}" data-a="${s.a}" data-b="${s.b}">${s.label}</button>`).join('')}</div>
      <p class="play-hint">${t.hint}</p>
    </div>
  </div>
</section>`;
}

function spotlight({ id, kicker, title, body, points, media, flip, cls = '' }) {
  return `<section class="section ${cls}"${id ? ` id="${id}"` : ''}>
  <div class="wrap spot${flip ? ' flip' : ''}">
    <div class="spot-txt reveal">
      <p class="kicker">${kicker}</p><h2>${title}</h2><p class="sub">${body}</p>
      ${points ? `<ul class="ticks">${points.map((p) => `<li>${icon('check')}${p}</li>`).join('')}</ul>` : ''}
    </div>
    <div class="spot-media reveal">${media}</div>
  </div>
</section>`;
}

function macKeys(ctx) {
  const t = COPY[ctx.lang].mac;
  const row = (label, cls, letters) => `<div class="krow ${cls}"><span class="kname">${label}</span><div class="keys" dir="ltr">${letters.map((k) => `<span class="key"><small>${k.code}</small><b dir="rtl">${esc(k.char)}</b></span>`).join('')}</div></div>`;
  return `<div class="kb-compare card">
  <p class="kb-cap">${t.same}</p>
  ${row(t.win, 'k-win', ctx.macDiff.map((d) => ({ code: d.label, char: d.win })))}
  ${row(t.macName, 'k-mac', ctx.macDiff.map((d) => ({ code: d.label, char: d.mac })))}
</div>`;
}

function features(ctx) {
  const t = COPY[ctx.lang].features;
  return `<section class="section" id="features">
  <div class="wrap">
    <div class="head center"><p class="kicker">${t.kicker}</p><h2>${t.title}</h2></div>
    <div class="feats">${t.items.map((f) => `<article class="feat reveal"><span class="feat-ic">${icon(f.icon)}</span><h3>${f.title}</h3><p>${fill(f.body)}</p></article>`).join('')}</div>
  </div>
</section>`;
}

function video(ctx) {
  const t = COPY[ctx.lang].video;
  return `<section class="section alt">
  <div class="wrap">
    <div class="head center"><p class="kicker">${t.kicker}</p><h2>${t.title}</h2></div>
    <div class="video reveal">
      <video controls preload="none" playsinline width="1920" height="1080" poster="${ctx.root}assets/video/promo-${ctx.lang}.jpg" aria-label="${esc(t.label)}">
        <source src="${ctx.root}assets/video/promo-${ctx.lang}.mp4" type="video/mp4">
      </video>
    </div>
  </div>
</section>`;
}

function languages(ctx) {
  const t = COPY[ctx.lang].langs;
  return `<section class="section">
  <div class="wrap">
    <div class="head center"><p class="kicker">${t.kicker}</p><h2>${t.title}</h2></div>
    <div class="langs">${ctx.groups.map((g) => `<article class="lang reveal">
      <span class="glyph" lang="${g.lang}">${ctx.glyphs[g.lang]}</span>
      <div><h3><span lang="${g.lang}" dir="auto">${esc(g.meta.native)}</span>${g.meta.native !== g.meta[ctx.lang] ? `<small>${esc(g.meta[ctx.lang])}</small>` : ''}</h3>
      <p>${g.items.map((it) => `<span class="pill">${esc(ctx.variant(it))}</span>`).join('')}</p></div>
    </article>`).join('')}</div>
  </div>
</section>`;
}

function privacy(ctx) {
  const t = COPY[ctx.lang].privacy;
  const icons = ['wifiOff', 'eyeOff', 'chart', 'shield'];
  return `<section class="section privacy">
  <div class="wrap priv-in">
    <div class="priv-badge reveal" aria-hidden="true"><span class="ring r1"></span><span class="ring r2"></span><span class="core">${icon('lock')}</span></div>
    <div class="reveal">
      <p class="kicker">${t.kicker}</p><h2>${t.title}</h2><p class="sub">${t.body}</p>
      <ul class="priv-list">${t.points.map((p, i) => `<li>${icon(icons[i])}<span>${p}</span></li>`).join('')}</ul>
      <a class="link" href="${ctx.root}privacy/${ctx.lang === 'ar' ? '#ar' : ''}">${t.link}${icon('arrow', 'ic dir-ic')}</a>
    </div>
  </div>
</section>`;
}

function install(ctx) {
  const t = COPY[ctx.lang].install;
  const body = ctx.storeUrl
    ? `<h2>${t.titleStore}</h2><p class="sub">${t.bodyStore}</p>
      <div class="hero-cta center"><a class="btn primary lg" href="${ctx.storeUrl}">${icon('download')}${COPY[ctx.lang].cta.store}</a></div>`
    : `<h2>${t.titleSoon}</h2><p class="sub">${t.bodySoon}</p>
      <ol class="steps">${t.steps.map((s, i) => `<li><span class="n">${i + 1}</span><span>${s}</span></li>`).join('')}</ol>
      <div class="hero-cta center"><a class="btn primary lg" href="${ctx.zipUrl}">${icon('download')}${t.download}</a></div>`;
  return `<section class="section" id="install">
  <div class="wrap">
    <div class="install card reveal">
      <p class="kicker">${t.kicker}</p>
      ${body}
      <p class="browsers center">${icon('laptop')}${t.browsers}</p>
    </div>
  </div>
</section>`;
}

function faq(ctx) {
  const t = COPY[ctx.lang].faq;
  return `<section class="section alt" id="faq">
  <div class="wrap narrow">
    <div class="head center"><p class="kicker">${t.kicker}</p><h2>${t.title}</h2></div>
    <div class="faq">${t.items.map(([q, a]) => `<details class="qa reveal"><summary>${q}<span class="pm" aria-hidden="true"></span></summary><div class="ans"><p>${a}</p></div></details>`).join('')}</div>
  </div>
</section>`;
}

function finalCta(ctx) {
  const t = COPY[ctx.lang];
  return `<section class="final">
  <div class="wrap final-in reveal">
    <h2>${t.final.title}</h2>
    <p>${t.final.body}</p>
    <div class="hero-cta center">
      <a class="btn light lg" href="#install">${icon('download')}${ctx.storeUrl ? t.cta.store : t.cta.soon}</a>
      <a class="btn outline-light lg" href="#try">${t.cta.try}</a>
    </div>
  </div>
</section>`;
}

function jsonLd(ctx) {
  const t = COPY[ctx.lang];
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'KeyFlip',
    description: t.description,
    applicationCategory: 'BrowserApplication',
    operatingSystem: 'Windows, macOS, Linux, ChromeOS',
    browserRequirements: 'Chrome, Microsoft Edge, Brave or Opera',
    inLanguage: ['en', 'ar'],
    url: ctx.site + (ctx.lang === 'ar' ? 'ar/' : ''),
    image: `${ctx.site}assets/logo-512.png`,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
  if (ctx.storeUrl) data.installUrl = ctx.storeUrl;
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

export function landing(ctx) {
  const t = COPY[ctx.lang];
  const path = ctx.lang === 'ar' ? 'ar/' : '';
  return `${head(ctx, { title: t.title, description: t.description, path, page: 'home' })}
<body class="lang-${ctx.lang}">
${header(ctx)}
<main id="main">
${hero(ctx)}
${how(ctx)}
${playground(ctx)}
${spotlight({ ...t.lam, body: t.lam.body, media: `<figure class="shot glow"><img src="${ctx.root}assets/img/dialog-${ctx.lang}.webp" width="912" height="612" loading="lazy" decoding="async" alt="${esc(t.lam.alt)}"></figure>` })}
${spotlight({ ...t.mac, flip: true, cls: 'alt', media: macKeys(ctx) })}
${spotlight({ ...t.popup, media: `<figure class="shot popup glow"><img src="${ctx.root}assets/img/popup-${ctx.lang}.webp" width="760" height="1090" loading="lazy" decoding="async" alt="${esc(t.popup.alt)}"></figure>` })}
${features(ctx)}
${video(ctx)}
${languages(ctx)}
${privacy(ctx)}
${install(ctx)}
${faq(ctx)}
${finalCta(ctx)}
</main>
${footer(ctx)}
${jsonLd(ctx)}
<script src="${ctx.root}assets/kf/layouts.data.js" defer></script>
<script src="${ctx.root}assets/kf/layouts.js" defer></script>
<script src="${ctx.root}assets/kf/converter.js" defer></script>
<script src="${ctx.root}assets/kf/dictionary.js" defer></script>
<script src="${ctx.root}assets/site.js" defer></script>
</body>
</html>
`;
}

// ---------- privacy policy and 404 ----------

export function privacyPage(ctx, { en, ar }) {
  return `${head(ctx, { title: 'KeyFlip — Privacy Policy · سياسة الخصوصية', description: 'KeyFlip works entirely on your device. It never collects, sells or shares your data.', path: 'privacy/', noindex: false }).replace(/<link rel="alternate"[^>]+>\n?/g, '')}
<body class="lang-en doc-page">
${header(ctx, { home: ctx.root })}
<main id="main" class="section">
  <div class="wrap narrow">
    <div class="doc-switch" role="group" aria-label="Language · اللغة"><button type="button" data-doc="en" aria-pressed="true">English</button><button type="button" data-doc="ar" aria-pressed="false" lang="ar">العربية</button></div>
    <article class="doc card" id="doc-en" lang="en" dir="ltr"><h1>Privacy Policy</h1><p class="date">Effective date: October 14, 2026</p>${en}</article>
    <article class="doc card" id="doc-ar" lang="ar" dir="rtl" hidden><h1>سياسة الخصوصية</h1><p class="date">تاريخ السريان: 14 أكتوبر 2026</p>${ar}</article>
  </div>
</main>
${footer({ ...ctx, lang: 'en' })}
<script src="${ctx.root}assets/site.js" defer></script>
</body>
</html>
`;
}

export function notFound(ctx) {
  const en = COPY.en.notFound;
  const ar = COPY.ar.notFound;
  return `${head(ctx, { title: `KeyFlip — ${en.title}`, description: en.body, path: '404.html', noindex: true })}
<body class="lang-en">
${header(ctx, { home: ctx.root })}
<main id="main" class="section nf">
  <div class="wrap narrow center">
    <p class="nf-code" dir="ltr"><span class="g">٤٠٤</span>${icon('arrow', 'ic')}<span>404</span></p>
    <h1>${en.title}</h1><p class="sub">${en.body}</p>
    <h2 lang="ar" dir="rtl">${ar.title}</h2><p class="sub" lang="ar" dir="rtl">${ar.body}</p>
    <div class="hero-cta center"><a class="btn primary" href="${ctx.root}">${en.home}</a><a class="btn ghost" href="${ctx.root}ar/" lang="ar">${ar.home}</a></div>
  </div>
</main>
<script src="${ctx.root}assets/site.js" defer></script>
</body>
</html>
`;
}
