#!/usr/bin/env node
/** Captures /clean-battlefield with Elder Dragon raid boss (qaRaidLayout=1). */
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
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const url = `${baseUrl}/clean-battlefield?battlefieldId=qa-screenshot&darkMode=true&qaRaidLayout=1`;
await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForSelector('#battle-enemy-raid-boss', { timeout: 120000 });
await page.waitForTimeout(8000);

await page.screenshot({
  path: path.join(outDir, 'clean-battlefield-elder-dragon.png'),
});

await browser.close();
console.log(`Saved ${path.join(outDir, 'clean-battlefield-elder-dragon.png')}`);
