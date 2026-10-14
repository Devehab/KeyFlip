const test = require('node:test');
const assert = require('node:assert/strict');
const { detectOS, fromRuntime, label } = require('../../src/core/platform.js');

test('detects operating systems', () => {
  assert.equal(detectOS({ userAgentData: { platform: 'macOS' } }), 'mac');
  assert.equal(detectOS({ platform: 'MacIntel' }), 'mac');
  assert.equal(detectOS({ platform: 'Win32' }), 'win');
  assert.equal(detectOS({ platform: 'Linux x86_64' }), 'linux');
  assert.equal(detectOS({ userAgent: 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0)' }), 'cros');
  assert.equal(detectOS({}), 'other');
});

test('runtime names and labels', () => {
  assert.equal(fromRuntime('mac'), 'mac');
  assert.equal(fromRuntime('openbsd'), 'other');
  assert.equal(label('mac', 'ar'), 'ماك');
  assert.equal(label('win', 'en'), 'Windows');
});
