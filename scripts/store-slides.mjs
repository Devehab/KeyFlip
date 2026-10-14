// HTML for the five 1280x800 Chrome Web Store screenshots of one locale.
// Slides explain the idea first (gibberish -> keys -> intended text) and use
// real captures of the extension's UI where it matters.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const converter = require('../src/core/converter.js');
const layouts = require('../src/core/layouts.js');

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Keeps Latin runs such as "⌃ Control + Q" intact inside right-to-left text.
function rich(s, dir) {
  const html = esc(s);
  if (dir !== 'rtl') return html;
  return html.replace(/(?:[⌃⌘]\s?)?[A-Za-z][A-Za-z0-9’']*(?:\s?\+\s?(?:[⌃⌘]\s?)?[A-Za-z0-9]+)*/g, (m) => `<bdi dir="ltr">${m}</bdi>`);
}

export function fontCss(base) {
  const f = (family, file, range) => `@font-face { font-family: "${family}"; src: url("${base}/store/assets-src/fonts/${file}") format("woff2"); font-weight: 200 1000; font-display: block; unicode-range: ${range}; }`;
  const AR = 'U+0600-06FF, U+0750-077F, U+08A0-08FF, U+200C-200F, U+FB50-FDFF, U+FE70-FEFC';
  const LAT = 'U+0000-00FF, U+0131, U+0152-0153, U+2000-206F, U+2190-2193, U+2212, U+2303, U+2318';
  const LATX = 'U+0100-024F, U+1E00-1EFF';
  return [
    f('Cairo', 'cairo-arabic-wght-normal.woff2', AR),
    f('Cairo', 'cairo-latin-wght-normal.woff2', LAT),
    f('Vazirmatn', 'vazirmatn-arabic-wght-normal.woff2', AR),
    f('Plus Jakarta Sans', 'plus-jakarta-sans-latin-wght-normal.woff2', LAT),
    f('Plus Jakarta Sans', 'plus-jakarta-sans-latin-ext-wght-normal.woff2', LATX),
    f('Rubik', 'rubik-latin-wght-normal.woff2', LAT),
    f('Rubik', 'rubik-latin-ext-wght-normal.woff2', LATX),
    f('Rubik', 'rubik-hebrew-wght-normal.woff2', 'U+0590-05FF, U+FB1D-FB4F'),
    f('Rubik', 'rubik-cyrillic-wght-normal.woff2', 'U+0400-045F, U+0490-0491'),
  ].join('\n');
}

const KEY_TILE = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="132" height="132"><rect x="14" y="14" width="104" height="104" rx="24" fill="none" stroke="#6c47ff" stroke-opacity=".07" stroke-width="3"/></svg>');

function baseCss(L, base) {
  const stack = `"${L.font}", "Plus Jakarta Sans", "Cairo", "Vazirmatn", "Rubik", system-ui, sans-serif`;
  const arabicScript = L.font === 'Cairo' || L.font === 'Vazirmatn';
  return `${fontCss(base)}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1280px; height: 800px; overflow: hidden; }
  body { font-family: ${stack}; color: #16132e; position: relative; -webkit-font-smoothing: antialiased;
    background: radial-gradient(760px 480px at 92% 6%, rgba(20, 194, 232, .22), transparent 62%),
      radial-gradient(760px 520px at 4% 0%, rgba(123, 77, 255, .22), transparent 60%),
      linear-gradient(165deg, #fbfaff 0%, #f2eeff 50%, #eaf8fe 100%); }
  body::before { content: ""; position: absolute; inset: -80px; background: url("data:image/svg+xml,${KEY_TILE}"); transform: rotate(-9deg); pointer-events: none; }
  .brand { position: absolute; top: 30px; inset-inline-start: 40px; display: flex; align-items: center; gap: 10px; direction: ltr; font: 800 22px "Plus Jakarta Sans", sans-serif; letter-spacing: -0.02em; }
  .brand img { width: 38px; height: 38px; filter: drop-shadow(0 6px 12px rgba(108, 71, 255, .35)); }
  .head { position: absolute; top: 82px; left: 70px; right: 70px; text-align: center; }
  h1 { font-size: ${arabicScript ? 58 : 54}px; font-weight: 800; line-height: 1.18; letter-spacing: ${arabicScript || L.font === 'Rubik' ? '0' : '-0.025em'}; }
  h1 em { font-style: normal; background: linear-gradient(120deg, #6a3dff, #14b6e0); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .sub { margin-top: 12px; font-size: 24px; font-weight: 500; color: #57536f; line-height: 1.45; }
  .stage { position: absolute; left: 0; right: 0; top: 268px; bottom: 0; }
  .card { background: #fff; border-radius: 28px; box-shadow: 0 30px 60px -28px rgba(46, 26, 140, .40), 0 2px 8px rgba(23, 21, 43, .06); }
  .key { display: inline-grid; place-items: center; min-width: 96px; height: 96px; padding: 0 22px; border-radius: 24px; background: linear-gradient(#fff, #f4f2fb);
    border: 2px solid #ded8f4; box-shadow: 0 8px 0 #d3cbf3, 0 22px 34px -16px rgba(46, 26, 140, .5); font: 800 34px "Plus Jakarta Sans", sans-serif; color: #2b2550; direction: ltr; }
  .key.hot { background: linear-gradient(135deg, #7b4dff, #5e5bf6 55%, #14c2e8); color: #fff; border-color: transparent; box-shadow: 0 8px 0 #4a2fc0, 0 22px 34px -14px rgba(76, 47, 224, .7); }
  .plus { font: 800 30px "Plus Jakarta Sans", sans-serif; color: #a19dbb; }
  .chip { display: inline-flex; align-items: center; gap: 8px; height: 46px; padding: 0 20px; border-radius: 999px; background: #fff; font-size: 19px; font-weight: 700;
    box-shadow: 0 10px 22px -14px rgba(46, 26, 140, .45); border: 1px solid #ebe7f8; white-space: nowrap; }
  .chip i { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: #12a150; color: #fff; font: 900 14px sans-serif; font-style: normal; }
  .shot { display: block; border-radius: 22px; box-shadow: 0 34px 70px -28px rgba(46, 26, 140, .5), 0 3px 10px rgba(23, 21, 43, .08); }
  bdi { unicode-bidi: isolate; }`;
}

function page(L, base, css, body) {
  return `<!doctype html><html lang="${L.ui}" dir="${L.dir}"><head><meta charset="utf-8"><style>${baseCss(L, base)}${css}</style></head>
  <body><div class="brand"><img src="${base}/assets/icons/icon-128.png">KeyFlip</div>${body}
  <script>
    // Shrink long headlines until they fit on one line.
    document.fonts.ready.then(() => {
      const h = document.querySelector('h1');
      let size = parseFloat(getComputedStyle(h).fontSize);
      while (h.getBoundingClientRect().height > size * 1.4 && size > 38) { size -= 2; h.style.fontSize = size + 'px'; }
      document.body.dataset.fit = '1';
    });
  </script></body></html>`;
}

function head(L, h, s) {
  return `<div class="head"><h1>${rich(h, L.dir)}</h1>${s ? `<p class="sub">${rich(s, L.dir)}</p>` : ''}</div>`;
}

// The word of the phrase whose keys change the most, with its keystrokes.
function demoWord(L) {
  const words = L.phrase.split(/\s+/).map((w) => w.replace(/[!?؟.,،:;]+$/u, '')).filter(Boolean);
  const data = layouts.get(L.layoutB);
  const en = layouts.get('en-us');
  const keysFor = (word) => [...word].map((ch) => {
    for (const code of layouts.CODES) {
      const pair = data.keys[code];
      if (!pair) continue;
      const level = pair[0] === ch ? 0 : pair[1] === ch ? 1 : -1;
      if (level >= 0) return { target: ch, typed: en.keys[code][level] };
    }
    return { target: ch, typed: ch };
  });
  let best = null;
  for (const w of words) {
    const keys = keysFor(w);
    const changed = keys.filter((k) => k.typed.toLowerCase() !== k.target.toLowerCase()).length;
    if (keys.length <= 7 && (!best || changed > best.changed || (changed === best.changed && keys.length < best.keys.length))) best = { word: w, keys, changed };
  }
  return best;
}

function slide1(L, base) {
  const gib = converter.convert(L.phrase, 'en-us', L.layoutB, { direction: 'backward' });
  const css = `
  .flow { position: absolute; top: 20px; left: 30px; right: 30px; display: flex; align-items: center; justify-content: center; gap: 22px; }
  .msg { width: 452px; height: 236px; padding: 26px 30px; display: flex; flex-direction: column; gap: 18px; }
  .tag { align-self: flex-start; display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 16px; border-radius: 999px; font-size: 17px; font-weight: 800; }
  .tag.bad { background: #ffe9ea; color: #d63a40; }
  .tag.good { background: #e3f7ea; color: #0f8a44; }
  .tag b { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; color: #fff; font: 900 13px sans-serif; }
  .bad b { background: #e5484d; } .good b { background: #12a150; }
  .txt { flex: 1; display: flex; align-items: center; }
  .gib { font: 600 30px/1.35 "DejaVu Sans Mono", ui-monospace, monospace; white-space: nowrap; color: #4a4566; direction: ltr; text-decoration: underline wavy #ef4444 2px; text-underline-offset: 9px; word-break: break-all; }
  .ok { font-size: 40px; font-weight: 800; line-height: 1.3; white-space: nowrap; color: #16132e; unicode-bidi: plaintext; }
  .mid { display: grid; justify-items: center; gap: 14px; }
  .keys { display: flex; align-items: center; gap: 12px; direction: ltr; }
  .arrow { width: 150px; height: 40px; color: #7b4dff; }
  [dir="rtl"] .arrow { transform: scaleX(-1); }
  .mac { font: 600 16px "Plus Jakarta Sans", "Cairo", "Vazirmatn", "Rubik", sans-serif; color: #6b6787; }
  .chips { position: absolute; top: 330px; left: 0; right: 0; display: flex; justify-content: center; gap: 14px; }`;
  return page(L, base, css, `${head(L, L.s1.h, L.s1.s)}
  <div class="stage">
    <div class="flow">
      <div class="msg card"><span class="tag bad"><b>✕</b>${esc(L.s1.before)}</span><div class="txt"><span class="gib">${esc(gib)}</span></div></div>
      <div class="mid">
        <svg class="arrow" viewBox="0 0 150 40"><path d="M6 30 C 45 4, 100 4, 136 26" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="M122 14 L138 27 L120 34" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div class="keys"><span class="key">Ctrl</span><span class="plus">+</span><span class="key hot">Q</span></div>
        <span class="mac">${rich(L.s1.mac, L.dir)}</span>
      </div>
      <div class="msg card"><span class="tag good"><b>✓</b>${esc(L.s1.after)}</span><div class="txt"><span class="ok" dir="auto">${esc(L.phrase)}</span></div></div>
    </div>
    <div class="chips">${L.s1.chips.map((c) => `<span class="chip"><i>✓</i>${esc(c)}</span>`).join('')}</div>
  </div>`);
}

function slide2(L, base) {
  const demo = demoWord(L);
  const targetDir = /[֐-ࣿ]/.test(demo.word) ? 'rtl' : 'ltr';
  const css = `
  .row { position: absolute; top: 6px; left: 0; right: 0; display: flex; justify-content: center; gap: 18px; }
  .cap { position: relative; width: 132px; height: 132px; border-radius: 30px; background: linear-gradient(#fff, #f5f3fc); border: 2px solid #ddd6f5;
    box-shadow: 0 10px 0 #d3cbf3, 0 26px 40px -18px rgba(46, 26, 140, .55); }
  .cap .a { position: absolute; top: 14px; left: 18px; font: 700 30px "DejaVu Sans Mono", monospace; color: #a6a1c0; text-decoration: line-through #e5484d 3px; direction: ltr; unicode-bidi: isolate; }
  .cap .b { position: absolute; bottom: 4px; right: 18px; font-size: 54px; font-weight: 800; line-height: 1.5; padding: 0 2px; unicode-bidi: isolate; background: linear-gradient(135deg, #6a3dff, #14b6e0); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .cap.same .a { text-decoration: none; }
  .cap.same .b { -webkit-text-fill-color: #c9c4dc; }
  .lines { position: absolute; top: 196px; left: 0; right: 0; display: flex; justify-content: center; gap: 70px; align-items: baseline; }
  .line { display: grid; justify-items: center; gap: 4px; }
  .line small { font-size: 18px; font-weight: 700; color: #8a86a3; text-transform: uppercase; letter-spacing: ${L.dir === 'rtl' ? '0' : '.08em'}; }
  .line .t { font: 700 40px "DejaVu Sans Mono", monospace; color: #8a86a3; direction: ltr; text-decoration: line-through #e5484d 3px; }
  .line .m { font-size: 52px; font-weight: 800; color: #16132e; }
  .eq { font: 800 40px "Plus Jakarta Sans", sans-serif; color: #7b4dff; }
  .support { position: absolute; left: 60px; right: 60px; top: 330px; display: grid; justify-items: center; gap: 14px; }
  .support .list { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
  .support .chip { height: 42px; font-size: 18px; padding: 0 16px; }
  .support .chip.first { background: linear-gradient(135deg, #7b4dff, #5e5bf6 55%, #14c2e8); color: #fff; border: 0; }
  .support .plat { font-size: 18px; font-weight: 700; color: #6b6787; }
  .support .plat b { color: #16132e; }`;
  const caps = demo.keys.map((k) => `<div class="cap ${k.typed.toLowerCase() === k.target.toLowerCase() ? 'same' : ''}"><span class="a">${esc(k.typed)}</span><span class="b">${esc(k.target)}</span></div>`).join('');
  return page(L, base, css, `${head(L, L.s2.h, L.s2.s)}
  <div class="stage">
    <div class="row" dir="${targetDir}">${caps}</div>
    <div class="lines" dir="${L.dir}">
      <div class="line"><small>${esc(L.s2.typed)}</small><span class="t">${esc(demo.keys.map((k) => k.typed).join(''))}</span></div>
      <span class="eq">${L.dir === 'rtl' ? '←' : '→'}</span>
      <div class="line"><small>${esc(L.s2.meant)}</small><span class="m" dir="auto">${esc(demo.word)}</span></div>
    </div>
    <div class="support">
      <div class="list">${L.supports.map((s, i) => `<span class="chip ${i === 0 ? 'first' : ''}" dir="auto">${esc(s)}</span>`).join('')}</div>
      <div class="plat">${esc(L.s2.supports)} · <b>${esc(L.platforms)}</b></div>
    </div>
  </div>`);
}

function contextMenu(L, base) {
  const ar = L.ui === 'ar';
  const items = ar ? ['قص', 'نسخ', 'لصق'] : ['Cut', 'Copy', 'Paste'];
  const label = ar ? 'صحّح لغة الكيبورد' : 'Fix keyboard layout';
  return `<div class="cmenu" dir="${ar ? 'rtl' : 'ltr'}">${items.map((t) => `<div class="ci">${t}</div>`).join('')}<div class="sep"></div>
    <div class="ci on"><img src="${base}/assets/icons/icon-32.png">${esc(label)}<span class="sc">Ctrl+Q</span></div></div>`;
}

function fabText(L) {
  const demo = demoWord(L);
  return demo.keys.map((k) => k.typed).join('');
}

function slide3(L, base, raw) {
  const css = `
  .cards { position: absolute; top: 0; left: 56px; right: 56px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
  .way { height: 470px; padding: 0 0 28px; display: grid; grid-template-rows: 290px auto auto; justify-items: center; text-align: center; overflow: hidden; }
  .ill { width: 100%; height: 290px; display: grid; place-items: center; background: linear-gradient(160deg, #f6f3ff, #ecf8fd); border-bottom: 1px solid #eeeaf8; position: relative; }
  .way h3 { margin-top: 26px; font-size: 30px; font-weight: 800; }
  .way p { margin-top: 8px; font-size: 19px; font-weight: 600; color: #6b6787; padding: 0 22px; }
  .n { position: absolute; top: 18px; inset-inline-start: 18px; width: 40px; height: 40px; border-radius: 13px; display: grid; place-items: center; background: #16132e; color: #fff; font: 800 20px "Plus Jakarta Sans", sans-serif; }
  .keys { display: flex; align-items: center; gap: 10px; direction: ltr; }
  .keys .key { min-width: 86px; height: 86px; font-size: 30px; }
  .mini { position: relative; width: 300px; display: grid; justify-items: end; gap: 10px; direction: ltr; }
  .fabimg { height: 52px; border-radius: 999px; box-shadow: 0 16px 30px -14px rgba(46, 26, 140, .55); outline: 3px solid rgba(123, 77, 255, .35); outline-offset: 4px; }
  .field { width: 300px; height: 72px; padding: 0 18px; display: flex; align-items: center; border-radius: 16px; background: #fff; border: 2px solid #ddd6f5; box-shadow: 0 12px 26px -18px rgba(46, 26, 140, .5); }
  .field mark { font: 600 24px "DejaVu Sans Mono", monospace; background: #3b74e8; color: #fff; padding: 2px 4px; border-radius: 3px; white-space: nowrap; }
  .cmenu { width: 300px; padding: 7px 0; border-radius: 12px; background: #fff; border: 1px solid #dad7e6; box-shadow: 0 22px 44px -16px rgba(23, 21, 43, .4); font: 500 17px "Plus Jakarta Sans", "Cairo", sans-serif; text-align: start; }
  .cmenu .ci { display: flex; align-items: center; gap: 10px; height: 38px; padding: 0 16px; color: #2d2a40; }
  .cmenu .ci img { width: 18px; height: 18px; }
  .cmenu .ci.on { background: #ece7ff; color: #3b22c9; font-weight: 800; }
  .cmenu .sc { margin-inline-start: auto; font-size: 13px; color: #8a86a3; font-weight: 600; direction: ltr; }
  .cmenu .sep { height: 1px; background: #e7e5ef; margin: 6px 0; }`;
  const [a, b, c] = L.s3.cards;
  return page(L, base, css, `${head(L, L.s3.h)}
  <div class="stage" style="top:208px">
    <div class="cards">
      <div class="way card"><div class="ill"><span class="n">1</span><div class="keys"><span class="key">Ctrl</span><span class="plus">+</span><span class="key hot">Q</span></div></div><h3>${esc(a[0])}</h3><p>${rich(a[1], L.dir)}</p></div>
      <div class="way card"><div class="ill"><span class="n">2</span>
        <div class="mini"><img class="fabimg" src="${raw('fab.png')}"><div class="field"><mark>${esc(fabText(L))}</mark></div></div></div><h3>${esc(b[0])}</h3><p>${rich(b[1], L.dir)}</p></div>
      <div class="way card"><div class="ill"><span class="n">3</span>${contextMenu(L, base)}</div><h3>${esc(c[0])}</h3><p>${rich(c[1], L.dir)}</p></div>
    </div>
  </div>`);
}

function slide4(L, base, raw) {
  if (L.layoutB.startsWith('ar')) {
    const css = `
    .eqn { position: absolute; top: 40px; inset-inline-start: 70px; width: 520px; display: grid; gap: 26px; justify-items: center; }
    .eqrow { display: flex; align-items: center; gap: 16px; direction: ltr; }
    .cap { position: relative; width: 118px; height: 118px; border-radius: 28px; background: linear-gradient(#fff, #f5f3fc); border: 2px solid #ddd6f5; box-shadow: 0 10px 0 #d3cbf3, 0 24px 36px -18px rgba(46, 26, 140, .55); }
    .cap .a { position: absolute; top: 12px; left: 16px; font: 800 28px "Plus Jakarta Sans", sans-serif; color: #2b2550; }
    .cap .b { position: absolute; bottom: 8px; right: 16px; font: 800 46px "Cairo", sans-serif; color: #6a3dff; line-height: 1.1; }
    .op { font: 800 40px "Plus Jakarta Sans", sans-serif; color: #a19dbb; }
    .lam { font: 900 84px "Cairo", sans-serif; color: #16132e; line-height: 1; }
    .verdict { display: flex; gap: 14px; direction: ltr; }
    .verdict span { display: inline-flex; align-items: center; gap: 8px; height: 50px; padding: 0 20px; border-radius: 16px; font: 800 24px "Plus Jakarta Sans", sans-serif; }
    .verdict .no { background: #ffe9ea; color: #d63a40; text-decoration: line-through; }
    .verdict .yes { background: #e3f7ea; color: #0f8a44; }
    .dlg { position: absolute; top: 0; inset-inline-end: 70px; width: 520px; }`;
    return page(L, base, css, `${head(L, L.s4.h, L.s4.s)}
    <div class="stage">
      <div class="eqn">
        <div class="eqrow"><div class="cap"><span class="a">B</span><span class="b">لا</span></div><span class="op">=</span><span class="lam">لا</span><span class="op">=</span>
          <div class="cap"><span class="a">G</span><span class="b">ل</span></div><span class="op">+</span><div class="cap"><span class="a">H</span><span class="b">ا</span></div></div>
        <div class="verdict"><span class="no">ribt</span><span class="yes">✓ right</span></div>
      </div>
      <img class="shot dlg" src="${raw('dialog.png')}">
    </div>`);
  }
  const css = `
  .kb { position: absolute; top: -6px; left: 190px; width: 900px; }`;
  return page(L, base, css, `${head(L, L.s4.h, L.s4.s)}
  <div class="stage"><img class="shot kb" src="${raw('keyboards.png')}"></div>`);
}

function slide5(L, base, raw) {
  const css = `
  .priv { position: absolute; top: 10px; inset-inline-start: 90px; width: 520px; display: grid; gap: 18px; }
  .shield { width: 120px; height: 120px; border-radius: 34px; display: grid; place-items: center; background: linear-gradient(135deg, #18b864, #0f8a44); box-shadow: 0 24px 40px -18px rgba(15, 138, 68, .7); }
  .shield svg { width: 66px; height: 66px; color: #fff; }
  .check { display: flex; align-items: center; gap: 14px; height: 66px; padding: 0 22px; border-radius: 20px; background: #fff; font-size: 24px; font-weight: 800; box-shadow: 0 14px 30px -18px rgba(46, 26, 140, .45); }
  .check i { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: #e3f7ea; color: #0f8a44; font: 900 18px sans-serif; font-style: normal; flex: none; }
  .pop { position: absolute; top: -34px; inset-inline-end: 120px; width: 350px; transform: rotate(${L.dir === 'rtl' ? '-2' : '2'}deg); }`;
  return page(L, base, css, `${head(L, L.s5.h, L.s5.s)}
  <div class="stage">
    <div class="priv">
      <div class="shield"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg></div>
      ${L.s5.checks.map((c) => `<div class="check"><i>✓</i>${esc(c)}</div>`).join('')}
    </div>
    <img class="shot pop" src="${raw('popup.png')}">
  </div>`);
}

export function slides(L, base, raw) {
  return [
    ['01-idea', slide1(L, base)],
    ['02-how-it-works', slide2(L, base)],
    ['03-three-ways', slide3(L, base, raw)],
    [L.layoutB.startsWith('ar') ? '04-smart-lam' : '04-layouts', slide4(L, base, raw)],
    ['05-private', slide5(L, base, raw)],
  ];
}
