#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const outDir = path.join(repoRoot, 'docs/screenshots/dragon-boss');
const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(`${baseUrl}/dragon-test`, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(2500);

const elder = page.locator('[data-test-elder-dragon]');
await elder.screenshot({ path: path.join(outDir, 'elder-dragon-idle-battle.png') });

const whelp = page.locator('[data-test-dragon]');
await whelp.screenshot({ path: path.join(outDir, 'dragon-whelp-dragon1.png') });

await page.screenshot({
  path: path.join(outDir, 'dragon-test-full-page.png'),
  fullPage: true,
});

await browser.close();
console.log('Saved dragon boss screenshots to', outDir);
