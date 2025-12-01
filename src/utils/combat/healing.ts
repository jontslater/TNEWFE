/**
 * Healing System
 * Handles all healing calculations, overheal shields, and shield application
 */

import { Hero, Shield, ViewerBonuses } from './types';
import { ROLE_CONFIG } from '../fullCombatEngine';

/**
 * Apply shield to hero (from overheal or abilities)
 */
export function applyShield(
  hero: Hero,
  amount: number,
  duration: number = 30000,
  source: string = 'overheal'
): void {
  if (!hero || amount <= 0) return;

  const now = Date.now();

  // Initialize or update shield
  if (!hero.shield) {
    hero.shield = {
      amount: 0,
      expiresAt: now + duration,
      source: source
    };
  }

  // Add to existing shield or create new one
  const shieldBefore = hero.shield.amount;
  hero.shield.amount += amount;
  hero.shield.expiresAt = Math.max(hero.shield.expiresAt, now + duration); // Extend duration if shield already exists
  hero.shield.source = source;
  
}

/**
 * Check and process shield expiry (converts to healing if expired)
 * NOTE: Expired shields should NOT convert to healing - they should just expire
 * Converting to healing causes shields to disappear when they expire, which is confusing
 */
export function checkShieldExpiry(hero: Hero, now: number): boolean {
  if (!hero.shield || hero.shield.amount <= 0) return false;

  if (now >= hero.shield.expiresAt) {
    // Shield expired - just remove it (don't convert to healing)
    // Converting to healing makes it look like shields disappear for no reason
    hero.shield = undefined;
    return true;
  }

  return false;
}

/**
 * Calculate healing amount with all bonuses and reductions
 */
export function calculateHealing(
  baseHeal: number,
  healer: Hero,
  bonuses: ViewerBonuses,
  calculateSkillBonuses: (hero: Hero) => any
): number {
  // Intellect bonus (capped at 100 for 1% per point)
  const cappedInt = Math.min(healer.intellect || 0, 100);
  const intellectBonus = 1 + (cappedInt * 0.01);

  // Healing Power bonus (capped at 30 for 1% per point)
  const cappedHealingPower = Math.min(healer.healingPower || 0, 30);
  const healingPowerBonus = 1 + (cappedHealingPower * 0.01);

  // Skill bonuses
  const skillBonuses = calculateSkillBonuses(healer);
  const healingMultiplier = 1 + (skillBonuses.healingMultiplier / 100);

  // Calculate final healing
  let healAmount = baseHeal * intellectBonus * healingPowerBonus * bonuses.healingMultiplier * healingMultiplier;

  return Math.floor(healAmount);
}

/**
 * Apply healing to hero with overheal shield conversion
 */
export function applyHealing(
  hero: Hero,
  healAmount: number,
  now: number,
  createOverhealShield: boolean = true
): { actualHeal: number; overhealAmount: number } {
  if (!hero || hero.isDead || hero.hp <= 0) {
    return { actualHeal: 0, overhealAmount: 0 };
  }

  // Calculate actual heal and overheal
  const hpBeforeHeal = hero.hp;
  const maxPossibleHeal = hero.maxHp - hpBeforeHeal;
  const actualHeal = Math.min(healAmount, maxPossibleHeal);
  const overhealAmount = Math.max(0, healAmount - maxPossibleHeal);

  // Apply healing (cap at maxHp)
  hero.hp = Math.min(hero.hp + healAmount, hero.maxHp);

  // Create shield from overheal
  if (createOverhealShield && overhealAmount > 0) {
    applyShield(hero, overhealAmount, 30000, 'overheal');
  }

  return { actualHeal, overhealAmount };
}

/**
 * Process shields (expiry and damage absorption)
 */
export function processShields(heroes: Hero[] | Map<string, Hero>, now: number): void {
  const heroesArray = Array.isArray(heroes) ? heroes : Array.from(heroes.values());

  heroesArray.forEach((hero) => {
    if (!hero || hero.isDead) return;

    // Check shield expiry - check even if amount is 0 (shield might have expired)
    if (hero.shield && hero.shield.expiresAt && now >= hero.shield.expiresAt) {
      checkShieldExpiry(hero, now);
    }
  });
}

/**
 * Absorb damage with shield
 */
export function absorbShieldDamage(hero: Hero, damage: number): { absorbed: number; remainingDamage: number } {
  if (!hero || !hero.shield || hero.shield.amount <= 0) {
    return { absorbed: 0, remainingDamage: damage };
  }

  const shieldAmount = hero.shield.amount;
  const absorbed = Math.min(damage, shieldAmount);
  const remainingDamage = Math.max(0, damage - shieldAmount);

  // Reduce shield
  const shieldBefore = hero.shield.amount;
  hero.shield.amount -= absorbed;
  
  // Clear shield if depleted (amount <= 0)
  // A shield with 0 amount is useless, so clear it immediately
  if (hero.shield.amount <= 0) {
    hero.shield = undefined;
  }

  return { absorbed, remainingDamage };
}
