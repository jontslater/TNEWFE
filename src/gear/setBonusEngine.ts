import gearSets from './data/gear-set-bonuses.json';
import type { Equipment, Item } from '../types/Hero';
import type { SetBonuses } from '../utils/setBonuses';

export type BackendGearSet = {
  id: string;
  name: string;
  roleGroup: string;
  slots: string[];
  bonuses: Record<
    string,
    {
      description?: string;
      hook?: string;
      value?: number;
      attack?: number;
      defense?: number;
      hp?: number;
      damageReduction?: number;
      critChance?: number;
      healingPower?: number;
      spellDamage?: number;
      meleeDamage?: number;
    }
  >;
};

export const BACKEND_GEAR_SETS = gearSets as BackendGearSet[];

export function itemMatchesSet(item: Item, set: BackendGearSet): boolean {
  const key = item.setId || item.setName;
  if (!key) return false;
  return key === set.id || key === set.name;
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

function applyTier(bonuses: SetBonuses, tier: BackendGearSet['bonuses'][string]) {
  if (!tier) return;
  if (tier.attack) bonuses.attack += tier.attack;
  if (tier.defense) bonuses.defense += tier.defense;
  if (tier.hp) bonuses.hp += tier.hp;
  if (tier.healingPower) bonuses.healingPower += tier.healingPower;
  if (tier.spellDamage) bonuses.spellDamage += tier.spellDamage;
  if (tier.meleeDamage) bonuses.meleeDamage += tier.meleeDamage;
  if (tier.critChance) bonuses.critChance += tier.critChance;
  if (tier.damageReduction) bonuses.damageReduction += tier.damageReduction;
  if (tier.hook === 'shield_wall_party_dr' && typeof tier.value === 'number') {
    bonuses.damageReduction += tier.value;
  }
  if (tier.hook === 'group_heal_bonus' && typeof tier.value === 'number') {
    bonuses.healingPower += tier.value * 100;
  }
}

export function calculateBackendSetBonuses(
  equipment: Equipment | undefined,
  _role: string
): SetBonuses {
  const bonuses: SetBonuses = {
    attack: 0,
    defense: 0,
    hp: 0,
    intellect: 0,
    strength: 0,
    dexterity: 0,
    wisdom: 0,
    stamina: 0,
    healingPower: 0,
    spellDamage: 0,
    meleeDamage: 0,
    hpRegen: 0,
    damageReduction: 0,
    critChance: 0,
  };

  for (const set of BACKEND_GEAR_SETS) {
    const pieces = countPieces(equipment, set);
    if (pieces < 2) continue;
    const tiers = Object.keys(set.bonuses)
      .map(Number)
      .filter((n) => pieces >= n)
      .sort((a, b) => b - a);
    for (const tier of tiers) {
      applyTier(bonuses, set.bonuses[String(tier)]);
    }
  }

  return bonuses;
}

export function getSetDisplayForBackendItem(
  equipment: Equipment | undefined,
  item: Item
): {
  setName: string;
  pieceCount: number;
  maxPieces: number;
  tiers: Array<{ pieces: number; description: string; active: boolean }>;
} | null {
  const key = item.setId || item.setName;
  if (!key) return null;
  const set = BACKEND_GEAR_SETS.find((s) => s.id === key || s.name === key);
  if (!set) return null;
  const preview = item.slot
    ? { ...(equipment || {}), [item.slot]: item } as Equipment
    : equipment;
  const pieceCount = countPieces(preview, set);
  const tiers = [2, 4]
    .filter((n) => set.bonuses[String(n)])
    .map((n) => ({
      pieces: n,
      description: set.bonuses[String(n)]?.description || `${n}-piece bonus`,
      active: pieceCount >= n,
    }));
  return { setName: set.name, pieceCount, maxPieces: set.slots.length, tiers };
}
