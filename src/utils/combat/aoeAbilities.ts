/**
 * AoE (Area of Effect) Abilities
 * Handles all multi-target abilities:
 * - Bladedancer: Whirlwind (200% to all when 2+ enemies)
 * - Stormcaller: Chain Lightning (180% primary, 90% to others)
 * - Dragonsorcerer: Dragon Breath (300% to all when 2+ enemies or enemy <50%)
 * - Storm Warrior: Chain Lightning (150% primary, 75% to 2 others)
 * - Mooncaller: Lunar Eclipse (120% to all)
 */

import { Hero, Enemy, CombatCallbacks } from './types';

/**
 * Process AoE abilities and check if hero should use AoE
 */
export function processAoEAbilities(
  hero: Hero,
  enemies: Enemy[],
  baseDamage: number,
  now: number,
  callbacks: CombatCallbacks
): {
  isAoE: boolean;
  aoeMultiplier: number;
  chainLightning?: boolean;
  stormChain?: boolean;
} {
  let isAoE = false;
  let aoeMultiplier = 1.0;
  let chainLightning = false;
  let stormChain = false;

  if (!hero || hero.hp <= 0 || hero.isDead || !enemies || enemies.length === 0) {
    return { isAoE, aoeMultiplier, chainLightning, stormChain };
  }

  // Initialize cooldowns if needed
  if (!hero.cooldowns) {
    hero.cooldowns = {
      classAbility: 0,
      classAbilityPrimary: 0,
      classAbilitySecondary: 0,
      procBuff: 0,
      lastStand: 0,
      groupHeal: 0,
      instantHeal: 0,
      debuffEnemy: 0,
      combatRes: 0
    };
  }

  // Initialize classAbilityState if needed
  if (!hero.classAbilityState) {
    hero.classAbilityState = {
      comboCount: 0,
      elementRotation: 0,
      eclipseForm: 'solar',
      eclipseTimer: now,
      petActive: false,
      petExpiry: 0,
      beaconTarget: null,
      atonementActive: false,
      enrageActive: false,
      enrageExpiry: 0,
      evasionActive: false,
      evasionExpiry: 0,
      bloodDrainActive: false,
      bloodDrainExpiry: 0,
      shieldWallActive: false,
      shieldWallExpiry: 0,
      divineShieldActive: false,
      divineShieldExpiry: 0,
      hpSnapshot: {}
    };
  }

  // BLADE DANCER: Whirlwind (200% weapon damage to all enemies when 2+ present)
  if (hero.role === 'bladedancer' && enemies.length >= 2 && now >= hero.cooldowns.classAbilityPrimary) {
    isAoE = true;
    aoeMultiplier = 2.0; // 200% of current damage (already scaled)
    hero.cooldowns.classAbilityPrimary = now + 35000; // 35s cooldown
    callbacks.log('damage', `💃 ${hero.username} WHIRLWIND! (hits all enemies)`);
  }

  // STORMCALLER: Chain Lightning (180% primary, 90% to others)
  if (hero.role === 'stormcaller' && now >= hero.cooldowns.classAbilityPrimary) {
    isAoE = true;
    chainLightning = true;
    hero.cooldowns.classAbilityPrimary = now + 20000; // 20s cooldown
    callbacks.log('damage', `⛈️ ${hero.username} CHAIN LIGHTNING!`);
  }

  // DRACONIC SORCERER: Dragon Breath (300% to all when 2+ enemies or enemy <50%)
  if (hero.role === 'dragonsorcerer' && enemies && enemies.length > 0) {
    const primaryEnemy = enemies[0];
    const shouldBreath = enemies.length >= 2 || (primaryEnemy.hp / primaryEnemy.maxHp) <= 0.5;

    if (shouldBreath && now >= hero.cooldowns.classAbilityPrimary) {
      isAoE = true;
      aoeMultiplier = 3.0; // 300% damage to all
      hero.cooldowns.classAbilityPrimary = now + 90000; // 90s cooldown
      callbacks.log('damage', `🐉🔥 ${hero.username} DRAGON BREATH! (massive AoE)`);
    }
  }

  // STORM WARRIOR: Chain Lightning (150% primary, 75% to 2 others)
  if (hero.role === 'stormwarrior' && now >= hero.cooldowns.classAbilityPrimary) {
    stormChain = true;
    hero.cooldowns.classAbilityPrimary = now + 25000; // 25s cooldown
    callbacks.log('damage', `⚡ ${hero.username} CHAIN LIGHTNING!`);
  }

  // MOONCALLER: Eclipse (already handled in heroAbilities.ts, but mark as AoE for lunar form)
  if (hero.role === 'mooncaller') {
    if (hero.classAbilityState!.eclipseForm === 'lunar') {
      isAoE = true;
      aoeMultiplier = 1.2; // Lunar: 120% to all
    }
    // Solar form is handled in heroAbilities.ts (single target 200%)
  }

  // Reset chain flags after use
  if (chainLightning && hero.classAbilityState!.chainLightning) {
    hero.classAbilityState!.chainLightning = false;
  }
  if (stormChain && hero.classAbilityState!.stormChain) {
    hero.classAbilityState!.stormChain = false;
  }

  return { isAoE, aoeMultiplier, chainLightning, stormChain };
}

/**
 * Calculate AoE damage distribution for chain abilities
 */
export function calculateChainLightning(
  heroDamage: number,
  enemies: Enemy[],
  isStormcaller: boolean
): Array<{ enemy: Enemy; damage: number }> {
  const chainDamage: Array<{ enemy: Enemy; damage: number }> = [];

  enemies.forEach((enemy, idx) => {
    if (!enemy || enemy.isDead || enemy.hp <= 0) return;

    if (isStormcaller) {
      // Stormcaller: 180% primary, 90% to others
      const damage = idx === 0 ? heroDamage * 1.8 : heroDamage * 0.9;
      chainDamage.push({ enemy, damage });
    } else {
      // Storm Warrior: 150% primary, 75% to up to 2 others
      if (idx === 0) {
        chainDamage.push({ enemy, damage: heroDamage * 1.5 });
      } else if (idx <= 2) {
        chainDamage.push({ enemy, damage: heroDamage * 0.75 });
      }
    }
  });

  return chainDamage;
}

/**
 * Calculate standard AoE damage (all enemies take same multiplier)
 */
export function calculateAoEDamage(
  heroDamage: number,
  enemies: Enemy[],
  aoeMultiplier: number
): Array<{ enemy: Enemy; damage: number }> {
  const aoeDamage: Array<{ enemy: Enemy; damage: number }> = [];
  const finalDamage = heroDamage * aoeMultiplier;

  enemies.forEach((enemy) => {
    if (!enemy || enemy.isDead || enemy.hp <= 0) return;
    aoeDamage.push({ enemy, damage: finalDamage });
  });

  return aoeDamage;
}
