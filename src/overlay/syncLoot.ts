import { overlayAPI } from '../api/client';
import { normalizeServerItem } from '../gear/itemDisplay';
import type { Item } from '../types/Hero';
import {
  assignHeroIdsToKills,
  killsForBattlefieldLootRoll,
  mapEnemyKillKind,
  type OverlaySyncKill,
} from './syncLootKills';

export type { OverlaySyncKill } from './syncLootKills';
export { assignHeroIdsToKills, killsForBattlefieldLootRoll, mapEnemyKillKind };

export type LootDrop = { heroId: string; item: Item };

/**
 * Canonical loot: POST /api/battlefields/twitch:{streamerId}/loot/roll with kills[].
 * XP/gold remain on POST /api/overlay/sync (deltas only).
 */
export async function requestServerLootDrops(
  streamerId: string,
  batchId: string,
  deltas: Array<{
    heroId: string;
    xpGained: number;
    goldGained: number;
    timestamp?: number;
  }>,
  kills: OverlaySyncKill[]
): Promise<LootDrop[]> {
  if (!streamerId) return [];

  const rollKills = killsForBattlefieldLootRoll(kills);
  let drops: LootDrop[] = [];

  if (rollKills.length > 0) {
    const res = await overlayAPI.rollBattlefieldLoot(streamerId, rollKills);
    const raw = res.drops ?? [];
    drops = raw
      .map((row) => {
        if (!row?.heroId || !row?.item) return null;
        return { heroId: row.heroId, item: normalizeServerItem(row.item) };
      })
      .filter(Boolean) as LootDrop[];
  }

  const safeDeltas = deltas.filter((d) => d.xpGained > 0 || d.goldGained > 0);
  if (safeDeltas.length > 0) {
    await overlayAPI.syncDeltas(streamerId, batchId, safeDeltas);
  }

  return drops;
}
