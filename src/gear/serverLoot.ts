/**
 * @deprecated Use `src/overlay/syncLoot.ts` (POST .../battlefields/twitch:{id}/loot/roll).
 */
export {
  assignHeroIdsToKills,
  mapEnemyKillKind,
  requestServerLootDrops,
  type LootDrop,
  type OverlaySyncKill,
} from '../overlay/syncLoot';

/** @deprecated Use requestServerLootDrops via overlay sync kills. */
export async function rollCombatLoot(
  _battlefieldId: string,
  _params: unknown
): Promise<import('../overlay/syncLoot').LootDrop[]> {
  console.warn('[serverLoot] rollCombatLoot is disabled; use requestServerLootDrops + overlay/sync kills');
  return [];
}
