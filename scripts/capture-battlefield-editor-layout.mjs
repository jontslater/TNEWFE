#!/usr/bin/env node
/** Screenshots for battlefield editor layout PR (1280 + mobile). */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const outDir = path.join(repoRoot, 'docs/screenshots/battlefield-editor');
const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function capture(viewport, name) {
  const page = await browser.newPage({ viewport });
  await page.goto(`${baseUrl}/battlefield-facing`, {
    waitUntil: 'networkidle',
    timeout: 120000,
  });
  await page.waitForSelector('#battlefield-hero-line, #battlefield-layout-preview-strip', {
    timeout: 60000,
  });
  await page.waitForSelector('[data-sprite-card="Goblin Chief"] canvas, [data-sprite-card="Goblin Chief"] img', {
    timeout: 60000,
  }).catch(() => {});
  await page.waitForTimeout(3500);

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  if (scrollWidth > clientWidth + 2) {
    console.warn(`${name}: horizontal overflow scrollWidth=${scrollWidth} clientWidth=${clientWidth}`);
  }

  await page.screenshot({
    path: path.join(outDir, name),
    fullPage: true,
  });
  await page.close();
}

await capture({ width: 1280, height: 900 }, 'editor-layout-1280-full.png');
await capture({ width: 1280, height: 900 }, 'editor-heroes-enemies-1280.png');
await capture({ width: 390, height: 844 }, 'editor-layout-mobile-390-full.png');

await browser.close();
console.log(`Saved screenshots to ${outDir}`);
