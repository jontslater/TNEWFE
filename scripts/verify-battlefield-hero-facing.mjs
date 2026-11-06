#!/usr/bin/env node
/**
 * Verifies hero sprites on clean-battlefield use canonical right-facing mirror math
 * (matches /battlefield-facing), including chronomancer (wizard sheet).
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const outDir = path.join(repoRoot, 'docs/screenshots/combat-status-bar');
const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';
const battlefieldId = process.env.BATTLEFIELD_ID || 'twitch:theneverendingwar';
const OVERRIDES_URL =
  'https://idlednd-backend-production.up.railway.app/api/config/sprite-overrides';

fs.mkdirSync(outDir, { recursive: true });

function shouldMirror(desiredFacing, facesLeft, flipOverride = false) {
  const base = facesLeft !== (desiredFacing === 'left');
  return flipOverride ? !base : base;
}

function parseHeroFacesLeftMaps() {
  const src = fs.readFileSync(
    path.join(repoRoot, 'src/utils/spriteFacingConfig.ts'),
    'utf8'
  );
  const heroConfig = fs.readFileSync(
    path.join(repoRoot, 'src/utils/spriteConfig.ts'),
    'utf8'
  );
  const luiz = fs.readFileSync(
    path.join(repoRoot, 'src/utils/luizmeloHeroSpriteConfig.ts'),
    'utf8'
  );
  const parseBoolMap = (text) => {
    const out = {};
    if (!text) return out;
    for (const m of text.matchAll(/(?:'([^']+)'|([\w-]+)):\s*(true|false)/g)) {
      out[m[1] || m[2]] = m[3] === 'true';
    }
    return out;
  };
  const packFaces = parseBoolMap(
    luiz.match(/LUIZ_PACK_FACES_LEFT[^=]*=\s*\{([^}]+)\}/s)?.[1]
  );
  const native = parseBoolMap(
    src.match(/HERO_NATIVE_FACES_LEFT[^=]*=\s*\{([^}]+)\}/s)?.[1]
  );
  const overrides = parseBoolMap(
    src.match(/HERO_FACES_LEFT_OVERRIDES[^=]*=\s*\{([^}]+)\}/s)?.[1]
  );
  const perRole = {};
  const roleStarts = [...heroConfig.matchAll(/\n  ([\w-]+): \{/g)];
  for (let i = 0; i < roleStarts.length; i++) {
    const role = roleStarts[i][1];
    const start = roleStarts[i].index;
    const end = i + 1 < roleStarts.length ? roleStarts[i + 1].index : heroConfig.length;
    const block = heroConfig.slice(start, end);
    const fl = block.match(/facesLeft:\s*(true|false)/);
    if (fl) perRole[role] = fl[1] === 'true';
  }
  for (const role of [...luiz.matchAll(/^\s{2}([\w-]+):\s*luizHero/gm)].map((x) => x[1])) {
    const blockMatch = luiz.match(
      new RegExp(`\\n  ${role}:\\s*luizHero\\([\\s\\S]*?\\),`, 'm')
    );
    const packDir = blockMatch?.[0].match(/luizHero\(\s*'([^']+)'/)?.[1];
    if (packDir && packFaces[packDir] !== undefined) {
      perRole[role] = packFaces[packDir];
    }
  }
  return { perRole, native, overrides };
}

function getHeroFacesLeft(role, maps) {
  const key = role.toLowerCase();
  if (maps.perRole[key] !== undefined) return maps.perRole[key];
  if (maps.overrides[key] !== undefined) return maps.overrides[key];
  if (maps.native[key] !== undefined) return maps.native[key];
  return false;
}

function matrixMirrored(transform) {
  if (!transform || transform === 'none') return false;
  const m = transform.match(/matrix\(([^)]+)\)/);
  if (!m) return false;
  return parseFloat(m[1].split(',')[0].trim()) < 0;
}

const maps = parseHeroFacesLeftMaps();

const PLAYABLE = [
  'guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster',
  'cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard',
  'berserker', 'crusader', 'assassin', 'reaper', 'bladedancer', 'monk', 'stormwarrior',
  'hunter', 'mage', 'warlock', 'ranger', 'shadowpriest', 'mooncaller', 'stormcaller',
  'frostmage', 'firemage', 'dragonsorcerer', 'necromancer',
];
let heroOverrides = {};
try {
  const doc = await fetch(OVERRIDES_URL, { cache: 'no-store' }).then((r) => r.json());
  heroOverrides = doc.heroes || {};
} catch (e) {
  console.error('Failed to load sprite overrides:', e);
  process.exitCode = 1;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

// Production-like layout: same components/math as live clean-battlefield hero sprites
await page.goto(`${baseUrl}/battlefield-facing`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForSelector('[data-sprite-card="chronomancer"] .hero-sprite-container', {
  timeout: 60000,
});
await page.waitForTimeout(3000);

const galleryMismatches = [];
for (const role of PLAYABLE) {
  const transform = await page
    .locator(`[data-sprite-card="${role}"] .hero-sprite-container`)
    .first()
    .evaluate((el) => getComputedStyle(el).transform)
    .catch(() => null);
  if (!transform) {
    galleryMismatches.push({ role, reason: 'missing sprite card' });
    continue;
  }
  const flipOverride = heroOverrides[role]?.flip === true;
  const facesLeft = getHeroFacesLeft(role, maps);
  // Canonical battlefield facing (ignore saved flip flags — those compensated for legacy prefs).
  const expectMirror = shouldMirror('right', facesLeft, false);
  const mirrored = matrixMirrored(transform);
  if (mirrored !== expectMirror) {
    galleryMismatches.push({ role, expectMirror, mirrored, transform, savedFlip: flipOverride });
  }
}

await page.screenshot({
  path: path.join(outDir, 'battlefield-facing-hero-facing-verify.png'),
  fullPage: true,
});

const chronoCard = page.locator('[data-sprite-card="chronomancer"]');
if (await chronoCard.count()) {
  await chronoCard.screenshot({
    path: path.join(outDir, 'chronomancer-facing-card.png'),
  });
}

const chronoGalleryTransform = await page
  .locator('[data-sprite-card="chronomancer"] .hero-sprite-container')
  .first()
  .evaluate((el) => getComputedStyle(el).transform)
  .catch(() => null);

let report = [];
let mismatches = [];
if (process.env.VERIFY_CLEAN_BATTLEFIELD === '1') {
  await page.goto(`${baseUrl}/clean-battlefield?battlefieldId=${encodeURIComponent(battlefieldId)}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await page.waitForResponse((r) => r.url().includes('sprite-overrides'), { timeout: 30000 }).catch(() => {});
  await page.waitForSelector('.hero-sprite-container[data-hero-role]', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);

  report = await page.evaluate(() =>
    [...document.querySelectorAll('.hero-sprite-container[data-hero-role]')].map((el) => ({
      role: el.getAttribute('data-hero-role'),
      transform: getComputedStyle(el).transform,
    }))
  );

  for (const row of report) {
    if (!row.role) continue;
    const facesLeft = getHeroFacesLeft(row.role, maps);
    const expectMirror = shouldMirror('right', facesLeft, false);
    const mirrored = matrixMirrored(row.transform);
    if (mirrored !== expectMirror) {
      mismatches.push({
        role: row.role,
        facesLeft,
        expectMirror,
        mirrored,
        transform: row.transform,
      });
    }
  }

  const screenshotName = process.env.FACING_SCREENSHOT || 'hero-facing-verify-1920.png';
  if (report.length > 0) {
    await page.screenshot({
      path: path.join(outDir, screenshotName),
    });
  }
}

console.log(
  JSON.stringify(
    {
      baseUrl,
      heroCountOnLiveBattlefield: report.length,
      chronomancerOnBattlefield: report.find((r) => r.role === 'chronomancer'),
      liveBattlefieldMismatchCount: mismatches.length,
      liveBattlefieldMismatches: mismatches.slice(0, 12),
      galleryHeroCount: PLAYABLE.length,
      galleryMismatchCount: galleryMismatches.length,
      galleryMismatches: galleryMismatches.slice(0, 12),
      chronomancerGalleryTransform: chronoGalleryTransform,
    },
    null,
    2
  )
);

await browser.close();
if (galleryMismatches.length > 0 || (report.length > 0 && mismatches.length > 0)) {
  process.exitCode = 1;
}
