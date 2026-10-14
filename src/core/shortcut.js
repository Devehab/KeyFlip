// Keyboard shortcut helpers. Shortcuts are matched on KeyboardEvent.code so
// they keep working while an Arabic (or any) layout is active.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KeyFlip = root.KeyFlip || {};
  root.KeyFlip.shortcut = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DEFAULT = Object.freeze({ code: 'KeyQ', ctrl: true, alt: false, shift: false, meta: false });

  const NAMED = {
    Backquote: '`', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\',
    Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/', Space: 'Space',
    Enter: 'Enter', Tab: 'Tab', Backspace: 'Backspace', Escape: 'Esc',
    ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
  };

  const MODIFIER_CODES = /^(Control|Shift|Alt|Meta|OS)(Left|Right)?$/;

  function keyLabel(code) {
    if (!code) return '';
    if (/^Key[A-Z]$/.test(code)) return code.slice(3);
    if (/^Digit\d$/.test(code)) return code.slice(5);
    if (/^Numpad/.test(code)) return 'Num ' + code.slice(6);
    if (/^F\d{1,2}$/.test(code)) return code;
    return NAMED[code] || code;
  }

  // Ordered list of key names, e.g. ["Ctrl", "Q"] or ["⌃ Control", "Q"] on Mac.
  function parts(sc, os) {
    const s = sc || DEFAULT;
    const mac = os === 'mac';
    const out = [];
    if (s.ctrl) out.push(mac ? '⌃ Control' : 'Ctrl');
    if (s.alt) out.push(mac ? '⌥ Option' : 'Alt');
    if (s.shift) out.push(mac ? '⇧ Shift' : 'Shift');
    if (s.meta) out.push(mac ? '⌘ Command' : 'Win');
    out.push(keyLabel(s.code));
    return out;
  }

  function format(sc, os) {
    return parts(sc, os).join(' + ');
  }

  function matches(e, sc) {
    const s = sc || DEFAULT;
    return !!e && e.code === s.code &&
      !!e.ctrlKey === !!s.ctrl && !!e.altKey === !!s.alt &&
      !!e.shiftKey === !!s.shift && !!e.metaKey === !!s.meta;
  }

  // Builds a shortcut from a keydown event. Needs at least Ctrl, Alt or Meta,
  // otherwise it would fire while typing.
  function fromEvent(e) {
    if (!e || !e.code || MODIFIER_CODES.test(e.code)) return null;
    if (!e.ctrlKey && !e.altKey && !e.metaKey) return null;
    return { code: e.code, ctrl: !!e.ctrlKey, alt: !!e.altKey, shift: !!e.shiftKey, meta: !!e.metaKey };
  }

  // Combinations the browser or OS keeps for itself.
  const RESERVED = [
    { code: 'KeyW', ctrl: true }, { code: 'KeyT', ctrl: true }, { code: 'KeyN', ctrl: true },
    { code: 'KeyL', ctrl: true }, { code: 'KeyR', ctrl: true }, { code: 'KeyP', ctrl: true },
    { code: 'KeyC', ctrl: true }, { code: 'KeyV', ctrl: true }, { code: 'KeyX', ctrl: true },
    { code: 'KeyA', ctrl: true }, { code: 'KeyZ', ctrl: true }, { code: 'KeyF', ctrl: true },
    { code: 'KeyQ', ctrl: true, shift: true }, { code: 'Tab', ctrl: true },
    { code: 'KeyQ', meta: true }, { code: 'KeyW', meta: true }, { code: 'KeyT', meta: true },
    { code: 'KeyN', meta: true }, { code: 'KeyC', meta: true }, { code: 'KeyV', meta: true },
    { code: 'KeyA', meta: true }, { code: 'KeyZ', meta: true }, { code: 'Tab', alt: true },
    { code: 'F4', alt: true },
    // macOS system shortcuts: log out, lock screen, hide, minimize, Spotlight, close window.
    { code: 'KeyQ', meta: true, shift: true }, { code: 'KeyQ', meta: true, ctrl: true },
    { code: 'KeyH', meta: true }, { code: 'KeyM', meta: true }, { code: 'Space', meta: true },
    { code: 'Space', ctrl: true }, { code: 'KeyW', meta: true, shift: true },
  ];

  function isReserved(sc) {
    if (!sc) return false;
    return RESERVED.some((r) => r.code === sc.code && !!r.ctrl === !!sc.ctrl && !!r.alt === !!sc.alt &&
      !!r.shift === !!sc.shift && !!r.meta === !!sc.meta);
  }

  function isValid(sc) {
    return !!sc && typeof sc.code === 'string' && !!sc.code && !MODIFIER_CODES.test(sc.code) &&
      (!!sc.ctrl || !!sc.alt || !!sc.meta);
  }

  // Labels for the OS's own select-all / undo, shown next to KeyFlip's shortcut.
  function selectAll(os) {
    return os === 'mac' ? '⌘ Command + A' : 'Ctrl + A';
  }

  function undo(os) {
    return os === 'mac' ? '⌘ Command + Z' : 'Ctrl + Z';
  }

  return { DEFAULT, keyLabel, parts, format, matches, fromEvent, isReserved, isValid, selectAll, undo };
});
