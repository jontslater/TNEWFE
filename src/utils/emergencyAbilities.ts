/**
 * Emergency Abilities System
 * Handles automatic emergency abilities that trigger based on combat conditions
 */

export interface EmergencyAbilityResult {
  abilityUsed: boolean;
  abilityName?: string;
  abilityMessage?: string;
  healing?: number;
  healingTargets?: string[]; // Hero IDs that were healed
  damageReduction?: number; // 0-1 multiplier (e.g., 0.25 = 75% reduction)
  debuffsRemoved?: string[]; // Hero IDs that had debuffs removed
}

/**
 * Check and apply Last Stand for tanks
 * Triggers automatically at 10% HP, provides 75% damage reduction for 10 seconds
 */
export function checkLastStand(
  heroId: string,
  heroRole: string,
  hpPercent: number,
  now: number,
  cooldowns: { lastStand?: number } = {},
  classAbilityState: { lastStandActive?: boolean; lastStandExpiry?: number } = {}
): EmergencyAbilityResult {
  // Only tanks can use Last Stand
  const tankRoles = ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'];
  if (!tankRoles.includes(heroRole.toLowerCase())) {
    return { abilityUsed: false };
  }

  // Check if Last Stand should trigger (10% HP or below, off cooldown, not already active)
  if (hpPercent <= 0.10 && (!cooldowns.lastStand || now >= cooldowns.lastStand) && !classAbilityState.lastStandActive) {
    classAbilityState.lastStandActive = true;
    classAbilityState.lastStandExpiry = now + 10000; // 10 seconds
    cooldowns.lastStand = now + 120000; // 2 minute cooldown

    return {
      abilityUsed: true,
      abilityName: 'Last Stand',
      abilityMessage: `🛡️💥 ${heroId} activates LAST STAND! (75% damage reduction for 10s)`,
      damageReduction: 0.25 // 75% reduction = 25% of original damage
    };
  }

  // Check if Last Stand expired
  if (classAbilityState.lastStandActive && classAbilityState.lastStandExpiry && now >= classAbilityState.lastStandExpiry) {
    classAbilityState.lastStandActive = false;
  }

  return { abilityUsed: false };
}

/**
 * Check and apply Group Heal for healers
 * Triggers when party average HP <70%, heals all members 40-60 HP
 */
export function checkGroupHeal(
  healerId: string,
  healerRole: string,
  healerAttack: number,
  allHeroes: Array<{ id: string; hp: number; maxHp: number }>,
  now: number,
  cooldowns: { groupHeal?: number } = {}
): EmergencyAbilityResult {
  // Only healers can use Group Heal
  const healerRoles = ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'];
  if (!healerRoles.includes(healerRole.toLowerCase())) {
    return { abilityUsed: false };
  }

  // Check cooldown
  if (cooldowns.groupHeal && now < cooldowns.groupHeal) {
    return { abilityUsed: false };
  }

  // Calculate party average HP percentage
  let totalHpPercent = 0;
  let aliveCount = 0;
  
  allHeroes.forEach((hero) => {
    if (hero.hp > 0) {
      totalHpPercent += hero.hp / hero.maxHp;
      aliveCount++;
    }
  });

  if (aliveCount === 0) {
    return { abilityUsed: false };
  }

  const avgHpPercent = totalHpPercent / aliveCount;

  // Trigger when party average HP <70%
  if (avgHpPercent < 0.70) {
    // Base heal: 40-60 HP + scales with healer attack (50% of attack)
    const baseHeal = 40 + Math.random() * 20; // 40-60
    const scaledHeal = baseHeal + (healerAttack * 0.5);
    const actualHeal = Math.floor(scaledHeal);

    // Heal all alive heroes
    const healedTargets: string[] = [];
    allHeroes.forEach((hero) => {
      if (hero.hp > 0) {
        healedTargets.push(hero.id);
      }
    });

    cooldowns.groupHeal = now + 30000; // 30 second cooldown

    return {
      abilityUsed: true,
      abilityName: 'Group Heal',
      abilityMessage: `🌊 ${healerId} uses GROUP HEAL! Restores ${healedTargets.length} heroes!`,
      healing: actualHeal,
      healingTargets: healedTargets
    };
  }

  return { abilityUsed: false };
}

/**
 * Check and apply Instant Heal for healers
 * Triggers when any hero <30% HP, targets lowest HP hero, 70-100 HP
 */
export function checkInstantHeal(
  healerId: string,
  healerRole: string,
  healerAttack: number,
  allHeroes: Array<{ id: string; hp: number; maxHp: number }>,
  now: number,
  cooldowns: { instantHeal?: number } = {}
): EmergencyAbilityResult {
  // Only healers can use Instant Heal
  const healerRoles = ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'];
  if (!healerRoles.includes(healerRole.toLowerCase())) {
    return { abilityUsed: false };
  }

  // Check cooldown
  if (cooldowns.instantHeal && now < cooldowns.instantHeal) {
    return { abilityUsed: false };
  }

  // Find hero with lowest HP percentage (must be below 30%)
  let criticalHero: { id: string; hp: number; maxHp: number } | null = null;
  let lowestHpPercent = 0.3; // Only trigger for heroes below 30%

  allHeroes.forEach((hero) => {
    if (hero.hp > 0) {
      const hpPercent = hero.hp / hero.maxHp;
      if (hpPercent < lowestHpPercent) {
        lowestHpPercent = hpPercent;
        criticalHero = hero;
      }
    }
  });

  // Trigger if we found a hero below 30% HP
  if (criticalHero) {
    // Base heal: 70-100 HP + scales with healer attack (100% of attack)
    const baseHeal = 70 + Math.random() * 30; // 70-100
    const scaledHeal = baseHeal + healerAttack; // 100% of attack
    const actualHeal = Math.floor(scaledHeal);

    cooldowns.instantHeal = now + 20000; // 20 second cooldown

    return {
      abilityUsed: true,
      abilityName: 'Instant Heal',
      abilityMessage: `⚡💚 ${healerId} uses INSTANT HEAL on ${criticalHero.id} for ${actualHeal} HP!`,
      healing: actualHeal,
      healingTargets: [criticalHero.id]
    };
  }

  return { abilityUsed: false };
}

/**
 * Check and apply Auto-Dispel for healers
 * Triggers every 25 seconds, removes ALL debuffs from most debuffed hero
 */
export function checkAutoDispel(
  healerId: string,
  healerRole: string,
  allHeroes: Array<{ id: string; activeDebuffs?: Record<string, any> }>,
  now: number,
  cooldowns: { dispel?: number } = {}
): EmergencyAbilityResult {
  // Only healers can use Auto-Dispel
  const healerRoles = ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'];
  if (!healerRoles.includes(healerRole.toLowerCase())) {
    return { abilityUsed: false };
  }

  // Check cooldown (25 seconds)
  if (cooldowns.dispel && now < cooldowns.dispel) {
    return { abilityUsed: false };
  }

  // Find hero with most debuffs
  let mostDebuffed: { id: string; debuffCount: number } | null = null;
  let maxDebuffs = 0;

  allHeroes.forEach((hero) => {
    const debuffCount = hero.activeDebuffs ? Object.keys(hero.activeDebuffs).length : 0;
    if (debuffCount > maxDebuffs) {
      maxDebuffs = debuffCount;
      mostDebuffed = { id: hero.id, debuffCount };
    }
  });

  // Trigger if we found a hero with debuffs
  if (mostDebuffed && mostDebuffed.debuffCount > 0) {
    cooldowns.dispel = now + 25000; // 25 second cooldown

    return {
      abilityUsed: true,
      abilityName: 'Auto-Dispel',
      abilityMessage: `✨ ${healerId} uses AUTO-DISPEL on ${mostDebuffed.id}! Removed ${mostDebuffed.debuffCount} debuffs.`,
      debuffsRemoved: [mostDebuffed.id]
    };
  }

  return { abilityUsed: false };
}
