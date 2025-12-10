// ALL sprites are 48x48, horizontal strips.

// Animation speed multiplier: 1.5 = 50% slower (more readable)
// Original: 120ms per frame, New: 180ms per frame
const ANIMATION_SPEED_MULTIPLIER = 1.5;

export interface SpriteAnimationData {
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  duration: number; // ms
  spriteSheet: string;
}

/**
 * Map enemy type names to animation keys
 */
export function getEnemyAnimationKey(enemyType: string): string {
  const mapping: Record<string, string> = {
    'Kobold Warrior': 'kobold',
    'Baby Dragon': 'babyDragon',
    'Imp': 'imp',
    'Lizardman': 'lizardman',
    'Masked Orc': 'maskedOrc',
    'Werewolf': 'werewolf',
    'Skeleton Mage': 'skeletonMage',
    'Witch': 'witch',
    'Mimic': 'mimic',
    'Gryphon': 'gryphon',
    'Minotaur': 'minotaur',
    'Headless Horseman': 'headlessHorseman',
    'Adult Dragon': 'adultDragon',
    'Demon Lord': 'demonLord',
    'Elder Dragon': 'elderDragon',
    // Raid wave dragons
    'Dragon_1': 'dragon1',
    'Dragon_2': 'dragon2',
    'Dragon_3': 'dragon3',
    // Goblins
    'Goblin': 'goblin',
    'Goblin Chief': 'goblinChief',
    'Corrupted High Priest': 'corruptedHighPriest',
    'Cultist': 'cultist',
  };
  
  const result = mapping[enemyType];
  
  if (!result) {
    console.error(`[getEnemyAnimationKey] ❌ NO MAPPING for enemyType: "${enemyType}"`);
    console.error(`[getEnemyAnimationKey] Available mappings:`, Object.keys(mapping));
  }
  
  return result || enemyType; // Return original if no mapping (will cause error and show us what's wrong)
}

/**
 * Get animations for an enemy type
 * Handles case-insensitive matching and variations
 */
export function getEnemyAnimations(enemyType: string): Record<string, SpriteAnimationData> | null {
  if (!enemyType) {
    console.warn('[getEnemyAnimations] Empty enemyType provided');
    return null;
  }
  
  // Try exact match first
  let key = getEnemyAnimationKey(enemyType);
  let animations = ENEMY_ANIMATIONS[key];
  
  if (animations) {
    return animations;
  }
  
  // Try case-insensitive match
  const enemyTypeLower = enemyType.toLowerCase().trim();
  for (const [mappedType, mappedKey] of Object.entries({
    'Kobold Warrior': 'kobold',
    'Baby Dragon': 'babyDragon',
    'Imp': 'imp',
    'Lizardman': 'lizardman',
    'Masked Orc': 'maskedOrc',
    'Werewolf': 'werewolf',
    'Skeleton Mage': 'skeletonMage',
    'Witch': 'witch',
    'Mimic': 'mimic',
    'Gryphon': 'gryphon',
    'Minotaur': 'minotaur',
    'Headless Horseman': 'headlessHorseman',
    'Adult Dragon': 'adultDragon',
    'Demon Lord': 'demonLord',
    'Elder Dragon': 'elderDragon',
    'Goblin': 'goblin',
    'Goblin Chief': 'goblinChief',
  })) {
    if (mappedType.toLowerCase() === enemyTypeLower) {
      animations = ENEMY_ANIMATIONS[mappedKey];
      if (animations) {
        console.debug(`[getEnemyAnimations] Found match for "${enemyType}" -> "${mappedKey}"`);
        return animations;
      }
    }
  }
  
  console.warn(`[getEnemyAnimations] No animations found for enemy type: "${enemyType}" (tried key: "${key}")`);
  return null;
}

export const ENEMY_ANIMATIONS: Record<string, Record<string, SpriteAnimationData>> = {
  kobold: {
    idle: {
      frameCount: 6,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1080,
      spriteSheet: "/Sprites/KoboldWarrior/with_outline/IDLE.png",
    },
    attack: {
      frameCount: 5, // User confirmed: should be 5 frames
      frameWidth: 148, // CRITICAL: Actual frame width measured from image (not 48px!)
      frameHeight: 96, // CRITICAL: Actual frame height is 96px (not 48px!) - includes slash effect
      duration: 1350, // 5 frames * 180ms = 900ms (slowed down 50%)
      spriteSheet: "/Sprites/KoboldWarrior/with_outline/ATTACK 1.png",
    },
    attack2: {
      frameCount: 15, // TODO: Verify actual frame count from image
      frameWidth: 48,
      frameHeight: 48,
      duration: 2700, // Adjusted: 15 frames * 120ms = 1800ms
      spriteSheet: "/Sprites/KoboldWarrior/with_outline/ATTACK 2.png",
    },
    attack3: {
      frameCount: 18, // TODO: Verify actual frame count from image (was 6, likely more)
      frameWidth: 48,
      frameHeight: 48,
      duration: 3240, // Adjusted: 18 frames * 120ms = 2160ms
      spriteSheet: "/Sprites/KoboldWarrior/with_outline/ATTACK 3.png",
    },
    strongAttack: {
      frameCount: 12,
      frameWidth: 48,
      frameHeight: 48,
      duration: 2160,
      spriteSheet: "/Sprites/KoboldWarrior/with_outline/STRONG ATTACK.png",
    },
    hurt: {
      frameCount: 4,
      frameWidth: 48,
      frameHeight: 48,
      duration: 600,
      spriteSheet: "/Sprites/KoboldWarrior/with_outline/HURT.png",
    },
    death: {
      frameCount: 10,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1500,
      spriteSheet: "/Sprites/KoboldWarrior/with_outline/DEATH.png",
    },
    dash: {
      frameCount: 7,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1260,
      spriteSheet: "/Sprites/KoboldWarrior/with_outline/DASH.png",
    },
    jump: {
      frameCount: 3,
      frameWidth: 48,
      frameHeight: 48,
      duration: 540,
      spriteSheet: "/Sprites/KoboldWarrior/with_outline/JUMP.png",
    },
    run: {
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1440,
      spriteSheet: "/Sprites/KoboldWarrior/with_outline/RUN.png",
    },
  },
  babyDragon: {
    idle: {
      frameCount: 4,
      frameWidth: 48,
      frameHeight: 48,
      duration: 720,
      spriteSheet: "/Sprites/enemies/EnemySprites/Baby Dragon 2D Pixel Art/Sprites/outline/IDLE.png",
    },
    attack: {
      frameCount: 6,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1080,
      spriteSheet: "/Sprites/enemies/EnemySprites/Baby Dragon 2D Pixel Art/Sprites/outline/ATTACK.png",
    },
    hurt: {
      frameCount: 3,
      frameWidth: 48,
      frameHeight: 48,
      duration: 450,
      spriteSheet: "/Sprites/enemies/EnemySprites/Baby Dragon 2D Pixel Art/Sprites/outline/HURT.png",
    },
    death: {
      frameCount: 5,
      frameWidth: 48,
      frameHeight: 48,
      duration: 750,
      spriteSheet: "/Sprites/enemies/EnemySprites/Baby Dragon 2D Pixel Art/Sprites/outline/DEATH.png",
    },
    projectile: {
      frameCount: 6,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1080,
      spriteSheet: "/Sprites/enemies/EnemySprites/Baby Dragon 2D Pixel Art/Sprites/outline/projectile.png",
    },
    projectileDiagonal: {
      frameCount: 6,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1080,
      spriteSheet: "/Sprites/enemies/EnemySprites/Baby Dragon 2D Pixel Art/Sprites/outline/projectile_diagonal.png",
    },
  },
  dragon1: {
    idle: {
      frameCount: 7,
      frameWidth: 256,  // Correct size from PSD
      frameHeight: 256,
      duration: 1260, // 7 frames * 180ms
      spriteSheet: "/Sprites/enemies/Dragon_1/Idle.png",
    },
    attack: {
      frameCount: 4,
      frameWidth: 256,
      frameHeight: 256,
      duration: 720, // 4 frames * 180ms
      spriteSheet: "/Sprites/enemies/Dragon_1/Attack_1.png",
    },
    attack2: {
      frameCount: 10,
      frameWidth: 256,
      frameHeight: 256,
      duration: 1800, // 10 frames * 180ms
      spriteSheet: "/Sprites/enemies/Dragon_1/Attack_2.png",
    },
    special: {
      frameCount: 12,  // Confirmed: 12 frames
      frameWidth: 256,
      frameHeight: 256,
      duration: 2160, // 12 frames * 180ms
      spriteSheet: "/Sprites/enemies/Dragon_1/Special.png",
    },
    hurt: {
      frameCount: 4,
      frameWidth: 256,
      frameHeight: 256,
      duration: 720, // 4 frames * 180ms
      spriteSheet: "/Sprites/enemies/Dragon_1/Hurt.png",
    },
    death: {
      frameCount: 3,
      frameWidth: 256,
      frameHeight: 256,
      duration: 540, // 3 frames * 180ms
      spriteSheet: "/Sprites/enemies/Dragon_1/Dead.png",
    },
    rise: {
      frameCount: 7,
      frameWidth: 256,
      frameHeight: 256,
      duration: 1260, // 7 frames * 180ms
      spriteSheet: "/Sprites/enemies/Dragon_1/Rise.png",
    },
    flight: {
      frameCount: 12,
      frameWidth: 256,  // Exact: 3072px total / 12 frames = 256px per frame
      frameHeight: 256, // Image is 256px tall
      duration: 2160, // 12 frames * 180ms
      spriteSheet: "/Sprites/enemies/Dragon_1/Flight.png",
    },
    landing: {
      frameCount: 5,
      frameWidth: 256,
      frameHeight: 256,
      duration: 900, // 5 frames * 180ms
      spriteSheet: "/Sprites/enemies/Dragon_1/Landing.png",
    },
    walk: {
      frameCount: 12,
      frameWidth: 256,
      frameHeight: 256,
      duration: 2160, // 12 frames * 180ms
      spriteSheet: "/Sprites/enemies/Dragon_1/Walk.png",
    },
  },
  dragon2: {
    idle: {
      frameCount: 7,
      frameWidth: 256,
      frameHeight: 256,
      duration: 1260,
      spriteSheet: "/Sprites/enemies/Dragon_2/Idle.png",
    },
    attack: {
      frameCount: 4,
      frameWidth: 256,
      frameHeight: 256,
      duration: 720,
      spriteSheet: "/Sprites/enemies/Dragon_2/Attack_1.png",
    },
    attack2: {
      frameCount: 10,
      frameWidth: 256,
      frameHeight: 256,
      duration: 1800,
      spriteSheet: "/Sprites/enemies/Dragon_2/Attack_2.png",
    },
    special: {
      frameCount: 13,
      frameWidth: 256,
      frameHeight: 256,
      duration: 2340, // 13 frames * 180ms
      spriteSheet: "/Sprites/enemies/Dragon_2/Special.png",
    },
    hurt: {
      frameCount: 4,
      frameWidth: 256,
      frameHeight: 256,
      duration: 720,
      spriteSheet: "/Sprites/enemies/Dragon_2/Hurt.png",
    },
    death: {
      frameCount: 3,
      frameWidth: 256,
      frameHeight: 256,
      duration: 540,
      spriteSheet: "/Sprites/enemies/Dragon_2/Dead.png",
    },
    rise: {
      frameCount: 7,
      frameWidth: 256,
      frameHeight: 256,
      duration: 1260,
      spriteSheet: "/Sprites/enemies/Dragon_2/Rise.png",
    },
    flight: {
      frameCount: 12,
      frameWidth: 256,
      frameHeight: 256,
      duration: 2160,
      spriteSheet: "/Sprites/enemies/Dragon_2/Flight.png",
    },
    landing: {
      frameCount: 5,
      frameWidth: 256,
      frameHeight: 256,
      duration: 900,
      spriteSheet: "/Sprites/enemies/Dragon_2/Landing.png",
    },
    walk: {
      frameCount: 12,
      frameWidth: 256,
      frameHeight: 256,
      duration: 2160,
      spriteSheet: "/Sprites/enemies/Dragon_2/Walk.png",
    },
  },
  dragon3: {
    idle: {
      frameCount: 7,
      frameWidth: 256,
      frameHeight: 256,
      duration: 1260,
      spriteSheet: "/Sprites/enemies/Dragon_3/Idle.png",
    },
    attack: {
      frameCount: 4,
      frameWidth: 256,
      frameHeight: 256,
      duration: 720,
      spriteSheet: "/Sprites/enemies/Dragon_3/Attack_1.png",
    },
    attack2: {
      frameCount: 10,
      frameWidth: 256,
      frameHeight: 256,
      duration: 1800,
      spriteSheet: "/Sprites/enemies/Dragon_3/Attack_2.png",
    },
    special: {
      frameCount: 13,
      frameWidth: 256,
      frameHeight: 256,
      duration: 2340, // 13 frames * 180ms
      spriteSheet: "/Sprites/enemies/Dragon_3/Special.png",
    },
    hurt: {
      frameCount: 4,
      frameWidth: 256,
      frameHeight: 256,
      duration: 720,
      spriteSheet: "/Sprites/enemies/Dragon_3/Hurt.png",
    },
    death: {
      frameCount: 3,
      frameWidth: 256,
      frameHeight: 256,
      duration: 540,
      spriteSheet: "/Sprites/enemies/Dragon_3/Dead.png",
    },
    rise: {
      frameCount: 7,
      frameWidth: 256,
      frameHeight: 256,
      duration: 1260,
      spriteSheet: "/Sprites/enemies/Dragon_3/Rise.png",
    },
    flight: {
      frameCount: 12,
      frameWidth: 256,
      frameHeight: 256,
      duration: 2160,
      spriteSheet: "/Sprites/enemies/Dragon_3/Flight.png",
    },
    landing: {
      frameCount: 5,
      frameWidth: 256,
      frameHeight: 256,
      duration: 900,
      spriteSheet: "/Sprites/enemies/Dragon_3/Landing.png",
    },
    walk: {
      frameCount: 12,
      frameWidth: 256,
      frameHeight: 256,
      duration: 2160,
      spriteSheet: "/Sprites/enemies/Dragon_3/Walk.png",
    },
  },
  imp: {
    idle: {
      frameCount: 7,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1260,
      spriteSheet: "/Sprites/enemies/EnemySprites/Imp 2D Pixel Art v1.2/Sprites/outline/IDLE.png",
    },
    attack: {
      frameCount: 9,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1620,
      spriteSheet: "/Sprites/enemies/EnemySprites/Imp 2D Pixel Art v1.2/Sprites/outline/ATTACK.png",
    },
    hurt: {
      frameCount: 6,
      frameWidth: 48,
      frameHeight: 48,
      duration: 900,
      spriteSheet: "/Sprites/enemies/EnemySprites/Imp 2D Pixel Art v1.2/Sprites/outline/HURT.png",
    },
    death: {
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1200,
      spriteSheet: "/Sprites/enemies/EnemySprites/Imp 2D Pixel Art v1.2/Sprites/outline/DEATH.png",
    },
  },
  lizardman: {
    idle: {
      frameCount: 14,
      frameWidth: 48,
      frameHeight: 48,
      duration: 2520,
      spriteSheet: "/Sprites/enemies/EnemySprites/Lizardman 2D Pixel Art v1.2/New Version/Sprites/outline/IDLE.png",
    },
    attack: {
      frameCount: 7,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1260,
      spriteSheet: "/Sprites/enemies/EnemySprites/Lizardman 2D Pixel Art v1.2/New Version/Sprites/outline/ATTACK 1.png",
    },
    attack2: {
      frameCount: 9,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1620,
      spriteSheet: "/Sprites/enemies/EnemySprites/Lizardman 2D Pixel Art v1.2/New Version/Sprites/outline/ATTACK 2.png",
    },
    hurt: {
      frameCount: 6,
      frameWidth: 48,
      frameHeight: 48,
      duration: 900,
      spriteSheet: "/Sprites/enemies/EnemySprites/Lizardman 2D Pixel Art v1.2/New Version/Sprites/outline/HURT.png",
    },
    death: {
      frameCount: 13,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1950,
      spriteSheet: "/Sprites/enemies/EnemySprites/Lizardman 2D Pixel Art v1.2/New Version/Sprites/outline/DEATH.png",
    },
    walk: {
      frameCount: 10,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1800,
      spriteSheet: "/Sprites/enemies/EnemySprites/Lizardman 2D Pixel Art v1.2/New Version/Sprites/outline/WALK.png",
    },
  },
  maskedOrc: {
    idle: {
      frameCount: 4,
      frameWidth: 48,
      frameHeight: 48,
      duration: 720,
      spriteSheet: "/Sprites/enemies/EnemySprites/Masked Orc 2D Pixel Art/Sprites/IDLE.png",
    },
    attack: {
      frameCount: 6,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1080,
      spriteSheet: "/Sprites/enemies/EnemySprites/Masked Orc 2D Pixel Art/Sprites/ATTACK.png",
    },
    hurt: {
      frameCount: 3,
      frameWidth: 48,
      frameHeight: 48,
      duration: 450,
      spriteSheet: "/Sprites/enemies/EnemySprites/Masked Orc 2D Pixel Art/Sprites/HURT.png",
    },
    death: {
      frameCount: 10,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1500,
      spriteSheet: "/Sprites/enemies/EnemySprites/Masked Orc 2D Pixel Art/Sprites/DEATH.png",
    },
  },
  goblin: {
    idle: {
      frameCount: 15,
      frameWidth: 200, // Actual sprite size: 200x200
      frameHeight: 200,
      duration: 1500, // 15 frames * 100ms (faster animation)
      spriteSheet: "/Sprites/enemies/GoblinUnderling/idle/idle_0000.png",
    },
    walk: {
      frameCount: 11,
      frameWidth: 200, // Actual sprite size: 200x200
      frameHeight: 200,
      duration: 1100, // 11 frames * 100ms (faster animation)
      spriteSheet: "/Sprites/enemies/GoblinUnderling/walk/walk_0000.png",
    },
    attack: {
      frameCount: 21, // Using "smash" as attack
      frameWidth: 200, // Actual sprite size: 200x200
      frameHeight: 200,
      duration: 2100, // 21 frames * 100ms (faster animation)
      spriteSheet: "/Sprites/enemies/GoblinUnderling/smash/smash_0000.png",
    },
    hurt: {
      frameCount: 18,
      frameWidth: 200, // Actual sprite size: 200x200
      frameHeight: 200,
      duration: 1800, // 18 frames * 100ms (faster animation)
      spriteSheet: "/Sprites/enemies/GoblinUnderling/hurt/hurt_0000.png",
    },
    death: {
      frameCount: 21,
      frameWidth: 200, // Actual sprite size: 200x200
      frameHeight: 200,
      duration: 2100, // 21 frames * 100ms (faster animation)
      spriteSheet: "/Sprites/enemies/GoblinUnderling/die/die_0000.png",
    },
  },
  goblinChief: {
    idle: {
      frameCount: 9,
      frameWidth: 200, // Actual sprite size: 200x200
      frameHeight: 200,
      duration: 900, // 9 frames * 100ms (faster animation)
      spriteSheet: "/Sprites/enemies/GoblinBoss/AnotherGoblin/idle/idle_0000.png",
    },
    walk: {
      frameCount: 9,
      frameWidth: 200, // Actual sprite size: 200x200
      frameHeight: 200,
      duration: 900, // 9 frames * 100ms (faster animation)
      spriteSheet: "/Sprites/enemies/GoblinBoss/AnotherGoblin/walk/walk_0000.png",
    },
    run: {
      frameCount: 9,
      frameWidth: 200, // Actual sprite size: 200x200
      frameHeight: 200,
      duration: 720, // 9 frames * 80ms (faster for run animation)
      spriteSheet: "/Sprites/enemies/GoblinBoss/AnotherGoblin/run/run_0000.png",
    },
    attack: {
      frameCount: 11, // Using attack1 as primary attack
      frameWidth: 250, // Actual sprite size: 250x250 (attack1 is larger)
      frameHeight: 250,
      duration: 1100, // 11 frames * 100ms (faster animation)
      spriteSheet: "/Sprites/enemies/GoblinBoss/AnotherGoblin/attack1/attack1_0000.png",
    },
    attack2: {
      frameCount: 10,
      frameWidth: 200, // Actual sprite size: 200x200
      frameHeight: 200,
      duration: 1000, // 10 frames * 100ms (faster animation)
      spriteSheet: "/Sprites/enemies/GoblinBoss/AnotherGoblin/attack2/attack2_0000.png",
    },
    hurt: {
      frameCount: 4,
      frameWidth: 200, // Actual sprite size: 200x200
      frameHeight: 200,
      duration: 400, // 4 frames * 100ms (faster animation)
      spriteSheet: "/Sprites/enemies/GoblinBoss/AnotherGoblin/hurt/hurt_0000.png",
    },
    death: {
      frameCount: 11,
      frameWidth: 200, // Actual sprite size: 200x200
      frameHeight: 200,
      duration: 1100, // 11 frames * 100ms (faster animation)
      spriteSheet: "/Sprites/enemies/GoblinBoss/AnotherGoblin/die/die_0000.png",
    },
  },
  werewolf: {
    idle: {
      frameCount: 6,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1080,
      spriteSheet: "/Sprites/enemies/EnemySprites/Werewolf 2D Pixel Art/Sprites/outline/IDLE.png",
    },
    attack: {
      frameCount: 7,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1260,
      spriteSheet: "/Sprites/enemies/EnemySprites/Werewolf 2D Pixel Art/Sprites/outline/ATTACK1.png",
    },
    attack2: {
      frameCount: 6,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1080,
      spriteSheet: "/Sprites/enemies/EnemySprites/Werewolf 2D Pixel Art/Sprites/outline/ATTACK2.png",
    },
    hurt: {
      frameCount: 6,
      frameWidth: 48,
      frameHeight: 48,
      duration: 900,
      spriteSheet: "/Sprites/enemies/EnemySprites/Werewolf 2D Pixel Art/Sprites/outline/HURT.png",
    },
    death: {
      frameCount: 10,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1500,
      spriteSheet: "/Sprites/enemies/EnemySprites/Werewolf 2D Pixel Art/Sprites/outline/DEATH.png",
    },
    idleHuman: {
      frameCount: 6,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1080,
      spriteSheet: "/Sprites/enemies/EnemySprites/Werewolf 2D Pixel Art/Sprites/outline/IDLE HUMAN.png",
    },
    transformation: {
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1440,
      spriteSheet: "/Sprites/enemies/EnemySprites/Werewolf 2D Pixel Art/Sprites/outline/TRANSFORMATION.png",
    },
    run: {
      frameCount: 6,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1080,
      spriteSheet: "/Sprites/enemies/EnemySprites/Werewolf 2D Pixel Art/Sprites/outline/RUN.png",
    },
  },
  skeletonMage: {
    idle: {
      frameCount: 6,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1080,
      spriteSheet: "/Sprites/enemies/EnemySprites/Skeleton Mage 2D Pixel Art/Sprites/outline/IDLE.png",
    },
    attack: {
      frameCount: 9,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1620,
      spriteSheet: "/Sprites/enemies/EnemySprites/Skeleton Mage 2D Pixel Art/Sprites/outline/ATTACK.png",
    },
    hurt: {
      frameCount: 4,
      frameWidth: 48,
      frameHeight: 48,
      duration: 600,
      spriteSheet: "/Sprites/enemies/EnemySprites/Skeleton Mage 2D Pixel Art/Sprites/outline/HURT.png",
    },
    death: {
      frameCount: 10,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1500,
      spriteSheet: "/Sprites/enemies/EnemySprites/Skeleton Mage 2D Pixel Art/Sprites/outline/DEATH.png",
    },
    projectile: {
      frameCount: 5,
      frameWidth: 48,
      frameHeight: 48,
      duration: 900,
      spriteSheet: "/Sprites/enemies/EnemySprites/Skeleton Mage 2D Pixel Art/Sprites/projectile.png",
    },
  },
  witch: {
    idle: {
      frameCount: 6,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1080,
      spriteSheet: "/Sprites/enemies/EnemySprites/Witch/Sprite/IDLE.png",
    },
    attack: {
      frameCount: 6,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1080,
      spriteSheet: "/Sprites/enemies/EnemySprites/Witch/Sprite/ATTACK.png",
    },
    hurt: {
      frameCount: 3,
      frameWidth: 48,
      frameHeight: 48,
      duration: 450,
      spriteSheet: "/Sprites/enemies/EnemySprites/Witch/Sprite/HURT.png",
    },
    death: {
      frameCount: 7,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1050,
      spriteSheet: "/Sprites/enemies/EnemySprites/Witch/Sprite/DEATH.png",
    },
    move: {
      frameCount: 6,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1080,
      spriteSheet: "/Sprites/enemies/EnemySprites/Witch/Sprite/MOVE.png",
    },
    projectile: {
      frameCount: 6,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1080,
      spriteSheet: "/Sprites/enemies/EnemySprites/Witch/Sprite/PROJECTILE.png",
    },
  },
  mimic: {
    appear: {
      frameCount: 16,
      frameWidth: 48,
      frameHeight: 48,
      duration: 2880,
      spriteSheet: "/Sprites/enemies/EnemySprites/Mimic 2D Pixel Art v1.2/New Version/Sprites/outline/APPEAR.png",
    },
    idle: {
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1440,
      spriteSheet: "/Sprites/enemies/EnemySprites/Mimic 2D Pixel Art v1.2/New Version/Sprites/outline/IDLE.png",
    },
    attack: {
      frameCount: 14,
      frameWidth: 48,
      frameHeight: 48,
      duration: 2520,
      spriteSheet: "/Sprites/enemies/EnemySprites/Mimic 2D Pixel Art v1.2/New Version/Sprites/outline/ATTACK.png",
    },
    hurt: {
      frameCount: 6,
      frameWidth: 48,
      frameHeight: 48,
      duration: 900,
      spriteSheet: "/Sprites/enemies/EnemySprites/Mimic 2D Pixel Art v1.2/New Version/Sprites/outline/HURT.png",
    },
    death: {
      frameCount: 10,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1500,
      spriteSheet: "/Sprites/enemies/EnemySprites/Mimic 2D Pixel Art v1.2/New Version/Sprites/outline/DEATH.png",
    },
    walk: {
      frameCount: 12,
      frameWidth: 48,
      frameHeight: 48,
      duration: 2160,
      spriteSheet: "/Sprites/enemies/EnemySprites/Mimic 2D Pixel Art v1.2/New Version/Sprites/outline/WALK.png",
    },
  },
  gryphon: {
    idle: {
      frameCount: 4,
      frameWidth: 48,
      frameHeight: 48,
      duration: 720,
      spriteSheet: "/Sprites/enemies/EnemySprites/Gryphon 2D Pixel Art v1.2/NEW VERSION/Sprites/with_outline/IDLE.png",
    },
    attack: {
      frameCount: 7,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1260,
      spriteSheet: "/Sprites/enemies/EnemySprites/Gryphon 2D Pixel Art v1.2/NEW VERSION/Sprites/with_outline/ATTACK 1.png",
    },
    attack2: {
      frameCount: 5,
      frameWidth: 48,
      frameHeight: 48,
      duration: 900,
      spriteSheet: "/Sprites/enemies/EnemySprites/Gryphon 2D Pixel Art v1.2/NEW VERSION/Sprites/with_outline/ATTACK 2.png",
    },
    hurt: {
      frameCount: 4,
      frameWidth: 48,
      frameHeight: 48,
      duration: 600,
      spriteSheet: "/Sprites/enemies/EnemySprites/Gryphon 2D Pixel Art v1.2/NEW VERSION/Sprites/with_outline/HURT.png",
    },
    death: {
      frameCount: 7,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1050,
      spriteSheet: "/Sprites/enemies/EnemySprites/Gryphon 2D Pixel Art v1.2/NEW VERSION/Sprites/with_outline/DEATH.png",
    },
    move: {
      frameCount: 4,
      frameWidth: 48,
      frameHeight: 48,
      duration: 720,
      spriteSheet: "/Sprites/enemies/EnemySprites/Gryphon 2D Pixel Art v1.2/NEW VERSION/Sprites/with_outline/MOVE.png",
    },
  },
  minotaur: {
    idle: {
      frameCount: 6,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1080,
      spriteSheet: "/Sprites/enemies/EnemySprites/Minotaur 2D Pixel Art v1.1/Sprites/with_outline/IDLE.png",
    },
    attack: {
      frameCount: 6,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1080,
      spriteSheet: "/Sprites/enemies/EnemySprites/Minotaur 2D Pixel Art v1.1/Sprites/with_outline/ATTACK1.png",
    },
    attack2: {
      frameCount: 7,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1260,
      spriteSheet: "/Sprites/enemies/EnemySprites/Minotaur 2D Pixel Art v1.1/Sprites/with_outline/ATTACK2.png",
    },
    hurt: {
      frameCount: 5,
      frameWidth: 48,
      frameHeight: 48,
      duration: 750,
      spriteSheet: "/Sprites/enemies/EnemySprites/Minotaur 2D Pixel Art v1.1/Sprites/with_outline/HURT.png",
    },
    death: {
      frameCount: 6,
      frameWidth: 48,
      frameHeight: 48,
      duration: 900,
      spriteSheet: "/Sprites/enemies/EnemySprites/Minotaur 2D Pixel Art v1.1/Sprites/with_outline/DEATH.png",
    },
    walk: {
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1440,
      spriteSheet: "/Sprites/enemies/EnemySprites/Minotaur 2D Pixel Art v1.1/Sprites/with_outline/WALK.png",
    },
  },
  headlessHorseman: {
    idle: {
      frameCount: 4,
      frameWidth: 48,
      frameHeight: 48,
      duration: 720,
      spriteSheet: "/Sprites/enemies/EnemySprites/Headless Horseman 2D Pixel Art/Sprites/outline/IDLE.png",
    },
    attack: {
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1440,
      spriteSheet: "/Sprites/enemies/EnemySprites/Headless Horseman 2D Pixel Art/Sprites/outline/ATTACK.png",
    },
    hurt: {
      frameCount: 3,
      frameWidth: 48,
      frameHeight: 48,
      duration: 450,
      spriteSheet: "/Sprites/enemies/EnemySprites/Headless Horseman 2D Pixel Art/Sprites/outline/HURT.png",
    },
    death: {
      frameCount: 10,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1500,
      spriteSheet: "/Sprites/enemies/EnemySprites/Headless Horseman 2D Pixel Art/Sprites/outline/DEATH.png",
    },
  },
  adultDragon: {
    idle: {
      frameCount: 9,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1620,
      spriteSheet: "/Sprites/enemies/EnemySprites/Dragon 2D Pixel Art v1.2/Sprites/with_outline/IDLE.png",
    },
    attack: {
      frameCount: 13,
      frameWidth: 48,
      frameHeight: 48,
      duration: 3060,
      spriteSheet: "/Sprites/enemies/EnemySprites/Dragon 2D Pixel Art v1.2/Sprites/with_outline/ATTACK 1.png",
    },
    attack2: {
      frameCount: 17,
      frameWidth: 48,
      frameHeight: 48,
      duration: 3060,
      spriteSheet: "/Sprites/enemies/EnemySprites/Dragon 2D Pixel Art v1.2/Sprites/with_outline/ATTACK 2.png",
    },
    hurt: {
      frameCount: 4,
      frameWidth: 48,
      frameHeight: 48,
      duration: 600,
      spriteSheet: "/Sprites/enemies/EnemySprites/Dragon 2D Pixel Art v1.2/Sprites/with_outline/HURT.png",
    },
    death: {
      frameCount: 7,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1050,
      spriteSheet: "/Sprites/enemies/EnemySprites/Dragon 2D Pixel Art v1.2/Sprites/with_outline/DEATH.png",
    },
    run: {
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1440,
      spriteSheet: "/Sprites/enemies/EnemySprites/Dragon 2D Pixel Art v1.2/Sprites/with_outline/RUN.png",
    },
  },
  demonLord: {
    idle: {
      frameCount: 4,
      frameWidth: 48,
      frameHeight: 48,
      duration: 720,
      spriteSheet: "/Sprites/enemies/EnemySprites/Demon Boss 2D Pixel Art/Sprites/with_outline/IDLE.png",
    },
    attack: {
      frameCount: 6,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1080,
      spriteSheet: "/Sprites/enemies/EnemySprites/Demon Boss 2D Pixel Art/Sprites/with_outline/ATTACK.png",
    },
    hurt: {
      frameCount: 3,
      frameWidth: 48,
      frameHeight: 48,
      duration: 450,
      spriteSheet: "/Sprites/enemies/EnemySprites/Demon Boss 2D Pixel Art/Sprites/with_outline/HURT.png",
    },
    death: {
      frameCount: 10,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1500,
      spriteSheet: "/Sprites/enemies/EnemySprites/Demon Boss 2D Pixel Art/Sprites/with_outline/DEATH.png",
    },
    flying: {
      frameCount: 4,
      frameWidth: 48,
      frameHeight: 48,
      duration: 720,
      spriteSheet: "/Sprites/enemies/EnemySprites/Demon Boss 2D Pixel Art/Sprites/with_outline/FLYING.png",
    },
    transition: {
      frameCount: 3,
      frameWidth: 48,
      frameHeight: 48,
      duration: 540,
      spriteSheet: "/Sprites/enemies/EnemySprites/Demon Boss 2D Pixel Art/Sprites/with_outline/TRANSITION.png",
    },
  },
  elderDragon: {
    idle: {
      frameCount: 161,
      frameWidth: 725, // Confirmed from image metadata
      frameHeight: 445,
      duration: 2680, // 161 frames / 60 fps
      spriteSheet: "/Sprites/enemies/Dragon - Fully Animated/Idle/001.png",
    },
    idleBattle: {
      frameCount: 140,
      frameWidth: 725,
      frameHeight: 445,
      duration: 2330, // 140 frames / 60 fps
      spriteSheet: "/Sprites/enemies/Dragon - Fully Animated/Idle Battle/001.png",
    },
    attack: {
      frameCount: 161,
      frameWidth: 725,
      frameHeight: 445,
      duration: 2680, // 161 frames / 60 fps
      spriteSheet: "/Sprites/enemies/Dragon - Fully Animated/Attack 1/001.png",
    },
    attack2: {
      frameCount: 202,
      frameWidth: 725,
      frameHeight: 445,
      duration: 3370, // 202 frames / 60 fps
      spriteSheet: "/Sprites/enemies/Dragon - Fully Animated/Attack 2/001.png",
    },
    hurt: {
      frameCount: 62,
      frameWidth: 725,
      frameHeight: 445,
      duration: 1030, // 62 frames / 60 fps
      spriteSheet: "/Sprites/enemies/Dragon - Fully Animated/Hurt/01.png",
    },
    death: {
      frameCount: 301,
      frameWidth: 725,
      frameHeight: 445,
      duration: 5020, // 301 frames / 60 fps
      spriteSheet: "/Sprites/enemies/Dragon - Fully Animated/Death/001.png",
    },
    walking: {
      frameCount: 161,
      frameWidth: 725,
      frameHeight: 445,
      duration: 2680, // 161 frames / 60 fps
      spriteSheet: "/Sprites/enemies/Dragon - Fully Animated/Walking/001.png",
    },
    projectile: {
      frameCount: 6,
      frameWidth: 48,
      frameHeight: 48,
      duration: 1080, // Using pyromancer fire projectile animation
      spriteSheet: "/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Fire_projectile.png",
    },
  },
  corruptedHighPriest: {
    idle: {
      frameCount: 5, // Only 5 idle frames (idle_1 through idle_5)
      frameWidth: 200, // Actual sprite size: 200x200
      frameHeight: 200,
      duration: 600, // 5 frames * 120ms
      spriteSheet: "/Sprites/enemies/Cultistpriest/cultist_priest_idle_1.png",
    },
    attack: {
      frameCount: 5,
      frameWidth: 200, // Actual sprite size: 200x200
      frameHeight: 200,
      duration: 600, // 5 frames * 120ms
      spriteSheet: "/Sprites/enemies/Cultistpriest/cultist_priest_attack_1.png",
    },
    hurt: {
      frameCount: 4,
      frameWidth: 200, // Actual sprite size: 200x200
      frameHeight: 200,
      duration: 480, // 4 frames * 120ms
      spriteSheet: "/Sprites/enemies/Cultistpriest/cultist_priest_takehit_1.png",
    },
    death: {
      frameCount: 6,
      frameWidth: 200, // Actual sprite size: 200x200
      frameHeight: 200,
      duration: 720, // 6 frames * 120ms
      spriteSheet: "/Sprites/enemies/Cultistpriest/cultist_priest_die_1.png",
    },
    walk: {
      frameCount: 6,
      frameWidth: 200, // Actual sprite size: 200x200
      frameHeight: 200,
      duration: 720, // 6 frames * 120ms
      spriteSheet: "/Sprites/enemies/Cultistpriest/cultist_priest_walk_1.png",
    },
  },
  cultist: {
    idle: {
      frameCount: 5, // Only 5 idle frames (idle_1 through idle_5)
      frameWidth: 200, // Actual sprite size: 200x200
      frameHeight: 200,
      duration: 600, // 5 frames * 120ms
      spriteSheet: "/Sprites/enemies/Cultistpriest/cultist_priest_idle_1.png",
    },
    attack: {
      frameCount: 5,
      frameWidth: 200, // Actual sprite size: 200x200
      frameHeight: 200,
      duration: 600, // 5 frames * 120ms
      spriteSheet: "/Sprites/enemies/Cultistpriest/cultist_priest_attack_1.png",
    },
    hurt: {
      frameCount: 4,
      frameWidth: 200, // Actual sprite size: 200x200
      frameHeight: 200,
      duration: 480, // 4 frames * 120ms
      spriteSheet: "/Sprites/enemies/Cultistpriest/cultist_priest_takehit_1.png",
    },
    death: {
      frameCount: 6,
      frameWidth: 200, // Actual sprite size: 200x200
      frameHeight: 200,
      duration: 720, // 6 frames * 120ms
      spriteSheet: "/Sprites/enemies/Cultistpriest/cultist_priest_die_1.png",
    },
    walk: {
      frameCount: 6,
      frameWidth: 200, // Actual sprite size: 200x200
      frameHeight: 200,
      duration: 720, // 6 frames * 120ms
      spriteSheet: "/Sprites/enemies/Cultistpriest/cultist_priest_walk_1.png",
    },
  },
};

/**
 * Hero Animation Data
 * Converted from HERO_SPRITES format to SpriteAnimationData format
 * Uses 120ms per frame for duration calculations (matches enemy animations)
 */
import { HERO_SPRITES } from './spriteConfig';

export function getHeroAnimationKey(role: string): string {
  // Heroes use role directly as key
  return role.toLowerCase();
}

/**
 * Get animations for a hero role
 */
export function getHeroAnimations(role: string): Record<string, SpriteAnimationData> | null {
  if (!role) {
    console.warn('[getHeroAnimations] Empty role provided');
    return null;
  }
  
  const roleKey = role.toLowerCase();
  const animations = HERO_ANIMATIONS[roleKey];
  
  if (animations) {
    return animations;
  }
  
  console.warn(`[getHeroAnimations] No animations found for role: "${role}" (tried key: "${roleKey}")`);
  return null;
}

/**
 * Convert HERO_SPRITES format to SpriteAnimationData format
 */
function createHeroAnimations(): Record<string, Record<string, SpriteAnimationData>> {
  const heroAnimations: Record<string, Record<string, SpriteAnimationData>> = {};
  const FRAME_TIME_MS = 120; // Standard frame time (matches enemy animations)
  
  for (const [role, config] of Object.entries(HERO_SPRITES)) {
    if (!config.isAnimated || !config.frameCount || !config.animations) continue;
    
    const spriteSize = config.spriteSize || 48;
    const animations: Record<string, SpriteAnimationData> = {};
    
    // Convert each animation
    for (const [animName, animPath] of Object.entries(config.animations)) {
      const frameCount = config.frameCount[animName as keyof typeof config.frameCount];
      if (!frameCount) continue;
      
      // Use per-animation frame width if specified, otherwise use spriteSize
      const animFrameWidth = config.frameWidth?.[animName as keyof typeof config.frameWidth] || spriteSize;
      
      animations[animName] = {
        frameCount,
        frameWidth: animFrameWidth,
        frameHeight: spriteSize,
        duration: frameCount * FRAME_TIME_MS,
        spriteSheet: animPath,
      };
    }
    
    if (Object.keys(animations).length > 0) {
      heroAnimations[role.toLowerCase()] = animations;
    }
  }
  
  return heroAnimations;
}

export const HERO_ANIMATIONS: Record<string, Record<string, SpriteAnimationData>> = createHeroAnimations();

// Hero projectile mappings
// Spell-casting heroes (fire damage) use Baby Dragon projectile
// Necromancer uses Witch projectile
// Healers use Wizard projectile (hero-specific)
export const HERO_PROJECTILE_MAPPING: Record<string, { type: 'babyDragon' | 'witch' | 'hero', projectileType: 'projectile' | 'projectileDiagonal' }> = {
  // Spell-casting heroes (fire damage)
  mage: { type: 'babyDragon', projectileType: 'projectile' },
  warlock: { type: 'babyDragon', projectileType: 'projectile' },
  firemage: { type: 'babyDragon', projectileType: 'projectile' },
  frostmage: { type: 'babyDragon', projectileType: 'projectile' },
  dragonsorcerer: { type: 'babyDragon', projectileType: 'projectile' },
  // Other ranged DPS heroes
  ranger: { type: 'babyDragon', projectileType: 'projectile' },
  shadowpriest: { type: 'witch', projectileType: 'projectile' },
  mooncaller: { type: 'babyDragon', projectileType: 'projectile' },
  stormcaller: { type: 'babyDragon', projectileType: 'projectile' },
  // Necromancer uses Witch projectile
  necromancer: { type: 'witch', projectileType: 'projectile' },
  // Healers use Wizard projectile (hero-specific)
  cleric: { type: 'hero', projectileType: 'projectile' },
  atoner: { type: 'hero', projectileType: 'projectile' },
  druid: { type: 'hero', projectileType: 'projectile' },
  lightbringer: { type: 'hero', projectileType: 'projectile' },
  shaman: { type: 'hero', projectileType: 'projectile' },
  mistweaver: { type: 'hero', projectileType: 'projectile' },
  chronomancer: { type: 'hero', projectileType: 'projectile' },
  bard: { type: 'hero', projectileType: 'projectile' },
};

/**
 * Get projectile data for a hero role
 * @param heroRole - Hero class/role (e.g., 'mage', 'necromancer', 'cleric')
 * @returns Projectile animation data or null if hero doesn't use projectiles
 */
export function getHeroProjectileData(heroRole: string, projectileType: 'projectile' | 'projectileDiagonal' = 'projectile'): SpriteAnimationData | null {
  const roleKey = heroRole.toLowerCase();
  const mapping = HERO_PROJECTILE_MAPPING[roleKey];
  
  console.log(`[getHeroProjectileData] Looking up projectile for:`, {
    heroRole,
    roleKey,
    hasMapping: !!mapping,
    mapping
  });
  
  if (!mapping) {
    console.warn(`[getHeroProjectileData] No mapping found for role: ${roleKey}`);
    return null;
  }
  
  if (mapping.type === 'hero') {
    // Hero-specific projectile (e.g., Wizard projectile for healers)
    const heroAnimations = HERO_ANIMATIONS[roleKey];
    console.log(`[getHeroProjectileData] Hero type projectile:`, {
      roleKey,
      hasHeroAnimations: !!heroAnimations,
      hasProjectile: !!(heroAnimations && heroAnimations.projectile),
      projectile: heroAnimations?.projectile
    });
    if (heroAnimations && heroAnimations.projectile) {
      return heroAnimations.projectile;
    }
    console.warn(`[getHeroProjectileData] Hero animations or projectile not found for: ${roleKey}`);
    return null;
  }
  
  // Enemy-based projectile (Baby Dragon, Witch, etc.)
  const enemyKey = mapping.type === 'babyDragon' ? 'babyDragon' : 'witch';
  const animations = ENEMY_ANIMATIONS[enemyKey];
  const projectile = animations?.[mapping.projectileType];
  console.log(`[getHeroProjectileData] Enemy type projectile:`, {
    enemyKey,
    projectileType: mapping.projectileType,
    hasAnimations: !!animations,
    hasProjectile: !!projectile
  });
  return projectile || null;
}
