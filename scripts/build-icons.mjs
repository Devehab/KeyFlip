#!/usr/bin/env node
// Renders the SVG logo into the PNG icons the manifest and stores need.
//   node scripts/build-icons.mjs
import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const logo = readFileSync(join(root, 'assets/logo/keyflip-logo.svg'), 'utf8');
const small = readFileSync(join(root, 'assets/logo/keyflip-mark-small.svg'), 'utf8');

// [file, svg, canvas size, artwork size]. Chrome asks for 96px artwork
// centred in the 128px icon.
const ICONS = [
  ['assets/icons/icon-16.png', small, 16, 16],
  ['assets/icons/icon-32.png', small, 32, 30],
  ['assets/icons/icon-48.png', logo, 48, 44],
  ['assets/icons/icon-128.png', logo, 128, 96],
  ['assets/logo/keyflip-logo-512.png', logo, 512, 512],
  ['assets/logo/keyflip-logo-1024.png', logo, 1024, 1024],
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const [file, svg, size, art] of ICONS) {
  const pad = (size - art) / 2;
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">
    <div style="width:${size}px;height:${size}px;display:grid;place-items:center">
      <img style="width:${art}px;height:${art}px;display:block" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}">
    </div></body></html>`);
  await page.waitForFunction(() => document.images[0].complete);
  mkdirSync(dirname(join(root, file)), { recursive: true });
  await page.screenshot({ path: join(root, file), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  console.log(`${file} (${size}px, artwork ${art}px, padding ${pad}px)`);
}
await browser.close();
