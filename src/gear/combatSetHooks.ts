import type { Equipment } from '../types/Hero';
import { BACKEND_GEAR_SETS, itemMatchesSet, type BackendGearSet } from './setBonusEngine';

export type CombatSetHookModifiers = {
  shieldWallCooldownMsDelta: number;
  shieldWallPartyDrBonus: number;
  groupHealBonusFraction: number;
  groupHealHotFraction: number;
  burstStrikeCritBonus: number;
  burstStrikeCleaveFraction: number;
  burstStrikeChargeRateBonus: number;
  burstStrikeDotFraction: number;
};

function emptyMods(): CombatSetHookModifiers {
  return {
    shieldWallCooldownMsDelta: 0,
    shieldWallPartyDrBonus: 0,
    groupHealBonusFraction: 0,
    groupHealHotFraction: 0,
    burstStrikeCritBonus: 0,
    burstStrikeCleaveFraction: 0,
    burstStrikeChargeRateBonus: 0,
    burstStrikeDotFraction: 0,
  };
}

function countPieces(equipment: Equipment | undefined, set: BackendGearSet): number {
  if (!equipment) return 0;
  let n = 0;
  for (const slot of set.slots) {
    const item = equipment[slot as keyof Equipment];
    if (item && itemMatchesSet(item, set)) n += 1;
  }
  return n;
}

function applyHook(mods: CombatSetHookModifiers, hook: string | undefined, value: number | undefined) {
  if (!hook || value === undefined) return;
  switch (hook) {
    case 'shield_wall_cooldown_ms':
      mods.shieldWallCooldownMsDelta += value;
      break;
    case 'shield_wall_party_dr':
      mods.shieldWallPartyDrBonus += value;
      break;
    case 'group_heal_bonus':
      mods.groupHealBonusFraction += value;
      break;
    case 'group_heal_hot':
      mods.groupHealHotFraction += value;
      break;
    case 'burst_strike_crit':
      mods.burstStrikeCritBonus += value;
      break;
    case 'burst_strike_cleave':
      mods.burstStrikeCleaveFraction += value;
      break;
    case 'burst_strike_charge_rate':
      mods.burstStrikeChargeRateBonus += value;
      break;
    case 'burst_strike_dot':
      mods.burstStrikeDotFraction += value;
      break;
    default:
      break;
  }
}

/** Combat-time set hooks (not folded into permanent stat sheet). */
export function getCombatSetHookModifiers(
  equipment: Equipment | undefined
): CombatSetHookModifiers {
  const mods = emptyMods();
  for (const set of BACKEND_GEAR_SETS) {
    const pieces = countPieces(equipment, set);
    if (pieces < 2) continue;
    for (const tierKey of Object.keys(set.bonuses)) {
      const tier = Number(tierKey);
      if (!Number.isFinite(tier) || pieces < tier) continue;
      const bonus = set.bonuses[tierKey];
      applyHook(mods, bonus.hook, bonus.value);
      if (bonus.attack) {
        /* stat-only tiers from backend JSON — applied in calculateBackendSetBonuses */
      }
    }
  }
  return mods;
}
