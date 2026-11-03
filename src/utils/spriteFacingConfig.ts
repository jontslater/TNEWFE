/**
 * Native idle facing per sprite (sheet faces left vs right before mirror).
 * Audited with scripts/audit-sprite-facing.mjs; manual overrides match Animation Test QA.
 */
import { HERO_SPRITES } from './spriteConfig';
import { getEnemyAnimationKey } from './spriteAnimationData';

/** Enemy animation registry key → native faces left on sheet */
export const ENEMY_NATIVE_FACES_LEFT: Record<string, boolean> = {
  adultDragon: true,
  babyDragon: true,
  corruptedHighPriest: false,
  cultist: false,
  demonLord: true,
  dragon1: false,
  dragon2: false,
  dragon3: false,
  elderDragon: true,
  goblin: false,
  goblinChief: false,
  gryphon: false,
  headlessHorseman: true,
  imp: false,
  kobold: false,
  lizardman: false,
  maskedOrc: true,
  mimic: false,
  minotaur: false,
  skeletonMage: false,
  werewolf: false,
  witch: true,
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

/** Wizard v2.0 healer/caster rig faces left natively */
const HERO_ROLES_FACES_LEFT = new Set([
  'druid',
  'shaman',
  'chronomancer',
]);

export function getHeroFacesLeft(role: string): boolean {
  const key = role.toLowerCase();
  const cfg = HERO_SPRITES[key];
  if (cfg && typeof (cfg as { facesLeft?: boolean }).facesLeft === 'boolean') {
    return (cfg as { facesLeft: boolean }).facesLeft;
  }
  if (HERO_ROLES_FACES_LEFT.has(key)) return true;
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
