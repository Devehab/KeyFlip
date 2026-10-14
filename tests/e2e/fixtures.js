// Shared fixtures: a Chromium profile with KeyFlip loaded and a local test site.
const { test: base, expect } = require('@playwright/test');
const { launchWithExtension, EXTENSION } = require('./browsers');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const FIXTURES = path.join(__dirname, '..', 'fixtures');

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const file = path.join(FIXTURES, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      if (!file.startsWith(FIXTURES) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      res.writeHead(200, { 'content-type': file.endsWith('.html') ? 'text/html; charset=utf-8' : 'text/plain' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

// Browsers such as Edge run service workers of their own; pick KeyFlip's.
const isKeyFlipWorker = (w) => /^chrome-extension:\/\/[a-p]{32}\/src\/background\/service-worker\.js$/.test(w.url());

async function installedWorker(context) {
  let sw = context.serviceWorkers().find(isKeyFlipWorker);
  while (!sw) {
    const w = await context.waitForEvent('serviceworker', { timeout: 30000 });
    if (isKeyFlipWorker(w)) sw = w;
  }
  // Wait for the install handler to write the OS-specific defaults. Right after
  // start-up some browsers expose the worker before its chrome.* APIs.
  const installed = () => sw.evaluate(() => chrome.storage.local.get('settings').then((r) => !!(r.settings && r.settings.os))).catch(() => false);
  await expect.poll(installed, { timeout: 30000 }).toBe(true);
  // The install handler then opens the welcome tab; let it appear before tests
  // open their own pages so it doesn't steal focus from them.
  const welcome = () => context.pages().some((p) => p.url().includes('/src/ui/onboarding/welcome.html'));
  await expect.poll(welcome, { timeout: 10000 }).toBe(true);
  return sw;
}

const test = base.extend({
  // eslint-disable-next-line no-empty-pattern
  server: [async ({}, use) => {
    const server = await startServer();
    await use({ url: (p) => `http://127.0.0.1:${server.address().port}/${p}` });
    server.close();
  }, { scope: 'worker' }],

  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const { context, close } = await launchWithExtension();
    // Hand the browser over only once KeyFlip is fully installed, so every test
    // starts from the state a real user has (extension ready before browsing).
    context.keyflipWorker = await installedWorker(context);
    await use(context);
    await close();
  },

  // On failure, print and attach what KeyFlip saw, plus the pages' console.
  diagnostics: [async ({ context }, use, testInfo) => {
    const log = [];
    context.on('console', (m) => log.push(`${m.type()}: ${m.text()}`));
    context.on('weberror', (e) => log.push(`error: ${e.error().message}`));
    await use();
    if (testInfo.status === testInfo.expectedStatus) return;
    const state = await diagnose(context).catch((e) => ({ error: String(e) }));
    const body = JSON.stringify({ state, console: log.slice(-40) }, null, 2);
    await testInfo.attach('keyflip-diagnostics', { body, contentType: 'application/json' });
    console.log(`--- KeyFlip diagnostics: ${testInfo.title}\n${body}`);
  }, { auto: true }],

  serviceWorker: async ({ context }, use) => {
    await use(context.keyflipWorker);
  },

  extensionId: async ({ serviceWorker }, use) => {
    await use(new URL(serviceWorker.url()).host);
  },

  // Helpers to read/write extension storage through the service worker.
  storage: async ({ serviceWorker }, use) => {
    await use({
      get: (key) => serviceWorker.evaluate((k) => chrome.storage.local.get(k).then((r) => r[k]), key),
      setSettings: (patch) => serviceWorker.evaluate(async (p) => {
        const { settings } = self.KeyFlip;
        return settings.save(p);
      }, patch),
      reset: () => serviceWorker.evaluate(() => chrome.storage.local.clear()),
    });
  },
});

// Asks the extension, which can see its own isolated world, whether KeyFlip's
// content script is running in every tab showing this page.
function running(page) {
  return page.context().keyflipWorker.evaluate(async (url) => {
    const tabs = (await chrome.tabs.query({})).filter((t) => t.url === url);
    if (!tabs.length) return false;
    const results = await Promise.all(tabs.map((t) => chrome.scripting.executeScript({
      target: { tabId: t.id },
      func: () => !!globalThis.__keyflipInstance,
    })));
    return results.every(([r]) => r.result === true);
  }, page.url()).catch(() => false);
}

// Content scripts run at document_idle and read settings asynchronously.
async function ready(page) {
  await page.waitForLoadState('load');
  const started = Date.now();
  await expect.poll(() => running(page), { timeout: 10000, message: `KeyFlip is running in ${page.url()}` }).toBe(true);
  const waited = Date.now() - started;
  if (waited > 1000) console.log(`KeyFlip started in ${page.url()} ${waited} ms after load`);
  await page.waitForTimeout(400);
}

// Everything KeyFlip can see when a test fails: open tabs, whether its content
// script runs in each frame, focus and selection there, settings, permissions.
function diagnose(context) {
  return context.keyflipWorker.evaluate(async () => {
    const probe = () => {
      const kf = globalThis.__keyflipInstance;
      const el = document.activeElement;
      return {
        frame: location.href,
        instance: !!kf,
        runtime: !!(globalThis.chrome && chrome.runtime && chrome.runtime.id),
        settings: kf ? { enabled: kf.settings.enabled, shortcut: kf.settings.shortcut, paused: kf.settings.disabledSites } : null,
        hasFocus: document.hasFocus(),
        visibility: document.visibilityState,
        active: el ? el.tagName + (el.id ? `#${el.id}` : '') : null,
        selection: el && 'selectionStart' in el ? [el.selectionStart, el.selectionEnd] : null,
      };
    };
    const tabs = [];
    for (const t of await chrome.tabs.query({})) {
      const row = { id: t.id, url: t.url, active: t.active, status: t.status, window: t.windowId };
      if (/^https?:/.test(t.url || '')) {
        try {
          row.frames = (await chrome.scripting.executeScript({ target: { tabId: t.id, allFrames: true }, func: probe })).map((f) => f.result);
        } catch (e) { row.error = String((e && e.message) || e); }
      }
      tabs.push(row);
    }
    const { settings } = await chrome.storage.local.get('settings');
    return { version: chrome.runtime.getManifest().version, settings, permissions: await chrome.permissions.getAll(), tabs };
  });
}

// Settings reach open tabs through storage events.
async function settle(page) {
  await page.waitForTimeout(250);
}

module.exports = { test, expect, ready, settle, EXTENSION };
