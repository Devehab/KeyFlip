const { test, expect, settle } = require('./fixtures');

const page = (id, path) => `chrome-extension://${id}/src/ui/${path}`;

test('settings page switches between English and Arabic (RTL)', async ({ context, extensionId }) => {
  const p = await context.newPage();
  await p.goto(page(extensionId, 'options/options.html'));
  await p.locator('#ui-language button[data-value="en"]').click();
  await expect(p.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(p.locator('#general h1')).toHaveText('General');
  await p.locator('#ui-language button[data-value="ar"]').click();
  await expect(p.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(p.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(p.locator('#general h1')).toHaveText('عام');
  await expect(p.locator('#nav a[href="#keyboards"]')).toHaveText('لوحات المفاتيح');
});

test('theme can be forced to dark', async ({ context, extensionId }) => {
  const p = await context.newPage();
  await p.goto(page(extensionId, 'options/options.html'));
  await p.locator('#theme button[data-value="dark"]').click();
  await expect(p.locator('html')).toHaveAttribute('data-theme', 'dark');
  await p.locator('#theme button[data-value="light"]').click();
  await expect(p.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('choosing layouts updates storage and the keyboard preview', async ({ context, extensionId, storage }) => {
  const p = await context.newPage();
  await p.goto(page(extensionId, 'options/options.html#keyboards'));
  await expect(p.locator('#keyboard .kb-key')).toHaveCount(47);
  await p.selectOption('#layout-b', 'ar-mac');
  await expect.poll(async () => (await storage.get('settings')).layoutB).toBe('ar-mac');
  // Z key shows z / ظ on Mac Arabic.
  await expect(p.locator('#keyboard .kb-key').nth(37)).toContainText('ظ');
  await p.click('#swap');
  await expect.poll(async () => (await storage.get('settings')).layoutA).toBe('ar-mac');
});

test('shortcut recorder saves a new shortcut and rejects reserved ones', async ({ context, extensionId, storage }) => {
  const p = await context.newPage();
  await p.goto(page(extensionId, 'options/options.html#activation'));
  await p.click('#recorder');
  await p.keyboard.press('Control+KeyW');
  await expect(p.locator('#shortcut-warn')).toBeVisible();
  await p.keyboard.press('Alt+Shift+KeyK');
  await expect.poll(async () => (await storage.get('settings')).shortcut).toEqual({ code: 'KeyK', ctrl: false, alt: true, shift: true, meta: false });
  await expect(p.locator('#recorder-combo')).toContainText('Alt');
  await p.click('#shortcut-reset');
  await expect.poll(async () => (await storage.get('settings')).shortcut.code).toBe('KeyQ');
});

test('on a Mac the UI shows ⌃ Control + Q and explains why', async ({ context, extensionId, storage }) => {
  await storage.setSettings({ os: 'mac', uiLanguage: 'en' });
  const p = await context.newPage();
  await p.goto(page(extensionId, 'options/options.html#activation'));
  await expect(p.locator('#recorder-combo')).toHaveText('⌃ Control+Q');
  await expect(p.locator('#shortcut-desc')).toContainText('⌘ Command + A');
  await expect(p.locator('#shortcut-desc')).toContainText('⌃ Control + Q');
  await p.goto(page(extensionId, 'onboarding/welcome.html#step=1'));
  await expect(p.locator('.step[data-step="1"] .mac-hint')).toBeVisible();
  await expect(p.locator('.steps3')).toContainText('Press ⌃ Control + Q');
});

test('on Windows/Linux the UI shows Ctrl + Q and no Mac hint', async ({ context, extensionId, storage }) => {
  await storage.setSettings({ os: 'win', uiLanguage: 'en' });
  const p = await context.newPage();
  await p.goto(page(extensionId, 'onboarding/welcome.html#step=1'));
  await expect(p.locator('.steps3')).toContainText('Press Ctrl + Q');
  await expect(p.locator('.step[data-step="1"] .mac-hint')).toBeHidden();
  await expect(p.locator('.steps3')).toContainText('right-click');
});

test('popup shows stats, the shortcut and a working quick flip', async ({ context, extensionId, serviceWorker }) => {
  await serviceWorker.evaluate(async () => {
    const S = self.KeyFlip.stats;
    let s = S.empty();
    for (let i = 0; i < 3; i++) s = S.record(s, { chars: 100, wpm: 40 });
    await chrome.storage.local.set({ stats: s });
    await self.KeyFlip.settings.save({ uiLanguage: 'en' });
  });
  const p = await context.newPage();
  await p.setViewportSize({ width: 380, height: 700 });
  await p.goto(page(extensionId, 'popup/popup.html'));
  await expect(p.locator('#kpis .kpi').nth(1)).toContainText('3');
  await expect(p.locator('#combo')).toContainText('Q');
  await p.locator('#quick summary').click();
  await p.fill('#quick-in', ';dt phg;');
  await expect(p.locator('#quick-text')).toHaveText('كيف حالك');
  await p.locator('#lang button[data-value="ar"]').click();
  await expect(p.locator('html')).toHaveAttribute('dir', 'rtl');
});

test('statistics page renders KPIs, chart and achievements', async ({ context, extensionId, serviceWorker }) => {
  await serviceWorker.evaluate(async () => {
    const S = self.KeyFlip.stats;
    let s = S.empty();
    for (let i = 0; i < 12; i++) s = S.record(s, { chars: 120, wpm: 40, ambiguities: 1 });
    await chrome.storage.local.set({ stats: s });
  });
  const p = await context.newPage();
  await p.goto(page(extensionId, 'options/options.html#stats'));
  await expect(p.locator('#kpis .kpi')).toHaveCount(3);
  await expect(p.locator('#chart .bar')).toHaveCount(14);
  await expect(p.locator('#achievements .ach:not(.locked)')).toHaveCount(4);
  await expect(p.locator('#share-text')).toContainText('12');
  await expect(p.locator('#share-x')).toHaveAttribute('href', /^https:\/\/x\.com\/intent\/post\?text=/);
});

test('welcome tour: pick Arabic, set keyboards, flip the practice text', async ({ context, extensionId, storage }) => {
  await storage.setSettings({ os: 'win' });
  const p = await context.newPage();
  await p.goto(page(extensionId, 'onboarding/welcome.html'));
  await p.locator('.lang-card[data-lang="ar"]').click();
  await expect(p.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(p.locator('.step[data-step="1"] .title')).toHaveText('كتبت والكيبورد على اللغة الغلط؟');
  await expect(p.locator('#privacy-note')).toBeVisible();
  await p.click('#next');
  await expect(p.locator('#layout-b')).toHaveValue('ar-101');
  await p.click('#next');
  const ta = p.locator('#try');
  await expect(ta).toHaveValue(/;dt phg;/);
  await ta.focus();
  await p.keyboard.press('Control+KeyA');
  await p.keyboard.press('Control+KeyQ');
  await expect(ta).toHaveValue('كيف حالك؟ هذه تجربة سريعة');
  await expect(p.locator('#try-success')).toBeVisible();
  await expect(p.locator('.step[data-step="4"]')).toBeVisible({ timeout: 5000 });
  await p.click('#open-settings');
  await expect.poll(async () => (await storage.get('settings')).onboarded).toBe(true);
});

test('layout detector recognises Mac Arabic from real key events', async ({ context, extensionId, storage }) => {
  const p = await context.newPage();
  await p.goto(page(extensionId, 'options/options.html#keyboards'));
  // Simulate typing with the Mac Arabic layout active: physical keys, Arabic characters.
  const keys = [['KeyZ', 'ظ'], ['KeyX', 'ط'], ['BracketRight', 'ة'], ['KeyB', 'ز'], ['KeyN', 'ر'], ['KeyM', 'و']];
  await p.locator('#detect-input').evaluate((el, ks) => {
    el.focus();
    for (const [code, key] of ks) el.dispatchEvent(new KeyboardEvent('keydown', { code, key, bubbles: true }));
  }, keys);
  await expect(p.locator('#detect-result')).toContainText('Mac');
  await p.click('#detect-use');
  await expect.poll(async () => (await storage.get('settings')).layoutB).toBe('ar-mac');
});

test('paused site list can be edited from settings', async ({ context, extensionId, storage }) => {
  await storage.setSettings({ disabledSites: ['example.com'], uiLanguage: 'en' });
  const p = await context.newPage();
  await p.goto(page(extensionId, 'options/options.html#activation'));
  await expect(p.locator('#sites li')).toHaveText(/example\.com/);
  await p.locator('#sites li button').click();
  await expect.poll(async () => (await storage.get('settings')).disabledSites).toEqual([]);
  await settle(p);
  await expect(p.locator('#sites li.empty')).toBeVisible();
});

test('context menu title is localised and shows the right shortcut', async ({ serviceWorker, storage }) => {
  await storage.setSettings({ uiLanguage: 'ar', os: 'mac' });
  await serviceWorker.evaluate(() => self.KeyFlipBackground.rebuildMenu());
  // The title is only observable through creation; recreate and read our own function's output.
  const title = await serviceWorker.evaluate(async () => {
    const { i18n, shortcut, settings } = self.KeyFlip;
    const cfg = await settings.load();
    return i18n.t(i18n.resolve(cfg.uiLanguage), 'menuFlip', { shortcut: shortcut.format(cfg.shortcut, cfg.os) });
  });
  expect(title.replace(/[\u2066-\u2069]/g, '')).toBe('صحّح لغة الكيبورد (⌃ Control + Q)');
});

test('popup learns the current site from the page itself (no tab permission)', async ({ context, extensionId, server, storage }) => {
  await storage.setSettings({ uiLanguage: 'en' });
  const site = await context.newPage();
  await site.goto(server.url('page.html'));
  await site.waitForTimeout(400);
  // Open the popup in a separate window so the test page stays the active tab.
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/src/ui/popup/popup.html`);
  // Simulate the toolbar popup: answer for the page's tab.
  const host = await popup.evaluate(async () => {
    const tabs = await chrome.tabs.query({});
    for (const t of tabs) {
      try {
        const r = await chrome.tabs.sendMessage(t.id, { type: 'keyflip:host' }, { frameId: 0 });
        if (r && r.host === '127.0.0.1') return r.host;
      } catch { /* no content script */ }
    }
    return null;
  });
  expect(host).toBe('127.0.0.1');
  await expect(popup.locator('.privacy-line')).toContainText('never leaves');
});
