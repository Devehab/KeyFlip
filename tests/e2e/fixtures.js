// Shared fixtures: a Chromium profile with KeyFlip loaded and a local test site.
const { test: base, expect, chromium } = require('@playwright/test');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const EXTENSION = path.join(__dirname, '..', '..');
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

const test = base.extend({
  // eslint-disable-next-line no-empty-pattern
  server: [async ({}, use) => {
    const server = await startServer();
    await use({ url: (p) => `http://127.0.0.1:${server.address().port}/${p}` });
    server.close();
  }, { scope: 'worker' }],

  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      headless: !process.env.HEADED,
      locale: 'en-US',
      args: [`--disable-extensions-except=${EXTENSION}`, `--load-extension=${EXTENSION}`],
    });
    await use(context);
    await context.close();
  },

  serviceWorker: async ({ context }, use) => {
    let [sw] = context.serviceWorkers();
    if (!sw) sw = await context.waitForEvent('serviceworker');
    // Wait for the install handler to finish writing the OS-specific defaults.
    await expect.poll(() => sw.evaluate(() => chrome.storage.local.get('settings').then((r) => !!(r.settings && r.settings.os)))).toBe(true);
    await use(sw);
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

// Content scripts run at document_idle and read settings asynchronously.
async function ready(page) {
  await page.waitForLoadState('load');
  await page.waitForTimeout(400);
}

// Settings reach open tabs through storage events.
async function settle(page) {
  await page.waitForTimeout(250);
}

module.exports = { test, expect, ready, settle, EXTENSION };
