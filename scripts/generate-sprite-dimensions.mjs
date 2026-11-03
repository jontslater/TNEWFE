/**
 * Reads strip sprite PNGs referenced in spriteAnimationData.ts + hero spriteConfig,
 * validates frame counts, and writes src/utils/spriteSheetDimensions.generated.ts
 *
 * Usage: node scripts/generate-sprite-dimensions.mjs [--check]
 *   --check  Exit 1 if generated file would change (CI)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const OUT_FILE = path.join(ROOT, 'src/utils/spriteSheetDimensions.generated.ts');

/** @type {Set<string>} */
const INDIVIDUAL_FRAME_MARKERS = [
  '/001.png',
  '/01.png',
  '_0000.png',
  '_0001.png',
];

function isIndividualFrameSheet(spriteSheet) {
  return (
    INDIVIDUAL_FRAME_MARKERS.some((m) => spriteSheet.includes(m)) ||
    /\/[^/]+_\d\.png$/.test(spriteSheet)
  );
}

function readPngSize(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.readUInt32BE(0) !== 0x89504e47) {
    throw new Error(`Not a PNG: ${filePath}`);
  }
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

function parseStripEntriesFromSpriteAnimationData(source) {
  /** @type {{ spriteSheet: string; frameCount: number; frameWidth?: number; frameHeight?: number }[]} */
  const entries = [];
  const re =
    /frameCount:\s*(\d+),\s*\n\s*frameWidth:\s*(\d+),[^\n]*\n\s*frameHeight:\s*(\d+),[\s\S]*?spriteSheet:\s*"(\/Sprites\/[^"]+)"/g;
  let m;
  while ((m = re.exec(source))) {
    entries.push({
      frameCount: Number(m[1]),
      frameWidth: Number(m[2]),
      frameHeight: Number(m[3]),
      spriteSheet: m[4],
    });
  }
  return entries;
}

function parseHeroStripEntries(source) {
  /** @type {{ spriteSheet: string; frameCount: number }[]} */
  const entries = [];
  const roleBlocks = source.split(/\n  [\w-]+: \{/);
  for (const block of roleBlocks) {
    if (!block.includes('isAnimated: true')) continue;
    const fcBlock = block.match(/frameCount:\s*\{([^}]+)\}/);
    const animBlock = block.match(/animations:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/s);
    if (!fcBlock || !animBlock) continue;
    const fcounts = Object.fromEntries(
      [...fcBlock[1].matchAll(/(\w+):\s*(\d+)/g)].map((x) => [x[1], Number(x[2])])
    );
    for (const am of animBlock[1].matchAll(/(\w+):\s*'(\/Sprites\/[^']+)'/g)) {
      const anim = am[1];
      const sheet = am[2];
      const fc = fcounts[anim];
      if (fc) entries.push({ spriteSheet: sheet, frameCount: fc });
    }
  }
  return entries;
}

/**
 * Resolve frame dimensions for a horizontal strip.
 * Prefers configured frameCount when width is divisible; otherwise picks best divisor.
 */
function resolveStripDimensions(spriteSheet, configuredFrameCount, pngWidth, pngHeight) {
  if (pngWidth % configuredFrameCount === 0) {
    return {
      frameCount: configuredFrameCount,
      frameWidth: pngWidth / configuredFrameCount,
      frameHeight: pngHeight,
    };
  }

  const candidates = [];
  for (let fc = 1; fc <= 120; fc++) {
    if (pngWidth % fc !== 0) continue;
    const fw = pngWidth / fc;
    if (fw < 16 || fw > 1024) continue;
    const score = Math.abs(fc - configuredFrameCount);
    candidates.push({ fc, fw, score });
  }
  candidates.sort((a, b) => a.score - b.score || a.fc - b.fc);
  if (candidates.length === 0) {
    throw new Error(
      `Cannot infer frame layout for ${spriteSheet}: ${pngWidth}x${pngHeight}, configured fc=${configuredFrameCount}`
    );
  }
  const best = candidates[0];
  if (best.fc !== configuredFrameCount) {
    console.warn(
      `[sprite-dimensions] Adjusted frameCount ${configuredFrameCount} -> ${best.fc} for ${spriteSheet} (${pngWidth}x${pngHeight})`
    );
  }
  return {
    frameCount: best.fc,
    frameWidth: best.fw,
    frameHeight: pngHeight,
  };
}

function parseLuizMeloMetricsEntries() {
  /** @type {{ spriteSheet: string; frameCount: number }[]} */
  const entries = [];
  const metricsPath = path.join(ROOT, 'scripts/luizmelo/generated-metrics.json');
  if (!fs.existsSync(metricsPath)) return entries;
  const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
  for (const [spriteSheet, metric] of Object.entries(metrics)) {
    if (
      metric &&
      typeof metric === 'object' &&
      typeof metric.frameCount === 'number'
    ) {
      entries.push({ spriteSheet, frameCount: metric.frameCount });
    }
  }
  return entries;
}

function collectEntries() {
  const animData = fs.readFileSync(
    path.join(ROOT, 'src/utils/spriteAnimationData.ts'),
    'utf8'
  );
  const heroConfig = fs.readFileSync(path.join(ROOT, 'src/utils/spriteConfig.ts'), 'utf8');

  const map = new Map();
  for (const e of parseStripEntriesFromSpriteAnimationData(animData)) {
    if (isIndividualFrameSheet(e.spriteSheet)) continue;
    map.set(`${e.spriteSheet}|${e.frameCount}`, e);
  }
  for (const e of parseHeroStripEntries(heroConfig)) {
    if (isIndividualFrameSheet(e.spriteSheet)) continue;
    map.set(`${e.spriteSheet}|${e.frameCount}`, e);
  }
  for (const e of parseLuizMeloMetricsEntries()) {
    if (isIndividualFrameSheet(e.spriteSheet)) continue;
    map.set(`${e.spriteSheet}|${e.frameCount}`, e);
  }
  return [...map.values()];
}

function buildLookup() {
  /** @type {Record<string, { frameWidth: number; frameHeight: number; frameCount: number; pngWidth: number; pngHeight: number }>} */
  const lookup = {};
  const errors = [];

  for (const { spriteSheet, frameCount } of collectEntries()) {
    const filePath = path.join(PUBLIC, spriteSheet.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) {
      errors.push(`Missing file: ${spriteSheet}`);
      continue;
    }
    const { width, height } = readPngSize(filePath);
    try {
      const resolved = resolveStripDimensions(spriteSheet, frameCount, width, height);
      const key = `${spriteSheet}|${frameCount}`;
      lookup[key] = {
        frameWidth: resolved.frameWidth,
        frameHeight: resolved.frameHeight,
        frameCount: resolved.frameCount,
        pngWidth: width,
        pngHeight: height,
      };
      // Also key by resolved count when adjusted
      if (resolved.frameCount !== frameCount) {
        lookup[`${spriteSheet}|${resolved.frameCount}`] = lookup[key];
      }
    } catch (err) {
      errors.push(String(err.message || err));
    }
  }

  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  return lookup;
}

function emitTs(lookup) {
  const lines = [
    '/* eslint-disable */',
    '// AUTO-GENERATED by scripts/generate-sprite-dimensions.mjs — do not edit',
    '',
    'export interface SpriteSheetDimensions {',
    '  frameWidth: number;',
    '  frameHeight: number;',
    '  frameCount: number;',
    '  pngWidth: number;',
    '  pngHeight: number;',
    '}',
    '',
    'const LOOKUP: Record<string, SpriteSheetDimensions> = {',
  ];
  for (const [key, v] of Object.entries(lookup).sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(
      `  ${JSON.stringify(key)}: { frameWidth: ${v.frameWidth}, frameHeight: ${v.frameHeight}, frameCount: ${v.frameCount}, pngWidth: ${v.pngWidth}, pngHeight: ${v.pngHeight} },`
    );
  }
  lines.push(
    '};',
    '',
    '/**',
    ' * Get pixel dimensions for a horizontal strip sheet.',
    ' * @param spriteSheet Public URL path e.g. /Sprites/.../IDLE.png',
    ' * @param frameCount Logical frame count from animation config',
    ' */',
    'export function getStripSheetDimensions(',
    '  spriteSheet: string,',
    '  frameCount: number',
    '): Pick<SpriteSheetDimensions, "frameWidth" | "frameHeight" | "frameCount"> {',
    '  const key = `${spriteSheet}|${frameCount}`;',
    '  const hit = LOOKUP[key];',
    '  if (hit) {',
    '    return { frameWidth: hit.frameWidth, frameHeight: hit.frameHeight, frameCount: hit.frameCount };',
    '  }',
    '  throw new Error(`[spriteSheetDimensions] No entry for ${key}. Run: npm run sprites:generate`);',
    '}',
    ''
  );
  return lines.join('\n');
}

const checkOnly = process.argv.includes('--check');
const lookup = buildLookup();
const content = emitTs(lookup);

if (checkOnly) {
  if (!fs.existsSync(OUT_FILE) || fs.readFileSync(OUT_FILE, 'utf8') !== content) {
    console.error(
      'spriteSheetDimensions.generated.ts is out of date. Run: npm run sprites:generate'
    );
    process.exit(1);
  }
  console.log('Sprite dimensions OK');
  process.exit(0);
}

fs.writeFileSync(OUT_FILE, content);
console.log(`Wrote ${OUT_FILE} (${Object.keys(lookup).length} entries)`);
