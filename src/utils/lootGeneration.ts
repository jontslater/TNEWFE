/**
 * @deprecated Client-side loot generation removed (GEAR_PLAN §7).
 * Use server rolls via `src/gear/serverLoot.ts` and display helpers below.
 */
import type { Item } from '../types/Hero';

export {
  calculateItemPower,
  isItemBetter,
  normalizeServerItem,
  wowRarityColor,
} from '../gear/itemDisplay';

/** @deprecated Server rolls only — returns null. */
export function generateLoot(
  _role: string,
  _options?: Record<string, unknown>
): Item | null {
  console.warn('[lootGeneration] generateLoot is disabled; use rollCombatLoot()');
  return null;
}
