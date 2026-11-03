#!/usr/bin/env node
/**
 * Renders /class-sprites and estimates on-screen hero facing from idle frame pixels.
 * "facesRight" = more weighted pixel mass in the right half of the sprite bbox.
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';
const outDir = path.join(repoRoot, 'tmp-facing-verify');
fs.mkdirSync(outDir, { recursive: true });

const PLAYABLE = [
  'guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster',
  'cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard',
  'berserker', 'crusader', 'assassin', 'reaper', 'bladedancer', 'monk', 'stormwarrior',
  'hunter', 'mage', 'warlock', 'ranger', 'shadowpriest', 'mooncaller', 'stormcaller',
  'frostmage', 'firemage', 'dragonsorcerer', 'necromancer',
];

async function analyzeFacing(pngBuffer) {
  const { data, info } = await sharp(pngBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let maxX = 0;
  let minY = info.height;
  let maxY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const a = data[(y * info.width + x) * 4 + 3];
      if (a > 40) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX <= minX) return { facesRight: null, reason: 'empty' };
  const w = maxX - minX;
  const headBottom = minY + (maxY - minY) * 0.55;
  let leftThird = 0;
  let rightThird = 0;
  for (let y = minY; y <= headBottom; y++) {
    for (let x = minX; x <= maxX; x++) {
      const a = data[(y * info.width + x) * 4 + 3];
      if (a <= 40) continue;
      const wgt = a;
      if (x < minX + w / 3) leftThird += wgt;
      else if (x > maxX - w / 3) rightThird += wgt;
    }
  }
  return {
    facesRight: rightThird > leftThird * 1.08,
    leftThird,
    rightThird,
  };
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 2400 } });
await page.goto(`${baseUrl}/class-sprites`, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(2000);

const wrong = [];
for (const role of PLAYABLE) {
  const el = page.locator(`[data-class="${role}"] .hero-sprite-container`);
  const png = await el.screenshot({ type: 'png' });
  fs.writeFileSync(path.join(outDir, `${role}.png`), png);
  const result = await analyzeFacing(png);
  const ok = result.facesRight === true;
  console.log(JSON.stringify({ role, ok, ...result }));
  if (!ok) wrong.push(role);
}

await browser.close();
if (wrong.length) {
  console.error('NOT facing right:', wrong.join(', '));
  process.exit(1);
}
console.log('All heroes face right on gallery');
