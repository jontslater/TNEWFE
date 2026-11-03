/**
 * Native idle facing per sprite (sheet faces left vs right before mirror).
 * Regenerate with: node scripts/audit-sprite-facing.mjs
 */
import { HERO_SPRITES } from './spriteConfig';
import { getEnemyAnimationKey } from './spriteAnimationData';

/** Enemy animation registry key → native faces left on sheet */
export const ENEMY_NATIVE_FACES_LEFT: Record<string, boolean> = {
  adultDragon: false,
  babyDragon: false,
  corruptedHighPriest: false,
  cultist: false,
  demonLord: false,
  dragon1: false,
  dragon2: false,
  dragon3: false,
  elderDragon: false,
  goblin: false,
  goblinChief: false,
  gryphon: false,
  headlessHorseman: false,
  imp: false,
  kobold: true,
  lizardman: false,
  maskedOrc: false,
  mimic: false,
  minotaur: true,
  skeletonMage: false,
  werewolf: false,
  witch: false,
};

const ENEMY_DISPLAY_TO_KEY: Record<string, keyof typeof ENEMY_NATIVE_FACES_LEFT> = {
  'Kobold Warrior': 'kobold',
  'Baby Dragon': 'babyDragon',
  Imp: 'imp',
  Lizardman: 'lizardman',
  'Masked Orc': 'maskedOrc',
  Werewolf: 'werewolf',
  'Skeleton Mage': 'skeletonMage',
  Witch: 'witch',
  Mimic: 'mimic',
  Gryphon: 'gryphon',
  Minotaur: 'minotaur',
  'Headless Horseman': 'headlessHorseman',
  'Adult Dragon': 'adultDragon',
  'Demon Lord': 'demonLord',
  'Elder Dragon': 'elderDragon',
  Dragon_1: 'dragon1',
  Dragon_2: 'dragon2',
  Dragon_3: 'dragon3',
  Goblin: 'goblin',
  'Goblin Chief': 'goblinChief',
  'Corrupted High Priest': 'corruptedHighPriest',
  Cultist: 'cultist',
};

/** Optional per-class overrides when sheet differs from pack default (prefer facesLeft on HERO_SPRITES). */
export const HERO_FACES_LEFT_OVERRIDES: Record<string, boolean> = {};

/** Per-role overrides (legacy rigs not using LuizMelo pack map) */
export const HERO_NATIVE_FACES_LEFT: Record<string, boolean> = {
  druid: true,
  shaman: true,
  chronomancer: true,
};

export function getHeroFacesLeft(role: string): boolean {
  const key = role.toLowerCase();
  const cfg = HERO_SPRITES[key];
  if (cfg && typeof cfg.facesLeft === 'boolean') {
    return cfg.facesLeft;
  }
  if (HERO_FACES_LEFT_OVERRIDES[key] !== undefined) {
    return HERO_FACES_LEFT_OVERRIDES[key];
  }
  if (HERO_NATIVE_FACES_LEFT[key] !== undefined) {
    return HERO_NATIVE_FACES_LEFT[key];
  }
  return false;
}

export function getEnemyFacesLeft(enemyType: string, enemyName?: string): boolean {
  const typeKey = getEnemyAnimationKey(enemyType);
  if (ENEMY_NATIVE_FACES_LEFT[typeKey] !== undefined) {
    return ENEMY_NATIVE_FACES_LEFT[typeKey];
  }
  if (enemyName && ENEMY_DISPLAY_TO_KEY[enemyName]) {
    const k = ENEMY_DISPLAY_TO_KEY[enemyName];
    if (ENEMY_NATIVE_FACES_LEFT[k] !== undefined) {
      return ENEMY_NATIVE_FACES_LEFT[k];
    }
  }
  return false;
}
