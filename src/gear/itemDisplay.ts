import type { Item } from '../types/Hero';
import { getRarityStyle, type ItemRarity } from '../utils/rarityDisplay';

export type GearAffix = { id?: string; kind?: 'prefix' | 'suffix'; label?: string; stats?: Record<string, number> };

export function normalizeServerItem(raw: Record<string, unknown>): Item {
  const rarity = (raw.rarity as Item['rarity']) || 'common';
  const style = getRarityStyle(rarity as ItemRarity);
  const ilvl = Number(raw.ilvl ?? raw.itemLevel ?? raw.level ?? 1);
  return {
    id: String(raw.id ?? `item-${Date.now()}`),
    name: String(raw.name ?? 'Unknown Item'),
    slot: raw.slot as Item['slot'],
    rarity,
    attack: Number(raw.attack ?? raw.stats?.power ?? 0),
    defense: Number(raw.defense ?? raw.stats?.armor ?? 0),
    hp: Number(raw.hp ?? 0),
    color: String(raw.color ?? style.color),
    setName: (raw.setName as string) || (raw.setId as string) || undefined,
    intellect: raw.intellect as number | undefined,
    strength: raw.strength as number | undefined,
    dexterity: raw.dexterity as number | undefined,
    stamina: raw.stamina as number | undefined,
    wisdom: raw.wisdom as number | undefined,
    secondaryStats: raw.secondaryStats as Item['secondaryStats'],
    procEffects: raw.procEffects as Item['procEffects'],
    upgradeLevel: raw.upgradeLevel as number | undefined,
    sockets: raw.sockets as Item['sockets'],
    ...(ilvl ? { itemLevel: ilvl } : {}),
    ...(raw.affixes ? { affixes: raw.affixes as GearAffix[] } : {}),
  } as Item & { itemLevel?: number; affixes?: GearAffix[] };
}

const MYTHIC_POWER_MULT = 3.5;

export function calculateItemPower(item: Item, heroRole?: string): number {
  if (!item) return 0;
  const rarityMult: Record<string, number> = {
    common: 1,
    uncommon: 1.3,
    rare: 1.6,
    epic: 2,
    legendary: 2.5,
    mythic: MYTHIC_POWER_MULT,
  };
  const mult = rarityMult[item.rarity] || 1;
  let score = (item.attack || 0) + (item.defense || 0) + (item.hp || 0) / 5;
  score *= mult;
  if (item.secondaryStats?.critChance) score += item.secondaryStats.critChance * 100;
  if (heroRole) {
    const role = heroRole.toLowerCase();
    if (['cleric', 'druid', 'shaman', 'bard', 'healer'].some((r) => role.includes(r))) {
      score += (item.secondaryStats?.healingPower || 0) * 2;
    }
  }
  return Math.floor(score);
}

export function isItemBetter(newItem: Item, currentItem: Item | null | undefined, heroRole?: string): boolean {
  if (!currentItem) return true;
  return calculateItemPower(newItem, heroRole) > calculateItemPower(currentItem, heroRole);
}

export function wowRarityColor(rarity: string): string {
  const map: Record<string, string> = {
    common: '#9d9d9d',
    uncommon: '#1eff00',
    rare: '#0070dd',
    epic: '#a335ee',
    legendary: '#ff8000',
    mythic: '#e60026',
  };
  return map[rarity] || map.common;
}
