/**
 * Enemy Sprite Configuration
 * Maps enemy types to their sprite paths and animations
 */

export type EnemyAnimationType = 
  | 'idle' | 'attack' | 'attack2' | 'attack3' | 'strongAttack' 
  | 'hurt' | 'death' | 'projectile' | 'projectileDiagonal'
  | 'transformation' | 'idleHuman' | 'transition' | 'flying'
  | 'walk' | 'run' | 'dash' | 'jump' | 'appear' | 'move';

export const ENEMY_SPRITES: Record<string, {
  sprite: string;
  isAnimated: boolean;
  spriteSize?: number;
  frameCount?: Partial<Record<EnemyAnimationType, number>>;
  animations?: Partial<Record<EnemyAnimationType, string>>;
}> = {
  'Kobold Warrior': {
    sprite: '/Sprites/KoboldWarrior/with_outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 6, attack: 5, attack2: 5, attack3: 6, strongAttack: 12, hurt: 4, death: 10, dash: 7, jump: 3, run: 8 },
    animations: {
      idle: '/Sprites/KoboldWarrior/with_outline/IDLE.png',
      attack: '/Sprites/KoboldWarrior/with_outline/ATTACK 1.png',
      attack2: '/Sprites/KoboldWarrior/with_outline/ATTACK 2.png',
      attack3: '/Sprites/KoboldWarrior/with_outline/ATTACK 3.png',
      strongAttack: '/Sprites/KoboldWarrior/with_outline/STRONG ATTACK.png',
      hurt: '/Sprites/KoboldWarrior/with_outline/HURT.png',
      death: '/Sprites/KoboldWarrior/with_outline/DEATH.png',
      dash: '/Sprites/KoboldWarrior/with_outline/DASH.png',
      jump: '/Sprites/KoboldWarrior/with_outline/JUMP.png',
      run: '/Sprites/KoboldWarrior/with_outline/RUN.png'
    }
  },
  'Baby Dragon': {
    sprite: '/Sprites/enemies/EnemySprites/Baby Dragon 2D Pixel Art/Sprites/outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 4, attack: 6, hurt: 3, death: 5, projectile: 6, projectileDiagonal: 6 },
    animations: {
      idle: '/Sprites/enemies/EnemySprites/Baby Dragon 2D Pixel Art/Sprites/outline/IDLE.png',
      attack: '/Sprites/enemies/EnemySprites/Baby Dragon 2D Pixel Art/Sprites/outline/ATTACK.png',
      hurt: '/Sprites/enemies/EnemySprites/Baby Dragon 2D Pixel Art/Sprites/outline/HURT.png',
      death: '/Sprites/enemies/EnemySprites/Baby Dragon 2D Pixel Art/Sprites/outline/DEATH.png',
      projectile: '/Sprites/enemies/EnemySprites/Baby Dragon 2D Pixel Art/Sprites/outline/projectile.png',
      projectileDiagonal: '/Sprites/enemies/EnemySprites/Baby Dragon 2D Pixel Art/Sprites/outline/projectile_diagonal.png'
    }
  },
  'Imp': {
    sprite: '/Sprites/enemies/EnemySprites/Imp 2D Pixel Art v1.2/Sprites/outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 7, attack: 9, hurt: 6, death: 8 }, // Match Electron app CSS: 9 attack (432px), 6 hurt (288px), 8 death (384px)
    animations: {
      idle: '/Sprites/enemies/EnemySprites/Imp 2D Pixel Art v1.2/Sprites/outline/IDLE.png',
      attack: '/Sprites/enemies/EnemySprites/Imp 2D Pixel Art v1.2/Sprites/outline/ATTACK.png',
      hurt: '/Sprites/enemies/EnemySprites/Imp 2D Pixel Art v1.2/Sprites/outline/HURT.png',
      death: '/Sprites/enemies/EnemySprites/Imp 2D Pixel Art v1.2/Sprites/outline/DEATH.png'
    }
  },
  'Lizardman': {
    sprite: '/Sprites/enemies/EnemySprites/Lizardman 2D Pixel Art v1.2/New Version/Sprites/outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 14, attack: 7, attack2: 9, hurt: 6, death: 13, walk: 10 },
    animations: {
      idle: '/Sprites/enemies/EnemySprites/Lizardman 2D Pixel Art v1.2/New Version/Sprites/outline/IDLE.png',
      attack: '/Sprites/enemies/EnemySprites/Lizardman 2D Pixel Art v1.2/New Version/Sprites/outline/ATTACK 1.png',
      attack2: '/Sprites/enemies/EnemySprites/Lizardman 2D Pixel Art v1.2/New Version/Sprites/outline/ATTACK 2.png',
      hurt: '/Sprites/enemies/EnemySprites/Lizardman 2D Pixel Art v1.2/New Version/Sprites/outline/HURT.png',
      death: '/Sprites/enemies/EnemySprites/Lizardman 2D Pixel Art v1.2/New Version/Sprites/outline/DEATH.png',
      walk: '/Sprites/enemies/EnemySprites/Lizardman 2D Pixel Art v1.2/New Version/Sprites/outline/WALK.png'
    }
  },
  'Masked Orc': {
    sprite: '/Sprites/enemies/EnemySprites/Masked Orc 2D Pixel Art/Sprites/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 4, attack: 6, hurt: 3, death: 10 }, // Match Electron app CSS: 6 attack (288px), 3 hurt (144px), 10 death (480px) - Already correct
    animations: {
      idle: '/Sprites/enemies/EnemySprites/Masked Orc 2D Pixel Art/Sprites/IDLE.png',
      attack: '/Sprites/enemies/EnemySprites/Masked Orc 2D Pixel Art/Sprites/ATTACK.png',
      hurt: '/Sprites/enemies/EnemySprites/Masked Orc 2D Pixel Art/Sprites/HURT.png',
      death: '/Sprites/enemies/EnemySprites/Masked Orc 2D Pixel Art/Sprites/DEATH.png'
    }
  },
  'Werewolf': {
    sprite: '/Sprites/enemies/EnemySprites/Werewolf 2D Pixel Art/Sprites/outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 6, attack: 7, attack2: 6, hurt: 6, death: 10, idleHuman: 6, transformation: 8, run: 6 },
    animations: {
      idle: '/Sprites/enemies/EnemySprites/Werewolf 2D Pixel Art/Sprites/outline/IDLE.png',
      attack: '/Sprites/enemies/EnemySprites/Werewolf 2D Pixel Art/Sprites/outline/ATTACK1.png',
      attack2: '/Sprites/enemies/EnemySprites/Werewolf 2D Pixel Art/Sprites/outline/ATTACK2.png',
      hurt: '/Sprites/enemies/EnemySprites/Werewolf 2D Pixel Art/Sprites/outline/HURT.png',
      death: '/Sprites/enemies/EnemySprites/Werewolf 2D Pixel Art/Sprites/outline/DEATH.png',
      idleHuman: '/Sprites/enemies/EnemySprites/Werewolf 2D Pixel Art/Sprites/outline/IDLE HUMAN.png',
      transformation: '/Sprites/enemies/EnemySprites/Werewolf 2D Pixel Art/Sprites/outline/TRANSFORMATION.png',
      run: '/Sprites/enemies/EnemySprites/Werewolf 2D Pixel Art/Sprites/outline/RUN.png'
    }
  },
  'Skeleton Mage': {
    sprite: '/Sprites/enemies/EnemySprites/Skeleton Mage 2D Pixel Art/Sprites/outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 6, attack: 9, hurt: 4, death: 10, projectile: 5 }, // Match Electron app CSS: 9 attack (432px), 4 hurt (192px), 10 death (480px)
    animations: {
      idle: '/Sprites/enemies/EnemySprites/Skeleton Mage 2D Pixel Art/Sprites/outline/IDLE.png',
      attack: '/Sprites/enemies/EnemySprites/Skeleton Mage 2D Pixel Art/Sprites/outline/ATTACK.png',
      hurt: '/Sprites/enemies/EnemySprites/Skeleton Mage 2D Pixel Art/Sprites/outline/HURT.png',
      death: '/Sprites/enemies/EnemySprites/Skeleton Mage 2D Pixel Art/Sprites/outline/DEATH.png',
      projectile: '/Sprites/enemies/EnemySprites/Skeleton Mage 2D Pixel Art/Sprites/projectile.png'
    }
  },
  'Witch': {
    sprite: '/Sprites/enemies/EnemySprites/Witch/Sprite/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 6, attack: 6, hurt: 3, death: 7, move: 6, projectile: 6 },
    animations: {
      idle: '/Sprites/enemies/EnemySprites/Witch/Sprite/IDLE.png',
      attack: '/Sprites/enemies/EnemySprites/Witch/Sprite/ATTACK.png',
      hurt: '/Sprites/enemies/EnemySprites/Witch/Sprite/HURT.png',
      death: '/Sprites/enemies/EnemySprites/Witch/Sprite/DEATH.png',
      move: '/Sprites/enemies/EnemySprites/Witch/Sprite/MOVE.png',
      projectile: '/Sprites/enemies/EnemySprites/Witch/Sprite/PROJECTILE.png'
    }
  },
  'Mimic': {
    sprite: '/Sprites/enemies/EnemySprites/Mimic 2D Pixel Art v1.2/New Version/Sprites/outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { appear: 16, idle: 8, attack: 14, hurt: 6, death: 10, walk: 12 },
    animations: {
      appear: '/Sprites/enemies/EnemySprites/Mimic 2D Pixel Art v1.2/New Version/Sprites/outline/APPEAR.png',
      idle: '/Sprites/enemies/EnemySprites/Mimic 2D Pixel Art v1.2/New Version/Sprites/outline/IDLE.png',
      attack: '/Sprites/enemies/EnemySprites/Mimic 2D Pixel Art v1.2/New Version/Sprites/outline/ATTACK.png',
      hurt: '/Sprites/enemies/EnemySprites/Mimic 2D Pixel Art v1.2/New Version/Sprites/outline/HURT.png',
      death: '/Sprites/enemies/EnemySprites/Mimic 2D Pixel Art v1.2/New Version/Sprites/outline/DEATH.png',
      walk: '/Sprites/enemies/EnemySprites/Mimic 2D Pixel Art v1.2/New Version/Sprites/outline/WALK.png'
    }
  },
  'Gryphon': {
    sprite: '/Sprites/enemies/EnemySprites/Gryphon 2D Pixel Art v1.2/NEW VERSION/Sprites/with_outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 4, attack: 7, attack2: 5, hurt: 4, death: 7, move: 4 },
    animations: {
      idle: '/Sprites/enemies/EnemySprites/Gryphon 2D Pixel Art v1.2/NEW VERSION/Sprites/with_outline/IDLE.png',
      attack: '/Sprites/enemies/EnemySprites/Gryphon 2D Pixel Art v1.2/NEW VERSION/Sprites/with_outline/ATTACK.png',
      attack2: '/Sprites/enemies/EnemySprites/Gryphon 2D Pixel Art v1.2/NEW VERSION/Sprites/with_outline/ATTACK 2.png',
      hurt: '/Sprites/enemies/EnemySprites/Gryphon 2D Pixel Art v1.2/NEW VERSION/Sprites/with_outline/HURT.png',
      death: '/Sprites/enemies/EnemySprites/Gryphon 2D Pixel Art v1.2/NEW VERSION/Sprites/with_outline/DEATH.png',
      move: '/Sprites/enemies/EnemySprites/Gryphon 2D Pixel Art v1.2/NEW VERSION/Sprites/with_outline/MOVE.png'
    }
  },
  'Minotaur': {
    sprite: '/Sprites/enemies/EnemySprites/Minotaur 2D Pixel Art v1.1/Sprites/with_outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 6, attack: 6, attack2: 7, hurt: 5, death: 6, walk: 8 },
    animations: {
      idle: '/Sprites/enemies/EnemySprites/Minotaur 2D Pixel Art v1.1/Sprites/with_outline/IDLE.png',
      attack: '/Sprites/enemies/EnemySprites/Minotaur 2D Pixel Art v1.1/Sprites/with_outline/ATTACK1.png',
      attack2: '/Sprites/enemies/EnemySprites/Minotaur 2D Pixel Art v1.1/Sprites/with_outline/ATTACK2.png',
      hurt: '/Sprites/enemies/EnemySprites/Minotaur 2D Pixel Art v1.1/Sprites/with_outline/HURT.png',
      death: '/Sprites/enemies/EnemySprites/Minotaur 2D Pixel Art v1.1/Sprites/with_outline/DEATH.png',
      walk: '/Sprites/enemies/EnemySprites/Minotaur 2D Pixel Art v1.1/Sprites/with_outline/WALK.png'
    }
  },
  'Headless Horseman': {
    sprite: '/Sprites/enemies/EnemySprites/Headless Horseman 2D Pixel Art/Sprites/outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 4, attack: 8, hurt: 3, death: 10 },
    animations: {
      idle: '/Sprites/enemies/EnemySprites/Headless Horseman 2D Pixel Art/Sprites/outline/IDLE.png',
      attack: '/Sprites/enemies/EnemySprites/Headless Horseman 2D Pixel Art/Sprites/outline/ATTACK.png',
      hurt: '/Sprites/enemies/EnemySprites/Headless Horseman 2D Pixel Art/Sprites/outline/HURT.png',
      death: '/Sprites/enemies/EnemySprites/Headless Horseman 2D Pixel Art/Sprites/outline/DEATH.png'
    }
  },
  'Adult Dragon': {
    sprite: '/Sprites/enemies/EnemySprites/Dragon 2D Pixel Art v1.2/Sprites/with_outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 9, attack: 13, attack2: 17, hurt: 4, death: 7, run: 8 },
    animations: {
      idle: '/Sprites/enemies/EnemySprites/Dragon 2D Pixel Art v1.2/Sprites/with_outline/IDLE.png',
      attack: '/Sprites/enemies/EnemySprites/Dragon 2D Pixel Art v1.2/Sprites/with_outline/ATTACK 1.png',
      attack2: '/Sprites/enemies/EnemySprites/Dragon 2D Pixel Art v1.2/Sprites/with_outline/ATTACK 2.png',
      hurt: '/Sprites/enemies/EnemySprites/Dragon 2D Pixel Art v1.2/Sprites/with_outline/HURT.png',
      death: '/Sprites/enemies/EnemySprites/Dragon 2D Pixel Art v1.2/Sprites/with_outline/DEATH.png',
      run: '/Sprites/enemies/EnemySprites/Dragon 2D Pixel Art v1.2/Sprites/with_outline/RUN.png'
    }
  },
  'Demon Lord': {
    sprite: '/Sprites/enemies/EnemySprites/Demon Boss 2D Pixel Art/Sprites/with_outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 4, attack: 6, hurt: 3, death: 10, flying: 4, transition: 3 },
    animations: {
      idle: '/Sprites/enemies/EnemySprites/Demon Boss 2D Pixel Art/Sprites/with_outline/IDLE.png',
      attack: '/Sprites/enemies/EnemySprites/Demon Boss 2D Pixel Art/Sprites/with_outline/ATTACK.png',
      hurt: '/Sprites/enemies/EnemySprites/Demon Boss 2D Pixel Art/Sprites/with_outline/HURT.png',
      death: '/Sprites/enemies/EnemySprites/Demon Boss 2D Pixel Art/Sprites/with_outline/DEATH.png',
      flying: '/Sprites/enemies/EnemySprites/Demon Boss 2D Pixel Art/Sprites/with_outline/FLYING.png',
      transition: '/Sprites/enemies/EnemySprites/Demon Boss 2D Pixel Art/Sprites/with_outline/TRANSITION.png'
    }
  },
  'Corrupted High Priest': {
    sprite: '/Sprites/enemies/Cultistpriest/cultist_priest_idle_1.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 5, attack: 5, hurt: 4, death: 6, walk: 6 },
    animations: {
      idle: '/Sprites/enemies/Cultistpriest/cultist_priest_idle_1.png',
      attack: '/Sprites/enemies/Cultistpriest/cultist_priest_attack_1.png',
      hurt: '/Sprites/enemies/Cultistpriest/cultist_priest_takehit_1.png',
      death: '/Sprites/enemies/Cultistpriest/cultist_priest_die_1.png',
      walk: '/Sprites/enemies/Cultistpriest/cultist_priest_walk_1.png'
    }
  },
  'Cultist': {
    sprite: '/Sprites/enemies/Cultistpriest/cultist_priest_idle_1.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 5, attack: 5, hurt: 4, death: 6, walk: 6 },
    animations: {
      idle: '/Sprites/enemies/Cultistpriest/cultist_priest_idle_1.png',
      attack: '/Sprites/enemies/Cultistpriest/cultist_priest_attack_1.png',
      hurt: '/Sprites/enemies/Cultistpriest/cultist_priest_takehit_1.png',
      death: '/Sprites/enemies/Cultistpriest/cultist_priest_die_1.png',
      walk: '/Sprites/enemies/Cultistpriest/cultist_priest_walk_1.png'
    }
  }
};

export function getEnemySpritePath(enemyType: string, animation: EnemyAnimationType = 'idle'): string {
  const spriteConfig = ENEMY_SPRITES[enemyType];
  if (!spriteConfig) {
    console.warn(`⚠️ [getEnemySpritePath] Missing sprite config for enemy: "${enemyType}", using Imp fallback`);
    return '/Sprites/enemies/EnemySprites/Imp 2D Pixel Art v1.2/Sprites/outline/IDLE.png'; // Default fallback
  }
  
  if (spriteConfig.animations && spriteConfig.animations[animation]) {
    return spriteConfig.animations[animation];
  }
  
  // Warn if animation is requested but not found
  if (animation !== 'idle' && !spriteConfig.animations?.[animation]) {
    console.warn(`⚠️ [getEnemySpritePath] Animation "${animation}" not found for enemy "${enemyType}", using default sprite`);
  }
  
  return spriteConfig.sprite;
}

// Get enemy sprite CSS class (matches IdleDnD game.js getEnemySpriteClass)
export function getEnemySpriteClass(enemyType: string): string {
  const nameMap: Record<string, string> = {
    'Kobold Warrior': 'kobold-sprite-container',
    'Baby Dragon': 'baby-dragon-sprite',
    'Imp': 'imp-sprite',
    'Lizardman': 'lizardman-sprite',
    'Masked Orc': 'masked-orc-sprite',
    'Werewolf': 'werewolf-sprite',
    'Skeleton Mage': 'skeleton-mage-sprite',
    'Witch': 'witch-sprite',
    'Mimic': 'mimic-sprite',
    'Gryphon': 'gryphon-sprite',
    'Minotaur': 'minotaur-sprite',
    'Headless Horseman': 'headless-horseman-sprite',
    'Adult Dragon': 'dragon-sprite',
    'Demon Lord': 'demon-lord-sprite',
    'Corrupted High Priest': 'corrupted-high-priest-sprite',
    'Cultist': 'cultist-sprite'
  };
  const spriteClass = nameMap[enemyType];
  if (!spriteClass) {
    console.warn(`⚠️ [getEnemySpriteClass] Unknown enemy type: "${enemyType}", using fallback 'enemy-sprite'`);
    return 'enemy-sprite';
  }
  return spriteClass;
}

// Get sprite image class (kobold uses different class)
export function getEnemySpriteImageClass(enemyType: string): string {
  return enemyType === 'Kobold Warrior' ? 'kobold-sprite' : 'sprite-img';
}

// Re-export SPRITE_SCALE_FACTOR from spriteConfig
export { SPRITE_SCALE_FACTOR } from './spriteConfig';
