import bundledSets from './data/gear-set-bonuses.json';
import { apiClient } from '../api/client';

export type GearSetDefinition = {
  id: string;
  name: string;
  category: string;
  pieces: string[];
  bonuses: Record<string, { description?: string; [key: string]: unknown }>;
};

export type GearCatalog = {
  version: number;
  sets: GearSetDefinition[];
};

let cached: GearCatalog | null = null;

export function getBundledGearCatalog(): GearCatalog {
  const sets = Array.isArray(bundledSets)
    ? (bundledSets as GearSetDefinition[])
    : (bundledSets as GearCatalog).sets;
  return { version: 2, sets };
}

export async function loadGearCatalog(): Promise<GearCatalog> {
  if (cached) return cached;
  try {
    const res = await apiClient.get('/api/gear/catalog');
    if (res.data?.sets) {
      cached = res.data as GearCatalog;
      return cached;
    }
  } catch {
    try {
      const res = await apiClient.get('/api/gear/sets');
      if (res.data?.sets) {
        cached = { version: 1, sets: res.data.sets };
        return cached;
      }
    } catch {
      // bundled fallback
    }
  }
  cached = getBundledGearCatalog();
  return cached;
}

export function findSetForItem(
  catalog: GearCatalog,
  item: { setName?: string; setId?: string }
): GearSetDefinition | undefined {
  const key = item.setId || item.setName;
  if (!key) return undefined;
  return catalog.sets.find(
    (s) => s.id === key || s.name === key || s.name.toLowerCase() === String(key).toLowerCase()
  );
}

export function countSetPieces(
  equipment: Record<string, { setName?: string; setId?: string } | null | undefined> | undefined,
  setName: string
): number {
  if (!equipment) return 0;
  let n = 0;
  for (const item of Object.values(equipment)) {
    if (!item) continue;
    if (item.setName === setName || item.setId === setName) n += 1;
  }
  return n;
}
