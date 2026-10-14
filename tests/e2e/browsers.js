// Launches a Chromium-family browser with KeyFlip installed.
//   KF_BROWSER = chromium (default) | chrome | msedge | brave | opera
//   KF_BROWSER_PATH = optional executable path (brave/opera)
//   KF_LOAD = flag | cdp   (how the unpacked extension is loaded)
const { chromium } = require('@playwright/test');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const EXTENSION = path.join(__dirname, '..', '..');

const BROWSERS = {
  chromium: { channel: 'chromium', load: 'flag' },
  msedge: { channel: 'msedge', load: 'flag' },
  // Google Chrome ignores --load-extension since v137; the supported route for
  // automation is the CDP Extensions.loadUnpacked command.
  chrome: { channel: 'chrome', load: 'cdp', exe: ['/opt/google/chrome/chrome', '/usr/bin/google-chrome'] },
  brave: { load: 'flag', exe: ['/usr/bin/brave-browser', '/opt/brave.com/brave/brave'] },
  opera: { load: 'flag', exe: ['/usr/bin/opera', '/usr/lib/x86_64-linux-gnu/opera/opera'] },
};

function which() {
  const name = process.env.KF_BROWSER || 'chromium';
  const cfg = BROWSERS[name];
  if (!cfg) throw new Error(`Unknown KF_BROWSER "${name}"`);
  const exe = process.env.KF_BROWSER_PATH || (cfg.exe || []).find((p) => fs.existsSync(p));
  return { name, ...cfg, load: process.env.KF_LOAD || cfg.load, exe };
}

const COMMON_ARGS = ['--no-first-run', '--no-default-browser-check', '--disable-search-engine-choice-screen', '--lang=en-US'];

async function launchWithFlag(b) {
  const opts = {
    headless: !process.env.HEADED,
    locale: 'en-US',
    args: [...COMMON_ARGS, `--disable-extensions-except=${EXTENSION}`, `--load-extension=${EXTENSION}`],
  };
  if (b.exe && !b.channel) opts.executablePath = b.exe;
  else opts.channel = b.channel;
  const context = await chromium.launchPersistentContext('', opts);
  return { context, close: () => context.close() };
}

// Starts the browser ourselves with a debugging port, connects over CDP and
// installs the unpacked extension through Extensions.loadUnpacked.
async function launchWithCdp(b) {
  const exe = b.exe || chromium.executablePath();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'keyflip-profile-'));
  const args = [
    ...COMMON_ARGS,
    '--remote-debugging-port=0',
    '--enable-unsafe-extension-debugging',
    `--user-data-dir=${profile}`,
    '--password-store=basic',
    '--use-mock-keychain',
  ];
  if (!process.env.HEADED) args.push('--headless=new');
  // Chromium refuses to start as root with its sandbox (only happens in containers).
  if (typeof process.getuid === 'function' && process.getuid() === 0) args.push('--no-sandbox');
  args.push('about:blank');
  const proc = spawn(exe, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    const timer = setTimeout(() => reject(new Error(`No DevTools endpoint from ${exe}\n${buf}`)), 30000);
    proc.stderr.on('data', (d) => {
      buf += d;
      const m = /DevTools listening on (ws:\/\/\S+)/.exec(buf);
      if (m) { clearTimeout(timer); resolve(m[1]); }
    });
    proc.on('exit', (code) => reject(new Error(`${exe} exited with ${code}\n${buf}`)));
  });
  const browser = await chromium.connectOverCDP(wsUrl);
  const session = await browser.newBrowserCDPSession();
  await session.send('Extensions.loadUnpacked', { path: EXTENSION });
  const context = browser.contexts()[0];
  return {
    context,
    close: async () => {
      await browser.close().catch(() => {});
      if (proc.exitCode === null) {
        const exited = new Promise((resolve) => proc.once('exit', resolve));
        proc.kill('SIGKILL');
        await exited;
      }
      try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* temp dir */ }
    },
  };
}

async function launchWithExtension() {
  const b = which();
  return b.load === 'cdp' ? launchWithCdp(b) : launchWithFlag(b);
}

module.exports = { launchWithExtension, which, EXTENSION };
