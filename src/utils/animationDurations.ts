/**
 * Animation Duration Constants
 * Based on IdleDnD game.js ANIMATION_DURATIONS
 * Maps sprite types to their animation durations (in milliseconds)
 */

// Import ENEMY_SPRITES for frameCount calculation (lazy import to avoid circular dependency)
let ENEMY_SPRITES_CACHE: any = null;
function getEnemySprites() {
  if (!ENEMY_SPRITES_CACHE) {
    try {
      ENEMY_SPRITES_CACHE = require('./enemySpriteConfig').ENEMY_SPRITES;
    } catch (e) {
      // If require fails (e.g., in browser), return null
      return null;
    }
  }
  return ENEMY_SPRITES_CACHE;
}

export const ANIMATION_DURATIONS: Record<string, Record<string, number>> = {
  'kobold': { attack: 600, hurt: 400, death: 1000 },
  'baby-dragon': { attack: 720, hurt: 300, death: 500 },
  'imp': { attack: 1080, hurt: 600, death: 800 },
  'lizardman': { attack: 840, hurt: 600, death: 1300 },
  'masked-orc': { attack: 720, hurt: 300, death: 1000 },
  'werewolf': { attack: 840, hurt: 600, death: 1000 }, // Matches Electron app: 7 frames @ 120ms = 840ms, 6 frames @ 100ms = 600ms, 10 frames @ 100ms = 1000ms
  'skeleton-mage': { attack: 1080, hurt: 400, death: 1000 },
  'witch': { attack: 720, hurt: 300, death: 700 },
  'mimic': { attack: 1680, hurt: 600, death: 1000 },
  'gryphon': { attack: 840, hurt: 400, death: 700 },
  'minotaur': { attack: 720, hurt: 500, death: 600 },
  'headless-horseman': { attack: 960, hurt: 300, death: 1000 },
  'dragon': { attack: 2040, hurt: 400, death: 700 },
  'demon-lord': { attack: 720, hurt: 300, death: 1000 },
  'huge-knight': { attack: 1320, hurt: 600, death: 700 },
  'wizard': { attack: 1200, hurt: 400, death: 600 },
  'bard': { attack: 800, hurt: 400, death: 600 },
  'dwarf-warrior': { attack: 960, hurt: 600, death: 1000 },
  'pyromancer': { attack: 720, hurt: 300, death: 1000 }
};

/**
 * Get sprite type from hero role
 */
export function getHeroSpriteType(heroRole: string): string {
  const tanks = ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'];
  const healers = ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'];
  
  if (tanks.includes(heroRole)) return 'huge-knight';
  if (healers.includes(heroRole)) return 'wizard';
  
  const meleeDPS = ['berserker', 'crusader', 'assassin', 'reaper', 'bladedancer', 'monk', 'stormwarrior', 'hunter'];
  if (meleeDPS.includes(heroRole)) return 'dwarf-warrior';
  return 'pyromancer';
}

/**
 * Get sprite type from enemy name
 */
export function getEnemySpriteType(enemyName: string): string {
  const nameMap: Record<string, string> = {
    'Kobold Warrior': 'kobold',
    'Baby Dragon': 'baby-dragon',
    'Imp': 'imp',
    'Lizardman': 'lizardman',
    'Masked Orc': 'masked-orc',
    'Werewolf': 'werewolf',
    'Skeleton Mage': 'skeleton-mage',
    'Witch': 'witch',
    'Mimic': 'mimic',
    'Gryphon': 'gryphon',
    'Minotaur': 'minotaur',
    'Headless Horseman': 'headless-horseman',
    'Adult Dragon': 'dragon',
    'Demon Lord': 'demon-lord'
  };
  const spriteType = nameMap[enemyName];
  if (!spriteType) {
    console.warn(`⚠️ [getEnemySpriteType] Unknown enemy name: "${enemyName}", defaulting to 'kobold'`);
    return 'kobold';
  }
  return spriteType;
}

/**
 * Get animation duration for a sprite type and animation
 * Calculates from frameCount if available, otherwise uses ANIMATION_DURATIONS
 * 
 * @param spriteType - The sprite type (e.g., 'kobold', 'wizard', 'huge-knight')
 * @param animationType - The animation type (e.g., 'attack', 'hurt', 'attack2')
 * @param enemyName - Optional: enemy name for looking up frameCount from ENEMY_SPRITES
 * @param enemyConfig - Optional: pre-loaded enemy config to avoid circular dependency
 */
export function getAnimationDuration(
  spriteType: string, 
  animationType: 'attack' | 'hurt' | 'death' | 'attack2' | 'attack3' | 'strongAttack' | 'projectile' | 'projectileDiagonal' | string,
  enemyName?: string, // Optional: for looking up frameCount from ENEMY_SPRITES
  enemyConfig?: { frameCount?: Partial<Record<string, number>> } // Optional: pre-loaded config
): number {
  // Try to calculate from frameCount if enemyConfig is provided
  if (enemyConfig?.frameCount) {
    const frameCount = enemyConfig.frameCount[animationType];
    if (frameCount && frameCount > 0) {
      // Standard frame duration: 120ms per frame (matches Electron app)
      const calculatedDuration = frameCount * 120;
      return calculatedDuration;
    }
  }
  
  // Try to load ENEMY_SPRITES if enemyName is provided (but enemyConfig wasn't)
  if (enemyName && !enemyConfig) {
    const ENEMY_SPRITES = getEnemySprites();
    if (ENEMY_SPRITES) {
      const config = ENEMY_SPRITES[enemyName];
      if (config?.frameCount) {
        const frameCount = config.frameCount[animationType as any];
        if (frameCount && frameCount > 0) {
          // Standard frame duration: 120ms per frame (matches Electron app)
          const calculatedDuration = frameCount * 120;
          return calculatedDuration;
        }
      }
    }
  }
  
  const durations = ANIMATION_DURATIONS[spriteType];
  
  // Check if we have a direct mapping
  if (durations?.[animationType]) {
    return durations[animationType];
  }
  
  // For attack variants, try to use base attack duration as fallback
  // But prefer calculating from frameCount if available
  if (animationType === 'attack2' || animationType === 'attack3' || animationType === 'strongAttack' || animationType === 'projectile' || animationType === 'projectileDiagonal') {
    if (durations?.attack) {
      return durations.attack;
    }
  }
  
  return 600; // fallback to 600ms if not found
}
