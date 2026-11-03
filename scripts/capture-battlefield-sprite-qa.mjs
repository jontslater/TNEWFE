#!/usr/bin/env node
/** Captures battlefield gallery + class grid for PR before/after comparisons. */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const outDir = path.join(repoRoot, 'docs/screenshots/battlefield-sprites');
const tag = process.argv[2] || 'after';
const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

await page.goto(`${baseUrl}/battlefield-facing`, {
  waitUntil: 'networkidle',
  timeout: 120000,
});
await page.waitForSelector(
  '#battlefield-hero-line, #battlefield-layout-preview-strip, [data-sprite-card]',
  { timeout: 60000 }
);
await page.waitForTimeout(4000);
await page.screenshot({
  path: path.join(outDir, `battlefield-gallery-${tag}.png`),
});

await page.goto(`${baseUrl}/animation-test`, {
  waitUntil: 'networkidle',
  timeout: 120000,
});
const heroButtons = ['+ Mage', '+ Berserker', '+ Cleric', '+ Monk', '+ Bard'];
for (const label of heroButtons) {
  const btn = page.getByRole('button', { name: label, exact: true });
  if (await btn.count()) {
    await btn.click();
    await page.waitForTimeout(250);
  }
}
const orcBtn = page.getByRole('button', { name: 'Masked Orc', exact: true });
if (await orcBtn.count()) {
  await orcBtn.click();
}
await page.waitForTimeout(2500);
await page.screenshot({
  path: path.join(outDir, `animation-test-battle-${tag}.png`),
  clip: { x: 0, y: 350, width: 1920, height: 650 },
});

await browser.close();
console.log(`Saved ${tag} screenshots to ${outDir}`);
