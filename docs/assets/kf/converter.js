// Keyboard layout remapping engine.
//
// Text typed with layout A is re-read key by key and re-emitted as if the same
// physical keys had been pressed with layout B. Some keys emit several
// characters (Arabic 101 "B" -> "لا", which is also "G"+"H"), so a conversion
// yields segments, and a segment may have more than one possible reading.
(function (root, factory) {
  const isNode = typeof module === 'object' && module.exports;
  const layouts = isNode ? require('./layouts.js') : root.KeyFlip.layouts;
  const api = factory(layouts);
  if (isNode) module.exports = api;
  root.KeyFlip = root.KeyFlip || {};
  root.KeyFlip.converter = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (layouts) {
  'use strict';

  // Presentation-form lam-alef ligatures some systems emit instead of two letters.
  const LIGATURES = {
    'ﻻ': 'لا', 'ﻼ': 'لا',
    'ﻷ': 'لأ', 'ﻸ': 'لأ',
    'ﻹ': 'لإ', 'ﻺ': 'لإ',
    'ﻵ': 'لآ', 'ﻶ': 'لآ',
  };
  const LIGATURE_RE = /[ﻵ-ﻼ]/g;

  function normalize(text) {
    return String(text).normalize('NFC').replace(LIGATURE_RE, (c) => LIGATURES[c]);
  }

  // One-directional mapping: source token -> target output for the same key.
  function buildMapping(src, tgt) {
    const tokens = new Map();
    const tgtDead = new Set(tgt.dead);
    for (const level of [0, 1]) {
      for (const code of layouts.CODES) {
        const s = src.keys[code] && src.keys[code][level];
        if (s == null || tokens.has(s)) continue;
        const pair = tgt.keys[code];
        if (!pair) continue;
        const t = pair[level] != null ? pair[level] : pair[0];
        if (t == null) continue;
        tokens.set(s, { out: t, dead: tgtDead.has(t) });
      }
    }
    // Composed source characters ("ê" = dead "^" + "e") map to both keystrokes.
    for (const [seq, composed] of Object.entries(src.compose)) {
      if (tokens.has(composed)) continue;
      const [d, c] = Array.from(seq);
      const dt = tokens.get(d);
      const ct = tokens.get(c);
      if (!dt || !ct) continue;
      tokens.set(composed, { out: composeTarget(tgt, dt, ct.out), dead: false });
    }
    let maxLen = 1;
    for (const k of tokens.keys()) maxLen = Math.max(maxLen, k.length);
    const chars = new Set();
    for (const k of tokens.keys()) for (const ch of k) chars.add(ch);
    return { src, tgt, tokens, maxLen, chars };
  }

  function composeTarget(tgt, deadToken, next) {
    if (!deadToken.dead) return deadToken.out + next;
    if (/^[\s\u00a0]/.test(next)) return deadToken.out + next.slice(1);
    const composed = tgt.compose[deadToken.out + next[0]];
    return composed ? composed + next.slice(1) : deadToken.out + next;
  }

  // Splits `str` into tokens no longer than `limit`; null if impossible.
  function splitShorter(str, mapping, limit) {
    if (str === '') return [];
    for (let len = Math.min(limit, str.length); len >= 1; len--) {
      const head = str.slice(0, len);
      const tok = mapping.tokens.get(head);
      if (!tok) continue;
      const rest = splitShorter(str.slice(len), mapping, limit);
      if (rest) return [tok].concat(rest);
    }
    return null;
  }

  // Text -> segments: { src, out: [primary, alternative?], dead, pass }.
  function segment(text, mapping) {
    const s = normalize(text);
    const segs = [];
    let i = 0;
    while (i < s.length) {
      let hit = null;
      for (let len = Math.min(mapping.maxLen, s.length - i); len >= 1; len--) {
        const piece = s.substr(i, len);
        if (mapping.tokens.has(piece)) { hit = piece; break; }
      }
      if (!hit) {
        const cp = String.fromCodePoint(s.codePointAt(i));
        segs.push({ src: cp, out: [cp], dead: false, pass: true });
        i += cp.length;
        continue;
      }
      const tok = mapping.tokens.get(hit);
      const seg = { src: hit, out: [tok.out], dead: tok.dead, pass: false };
      if (hit.length > 1) {
        const alt = splitShorter(hit, mapping, hit.length - 1);
        if (alt) {
          const altText = render(alt.map((t) => ({ out: [t.out], dead: t.dead })), null, mapping.tgt);
          if (altText !== tok.out) seg.out.push(altText);
        }
      }
      segs.push(seg);
      i += hit.length;
    }
    return segs;
  }

  // Joins segments using `choices[i]` (default 0) and applies target dead keys.
  function render(segs, choices, tgt) {
    let out = '';
    let pending = null;
    segs.forEach((seg, i) => {
      const piece = seg.out[(choices && choices[i]) || 0];
      if (pending) {
        out += composeTarget(tgt, pending, piece);
        pending = null;
        return;
      }
      if (seg.dead) { pending = { out: piece, dead: true }; return; }
      out += piece;
    });
    if (pending) out += pending.out;
    return out;
  }

  const LETTER_RE = /\p{L}|\p{M}/u;

  // A pair of layouts with both directions prepared.
  function createPair(idA, idB) {
    const a = layouts.get(idA);
    const b = layouts.get(idB);
    if (!a || !b) throw new Error(`Unknown layout: ${!a ? idA : idB}`);
    return { a, b, forward: buildMapping(a, b), backward: buildMapping(b, a) };
  }

  // Which way should `text` be flipped? Counts characters only one side can type.
  function detectDirection(text, pair) {
    const s = normalize(text);
    let fa = 0;
    let fb = 0;
    for (const ch of s) {
      const inA = pair.forward.chars.has(ch);
      const inB = pair.backward.chars.has(ch);
      if (inA === inB) continue;
      const w = LETTER_RE.test(ch) ? 3 : 1;
      if (inA) fa += w; else fb += w;
    }
    if (fa === 0 && fb === 0) return null;
    return fb > fa ? 'backward' : 'forward';
  }

  // Groups ambiguous segments by word and lists each word's readings.
  function ambiguities(segs, tgt, maxPerWord) {
    const limit = maxPerWord || 3;
    const words = [];
    let cur = null;
    segs.forEach((seg, i) => {
      if (/^\s+$/.test(seg.src)) { cur = null; return; }
      if (!cur) { cur = { from: i, to: i, ambiguous: [] }; words.push(cur); }
      cur.to = i;
      if (seg.out.length > 1) cur.ambiguous.push(i);
    });
    return words.filter((w) => w.ambiguous.length).map((w) => {
      const slice = segs.slice(w.from, w.to + 1);
      const amb = w.ambiguous.slice(0, limit);
      const candidates = [];
      for (let mask = 0; mask < (1 << amb.length); mask++) {
        const choices = {};
        amb.forEach((segIdx, bit) => { if (mask & (1 << bit)) choices[segIdx] = 1; });
        const local = slice.map((_, k) => choices[w.from + k] || 0);
        candidates.push({ choices, text: render(slice, local, tgt) });
      }
      return {
        from: w.from,
        to: w.to,
        source: slice.map((s) => s.src).join(''),
        candidates,
      };
    });
  }

  // "gH" inside a word almost never happens on purpose.
  function hasInnerCaseMix(word) {
    return /\p{Ll}\p{Lu}/u.test(word);
  }

  // Picks a reading when confident, otherwise returns null (ask the user).
  function autoPick(word, isKnownWord) {
    if (isKnownWord) {
      const known = word.candidates.filter((c) => isKnownWord(c.text));
      if (known.length === 1) return known[0];
    }
    const clean = word.candidates.filter((c) => !hasInnerCaseMix(c.text));
    if (clean.length === 1) return clean[0];
    return null;
  }

  // Full analysis used by the UI layers.
  //   opts.direction: 'forward' | 'backward' | undefined (auto)
  function analyze(text, pair, opts) {
    const o = opts || {};
    const direction = o.direction || detectDirection(text, pair) || 'forward';
    const mapping = direction === 'backward' ? pair.backward : pair.forward;
    const segs = segment(text, mapping);
    const words = ambiguities(segs, mapping.tgt);
    return {
      direction,
      from: mapping.src.id,
      to: mapping.tgt.id,
      segments: segs,
      words,
      changed: segs.some((s) => !s.pass),
      render: (choices) => render(segs, choices, mapping.tgt),
    };
  }

  // Merges per-word picks into a segment-level choices map.
  function choicesFrom(picks) {
    const out = {};
    for (const p of picks) if (p) Object.assign(out, p.choices);
    return out;
  }

  // One-shot helper: resolves ambiguity with a fixed strategy.
  //   strategy: 'single' (default) | 'double' | function(word) -> candidate
  function convert(text, idA, idB, opts) {
    const o = opts || {};
    const pair = createPair(idA, idB);
    const result = analyze(text, pair, o);
    const strategy = o.strategy || 'single';
    const picks = result.words.map((w) => {
      if (typeof strategy === 'function') return strategy(w) || w.candidates[0];
      return strategy === 'double' ? w.candidates[w.candidates.length - 1] : w.candidates[0];
    });
    return result.render(choicesFrom(picks));
  }

  return {
    normalize, buildMapping, segment, render, createPair, detectDirection,
    ambiguities, autoPick, analyze, choicesFrom, convert, hasInnerCaseMix,
  };
});
