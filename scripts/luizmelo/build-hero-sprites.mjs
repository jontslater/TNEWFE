#!/usr/bin/env node
/**
 * Builds LuizMelo hero sprite variants into public/ and emits sheet metrics for runtime frame slicing.
 *
 * Source zips: place extracted pack folders under scripts/luizmelo/vendor/
 * (run scripts/luizmelo/download-packs.mjs first) OR set LUIZMELO_VENDOR_ROOT.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import packDefinitions from './packDefinitions.json' with { type: 'json' };
import variants from './variants.json' with { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const vendorRoot =
  process.env.LUIZMELO_VENDOR_ROOT || path.join(__dirname, 'vendor');
const publicRoot = path.join(
  repoRoot,
  'public/Sprites/Heroes/HeroSprites/LuizMelo'
);
const metricsOut = path.join(__dirname, 'generated-metrics.json');
const metricsTsOut = path.join(
  repoRoot,
  'src/utils/heroSpriteSheetMetrics.generated.ts'
);

/** @typedef {{ width: number; height: number; frameCount: number; frameWidth: number; frameHeight: number }} SheetMetric */

/** @type {Record<string, SheetMetric>} */
const metrics = {};

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  h /= 360;
  let r;
  let g;
  let b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [
    Math.round(Math.min(255, r * 255)),
    Math.round(Math.min(255, g * 255)),
    Math.round(Math.min(255, b * 255)),
  ];
}

function applyTransform(r, g, b, transform) {
  if (!transform) return [r, g, b];
  let [h, s, l] = rgbToHsl(r, g, b);
  h += transform.hueDelta ?? 0;
  s = Math.min(1, Math.max(0, s * (transform.saturationScale ?? 1)));
  l = Math.min(1, Math.max(0, l * (transform.brightnessScale ?? 1)));
  let [nr, ng, nb] = hslToRgb(h, s, l);
  const tint = transform.tintRgb;
  const strength = transform.tintStrength ?? 0;
  if (tint && strength > 0) {
    nr = Math.round(nr * (1 - strength) + tint[0] * strength);
    ng = Math.round(ng * (1 - strength) + tint[1] * strength);
    nb = Math.round(nb * (1 - strength) + tint[2] * strength);
  }
  return [nr, ng, nb];
}

async function recolorPng(inputPath, outputPath, transform) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 8) continue;
    const [r, g, b] = applyTransform(data[i], data[i + 1], data[i + 2], transform);
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(outputPath);
}

async function copyOrRecolor(inputPath, outputPath, variantKey) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const variant = variants[variantKey];
  if (!variant?.transform) {
    fs.copyFileSync(inputPath, outputPath);
    return;
  }
  await recolorPng(inputPath, outputPath, variant.transform);
}

function webPathFromPublic(absPath) {
  const rel = path.relative(path.join(repoRoot, 'public'), absPath);
  return '/' + rel.split(path.sep).join('/');
}

async function recordMetric(webPath, frameCount) {
  const abs = path.join(repoRoot, 'public', webPath.replace(/^\//, ''));
  const meta = await sharp(abs).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) {
    throw new Error(`Could not read dimensions for ${webPath}`);
  }
  if (width % frameCount !== 0) {
    throw new Error(
      `${webPath}: width ${width} not divisible by frameCount ${frameCount}`
    );
  }
  const frameWidth = width / frameCount;
  metrics[webPath] = {
    width,
    height,
    frameCount,
    frameWidth,
    frameHeight: height,
  };
}

async function buildPack(packKey, packDef, variantKey) {
  const sourceDir = path.join(vendorRoot, packDef.extractSubdir);
  if (!fs.existsSync(sourceDir)) {
    throw new Error(
      `Missing vendor folder ${sourceDir}. Run scripts/luizmelo/download-packs.mjs or extract packs into scripts/luizmelo/vendor/.`
    );
  }

  const variant = variants[variantKey];
  const outDir = path.join(
    publicRoot,
    packDef.publicDir,
    'variants',
    variant.label
  );

  const usedFiles = new Set(Object.values(packDef.files));
  for (const srcName of usedFiles) {
    const srcPath = path.join(sourceDir, srcName);
    if (!fs.existsSync(srcPath)) {
      throw new Error(`Missing source sprite ${srcPath}`);
    }
    const destPath = path.join(outDir, srcName);
    await copyOrRecolor(srcPath, destPath, variantKey);
  }

  for (const [animKey, srcName] of Object.entries(packDef.files)) {
    const frameCount = packDef.frameCounts[animKey];
    if (!frameCount) continue;
    const webPath = webPathFromPublic(path.join(outDir, srcName));
    await recordMetric(webPath, frameCount);
  }
}

/** Pack + variant combinations required by class mappings */
const builds = [
  ['heroKnight', 'base'],
  ['heroKnight', 'bloodknight-red'],
  ['medievalWarrior', 'base'],
  ['martialHero', 'base'],
  ['martialHero', 'martial-shadow'],
  ['martialHero', 'martial-crimson'],
  ['martialHero', 'martial-emerald'],
  ['martialHero', 'martial-gold'],
  ['huntress', 'base'],
  ['wizard', 'base'],
  ['wizard', 'wizard-frost'],
  ['wizard', 'wizard-holy'],
  ['wizard', 'wizard-storm'],
  ['wizard', 'wizard-moon'],
  ['wizard', 'wizard-bard'],
];

async function main() {
  fs.mkdirSync(publicRoot, { recursive: true });

  for (const [packKey, variantKey] of builds) {
    const packDef = packDefinitions[packKey];
    if (!packDef) throw new Error(`Unknown pack ${packKey}`);
    console.log(`Building ${packKey} / ${variantKey}...`);
    await buildPack(packKey, packDef, variantKey);
  }

  fs.writeFileSync(metricsOut, JSON.stringify(metrics, null, 2));

  const ts = `/* eslint-disable */
/** Auto-generated by scripts/luizmelo/build-hero-sprites.mjs — do not edit manually */
export const HERO_SPRITE_SHEET_METRICS = ${JSON.stringify(metrics, null, 2)} as const;

export type HeroSpriteSheetMetric = {
  width: number;
  height: number;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
};

export function getHeroSpriteSheetMetric(spriteSheet: string): HeroSpriteSheetMetric | undefined {
  return HERO_SPRITE_SHEET_METRICS[spriteSheet as keyof typeof HERO_SPRITE_SHEET_METRICS];
}
`;
  fs.writeFileSync(metricsTsOut, ts);
  console.log(`Wrote ${Object.keys(metrics).length} sheet metrics.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
