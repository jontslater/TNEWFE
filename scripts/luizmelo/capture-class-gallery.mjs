#!/usr/bin/env node
/** Captures /class-sprites gallery for PR screenshots. */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const outDir = path.join(repoRoot, 'docs/screenshots/luizmelo-class-sprites');
const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 2400 } });
await page.goto(`${baseUrl}/class-sprites`, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForSelector('[data-class="chronomancer"] canvas, [data-class="chronomancer"] img', {
  timeout: 60000,
}).catch(() => {});
await page.waitForTimeout(3500);

await page.screenshot({
  path: path.join(outDir, 'all-classes-gallery.png'),
  fullPage: true,
});

await browser.close();
console.log(`Saved ${path.join(outDir, 'all-classes-gallery.png')}`);
