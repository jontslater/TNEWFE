// Hero Sprite Mappings - Matches game.js HERO_SPRITES
export const HERO_SPRITES: Record<string, {
  sprite: string;
  isAnimated: boolean;
  spriteSize?: number;
  frameCount?: { idle: number; attack: number; hurt: number; death: number; rangedAttack?: number; projectile?: number; walk?: number; run?: number };
  frameWidth?: { idle?: number; attack?: number; hurt?: number; death?: number; rangedAttack?: number; projectile?: number; walk?: number; run?: number }; // Optional per-animation frame widths
  animations?: {
    idle: string;
    attack: string;
    hurt: string;
    death: string;
    rangedAttack?: string;
    projectile?: string;
    walk?: string;
    run?: string;
  };
}> = {
  // TANKS - Huge Knight sprite
  guardian: {
    sprite: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/IDLE.png',
    isAnimated: true,
    spriteSize: 64,
    frameCount: { idle: 8, attack: 11, hurt: 6, death: 7, walk: 8 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/DEATH.png',
      walk: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/WALK.png'
    }
  },
  paladin: {
    sprite: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/IDLE.png',
    isAnimated: true,
    spriteSize: 64,
    frameCount: { idle: 8, attack: 11, hurt: 6, death: 7, walk: 8 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/DEATH.png',
      walk: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/WALK.png'
    }
  },
  warden: {
    sprite: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/IDLE.png',
    isAnimated: true,
    spriteSize: 64,
    frameCount: { idle: 8, attack: 11, hurt: 6, death: 7, walk: 8 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/DEATH.png',
      walk: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/WALK.png'
    }
  },
  bloodknight: {
    sprite: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/IDLE.png',
    isAnimated: true,
    spriteSize: 64,
    frameCount: { idle: 8, attack: 11, hurt: 6, death: 7, walk: 8 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/DEATH.png',
      walk: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/WALK.png'
    }
  },
  vanguard: {
    sprite: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/IDLE.png',
    isAnimated: true,
    spriteSize: 64,
    frameCount: { idle: 8, attack: 11, hurt: 6, death: 7, walk: 8 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/DEATH.png',
      walk: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/WALK.png'
    }
  },
  brewmaster: {
    sprite: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/IDLE.png',
    isAnimated: true,
    spriteSize: 64,
    frameCount: { idle: 8, attack: 11, hurt: 6, death: 7, walk: 8 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/DEATH.png',
      walk: '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/Sprites/outline/WALK.png'
    }
  },
  // HEALERS - Wizard sprite
  cleric: {
    sprite: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 6, attack: 9, hurt: 4, death: 6, rangedAttack: 10, projectile: 5, walk: 4 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/MELEE ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/DEATH.png',
      rangedAttack: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/RANGED ATTACK.png',
      projectile: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Projectile.png',
      walk: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/WALK.png'
    }
  },
  atoner: {
    sprite: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 6, attack: 9, hurt: 4, death: 6, rangedAttack: 10, projectile: 5, walk: 4 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/MELEE ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/DEATH.png',
      rangedAttack: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/RANGED ATTACK.png',
      projectile: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Projectile.png',
      walk: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/WALK.png'
    }
  },
  druid: {
    sprite: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 6, attack: 9, hurt: 4, death: 6, rangedAttack: 10, projectile: 5, walk: 4 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/MELEE ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/DEATH.png',
      rangedAttack: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/RANGED ATTACK.png',
      projectile: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Projectile.png',
      walk: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/WALK.png'
    }
  },
  lightbringer: {
    sprite: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 6, attack: 9, hurt: 4, death: 6, rangedAttack: 10, projectile: 5, walk: 4 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/MELEE ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/DEATH.png',
      rangedAttack: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/RANGED ATTACK.png',
      projectile: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Projectile.png',
      walk: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/WALK.png'
    }
  },
  shaman: {
    sprite: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 6, attack: 9, hurt: 4, death: 6, rangedAttack: 10, projectile: 5, walk: 4 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/MELEE ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/DEATH.png',
      rangedAttack: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/RANGED ATTACK.png',
      projectile: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Projectile.png',
      walk: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/WALK.png'
    }
  },
  mistweaver: {
    sprite: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 6, attack: 9, hurt: 4, death: 6, rangedAttack: 10, projectile: 5, walk: 4 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/MELEE ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/DEATH.png',
      rangedAttack: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/RANGED ATTACK.png',
      projectile: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Projectile.png',
      walk: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/WALK.png'
    }
  },
  chronomancer: {
    sprite: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 6, attack: 9, hurt: 4, death: 6, rangedAttack: 10, projectile: 5, walk: 4 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/MELEE ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/DEATH.png',
      rangedAttack: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/RANGED ATTACK.png',
      projectile: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Projectile.png',
      walk: '/Sprites/Heroes/HeroSprites/Wizard 2D Pixel Art v2.0/Sprites/with_outline/WALK.png'
    }
  },
  bard: {
    sprite: '/Sprites/Heroes/HeroSprites/Bard/idle-4-frames.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 4, attack: 4, hurt: 4, death: 4 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Bard/idle-4-frames.png',
      attack: '/Sprites/Heroes/HeroSprites/Bard/idle-4-frames.png',
      hurt: '/Sprites/Heroes/HeroSprites/Bard/idle-4-frames.png',
      death: '/Sprites/Heroes/HeroSprites/Bard/idle-4-frames.png'
    }
  },
  // MELEE DPS - Dwarf Warrior sprite
  berserker: {
    sprite: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 10, attack: 8, hurt: 6, death: 10, run: 8 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/DEATH.png',
      run: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/RUN.png'
    }
  },
  crusader: {
    sprite: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 10, attack: 8, hurt: 6, death: 10, run: 8 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/DEATH.png',
      run: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/RUN.png'
    }
  },
  assassin: {
    sprite: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 10, attack: 8, hurt: 6, death: 10, run: 8 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/DEATH.png',
      run: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/RUN.png'
    }
  },
  reaper: {
    sprite: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 10, attack: 8, hurt: 6, death: 10, run: 8 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/DEATH.png',
      run: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/RUN.png'
    }
  },
  bladedancer: {
    sprite: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 10, attack: 8, hurt: 6, death: 10, run: 8 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/DEATH.png',
      run: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/RUN.png'
    }
  },
  monk: {
    sprite: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 10, attack: 8, hurt: 6, death: 10, run: 8 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/DEATH.png',
      run: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/RUN.png'
    }
  },
  stormwarrior: {
    sprite: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 10, attack: 8, hurt: 6, death: 10, run: 8 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/DEATH.png',
      run: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/RUN.png'
    }
  },
  hunter: {
    sprite: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 10, attack: 8, hurt: 6, death: 10, run: 8 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/DEATH.png',
      run: '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/RUN.png'
    }
  },
  // RANGED DPS - Pyromancer sprite
  mage: {
    sprite: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 4, attack: 6, hurt: 3, death: 10, walk: 6 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/DEATH.png',
      walk: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/WALK.png'
    }
  },
  warlock: {
    sprite: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 4, attack: 6, hurt: 3, death: 10, walk: 6 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/DEATH.png',
      walk: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/WALK.png'
    }
  },
  necromancer: {
    sprite: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 4, attack: 6, hurt: 3, death: 10, walk: 6 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/DEATH.png',
      walk: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/WALK.png'
    }
  },
  // Skeleton minions (necromancer summons)
  'skeleton-minion-yellow': {
    sprite: '/Sprites/Heroes/HeroSprites/Skeleton_Sword/Skeleton_Yellow/Skeleton_With_VFX/Skeleton_01_Yellow_Idle.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 4, attack: 6, hurt: 3, death: 10, walk: 6 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Skeleton_Sword/Skeleton_Yellow/Skeleton_With_VFX/Skeleton_01_Yellow_Idle.png',
      attack: '/Sprites/Heroes/HeroSprites/Skeleton_Sword/Skeleton_Yellow/Skeleton_With_VFX/Skeleton_01_Yellow_Attack1.png',
      hurt: '/Sprites/Heroes/HeroSprites/Skeleton_Sword/Skeleton_Yellow/Skeleton_With_VFX/Skeleton_01_Yellow_Hurt.png',
      death: '/Sprites/Heroes/HeroSprites/Skeleton_Sword/Skeleton_Yellow/Skeleton_With_VFX/Skeleton_01_Yellow_Die.png',
      walk: '/Sprites/Heroes/HeroSprites/Skeleton_Sword/Skeleton_Yellow/Skeleton_With_VFX/Skeleton_01_Yellow_Walk.png'
    }
  },
  'skeleton-minion-white': {
    sprite: '/Sprites/Heroes/HeroSprites/Skeleton_Sword/Skeleton_White/Skeleton_With_VFX/Skeleton_01_White_Idle.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 4, attack: 6, hurt: 3, death: 10, walk: 6 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Skeleton_Sword/Skeleton_White/Skeleton_With_VFX/Skeleton_01_White_Idle.png',
      attack: '/Sprites/Heroes/HeroSprites/Skeleton_Sword/Skeleton_White/Skeleton_With_VFX/Skeleton_01_White_Attack1.png',
      hurt: '/Sprites/Heroes/HeroSprites/Skeleton_Sword/Skeleton_White/Skeleton_With_VFX/Skeleton_01_White_Hurt.png',
      death: '/Sprites/Heroes/HeroSprites/Skeleton_Sword/Skeleton_White/Skeleton_With_VFX/Skeleton_01_White_Die.png',
      walk: '/Sprites/Heroes/HeroSprites/Skeleton_Sword/Skeleton_White/Skeleton_With_VFX/Skeleton_01_White_Walk.png'
    }
  },
  ranger: {
    sprite: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 4, attack: 6, hurt: 3, death: 10, walk: 6 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/DEATH.png',
      walk: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/WALK.png'
    }
  },
  shadowpriest: {
    sprite: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 4, attack: 6, hurt: 3, death: 10, walk: 6 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/DEATH.png',
      walk: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/WALK.png'
    }
  },
  mooncaller: {
    sprite: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 4, attack: 6, hurt: 3, death: 10, walk: 6 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/DEATH.png',
      walk: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/WALK.png'
    }
  },
  stormcaller: {
    sprite: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 4, attack: 6, hurt: 3, death: 10, walk: 6 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/DEATH.png',
      walk: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/WALK.png'
    }
  },
  frostmage: {
    sprite: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 4, attack: 6, hurt: 3, death: 10, walk: 6 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/DEATH.png',
      walk: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/WALK.png'
    }
  },
  firemage: {
    sprite: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 4, attack: 6, hurt: 3, death: 10, walk: 6 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/DEATH.png',
      walk: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/WALK.png'
    }
  },
  dragonsorcerer: {
    sprite: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/IDLE.png',
    isAnimated: true,
    spriteSize: 48,
    frameCount: { idle: 4, attack: 6, hurt: 3, death: 10 },
    animations: {
      idle: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/IDLE.png',
      attack: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/ATTACK.png',
      hurt: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/HURT.png',
      death: '/Sprites/Heroes/HeroSprites/Pyromancer 2D Pixel Art/Sprites/DEATH.png'
    }
  }
};

export function getHeroSpritePath(role: string, animation: 'idle' | 'attack' | 'hurt' | 'death' = 'idle'): string {
  const spriteConfig = HERO_SPRITES[role];
  if (!spriteConfig) {
    return '/Sprites/Heroes/HeroSprites/Dwarf Warrior 2D Pixel Art v1.2/New Version/Sprites/outline/IDLE.png'; // Default fallback
  }
  
  if (spriteConfig.animations && spriteConfig.animations[animation]) {
    return spriteConfig.animations[animation];
  }
  
  return spriteConfig.sprite;
}

// Default scale factor matching Electron app
export const SPRITE_SCALE_FACTOR = 2.5;
