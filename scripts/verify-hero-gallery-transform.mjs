#!/usr/bin/env node
/** Asserts gallery heroes use expected mirror (matrix.a sign) vs facesLeft config. */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function shouldMirror(desiredFacing, facesLeft) {
  return facesLeft !== (desiredFacing === 'left');
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

const maps = parseHeroFacesLeftMaps();

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
