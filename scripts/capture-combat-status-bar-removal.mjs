#!/usr/bin/env node
/** Before/after screenshots for combat status bar removal on clean-battlefield. */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../docs/screenshots/combat-status-bar');
const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';
const battlefieldId = process.env.BATTLEFIELD_ID || 'twitch:theneverendingwar';

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

await page.goto(`${baseUrl}/clean-battlefield?battlefieldId=${encodeURIComponent(battlefieldId)}`, {
  waitUntil: 'domcontentloaded',
  timeout: 60000,
});
await page.waitForTimeout(5000);

const tag = process.argv[2] || 'after';
await page.screenshot({
  path: path.join(outDir, `${tag}-remove-status-bar-1920.png`),
});

const hasBar = await page.evaluate(() =>
  /Difficulty:\s*\d+%/.test(document.body.innerText) && /Combat|Idle|Travel/.test(document.body.innerText)
);
console.log(JSON.stringify({ tag, hasBar, outDir }, null, 2));
await browser.close();
