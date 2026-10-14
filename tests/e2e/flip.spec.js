const { test, expect, ready, settle } = require('./fixtures');

const MOD = 'Control';
const flipKeys = `${MOD}+KeyQ`;

async function open(context, server) {
  const page = await context.newPage();
  await page.goto(server.url('page.html'));
  await ready(page);
  return page;
}

async function typeAndSelect(page, selector, text) {
  await page.fill(selector, text);
  await page.focus(selector);
  await page.keyboard.press(`${MOD}+KeyA`);
}

test('opens the welcome page right after install', async ({ context, extensionId }) => {
  await expect.poll(() => context.pages().map((p) => p.url()).join(' ')).toContain(`chrome-extension://${extensionId}/src/ui/onboarding/welcome.html`);
});

test('Ctrl+Q flips a selected input, and again flips it back', async ({ context, server }) => {
  const page = await open(context, server);
  await typeAndSelect(page, '#input', ';dt phg;');
  await page.keyboard.press(flipKeys);
  await expect(page.locator('#input')).toHaveValue('كيف حالك');
  // The flipped text stays selected, so a second press undoes the flip.
  await page.keyboard.press(flipKeys);
  await expect(page.locator('#input')).toHaveValue(';dt phg;');
});

test('Arabic gibberish in a textarea becomes English', async ({ context, server }) => {
  const page = await open(context, server);
  await typeAndSelect(page, '#textarea', 'شؤؤخعىف ىعةلاثق');
  await page.keyboard.press(flipKeys);
  await expect(page.locator('#textarea')).toHaveValue('account number');
});

test('only the selected part changes', async ({ context, server }) => {
  const page = await open(context, server);
  await page.fill('#input', 'hello ;dt phg;');
  await page.locator('#input').evaluate((el) => { el.focus(); el.setSelectionRange(6, 14); });
  await page.keyboard.press(flipKeys);
  await expect(page.locator('#input')).toHaveValue('hello كيف حالك');
});

test('with nothing selected the whole field is flipped', async ({ context, server }) => {
  const page = await open(context, server);
  await page.fill('#input', ';dt phg;');
  await page.focus('#input');
  await page.keyboard.press('End');
  await page.keyboard.press(flipKeys);
  await expect(page.locator('#input')).toHaveValue('كيف حالك');
  // Caret ends after the text, so typing continues naturally.
  expect(await page.locator('#input').evaluate((el) => [el.selectionStart, el.selectionEnd])).toEqual([8, 8]);
});

test('"last word" mode flips only the word before the caret', async ({ context, server, storage }) => {
  const page = await open(context, server);
  await storage.setSettings({ noSelection: 'word' });
  await settle(page);
  await page.fill('#input', 'hello ;dt');
  await page.focus('#input');
  await page.keyboard.press('End');
  await page.keyboard.press(flipKeys);
  await expect(page.locator('#input')).toHaveValue('hello كيف');
});

test('works in contenteditable editors', async ({ context, server }) => {
  const page = await open(context, server);
  await page.click('#editable');
  await page.keyboard.insertText('hgsghl ugd;l');
  await page.keyboard.press(`${MOD}+KeyA`);
  await page.keyboard.press(flipKeys);
  await expect(page.locator('#editable')).toHaveText('السلام عليكم');
});

test('works inside iframes', async ({ context, server }) => {
  const page = await open(context, server);
  const frame = page.frameLocator('#frame');
  await frame.locator('#inner').fill(';dt');
  await frame.locator('#inner').focus();
  await page.keyboard.press(`${MOD}+KeyA`);
  await page.keyboard.press(flipKeys);
  await expect(frame.locator('#inner')).toHaveValue('كيف');
});

test('undo history is kept (Ctrl+Z restores the original)', async ({ context, server }) => {
  const page = await open(context, server);
  await page.click('#textarea');
  await page.keyboard.insertText(';dt phg;');
  await page.keyboard.press(`${MOD}+KeyA`);
  await page.keyboard.press(flipKeys);
  await expect(page.locator('#textarea')).toHaveValue('كيف حالك');
  await page.keyboard.press(`${MOD}+KeyZ`);
  await expect(page.locator('#textarea')).toHaveValue(';dt phg;');
});

test('fires input events so web apps notice the change', async ({ context, server }) => {
  const page = await open(context, server);
  await page.fill('#counted', ';dt');
  const before = await page.evaluate(() => window.inputEvents);
  await page.focus('#counted');
  await page.keyboard.press(`${MOD}+KeyA`);
  await page.keyboard.press(flipKeys);
  await expect(page.locator('#counted')).toHaveValue('كيف');
  expect(await page.evaluate(() => window.inputEvents)).toBeGreaterThan(before);
});

test('never touches password or read-only fields', async ({ context, server }) => {
  const page = await open(context, server);
  await typeAndSelect(page, '#password', ';dt phg;');
  await page.keyboard.press(flipKeys);
  await expect(page.locator('#password')).toHaveValue(';dt phg;');
  await page.focus('#readonly');
  await page.keyboard.press(`${MOD}+KeyA`);
  await page.keyboard.press(flipKeys);
  await expect(page.locator('#readonly')).toHaveValue(';dt phg;');
});

test('smart mode resolves لا with the word list', async ({ context, server }) => {
  const page = await open(context, server);
  await typeAndSelect(page, '#input', 'قهلاف يخعلاف');
  await page.keyboard.press(flipKeys);
  await expect(page.locator('#input')).toHaveValue('right doubt');
});

test('unknown لا words open the chooser; picking an option applies it', async ({ context, server }) => {
  const page = await open(context, server);
  await typeAndSelect(page, '#input', 'ءلاغ');
  await page.keyboard.press(flipKeys);
  const dialog = page.locator('keyflip-ui .dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.chip')).toHaveText(['1xby', '2xghy']);
  await dialog.locator('.chip').nth(1).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('#input')).toHaveValue('xghy');
});

test('"always ask" mode asks even for known words; Escape cancels', async ({ context, server, storage }) => {
  const page = await open(context, server);
  await storage.setSettings({ ambiguity: 'ask' });
  await settle(page);
  await typeAndSelect(page, '#input', 'قهلاف');
  await page.keyboard.press(flipKeys);
  const dialog = page.locator('keyflip-ui .dialog');
  await expect(dialog).toBeVisible();
  // The known word is pre-selected.
  await expect(dialog.locator('.chip[aria-pressed="true"]')).toHaveText('2right');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.locator('#input')).toHaveValue('قهلاف');
  // Enter accepts the pre-selected reading.
  await page.keyboard.press(flipKeys);
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('#input')).toHaveValue('right');
});

test('"always two keys" mode never asks', async ({ context, server, storage }) => {
  const page = await open(context, server);
  await storage.setSettings({ ambiguity: 'double' });
  await settle(page);
  await typeAndSelect(page, '#input', 'لاخخن');
  await page.keyboard.press(flipKeys);
  await expect(page.locator('#input')).toHaveValue('ghook');
});

test('floating button appears on selection and flips on click', async ({ context, server }) => {
  const page = await open(context, server);
  await page.fill('#input', ';dt phg;');
  await page.locator('#input').selectText();
  const fab = page.locator('keyflip-ui .fab');
  await expect(fab).toHaveClass(/show/);
  await expect(fab.locator('.dir')).toHaveText('EN → ع');
  await fab.click();
  await expect(page.locator('#input')).toHaveValue('كيف حالك');
});

test('floating button can be turned off', async ({ context, server, storage }) => {
  const page = await open(context, server);
  await storage.setSettings({ showFab: false });
  await settle(page);
  await page.fill('#input', ';dt phg;');
  await page.locator('#input').selectText();
  await page.waitForTimeout(400);
  await expect(page.locator('keyflip-ui .fab.show')).toHaveCount(0);
});

test('right-click menu action flips the selection', async ({ context, server, serviceWorker }) => {
  const page = await open(context, server);
  await page.bringToFront();
  await typeAndSelect(page, '#input', ';dt phg;');
  await serviceWorker.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    return self.KeyFlipBackground.handleMenuClick({ menuItemId: 'keyflip-flip', frameId: 0 }, tab);
  });
  await expect(page.locator('#input')).toHaveValue('كيف حالك');
});

test('context menu entry is registered and follows the setting', async ({ serviceWorker, storage }) => {
  const count = () => serviceWorker.evaluate(() => new Promise((resolve) => {
    chrome.contextMenus.update('keyflip-flip', {}, () => resolve(chrome.runtime.lastError ? 0 : 1));
  }));
  await expect.poll(count).toBe(1);
  await storage.setSettings({ contextMenu: false });
  await expect.poll(count).toBe(0);
});

test('a custom shortcut replaces Ctrl+Q', async ({ context, server, storage }) => {
  const page = await open(context, server);
  await storage.setSettings({ shortcut: { code: 'KeyK', ctrl: false, alt: true, shift: true, meta: false } });
  await settle(page);
  await typeAndSelect(page, '#input', ';dt');
  await page.keyboard.press(flipKeys);
  await expect(page.locator('#input')).toHaveValue(';dt');
  await page.keyboard.press('Alt+Shift+KeyK');
  await expect(page.locator('#input')).toHaveValue('كيف');
});

test('paused sites and the global switch are respected', async ({ context, server, storage }) => {
  const page = await open(context, server);
  await storage.setSettings({ disabledSites: ['127.0.0.1'] });
  await settle(page);
  await typeAndSelect(page, '#input', ';dt');
  await page.keyboard.press(flipKeys);
  await expect(page.locator('#input')).toHaveValue(';dt');
  await storage.setSettings({ disabledSites: [], enabled: false });
  await settle(page);
  await page.keyboard.press(flipKeys);
  await expect(page.locator('#input')).toHaveValue(';dt');
  await storage.setSettings({ enabled: true });
  await settle(page);
  await page.keyboard.press(flipKeys);
  await expect(page.locator('#input')).toHaveValue('كيف');
});

test('page text (not editable) is shown flipped in a card', async ({ context, server }) => {
  const page = await open(context, server);
  await page.locator('#gibberish').selectText();
  await page.keyboard.press(flipKeys);
  const card = page.locator('keyflip-ui .card');
  await expect(card).toBeVisible();
  await expect(card.locator('.body')).toHaveText('كيف حالك');
  await expect(page.locator('#gibberish')).toHaveText(';dt phg;');
});

test('Mac Arabic layout is honoured', async ({ context, server, storage }) => {
  const page = await open(context, server);
  await storage.setSettings({ layoutB: 'ar-mac' });
  await settle(page);
  await typeAndSelect(page, '#input', 'z] 123');
  await page.keyboard.press(flipKeys);
  await expect(page.locator('#input')).toHaveValue('ظة ١٢٣');
});

test('each flip is counted in the statistics', async ({ context, server, storage }) => {
  const page = await open(context, server);
  await typeAndSelect(page, '#input', ';dt phg;');
  await page.keyboard.press(flipKeys);
  await expect(page.locator('#input')).toHaveValue('كيف حالك');
  await expect.poll(async () => (await storage.get('stats') || {}).flips).toBe(1);
  const stats = await storage.get('stats');
  expect(stats.chars).toBe(8);
  expect(stats.seconds).toBeGreaterThan(2);
});

test('the confirmation bubble appears in the chosen UI language', async ({ context, server, storage }) => {
  const page = await open(context, server);
  await storage.setSettings({ uiLanguage: 'ar' });
  await settle(page);
  await typeAndSelect(page, '#input', ';dt phg;');
  await page.keyboard.press(flipKeys);
  await expect(page.locator('keyflip-ui .toast')).toContainText('تم قلب 8 أحرف');
});
