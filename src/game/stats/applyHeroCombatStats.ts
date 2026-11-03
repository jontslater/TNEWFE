import { computeHeroStats } from './computeHeroStats';
import type { ComputedHeroStats, HeroStatInput } from './types';

export type HeroWithCombatStats = HeroStatInput & {
  hp?: number;
  critDamage?: number;
  xpGain?: number;
  goldGain?: number;
  tokenGain?: number;
  damageMultiplier?: number;
  healingMultiplier?: number;
  defenseMultiplier?: number;
};

/**
 * Merge computed combat stats onto a hero document (battlefield sync, level-ups, etc.).
 */
export function applyHeroCombatStats<T extends HeroWithCombatStats>(hero: T): T & ComputedHeroStats {
  const computed = computeHeroStats(hero);
  const currentHp = hero.hp ?? computed.maxHp;

  return {
    ...hero,
    attack: computed.attack,
    defense: computed.defense,
    maxHp: computed.maxHp,
    intellect: computed.intellect,
    strength: computed.strength,
    dexterity: computed.dexterity,
    wisdom: computed.wisdom,
    stamina: computed.stamina,
    healingPower: computed.healingPower,
    spellDamage: computed.spellDamage,
    meleeDamage: computed.meleeDamage,
    hpRegen: computed.hpRegen,
    damageReduction: computed.damageReduction,
    critChance: computed.critChance,
    critDamage: computed.critDamageBonus,
    xpGain: computed.rewardBonuses.xpGain,
    goldGain: computed.rewardBonuses.goldGain,
    tokenGain: computed.rewardBonuses.tokenGain,
    damageMultiplier: computed.damageMultiplier,
    healingMultiplier: computed.healingMultiplier,
    defenseMultiplier: computed.defenseMultiplier,
    rewardBonuses: computed.rewardBonuses,
    critDamageBonus: computed.critDamageBonus,
    skillBonuses: computed.skillBonuses,
    hp: Math.min(currentHp, computed.maxHp),
  };
}
