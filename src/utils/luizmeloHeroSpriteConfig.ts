/**
 * LuizMelo CC0 sprite paths and frame counts (see scripts/luizmelo/packDefinitions.json).
 */
const ROOT = '/Sprites/Heroes/HeroSprites/LuizMelo';

/** Native idle facing per LuizMelo pack (audit: scripts/audit-sprite-facing.mjs) */
const LUIZ_PACK_FACES_LEFT: Record<string, boolean> = {
  'Hero Knight': false,
  'Medieval Warrior': true,
  'Martial Hero': true,
  'Huntress': true,
  Wizard: true,
};

export type HeroSpriteConfigEntry = {
  sprite: string;
  isAnimated: boolean;
  facesLeft?: boolean;
  spriteSize?: number;
  frameCount?: {
    idle: number;
    attack: number;
    hurt: number;
    death: number;
    rangedAttack?: number;
    projectile?: number;
    walk?: number;
    run?: number;
  };
  animations?: Record<string, string>;
};

type LuizPackFiles = {
  idle: string;
  attack: string;
  hurt: string;
  death: string;
  run: string;
  walk: string;
  rangedAttack?: string;
};

function luizSheet(
  packDir: string,
  variant: string,
  fileName: string
): string {
  return `${ROOT}/${packDir}/variants/${variant}/${fileName}`;
}

function luizHero(
  packDir: string,
  variant: string,
  files: LuizPackFiles,
  frameCounts: HeroSpriteConfigEntry['frameCount'],
  extras?: Record<string, { path: string; frames?: number }>
): HeroSpriteConfigEntry {
  const animations: Record<string, string> = {
    idle: luizSheet(packDir, variant, files.idle),
    attack: luizSheet(packDir, variant, files.attack),
    hurt: luizSheet(packDir, variant, files.hurt),
    death: luizSheet(packDir, variant, files.death),
    run: luizSheet(packDir, variant, files.run),
    walk: luizSheet(packDir, variant, files.walk),
  };
  if (files.rangedAttack) {
    animations.rangedAttack = luizSheet(packDir, variant, files.rangedAttack);
  }
  if (extras) {
    for (const [key, { path }] of Object.entries(extras)) {
      animations[key] = path;
    }
  }

  const mergedCounts = { ...frameCounts } as HeroSpriteConfigEntry['frameCount'];
  if (extras) {
    for (const [key, { frames }] of Object.entries(extras)) {
      if (frames && mergedCounts) {
        (mergedCounts as Record<string, number>)[key] = frames;
      }
    }
  }

  return {
    sprite: animations.idle,
    isAnimated: true,
    facesLeft: LUIZ_PACK_FACES_LEFT[packDir] ?? false,
    frameCount: mergedCounts,
    animations,
  };
}

const HERO_KNIGHT_FILES: LuizPackFiles = {
  idle: 'Idle.png',
  attack: 'Attack1.png',
  hurt: 'Take Hit.png',
  death: 'Death.png',
  run: 'Run.png',
  walk: 'Run.png',
};

const HERO_KNIGHT_FRAMES = {
  idle: 11,
  attack: 7,
  hurt: 4,
  death: 11,
  run: 8,
  walk: 8,
};

const MEDIEVAL_FILES: LuizPackFiles = {
  idle: 'Idle.png',
  attack: 'Attack1.png',
  hurt: 'Hit.png',
  death: 'Death.png',
  run: 'Run.png',
  walk: 'Run.png',
};

const MEDIEVAL_FRAMES = {
  idle: 6,
  attack: 4,
  hurt: 3,
  death: 9,
  run: 8,
  walk: 8,
};

const MARTIAL_FILES: LuizPackFiles = {
  idle: 'Idle.png',
  attack: 'Attack1.png',
  hurt: 'Take Hit.png',
  death: 'Death.png',
  run: 'Run.png',
  walk: 'Run.png',
};

const MARTIAL_FRAMES = {
  idle: 8,
  attack: 6,
  hurt: 4,
  death: 6,
  run: 8,
  walk: 8,
};

const HUNTRESS_FILES: LuizPackFiles = {
  idle: 'Idle.png',
  attack: 'Attack1.png',
  hurt: 'Take hit.png',
  death: 'Death.png',
  run: 'Run.png',
  walk: 'Run.png',
  rangedAttack: 'Attack2.png',
};

const HUNTRESS_FRAMES = {
  idle: 8,
  attack: 5,
  hurt: 3,
  death: 8,
  run: 8,
  walk: 8,
  rangedAttack: 5,
};

const WIZARD_FILES: LuizPackFiles = {
  idle: 'Idle.png',
  attack: 'Attack1.png',
  hurt: 'Hit.png',
  death: 'Death.png',
  run: 'Run.png',
  walk: 'Run.png',
  rangedAttack: 'Attack2.png',
};

const WIZARD_FRAMES = {
  idle: 6,
  attack: 8,
  hurt: 4,
  death: 7,
  run: 8,
  walk: 8,
  rangedAttack: 8,
};

const WIZARD_V2_PROJECTILE =
  '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Projectile.png';

export const LUIZMELO_HERO_ENTRIES: Record<string, HeroSpriteConfigEntry> = {
  vanguard: luizHero('Hero Knight', 'base', HERO_KNIGHT_FILES, HERO_KNIGHT_FRAMES),
  bloodknight: luizHero(
    'Hero Knight',
    'bloodknight-red',
    HERO_KNIGHT_FILES,
    HERO_KNIGHT_FRAMES
  ),
  brewmaster: luizHero(
    'Medieval Warrior',
    'base',
    MEDIEVAL_FILES,
    MEDIEVAL_FRAMES
  ),
  monk: luizHero('Martial Hero', 'base', MARTIAL_FILES, MARTIAL_FRAMES),
  bladedancer: luizHero(
    'Martial Hero',
    'martial-emerald',
    MARTIAL_FILES,
    MARTIAL_FRAMES
  ),
  assassin: luizHero(
    'Martial Hero',
    'martial-shadow',
    MARTIAL_FILES,
    MARTIAL_FRAMES
  ),
  reaper: luizHero(
    'Martial Hero',
    'martial-crimson',
    MARTIAL_FILES,
    MARTIAL_FRAMES
  ),
  hunter: luizHero('Huntress', 'base', HUNTRESS_FILES, HUNTRESS_FRAMES),
  ranger: luizHero('Huntress', 'base', HUNTRESS_FILES, HUNTRESS_FRAMES),
  mage: luizHero('Wizard', 'base', WIZARD_FILES, WIZARD_FRAMES),
  frostmage: luizHero('Wizard', 'wizard-frost', WIZARD_FILES, WIZARD_FRAMES),
  stormcaller: luizHero('Wizard', 'wizard-storm', WIZARD_FILES, WIZARD_FRAMES),
  mooncaller: luizHero('Wizard', 'wizard-moon', WIZARD_FILES, WIZARD_FRAMES),
  cleric: luizHero('Wizard', 'wizard-holy', WIZARD_FILES, WIZARD_FRAMES, {
    projectile: { path: WIZARD_V2_PROJECTILE, frames: 5 },
  }),
  atoner: luizHero('Wizard', 'wizard-holy', WIZARD_FILES, WIZARD_FRAMES, {
    projectile: { path: WIZARD_V2_PROJECTILE, frames: 5 },
  }),
  lightbringer: luizHero('Wizard', 'wizard-holy', WIZARD_FILES, WIZARD_FRAMES, {
    projectile: { path: WIZARD_V2_PROJECTILE, frames: 5 },
  }),
  // INTERIM: replace with chierit "Water Priestess FULL" when Jonathan drops assets (see docs/PENDING_PURCHASED_ASSETS.md).
  mistweaver: luizHero('Wizard', 'wizard-holy', WIZARD_FILES, WIZARD_FRAMES, {
    projectile: { path: WIZARD_V2_PROJECTILE, frames: 5 },
  }),
  bard: luizHero('Wizard', 'wizard-bard', WIZARD_FILES, WIZARD_FRAMES, {
    projectile: { path: WIZARD_V2_PROJECTILE, frames: 5 },
  }),
};
