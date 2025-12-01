/**
 * Emergency Abilities
 * Handles automatic defensive abilities that trigger based on HP thresholds
 * - Last Stand (Tanks at 10% HP)
 * - Shield Wall (Guardian when taking 40%+ max HP hit)
 * - Divine Shield (Paladin at 15% HP)
 * - Blood Drain (Blood Knight at 40% HP)
 * - Evasion (Vanguard at 30% HP)
 */

import { Hero, CombatCallbacks } from './types';
import { ROLE_CONFIG } from '../fullCombatEngine';

/**
 * Process emergency abilities for all heroes
 */
export function processEmergencyAbilities(
  heroes: Hero[] | Map<string, Hero>,
  now: number,
  callbacks: CombatCallbacks
): void {
  const heroesArray = Array.isArray(heroes) ? heroes : Array.from(heroes.values());

  heroesArray.forEach((hero) => {
    if (!hero || hero.hp <= 0 || hero.isDead) return;

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

    if (!hero.activeDebuffs) hero.activeDebuffs = {};

    const category = ROLE_CONFIG[hero.role]?.category || 'dps';
    const hpPercent = hero.hp / hero.maxHp;

    // TANK: LAST STAND - Triggers automatically at 10% HP
    if (category === 'tank' && hpPercent <= 0.10 && now >= hero.cooldowns!.lastStand && !hero.lastStandActive) {
      hero.lastStandActive = true;
      hero.cooldowns!.lastStand = now + 120000; // 2 minute cooldown
      callbacks.log('combat', `🛡️💥 ${hero.username} activates LAST STAND! (75% damage reduction for 10s)`);

      // Last Stand lasts 10 seconds
      setTimeout(() => {
        hero.lastStandActive = false;
        if (hero.hp > 0) {
          callbacks.log('combat', `${hero.username}'s Last Stand ends.`);
        }
      }, 10000);
    }

    // SHIELD GUARDIAN: SHIELD WALL - Triggers when taking 40%+ max HP hit
    if (hero.role === 'guardian' && now >= hero.cooldowns!.classAbilityPrimary) {
      // Check if recently took big hit (tracked separately)
      if (hero.lastBigHit && now - hero.lastBigHit < 1000) {
        hero.classAbilityState!.shieldWallActive = true;
        hero.classAbilityState!.shieldWallExpiry = now + 8000; // 8 seconds
        hero.cooldowns!.classAbilityPrimary = now + 90000; // 90s cooldown

        callbacks.log('combat', `🛡️💫 ${hero.username} activates SHIELD WALL! (Party -30% damage for 8s)`);
      }
    }

    // HOLY DEFENDER: DIVINE SHIELD - Triggers at 15% HP
    if (hero.role === 'paladin' && hpPercent <= 0.15 && now >= hero.cooldowns!.classAbilityPrimary) {
      hero.classAbilityState!.divineShieldActive = true;
      hero.classAbilityState!.divineShieldExpiry = now + 5000; // 5 seconds
      hero.cooldowns!.classAbilityPrimary = now + 120000; // 120s cooldown

      // Cleanse all debuffs
      hero.activeDebuffs = {};

      callbacks.log('combat', `✨ ${hero.username} activates DIVINE SHIELD! (Immune + Cleansed for 5s)`);
    }

    // BLOOD KNIGHT: BLOOD DRAIN - Triggers at 40% HP
    if (hero.role === 'bloodknight' && hpPercent <= 0.4 && now >= hero.cooldowns!.classAbilityPrimary) {
      hero.classAbilityState!.bloodDrainActive = true;
      hero.classAbilityState!.bloodDrainExpiry = now + 10000; // 10 seconds
      hero.cooldowns!.classAbilityPrimary = now + 60000; // 60s cooldown

      callbacks.log('combat', `🩸 ${hero.username} activates BLOOD DRAIN! (50% lifesteal for 10s)`);
    }

    // AGILE VANGUARD: EVASION - Triggers at 30% HP
    if (hero.role === 'vanguard' && hpPercent <= 0.3 && now >= hero.cooldowns!.classAbilityPrimary) {
      hero.classAbilityState!.evasionActive = true;
      hero.classAbilityState!.evasionExpiry = now + 6000; // 6 seconds
      hero.cooldowns!.classAbilityPrimary = now + 75000; // 75s cooldown

      callbacks.log('combat', `⚡ ${hero.username} activates EVASION! (50% dodge for 6s)`);
    }
  });
}

/**
 * Check if hero has active emergency ability
 */
export function hasEmergencyAbility(hero: Hero, ability: 'lastStand' | 'shieldWall' | 'divineShield' | 'bloodDrain' | 'evasion', now: number): boolean {
  if (!hero.classAbilityState) return false;

  switch (ability) {
    case 'lastStand':
      return hero.lastStandActive === true;
    case 'shieldWall':
      return hero.classAbilityState.shieldWallActive === true && now < (hero.classAbilityState.shieldWallExpiry || 0);
    case 'divineShield':
      return hero.classAbilityState.divineShieldActive === true && now < (hero.classAbilityState.divineShieldExpiry || 0);
    case 'bloodDrain':
      return hero.classAbilityState.bloodDrainActive === true && now < (hero.classAbilityState.bloodDrainExpiry || 0);
    case 'evasion':
      return hero.classAbilityState.evasionActive === true && now < (hero.classAbilityState.evasionExpiry || 0);
    default:
      return false;
  }
}
