const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../../src/core/shortcut.js');

const ev = (code, mods) => Object.assign({ code, ctrlKey: false, altKey: false, shiftKey: false, metaKey: false }, mods);

test('matches by physical key, whatever the layout types', () => {
  assert.ok(S.matches(ev('KeyQ', { ctrlKey: true, key: 'ض' }), S.DEFAULT));
  assert.ok(!S.matches(ev('KeyQ', { ctrlKey: true, shiftKey: true }), S.DEFAULT));
  assert.ok(!S.matches(ev('KeyQ', {}), S.DEFAULT));
  assert.ok(!S.matches(ev('KeyW', { ctrlKey: true }), S.DEFAULT));
});

test('fromEvent requires a modifier and a real key', () => {
  assert.equal(S.fromEvent(ev('KeyK', {})), null);
  assert.equal(S.fromEvent(ev('ControlLeft', { ctrlKey: true })), null);
  assert.deepEqual(S.fromEvent(ev('KeyK', { altKey: true, shiftKey: true })), { code: 'KeyK', ctrl: false, alt: true, shift: true, meta: false });
});

test('reserved browser shortcuts are refused', () => {
  assert.ok(S.isReserved({ code: 'KeyW', ctrl: true }));
  assert.ok(S.isReserved({ code: 'KeyQ', meta: true }));
  assert.ok(!S.isReserved(S.DEFAULT));
});

test('formatting', () => {
  assert.equal(S.format(S.DEFAULT, 'win'), 'Ctrl + Q');
  assert.equal(S.format({ code: 'Slash', alt: true, shift: true }, 'win'), 'Alt + Shift + /');
  assert.deepEqual(S.parts(S.DEFAULT, 'mac'), ['⌃ Control', 'Q']);
  assert.equal(S.keyLabel('Digit7'), '7');
});

test('Mac uses the Control key, never Command+Q', () => {
  // The default is the physical Control key on every OS (event.ctrlKey).
  assert.equal(S.DEFAULT.ctrl, true);
  assert.equal(S.DEFAULT.meta, false);
  assert.equal(S.format(S.DEFAULT, 'mac'), '⌃ Control + Q');
  assert.equal(S.format(S.DEFAULT, 'win'), 'Ctrl + Q');
  assert.ok(S.matches(ev('KeyQ', { ctrlKey: true }), S.DEFAULT));
  assert.ok(!S.matches(ev('KeyQ', { metaKey: true }), S.DEFAULT));
});

test('macOS system shortcuts cannot be recorded', () => {
  assert.ok(S.isReserved({ code: 'KeyQ', meta: true, shift: true }));
  assert.ok(S.isReserved({ code: 'KeyQ', meta: true, ctrl: true }));
  assert.ok(S.isReserved({ code: 'Space', meta: true }));
});

test('select-all and undo labels follow the OS', () => {
  assert.equal(S.selectAll('mac'), '⌘ Command + A');
  assert.equal(S.selectAll('win'), 'Ctrl + A');
  assert.equal(S.undo('mac'), '⌘ Command + Z');
  assert.equal(S.undo('linux'), 'Ctrl + Z');
});
