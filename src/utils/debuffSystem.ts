/**
 * Debuff System Utilities
 * Handles debuff application, resistance calculation, and effects
 */

export interface DebuffEffect {
  name: string;
  icon: string;
  color: string;
  duration: number;
  value: number;
  effect: 'damageReduction' | 'damageIncrease' | 'damageOverTime' | 'stun' | 'curse';
}

export const DEBUFF_TYPES: Record<string, DebuffEffect> = {
  weaken: {
    name: 'Weakened',
    icon: '💔',
    color: '#9b59b6',
    duration: 10000,
    value: 0.3, // 30% damage reduction
    effect: 'damageReduction'
  },
  vulnerable: {
    name: 'Vulnerable',
    icon: '🛡️💥',
    color: '#e74c3c',
    duration: 8000,
    value: 0.4, // 40% increased damage taken
    effect: 'damageIncrease'
  },
  poison: {
    name: 'Poisoned',
    icon: '☠️',
    color: '#27ae60',
    duration: 12000,
    value: 5, // 5 damage per tick
    effect: 'damageOverTime'
  },
  bleed: {
    name: 'Bleeding',
    icon: '🩸',
    color: '#c0392b',
    duration: 10000,
    value: 3, // 3 damage per tick
    effect: 'damageOverTime'
  },
  burn: {
    name: 'Burning',
    icon: '🔥',
    color: '#e67e22',
    duration: 10000,
    value: 4, // 4 damage per tick
    effect: 'damageOverTime'
  },
  corruption: {
    name: 'Corruption',
    icon: '😈',
    color: '#8e44ad',
    duration: 15000,
    value: 0, // Dynamic value (set when applied, typically 30% of damage as DoT)
    effect: 'damageOverTime'
  },
  stunned: {
    name: 'Stunned',
    icon: '💫',
    color: '#f39c12',
    duration: 3000,
    value: 1, // Prevents actions
    effect: 'stun'
  },
  cursed: {
    name: 'Cursed',
    icon: '😈',
    color: '#7d3c98',
    duration: 8000,
    value: 0.5, // 50% reduced healing
    effect: 'curse'
  }
};

/**
 * Calculate debuff resistance chance
 * @param target - Hero or Enemy with level, defense, etc.
 * @returns Resistance chance (0.0 to 1.0)
 */
export function getDebuffResistance(target: { level?: number; defense?: number; isBoss?: boolean }): number {
  // For enemies
  if (target.isBoss !== undefined) {
    return target.isBoss ? 0.25 : 0.10; // Bosses: 25%, regular: 10%
  }
  
  // For heroes
  const level = target.level || 1;
  const defense = target.defense || 0;
  
  // Base resistance from defense (1% per 5 defense, max 30%)
  const defenseResist = Math.min(0.3, defense / 500);
  
  // Level resistance (1% per 2 levels, max 25%)
  const levelResist = Math.min(0.25, level / 200);
  
  // Total resistance (max 70%)
  return Math.min(0.7, defenseResist + levelResist);
}

/**
 * Apply debuff to target with resistance check
 * @param target - Target with activeDebuffs
 * @param debuffKey - Key from DEBUFF_TYPES
 * @param appliedBy - Name of who applied the debuff
 * @returns true if debuff was applied, false if resisted
 */
export function applyDebuff(
  target: { activeDebuffs?: Record<string, any> },
  debuffKey: string,
  appliedBy: string,
  resistance?: number
): boolean {
  const debuffDef = DEBUFF_TYPES[debuffKey];
  if (!debuffDef) return false;

  // Check resistance
  const resistChance = resistance !== undefined ? resistance : 0.1; // Default 10% if not provided
  if (Math.random() < resistChance) {
    return false;
  }

  // Apply debuff
  if (!target.activeDebuffs) {
    target.activeDebuffs = {};
  }

  target.activeDebuffs[debuffKey] = {
    name: debuffDef.name,
    icon: debuffDef.icon,
    color: debuffDef.color,
    remainingDuration: debuffDef.duration,
    value: debuffDef.value,
    appliedBy: appliedBy,
    appliedAt: Date.now()
  };

  return true;
}

/**
 * Calculate damage modifier from debuffs
 * @param attacker - Attacker with activeDebuffs
 * @param defender - Defender with activeDebuffs
 * @returns Object with damageMultiplier (for attacker) and damageTakenMultiplier (for defender)
 */
export function calculateDebuffDamageModifiers(
  attacker: { activeDebuffs?: Record<string, any> },
  defender: { activeDebuffs?: Record<string, any> }
): { damageMultiplier: number; damageTakenMultiplier: number } {
  let damageMultiplier = 1.0; // Attacker's damage output
  let damageTakenMultiplier = 1.0; // Defender's damage taken

  // Attacker debuffs (reduce damage dealt)
  if (attacker.activeDebuffs) {
    Object.values(attacker.activeDebuffs).forEach((debuff: any) => {
      const debuffDef = Object.values(DEBUFF_TYPES).find(d => d.name === debuff.name);
      if (debuffDef?.effect === 'damageReduction') {
        damageMultiplier *= (1 - debuffDef.value); // e.g., 0.3 = 30% reduction = 0.7x damage
      }
    });
  }

  // Defender debuffs (increase damage taken)
  if (defender.activeDebuffs) {
    Object.values(defender.activeDebuffs).forEach((debuff: any) => {
      const debuffDef = Object.values(DEBUFF_TYPES).find(d => d.name === debuff.name);
      if (debuffDef?.effect === 'damageIncrease') {
        damageTakenMultiplier *= (1 + debuffDef.value); // e.g., 0.4 = 40% increase = 1.4x damage
      }
    });
  }

  return { damageMultiplier, damageTakenMultiplier };
}

/**
 * Check if target is stunned
 * @param target - Target with activeDebuffs
 * @returns true if stunned
 */
export function isStunned(target: { activeDebuffs?: Record<string, any> }): boolean {
  if (!target.activeDebuffs) return false;
  
  return Object.values(target.activeDebuffs).some((debuff: any) => {
    const debuffDef = Object.values(DEBUFF_TYPES).find(d => d.name === debuff.name);
    return debuffDef?.effect === 'stun' && debuff.remainingDuration > 0;
  });
}
