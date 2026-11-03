/**
 * Shared hero stat types for battlefield, portal, raids, and backend porting.
 */

export interface SkillStatBonuses {
  attack: number;
  defense: number;
  hp: number;
  damageMultiplier: number;
  healingMultiplier: number;
  defenseMultiplier: number;
  critChance: number;
  critDamage: number;
  cooldownReduction: number;
  lifesteal: number;
  speedBoost: number;
}

export interface RewardStatBonuses {
  xpGain: number;
  goldGain: number;
  tokenGain: number;
}

/** Minimal hero shape required for stat calculation */
export interface HeroStatInput {
  role: string;
  level: number;
  attack?: number;
  defense?: number;
  maxHp?: number;
  hp?: number;
  critChance?: number;
  intellect?: number;
  strength?: number;
  dexterity?: number;
  wisdom?: number;
  stamina?: number;
  equipment?: Record<string, unknown>;
  skills?: Record<string, { points?: number } | unknown>;
  prestigeSlotCores?: Record<string, { statBonus?: { attack?: number; defense?: number; hp?: number } }>;
  prestigeBoosts?: { statBoost?: { attack?: number; defense?: number; hp?: number } };
}

export interface ComputedHeroStats {
  attack: number;
  defense: number;
  maxHp: number;
  intellect: number;
  strength: number;
  dexterity: number;
  wisdom: number;
  stamina: number;
  healingPower: number;
  spellDamage: number;
  meleeDamage: number;
  hpRegen: number;
  /** Percentage points of damage reduction from gear/gems (e.g. 15 = 15% less damage taken) */
  damageReduction: number;
  critChance: number;
  /** Percentage points added to the base 200% crit multiplier (e.g. 10 → 2.1×) */
  critDamageBonus: number;
  rewardBonuses: RewardStatBonuses;
  damageMultiplier: number;
  healingMultiplier: number;
  defenseMultiplier: number;
  skillBonuses: SkillStatBonuses;
}
