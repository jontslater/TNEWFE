import { overlayClient } from '../api/client';
import type { Item } from '../types/Hero';
import { normalizeServerItem } from './itemDisplay';

export type CombatKillEvent = {
  enemyLevel: number;
  kind: 'normal' | 'elite' | 'boss';
  contentId?: string;
  difficulty?: string;
  enemyName?: string;
};

export type LootDrop = { heroId: string; item: Item };

export async function rollCombatLoot(
  battlefieldId: string,
  params: {
    kills: CombatKillEvent[];
    heroIds: string[];
    allowedSlots?: string[];
    waveCount?: number;
    viewerLootBonus?: number;
  }
): Promise<LootDrop[]> {
  if (!battlefieldId || params.kills.length === 0 || params.heroIds.length === 0) {
    return [];
  }

  const encoded = encodeURIComponent(battlefieldId);
  const body = {
    kills: params.kills,
    participantHeroIds: params.heroIds,
    allowedSlots: params.allowedSlots,
    waveCount: params.waveCount,
    viewerLootBonus: params.viewerLootBonus,
  };

  try {
    const res = await overlayClient.post(`/api/battlefields/${encoded}/loot/roll`, body);
    const drops = res.data?.drops ?? res.data?.items ?? [];
    return normalizeDrops(drops);
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) {
      try {
        const alt = await overlayClient.post('/api/overlay/loot-roll', {
          battlefieldId,
          ...body,
        });
        return normalizeDrops(alt.data?.drops ?? []);
      } catch {
        console.warn('[Loot] Server roll unavailable (404); no client-side roll');
        return [];
      }
    }
    console.error('[Loot] Server roll failed:', err);
    return [];
  }
}

function normalizeDrops(raw: unknown[]): LootDrop[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      const row = entry as { heroId?: string; item?: Record<string, unknown> };
      if (!row?.heroId || !row?.item) return null;
      return { heroId: row.heroId, item: normalizeServerItem(row.item) };
    })
    .filter(Boolean) as LootDrop[];
}
