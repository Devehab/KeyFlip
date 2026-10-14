#!/usr/bin/env node
// Builds dist/keyflip-<version>.zip with only the files the extension needs.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
const out = join(root, 'dist', `keyflip-${version}.zip`);
mkdirSync(dirname(out), { recursive: true });
if (existsSync(out)) rmSync(out);

const include = [
  'manifest.json',
  '_locales',
  'src',
  'assets/icons',
  'assets/fonts',
  'assets/logo/keyflip-logo-512.png',
];
execFileSync('zip', ['-r', '-X', '-q', out, ...include, '-x', '*.DS_Store'], { cwd: root, stdio: 'inherit' });
console.log(`Created ${out}`);
