/**
 * Buff System Utilities
 * Handles buff application, effects, and proc buffs
 */

export interface BuffEffect {
  name: string;
  icon: string;
  color: string;
  duration: number;
  value: number;
  effect: 'attackIncrease' | 'defenseIncrease' | 'critChanceIncrease' | 'damageReduction' | 'healingIncrease' | 'healOverTime' | 'proc';
}

export const BUFF_TYPES: Record<string, BuffEffect> = {
  ironSkin: {
    name: 'Iron Skin',
    icon: '🛡️',
    color: '#3b82f6',
    duration: 10000,
    value: 30, // 30% damage reduction
    effect: 'damageReduction'
  },
  divineGrace: {
    name: 'Divine Grace',
    icon: '✨',
    color: '#10b981',
    duration: 8000,
    value: 2, // 2x healing multiplier
    effect: 'healingIncrease'
  },
  criticalStrike: {
    name: 'Critical Strike',
    icon: '⚡',
    color: '#fbbf24',
    duration: 5000,
    value: 1.5, // 1.5x crit chance multiplier (or guaranteed crit)
    effect: 'critChanceIncrease'
  },
  attackBuff: {
    name: 'Attack Buff',
    icon: '⚔️',
    color: '#ef4444',
    duration: 60000,
    value: 10, // +10 attack (flat increase)
    effect: 'attackIncrease'
  },
  defenseBuff: {
    name: 'Defense Buff',
    icon: '🛡️',
    color: '#60a5fa',
    duration: 60000,
    value: 10, // +10 defense (flat increase)
    effect: 'defenseIncrease'
  },
  regeneration: {
    name: 'Regeneration',
    icon: '💚',
    color: '#10b981',
    duration: 10000,
    value: 5, // 5 HP per tick (every 2 seconds)
    effect: 'healOverTime'
  }
};

/**
 * Calculate stat modifiers from buffs
 * @param target - Target with activeBuffs
 * @returns Object with attackModifier, defenseModifier, critChanceModifier, damageReduction, healingMultiplier
 */
export function calculateBuffModifiers(
  target: { activeBuffs?: Record<string, any> }
): {
  attackModifier: number;
  defenseModifier: number;
  critChanceModifier: number;
  damageReduction: number;
  healingMultiplier: number;
} {
  let attackModifier = 0; // Flat attack increase
  let defenseModifier = 0; // Flat defense increase
  let critChanceModifier = 1.0; // Crit chance multiplier
  let damageReduction = 0; // Percentage damage reduction (0.0 to 1.0)
  let healingMultiplier = 1.0; // Healing multiplier

  if (target.activeBuffs) {
    Object.values(target.activeBuffs).forEach((buff: any) => {
      const buffDef = Object.values(BUFF_TYPES).find(b => b.name === buff.name);
      if (!buffDef) return;

      switch (buffDef.effect) {
        case 'attackIncrease':
          attackModifier += buffDef.value || buff.value || 0;
          break;
        case 'defenseIncrease':
          defenseModifier += buffDef.value || buff.value || 0;
          break;
        case 'critChanceIncrease':
          critChanceModifier *= (buffDef.value || buff.value || 1.0);
          break;
        case 'damageReduction':
          damageReduction += (buffDef.value || buff.value || 0) / 100; // Convert percentage to decimal
          break;
        case 'healingIncrease':
          healingMultiplier *= (buffDef.value || buff.value || 1.0);
          break;
      }
    });
  }

  // Cap damage reduction at 90%
  damageReduction = Math.min(0.9, damageReduction);

  return {
    attackModifier,
    defenseModifier,
    critChanceModifier,
    damageReduction,
    healingMultiplier
  };
}

/**
 * Check if proc buff should trigger (30% chance)
 * @param procChance - Proc chance (default 0.3 for 30%)
 * @returns true if proc should trigger
 */
export function checkProcBuff(procChance: number = 0.3): boolean {
  return Math.random() < procChance;
}

/**
 * Apply proc buff to target
 * @param target - Target with activeBuffs
 * @param buffKey - Key from BUFF_TYPES
 * @param appliedBy - Name of who applied the buff
 */
export function applyProcBuff(
  target: { activeBuffs?: Record<string, any> },
  buffKey: string,
  appliedBy: string
): void {
  const buffDef = BUFF_TYPES[buffKey];
  if (!buffDef) return;

  if (!target.activeBuffs) {
    target.activeBuffs = {};
  }

  target.activeBuffs[buffKey] = {
    name: buffDef.name,
    icon: buffDef.icon,
    color: buffDef.color,
    remainingDuration: buffDef.duration,
    value: buffDef.value,
    appliedBy: appliedBy,
    appliedAt: Date.now()
  };

}
