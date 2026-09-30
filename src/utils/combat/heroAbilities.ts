/**
 * Hero Damage Abilities
 * Handles all hero DPS abilities and passives:
 * - Berserker: Enrage, Enlarge
 * - Assassin: Backstab
 * - Reaper: Death Strike
 * - Crusader: Holy Strike (party heal)
 * - Ranger: Aimed Shot
 * - Monk: Combo Counter (Chi Burst)
 * - Warlock: Corruption (DoT), Summon Demon
 * - Hunter: Pet Attack
 * - Mage: Elemental Rotation (Fire/Frost/Arcane)
 * - Mooncaller: Eclipse
 * - Atoner: Atonement (damage to healing conversion)
 */

import { Hero, Enemy, CombatCallbacks, ViewerBonuses } from './types';
import { ROLE_CONFIG } from '../fullCombatEngine';
import { applyDebuff } from './buffsDebuffs';
import { applyHealing } from './healing';

/**
 * Apply hero-specific damage modifiers and abilities
 */
export function applyHeroAbilities(
  hero: Hero,
  baseDamage: number,
  enemies: Enemy[],
  now: number,
  bonuses: ViewerBonuses,
  callbacks: CombatCallbacks,
  calculateSkillBonuses: (hero: Hero) => any
): {
  modifiedDamage: number;
  isAoE: boolean;
  aoeMultiplier: number;
  chainLightning?: boolean;
  stormChain?: boolean;
  holyStrikeHealing?: number;
  atonementHeal?: number;
  atonementTarget?: Hero;
  corruptionDoT?: number;
  corruptionTarget?: Enemy;
} {
  let modifiedDamage = baseDamage;
  let isAoE = false;
  let aoeMultiplier = 1.0;
  const chainLightning = false;
  const stormChain = false;
  let holyStrikeHealing: number | undefined;
  let atonementHeal: number | undefined;
  let atonementTarget: Hero | undefined;
  let corruptionDoT: number | undefined;
  let corruptionTarget: Enemy | undefined;

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

  // ELEMENTALIST PASSIVE: Elemental Rotation (Fire/Frost/Arcane cycling)
  if (hero.role === 'mage') {
    if (hero.classAbilityState.elementRotation === undefined) {
      hero.classAbilityState.elementRotation = 0;
    }
    hero.classAbilityState.elementRotation = (hero.classAbilityState.elementRotation + 1) % 3;

    if (hero.classAbilityState.elementRotation === 0) {
      // Fire: 180% damage
      modifiedDamage *= 1.8;
      callbacks.log('damage', `🔥 ${hero.username} casts FIRE!`);
    } else if (hero.classAbilityState.elementRotation === 1) {
      // Frost: 120% damage
      modifiedDamage *= 1.2;
      callbacks.log('damage', `❄️ ${hero.username} casts FROST!`);
    } else {
      // Arcane: 150% damage
      modifiedDamage *= 1.5;
      callbacks.log('damage', `✨ ${hero.username} casts ARCANE!`);
    }
  }

  // BERSERKER: ENRAGE - Triggers when enemy below 35% HP
  if (hero.role === 'berserker' && enemies && enemies.length > 0) {
    const primaryEnemy = enemies[0];
    const enemyHpPercent = primaryEnemy.hp / primaryEnemy.maxHp;

    if (enemyHpPercent <= 0.35 && now >= hero.cooldowns!.classAbilityPrimary) {
      hero.classAbilityState!.enrageActive = true;
      hero.classAbilityState!.enrageExpiry = now + 12000; // 12 seconds
      hero.cooldowns!.classAbilityPrimary = now + 60000; // 60s cooldown

      callbacks.log('damage', `⚔️💥 ${hero.username} ENRAGES! (+40% damage for 12s)`);
    }
  }

  // Apply Enrage bonus if active
  if (hero.classAbilityState!.enrageActive && now < hero.classAbilityState!.enrageExpiry!) {
    modifiedDamage *= 1.4; // +40% damage
  }

  // Apply Enlarge bonus if active (simplified - would need separate function)
  if (hero.classAbilityState!.enlargeActive && now < hero.classAbilityState!.enlargeExpiry!) {
    modifiedDamage *= 1.3; // +30% damage
  }

  // ASSASSIN: Backstab (400% damage if enemy is attacking tank - 80% of time)
  if (hero.role === 'assassin' && now >= hero.cooldowns!.classAbilityPrimary) {
    // Assassins get bonus when enemy is distracted (targeting tank)
    const enemyDistracted = Math.random() < 0.8; // 80% of time enemy attacks tank
    if (enemyDistracted) {
      modifiedDamage *= 4; // 400% damage
      hero.cooldowns!.classAbilityPrimary = now + 30000; // 30s cooldown
      callbacks.log('damage', `🗝️ ${hero.username} BACKSTAB!`);
    }
  }

  // REAPER: Death Strike (instant kill <10%, 350% <25%)
  if (hero.role === 'reaper' && enemies && enemies.length > 0) {
    const primaryEnemy = enemies[0];
    const enemyHpPercent = primaryEnemy.hp / primaryEnemy.maxHp;

    if (enemyHpPercent <= 0.25 && now >= hero.cooldowns!.classAbilityPrimary) {
      if (enemyHpPercent <= 0.10) {
        // Instant kill
        modifiedDamage = primaryEnemy.hp + 1000; // Ensure it dies
        callbacks.log('damage', `💀💥 ${hero.username} DEATH STRIKE - INSTANT KILL!`);
      } else {
        modifiedDamage *= 3.5; // 350% damage
        callbacks.log('damage', `💀 ${hero.username} DEATH STRIKE!`);
      }
      hero.cooldowns!.classAbilityPrimary = now + 40000; // 40s cooldown
    }
  }

  // CRUSADER: Holy Strike (300% damage + 15% party heal)
  if (hero.role === 'crusader' && enemies && enemies.length > 0) {
    const primaryEnemy = enemies[0];
    const enemyHpPercent = primaryEnemy.hp / primaryEnemy.maxHp;

    if (enemyHpPercent >= 0.5 && now >= hero.cooldowns!.classAbilityPrimary) {
      modifiedDamage *= 3; // 300% damage
      holyStrikeHealing = modifiedDamage * 0.15; // Store for party heal
      hero.cooldowns!.classAbilityPrimary = now + 45000; // 45s cooldown
      callbacks.log('damage', `🗡️ ${hero.username} HOLY STRIKE!`);
    }
  }

  // MARKSMAN: Aimed Shot (450% damage on bosses or high HP enemies)
  if (hero.role === 'ranger' && enemies && enemies.length > 0) {
    const primaryEnemy = enemies[0];
    const enemyHpPercent = primaryEnemy.hp / primaryEnemy.maxHp;

    if ((primaryEnemy.isBoss || enemyHpPercent >= 0.8) && now >= hero.cooldowns!.classAbilityPrimary) {
      modifiedDamage *= 4.5; // 450% damage
      hero.cooldowns!.classAbilityPrimary = now + 50000; // 50s cooldown
      callbacks.log('damage', `🏹🎯 ${hero.username} AIMED SHOT!`);
    }
  }

  // CHI FIGHTER PASSIVE: Combo Counter (500% damage after 5 attacks)
  if (hero.role === 'monk') {
    if (hero.classAbilityState!.comboCount === undefined) {
      hero.classAbilityState!.comboCount = 0;
    }
    hero.classAbilityState!.comboCount!++;

    if (hero.classAbilityState!.comboCount! >= 5) {
      modifiedDamage *= 5; // 500% damage
      hero.classAbilityState!.comboCount = 0;
      callbacks.log('damage', `🥋💥 ${hero.username} CHI BURST!`);
    }
  }

  // BEAST STALKER PASSIVE: Pet Attack (40% bonus damage)
  if (hero.role === 'hunter') {
    const petDamage = modifiedDamage * 0.4;
    modifiedDamage += petDamage;
    callbacks.log('damage', `🏹 ${hero.username}'s pet attacks for ${Math.floor(petDamage)} bonus damage`);
  }

  // WARLOCK PASSIVE: Corruption (30% of damage as DoT over 15s)
  if (hero.role === 'warlock' && enemies && enemies.length > 0) {
    const immediateDamage = modifiedDamage * 0.7;
    const dotDamage = modifiedDamage * 0.3;
    modifiedDamage = immediateDamage; // Only immediate damage

    // Apply Corruption DoT to primary enemy
    const targetEnemy = enemies[0];
    if (targetEnemy && !targetEnemy.isDead && targetEnemy.hp > 0) {
      corruptionDoT = dotDamage;
      corruptionTarget = targetEnemy;

      // Calculate DoT damage per tick (total DoT damage / number of ticks)
      // Duration: 15s, tickRate: 2s = 8 ticks
      const ticks = Math.ceil(15000 / 2000); // 8 ticks
      const dotDamagePerTick = Math.ceil(dotDamage / ticks);

      // Apply or refresh corruption debuff
      if (!targetEnemy.activeDebuffs) {
        targetEnemy.activeDebuffs = {};
      }

      // If corruption already exists, stack the damage
      if (targetEnemy.activeDebuffs.corruption) {
        const existingDebuff = targetEnemy.activeDebuffs.corruption;
        const existingTicks = Math.ceil((existingDebuff.expiresAt - now) / 2000);
        const existingTotalDamage = existingDebuff.value! * existingTicks;
        const newTotalDamage = existingTotalDamage + dotDamage;
        const newTicks = Math.ceil(15000 / 2000);
        targetEnemy.activeDebuffs.corruption.value = Math.ceil(newTotalDamage / newTicks);
        targetEnemy.activeDebuffs.corruption.expiresAt = now + 15000;
        targetEnemy.activeDebuffs.corruption.lastTick = now;
      } else {
        // Apply new corruption debuff
        applyDebuff(targetEnemy, 'corruption', hero.username, dotDamagePerTick, callbacks);
      }

      callbacks.log('damage', `😈 ${hero.username}'s Corruption applies ${Math.floor(dotDamage)} DoT over 15s to ${targetEnemy.name}`);
    }

    // WARLOCK: Summon Demon (50% bonus DPS pet for 30s)
    if (!hero.classAbilityState!.petActive || now >= hero.classAbilityState!.petExpiry!) {
      if (now >= hero.cooldowns!.classAbilitySecondary) {
        hero.classAbilityState!.petActive = true;
        hero.classAbilityState!.petExpiry = now + 30000; // 30 seconds
        hero.cooldowns!.classAbilitySecondary = now + 60000; // 60s cooldown
        callbacks.log('damage', `😈 ${hero.username} summons a Demon! (+50% damage for 30s)`);
      }
    }

    // Apply demon bonus if active
    if (hero.classAbilityState!.petActive && now < hero.classAbilityState!.petExpiry!) {
      const demonDamage = modifiedDamage * 0.5;
      modifiedDamage += demonDamage;
    }
  }

  // MOONCALLER: Eclipse (cycles between solar and lunar)
  if (hero.role === 'mooncaller') {
    if (!hero.classAbilityState!.eclipseForm) {
      hero.classAbilityState!.eclipseForm = 'solar';
      hero.classAbilityState!.eclipseTimer = now;
    }

    // Switch forms every 20 seconds
    if (now - hero.classAbilityState!.eclipseTimer! >= 20000) {
      hero.classAbilityState!.eclipseForm = hero.classAbilityState!.eclipseForm === 'solar' ? 'lunar' : 'solar';
      hero.classAbilityState!.eclipseTimer = now;
    }

    if (hero.classAbilityState!.eclipseForm === 'solar') {
      modifiedDamage *= 2.0; // Solar: 200% single target
      callbacks.log('damage', `🌙☀️ ${hero.username} Solar Eclipse!`);
    } else {
      isAoE = true;
      aoeMultiplier = 1.2; // Lunar: 120% to all
      callbacks.log('damage', `🌙🌑 ${hero.username} Lunar Eclipse!`);
    }
  }

  // ATONER PASSIVE: Atonement (60% of damage converts to healing)
  if (hero.role === 'atoner' && modifiedDamage > 0) {
    atonementHeal = Math.floor(modifiedDamage * 0.6);
    // Target will be found in the main combat engine
  }

  // Apply gear proc effects (simplified)
  let gearProcBonus = 1.0;
  if (hero.equipment) {
    const EQUIPMENT_SLOTS = ['weapon', 'armor', 'accessory', 'helm', 'cloak', 'gloves', 'ring1', 'ring2', 'boots'];
    for (const slot of EQUIPMENT_SLOTS) {
      if (hero.equipment[slot] && hero.equipment[slot].procEffects) {
        hero.equipment[slot].procEffects.forEach((proc: any) => {
          if (Math.random() < proc.chance) {
            if (proc.effect === 'damageBonus') {
              gearProcBonus *= (1 + proc.value);
              callbacks.log('damage', `💫 ${proc.name} proc!`);
            } else if (proc.effect === 'critChance') {
              gearProcBonus *= 2; // Critical strike
              callbacks.log('damage', `⚡ ${proc.name} crit!`);
            }
          }
        });
      }
    }
  }

  modifiedDamage *= gearProcBonus;

  // Check for CRITICAL STRIKE proc
  if (hero.activeProcBuffs?.criticalStrike && now < hero.activeProcBuffs.criticalStrike) {
    modifiedDamage *= 2;
    delete hero.activeProcBuffs.criticalStrike; // Consume buff
    callbacks.log('damage', `💥 ${hero.username} CRITICAL STRIKE!`);
  }

  // Apply Arcane Empowerment spell crit chance (for casters)
  const isRangedCasterRole = ['mage', 'warlock', 'necromancer', 'ranger', 'shadowpriest', 'mooncaller', 'stormcaller', 'frostmage', 'firemage', 'dragonsorcerer'].includes(hero.role);
  if (isRangedCasterRole && hero.activeBuffs?.spellCritChance && hero.activeBuffs.spellCritChance.remainingDuration > 0) {
    if (Math.random() < hero.activeBuffs.spellCritChance.value) {
      modifiedDamage *= 2.0; // Critical strike
      callbacks.log('damage', `💥 ${hero.username} SPELL CRITICAL STRIKE!`);
    }
  }

  // Apply active buffs (e.g., Battle Hymn from Bard)
  if (hero.activeBuffs?.attackMultiplier && hero.activeBuffs.attackMultiplier.remainingDuration > 0) {
    modifiedDamage *= hero.activeBuffs.attackMultiplier.value;
  }

  // Apply skill bonuses
  const heroSkillBonuses = calculateSkillBonuses(hero);
  if (heroSkillBonuses.damageMultiplier > 0) {
    modifiedDamage *= (1 + heroSkillBonuses.damageMultiplier / 100);
  }

  // Apply guild perks (combat bonus) - placeholder
  if (hero.guildId) {
    modifiedDamage *= 1.05; // 5% guild combat bonus (placeholder)
  }

  // Check for skill-based crit chance
  if (heroSkillBonuses.critChance > 0 && Math.random() < (heroSkillBonuses.critChance / 100)) {
    const critMultiplier = 2.0 + (heroSkillBonuses.critDamage / 100);
    modifiedDamage *= critMultiplier;
    callbacks.log('damage', `💥 ${hero.username} SKILL CRITICAL STRIKE!`);
  }

  // Apply viewer bonuses
  modifiedDamage *= bonuses.damageMultiplier;

  // SANITY CAP: Prevent absurdly high damage
  if (enemies && enemies.length > 0) {
    const primaryEnemy = enemies[0];
    const maxReasonableDamage = primaryEnemy.maxHp * 3; // Max 3x enemy HP per hit
    if (modifiedDamage > maxReasonableDamage) {
      callbacks.log('combat', `⚠️ DAMAGE CAP: ${hero.username} damage capped from ${Math.floor(modifiedDamage)} to ${Math.floor(maxReasonableDamage)}`);
      modifiedDamage = maxReasonableDamage;
    }
  }

  return {
    modifiedDamage: Math.floor(modifiedDamage),
    isAoE,
    aoeMultiplier,
    chainLightning,
    stormChain,
    holyStrikeHealing,
    atonementHeal,
    atonementTarget,
    corruptionDoT,
    corruptionTarget
  };
}

/**
 * Apply Atonement healing (60% of damage converts to healing)
 */
export function applyAtonement(
  hero: Hero,
  heroDamage: number,
  heroes: Hero[] | Map<string, Hero>,
  now: number,
  callbacks: CombatCallbacks
): void {
  if (hero.role !== 'atoner' || heroDamage <= 0) return;

  const heroesArray = Array.isArray(heroes) ? heroes : Array.from(heroes.values());
  const atonementHeal = Math.floor(heroDamage * 0.6);

  // Find lowest HP ally
  let lowestHpHero: Hero | null = null;
  let lowestHpUsername: string | null = null;
  let lowestHpPercent = 1.0;

  heroesArray.forEach((h) => {
    if (!h || h.hp <= 0 || h.isDead || h.hp >= h.maxHp) return;

    const hpPercent = h.hp / h.maxHp;
    if (hpPercent < lowestHpPercent) {
      lowestHpPercent = hpPercent;
      lowestHpHero = h;
      lowestHpUsername = h.username;
    }
  });

  if (lowestHpHero && lowestHpUsername) {
    const { actualHeal } = applyHealing(lowestHpHero, atonementHeal, now, false);

    if (!hero.stats) hero.stats = { totalDamage: 0, totalHealing: 0, damageBlocked: 0 };
    hero.stats.totalHealing += actualHeal;

    callbacks.triggerHealAnimation(lowestHpUsername);
    callbacks.log('heal', `⚖️ ${hero.username}'s Atonement heals ${lowestHpUsername} for ${Math.floor(actualHeal)} HP`);
  }
}
