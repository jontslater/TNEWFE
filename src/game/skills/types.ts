export type SkillEffectType =
  | 'stat_boost'
  | 'damage_mult'
  | 'healing_mult'
  | 'defense_mult'
  | 'crit_chance'
  | 'crit_damage'
  | 'cooldown_red'
  | 'lifesteal'
  | 'speed_boost';

export type SkillCategory = 'tank' | 'healer' | 'dps';

export interface SkillTemplate {
  slot: number;
  name: string;
  effect: SkillEffectType;
  stat?: 'hp' | 'attack' | 'defense';
  baseValue: number;
  description: string;
  unlockLevel: number;
  maxPoints: number;
}

export interface SkillDefinition extends SkillTemplate {
  id: string;
  class: string;
  category: SkillCategory;
}

export interface HeroSkillAllocation {
  points?: number;
  unlockedAt?: number | null;
}

export interface ComputedSkillModifiers {
  damageMultiplier: number;
  healingMultiplier: number;
  defenseMultiplier: number;
  critChance: number;
  critDamage: number;
  cooldownReduction: number;
  lifesteal: number;
  speedBoost: number;
  statAttackPercent: number;
  statDefensePercent: number;
  statHpPercent: number;
  /** 0–30: chance per heal for 2× (Divine Grace, healer skill slot 3) */
  divineGraceProcPercent: number;
}

/** Legacy flat bucket shape used by combat helpers */
export interface LegacySkillBonuses {
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
  divineGraceProcPercent: number;
}

export interface ClassActiveAbility {
  cooldownKey: string;
  cooldownMs: number;
  label: string;
}
