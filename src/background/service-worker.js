// KeyFlip service worker: install flow, context menu, command and statistics.
importScripts(
  '../core/layouts.data.js',
  '../core/layouts.js',
  '../core/shortcut.js',
  '../core/settings.js',
  '../core/stats.js',
  '../core/i18n.js',
  '../core/platform.js',
);

const { settings: Settings, stats: Stats, i18n, shortcut: Shortcut, layouts, platform } = self.KeyFlip;
const MENU_ID = 'keyflip-flip';

// ---------- install / update ----------

// Tabs that were open before an install or update have no (or an orphaned)
// content script. Inject the same files the manifest declares so KeyFlip works
// there right away, without asking the user to reload every page.
async function injectIntoOpenTabs() {
  const files = chrome.runtime.getManifest().content_scripts[0].js;
  const tabs = await chrome.tabs.query({});
  const results = await Promise.allSettled(tabs.map((tab) => chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: true },
    files,
  })));
  return results.filter((r) => r.status === 'fulfilled').length;
}

chrome.runtime.onInstalled.addListener(async (details) => {
  injectIntoOpenTabs().catch(() => {});
  const info = await chrome.runtime.getPlatformInfo();
  const os = platform.fromRuntime(info.os);
  const current = await Settings.load();
  if (details.reason === 'install') {
    await Settings.save(Object.assign({}, layouts.defaultsFor(os), { os }));
    chrome.tabs.create({ url: chrome.runtime.getURL('src/ui/onboarding/welcome.html') });
  } else {
    await Settings.save(Object.assign({}, current, { os }));
  }
  await rebuildMenu();
});

chrome.runtime.onStartup.addListener(rebuildMenu);

// Site access granted again (after the user had restricted it): start working
// in the open tabs straight away.
chrome.permissions.onAdded.addListener((perms) => {
  if (perms.origins && perms.origins.length) injectIntoOpenTabs().catch(() => {});
});

// ---------- context menu ----------

async function rebuildMenu() {
  const cfg = await Settings.load();
  await chrome.contextMenus.removeAll();
  if (!cfg.contextMenu || !cfg.enabled) return;
  const lang = i18n.resolve(cfg.uiLanguage);
  chrome.contextMenus.create({
    id: MENU_ID,
    title: i18n.t(lang, 'menuFlip', { shortcut: Shortcut.format(cfg.shortcut, cfg.os) }),
    contexts: ['selection', 'editable'],
  });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes[Settings.KEY]) return;
  const before = changes[Settings.KEY].oldValue || {};
  const after = changes[Settings.KEY].newValue || {};
  const keys = ['contextMenu', 'enabled', 'uiLanguage', 'shortcut'];
  if (keys.some((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]))) rebuildMenu();
});

// Sends a flip request; if the tab has no live content script (opened before
// an update, for example), injects it once and tries again.
async function sendFlip(tabId, frameId, source) {
  const opts = typeof frameId === 'number' ? { frameId } : undefined;
  const msg = { type: 'keyflip:flip', source, requireFocus: opts === undefined };
  try {
    return await chrome.tabs.sendMessage(tabId, msg, opts);
  } catch (e) {
    try {
      const target = opts ? { tabId, frameIds: [frameId] } : { tabId, allFrames: true };
      await chrome.scripting.executeScript({ target, files: chrome.runtime.getManifest().content_scripts[0].js });
      return await chrome.tabs.sendMessage(tabId, msg, opts);
    } catch (err) {
      return null;
    }
  }
}

async function handleMenuClick(info, tab) {
  if (info.menuItemId !== MENU_ID || !tab || tab.id === undefined) return null;
  const res = await sendFlip(tab.id, info.frameId, 'menu');
  if (!res) await explainBlocked(info.selectionText || '');
  return res;
}

// The page can't be edited (browser pages, the extension store, or site access
// was restricted by the user). Open the popup with the text already flipped.
async function explainBlocked(text) {
  await chrome.storage.session.set({ pending: { text, at: Date.now() } });
  try {
    await chrome.action.openPopup();
  } catch (e) {
    await chrome.action.setBadgeBackgroundColor({ color: '#e5484d' });
    await chrome.action.setBadgeText({ text: '!' });
  }
}

chrome.contextMenus.onClicked.addListener(handleMenuClick);

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== 'flip-selection') return;
  const target = tab || (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
  if (target && target.id !== undefined) sendFlip(target.id, undefined, 'command');
});

// ---------- statistics (single writer to avoid races between tabs) ----------

let queue = Promise.resolve();

function recordFlip(event) {
  queue = queue.then(async () => {
    const cfg = await Settings.load();
    const got = await chrome.storage.local.get(Settings.STATS_KEY);
    const next = Stats.record(got[Settings.STATS_KEY], {
      chars: event.chars, ambiguities: event.ambiguities, wpm: cfg.typingWpm,
    });
    await chrome.storage.local.set({ [Settings.STATS_KEY]: next });
    return next;
  }).catch(() => null);
  return queue;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg.type !== 'string' || sender.id !== chrome.runtime.id) return undefined;
  if (msg.type === 'keyflip:record') {
    recordFlip(msg).then((s) => sendResponse({ ok: !!s }));
    return true;
  }
  if (msg.type === 'keyflip:openOptions') {
    chrome.runtime.openOptionsPage();
    return undefined;
  }
  return undefined;
});

// Exposed for tests.
self.KeyFlipBackground = { rebuildMenu, handleMenuClick, recordFlip, injectIntoOpenTabs, explainBlocked };
