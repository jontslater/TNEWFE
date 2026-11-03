#!/usr/bin/env node
/** Asserts gallery heroes use expected mirror (matrix.a sign) vs facesLeft config. */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function shouldMirror(desiredFacing, facesLeft) {
  return facesLeft === (desiredFacing === 'right');
}

function parseOverrides() {
  const src = fs.readFileSync(
    path.join(repoRoot, 'src/utils/spriteFacingConfig.ts'),
    'utf8'
  );
  const block = src.match(
    /export const HERO_FACES_LEFT_OVERRIDES[^=]*=\s*\{([^}]+)\}/s
  )?.[1];
  const native = src.match(
    /export const HERO_NATIVE_FACES_LEFT[^=]*=\s*\{([^}]+)\}/s
  )?.[1];
  const parse = (text) => {
    const out = {};
    if (!text) return out;
    for (const m of text.matchAll(/([\w-]+):\s*(true|false)/g)) {
      out[m[1]] = m[2] === 'true';
    }
    return out;
  };
  return { overrides: parse(block), native: parse(native) };
}

function getHeroFacesLeft(role, maps) {
  const key = role.toLowerCase();
  if (maps.overrides[key] !== undefined) return maps.overrides[key];
  if (maps.native[key] !== undefined) return maps.native[key];
  return false;
}

const maps = parseOverrides();

const PLAYABLE = [
  'guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster',
  'cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard',
  'berserker', 'crusader', 'assassin', 'reaper', 'bladedancer', 'monk', 'stormwarrior',
  'hunter', 'mage', 'warlock', 'ranger', 'shadowpriest', 'mooncaller', 'stormcaller',
  'frostmage', 'firemage', 'dragonsorcerer', 'necromancer',
];

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 2400 } });
await page.goto(`${baseUrl}/class-sprites`, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(2000);

const mismatches = [];
for (const role of PLAYABLE) {
  const matrixA = await page
    .locator(`[data-class="${role}"] .hero-sprite-container`)
    .evaluate((el) => {
      const t = getComputedStyle(el).transform;
      if (!t || t === 'none') return 1;
      const m = t.match(/matrix\(([^)]+)\)/);
      if (!m) return 1;
      return parseFloat(m[1].split(',')[0].trim());
    });
  const facesLeft = getHeroFacesLeft(role, maps);
  const expectMirror = shouldMirror('right', facesLeft);
  const mirrored = matrixA < 0;
  if (mirrored !== expectMirror) {
    mismatches.push({ role, facesLeft, expectMirror, matrixA });
  }
}
await browser.close();

if (mismatches.length) {
  console.error('Transform mismatches:', mismatches);
  process.exit(1);
}
console.log('All gallery heroes have expected mirror transforms');
