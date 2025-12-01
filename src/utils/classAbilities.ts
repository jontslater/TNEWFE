/**
 * Class Abilities System
 * Simplified version for test page - handles hero class abilities
 */

export interface AbilityResult {
  modifiedDamage: number;
  abilityUsed: boolean;
  abilityName?: string;
  abilityMessage?: string;
  healing?: number;
}

/**
 * Apply class ability effects to damage
 */
export function applyClassAbility(
  heroRole: string,
  baseDamage: number,
  targetEnemyHpPercent: number,
  now: number,
  cooldowns: { classAbilityPrimary?: number } = {},
  classAbilityState: {
    enrageActive?: boolean;
    enrageExpiry?: number;
    elementRotation?: number;
    comboCount?: number;
  } = {}
): AbilityResult {
  let modifiedDamage = baseDamage;
  let abilityUsed = false;
  let abilityName: string | undefined;
  let abilityMessage: string | undefined;
  let healing: number | undefined;

  // Initialize state if needed
  if (classAbilityState.elementRotation === undefined) {
    classAbilityState.elementRotation = 0;
  }
  if (classAbilityState.comboCount === undefined) {
    classAbilityState.comboCount = 0;
  }

  // BERSERKER: ENRAGE - Triggers when enemy below 35% HP
  if (heroRole === 'berserker') {
    // Check if enrage should trigger (enemy below 35% HP and ability off cooldown)
    const shouldTriggerEnrage = targetEnemyHpPercent <= 0.35 && (!cooldowns.classAbilityPrimary || now >= cooldowns.classAbilityPrimary);
    
    // Check if enrage is currently active
    const isEnrageActive = classAbilityState.enrageActive && classAbilityState.enrageExpiry && now < classAbilityState.enrageExpiry;
    
    if (shouldTriggerEnrage && !isEnrageActive) {
      // Trigger new enrage
      classAbilityState.enrageActive = true;
      classAbilityState.enrageExpiry = now + 12000; // 12 seconds
      cooldowns.classAbilityPrimary = now + 60000; // 60s cooldown
      abilityUsed = true;
      abilityName = 'Enrage';
      abilityMessage = '⚔️💥 ENRAGES! (+40% damage for 12s)';
    } else if (isEnrageActive && classAbilityState.enrageExpiry && now >= classAbilityState.enrageExpiry) {
      // Enrage expired
      classAbilityState.enrageActive = false;
    }

    // Apply Enrage bonus if active
    if (classAbilityState.enrageActive && classAbilityState.enrageExpiry && now < classAbilityState.enrageExpiry) {
      modifiedDamage *= 1.4; // +40% damage
    }
  }

  // ASSASSIN: Backstab (400% damage - 80% chance when enemy distracted)
  if (heroRole === 'assassin') {
    const enemyDistracted = Math.random() < 0.8; // 80% of time
    if (enemyDistracted && (!cooldowns.classAbilityPrimary || now >= cooldowns.classAbilityPrimary)) {
      modifiedDamage *= 4; // 400% damage
      cooldowns.classAbilityPrimary = now + 30000; // 30s cooldown
      abilityUsed = true;
      abilityName = 'Backstab';
      abilityMessage = '🗝️ BACKSTAB!';
    }
  }

  // REAPER: Death Strike (instant kill <10%, 350% <25%)
  if (heroRole === 'reaper') {
    if (targetEnemyHpPercent <= 0.25 && (!cooldowns.classAbilityPrimary || now >= cooldowns.classAbilityPrimary)) {
      if (targetEnemyHpPercent <= 0.10) {
        // Instant kill - set damage to enemy's max HP
        modifiedDamage = 999999; // Ensure it dies
        abilityUsed = true;
        abilityName = 'Death Strike';
        abilityMessage = '💀💥 DEATH STRIKE - INSTANT KILL!';
      } else {
        modifiedDamage *= 3.5; // 350% damage
        abilityUsed = true;
        abilityName = 'Death Strike';
        abilityMessage = '💀 DEATH STRIKE!';
      }
      cooldowns.classAbilityPrimary = now + 40000; // 40s cooldown
    }
  }

  // MAGE: Elemental Rotation (Fire/Frost/Arcane cycling)
  if (heroRole === 'mage') {
    const rotation = classAbilityState.elementRotation!;
    if (rotation === 0) {
      // Fire: 180% damage
      modifiedDamage *= 1.8;
      abilityUsed = true;
      abilityName = 'Fire';
      abilityMessage = '🔥 FIRE!';
    } else if (rotation === 1) {
      // Frost: 120% damage
      modifiedDamage *= 1.2;
      abilityUsed = true;
      abilityName = 'Frost';
      abilityMessage = '❄️ FROST!';
    } else {
      // Arcane: 150% damage
      modifiedDamage *= 1.5;
      abilityUsed = true;
      abilityName = 'Arcane';
      abilityMessage = '✨ ARCANE!';
    }
    // Cycle to next element
    classAbilityState.elementRotation = (rotation + 1) % 3;
  }

  // MONK: Combo Counter (500% damage after 5 attacks)
  if (heroRole === 'monk') {
    classAbilityState.comboCount!++;
    if (classAbilityState.comboCount! >= 5) {
      modifiedDamage *= 5; // 500% damage
      classAbilityState.comboCount = 0;
      abilityUsed = true;
      abilityName = 'Chi Burst';
      abilityMessage = '🥋💥 CHI BURST!';
    }
  }

  // CRUSADER: Holy Strike (300% damage + 15% party heal)
  if (heroRole === 'crusader') {
    if (targetEnemyHpPercent >= 0.5 && (!cooldowns.classAbilityPrimary || now >= cooldowns.classAbilityPrimary)) {
      modifiedDamage *= 3; // 300% damage
      healing = modifiedDamage * 0.15; // 15% of damage as healing
      cooldowns.classAbilityPrimary = now + 45000; // 45s cooldown
      abilityUsed = true;
      abilityName = 'Holy Strike';
      abilityMessage = '🗡️ HOLY STRIKE!';
    }
  }

  return {
    modifiedDamage: Math.floor(modifiedDamage),
    abilityUsed,
    abilityName,
    abilityMessage,
    healing
  };
}
