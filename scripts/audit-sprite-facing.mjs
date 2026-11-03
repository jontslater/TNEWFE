#!/usr/bin/env node
/** Heuristic: idle frame 0 center-of-mass left of frame midline => facesLeft */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

async function massCenterX(pngPath) {
  const { data, info } = await sharp(pngPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let sumX = 0;
  let mass = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * info.channels;
      const a = data[i + 3];
      if (a > 32) {
        sumX += x * a;
        mass += a;
      }
    }
  }
  if (!mass) return info.width / 2;
  return sumX / mass;
}

async function auditSheet(spriteSheet, frameCount) {
  const filePath = path.join(ROOT, 'public', spriteSheet.replace(/^\//, ''));
  if (!fs.existsSync(filePath)) return { error: 'missing', spriteSheet };
  const meta = await sharp(filePath).metadata();
  const fw = Math.floor(meta.width / frameCount);
  const framePath = path.join(ROOT, 'tmp-audit-frame.png');
  await sharp(filePath)
    .extract({ left: 0, top: 0, width: fw, height: meta.height })
    .png()
    .toFile(framePath);
  const cx = await massCenterX(framePath);
  fs.unlinkSync(framePath);
  const facesLeft = cx < fw / 2;
  return { facesLeft, cx: Math.round(cx), mid: fw / 2, fw };
}

function parseHeroEntries() {
  const heroConfig = fs.readFileSync(
    path.join(ROOT, 'src/utils/spriteConfig.ts'),
    'utf8'
  );
  const luiz = fs.readFileSync(
    path.join(ROOT, 'src/utils/luizmeloHeroSpriteConfig.ts'),
    'utf8'
  );
  const entries = [];
  const roleStarts = [...heroConfig.matchAll(/\n  ([\w-]+): \{/g)];
  for (let i = 0; i < roleStarts.length; i++) {
    const role = roleStarts[i][1];
    const start = roleStarts[i].index;
    const end = i + 1 < roleStarts.length ? roleStarts[i + 1].index : heroConfig.length;
    const block = heroConfig.slice(start, end);
    if (!block.includes('isAnimated: true')) continue;
    const idle = block.match(/idle:\s*'(\/Sprites\/[^']+)'/);
    const fc = block.match(/frameCount:\s*\{[^}]*idle:\s*(\d+)/s);
    if (idle && fc) {
      entries.push({
        id: role,
        kind: 'hero',
        sheet: idle[1],
        frameCount: Number(fc[1]),
      });
    }
  }
  for (const role of [...luiz.matchAll(/^\s{2}([\w-]+):\s*luizHero/gm)].map((x) => x[1])) {
    const blockMatch = luiz.match(
      new RegExp(`\\n  ${role}:\\s*luizHero\\([\\s\\S]*?\\),`, 'm')
    );
    if (!blockMatch) continue;
    const packDir = blockMatch[0].match(/luizHero\(\s*'([^']+)'/)?.[1];
    const variant = blockMatch[0].match(/,\s*'([^']+)'/)?.[1] ?? 'base';
    if (!packDir) continue;
    const sheet = `/Sprites/Heroes/HeroSprites/LuizMelo/${packDir}/variants/${variant}/Idle.png`;
    let frameCount = 6;
    if (packDir === 'Hero Knight') frameCount = 11;
    else if (packDir === 'Medieval Warrior') frameCount = 6;
    else if (packDir === 'Martial Hero') frameCount = 6;
    else if (packDir === 'Huntress') frameCount = 8;
    else if (packDir === 'Wizard') frameCount = 6;
    entries.push({ id: role, kind: 'hero-luiz', sheet, frameCount });
  }
  const byId = new Map();
  for (const e of entries) byId.set(e.id, e);
  return [...byId.values()];
}

function parseEnemyEntries() {
  const animData = fs.readFileSync(
    path.join(ROOT, 'src/utils/spriteAnimationData.ts'),
    'utf8'
  );
  const entries = [];
  const animStart = animData.indexOf('export const ENEMY_ANIMATIONS');
  const slice = animStart >= 0 ? animData.slice(animStart) : animData;
  const typeStarts = [...slice.matchAll(/\n  ([\w]+): \{/g)];
  for (let i = 0; i < typeStarts.length; i++) {
    const key = typeStarts[i][1];
    const start = typeStarts[i].index;
    const end = i + 1 < typeStarts.length ? typeStarts[i + 1].index : slice.length;
    const block = slice.slice(start, end);
    const idleMatch =
      block.match(
        /idleBattle:\s*\{[\s\S]*?spriteSheet:\s*"(\/Sprites\/[^"]+)"[\s\S]*?frameCount:\s*(\d+)/
      ) ||
      block.match(
        /idle:\s*\{[\s\S]*?spriteSheet:\s*"(\/Sprites\/[^"]+)"[\s\S]*?frameCount:\s*(\d+)/
      );
    if (!idleMatch) continue;
    let sheet = idleMatch[1];
    let frameCount = Number(idleMatch[2]);
    if (sheet.includes('/001.png') || sheet.includes('/01.png')) {
      frameCount = 1;
    }
    entries.push({ id: key, kind: 'enemy', sheet, frameCount });
  }
  return entries;
}

const heroes = parseHeroEntries();
const enemies = parseEnemyEntries();

console.log('=== HEROES ===');
for (const h of heroes.sort((a, b) => a.id.localeCompare(b.id))) {
  const r = await auditSheet(h.sheet, h.frameCount);
  console.log(JSON.stringify({ id: h.id, ...r, sheet: h.sheet }));
}

console.log('=== ENEMIES ===');
for (const e of enemies.sort((a, b) => a.id.localeCompare(b.id))) {
  const r = await auditSheet(e.sheet, e.frameCount);
  console.log(JSON.stringify({ id: e.id, ...r, sheet: e.sheet }));
}
