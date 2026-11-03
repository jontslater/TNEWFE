/**
 * Gold shop (!auto purchases) — prices aligned with idleDnD-Backend heroes purchase/gold route.
 */

export interface GoldShopItem {
  name: string;
  cost: number;
  description: string;
  type: 'potion' | 'buff';
  durationMs?: number;
}

/** Canonical auto-buy / !buy gold shop (backend GOLD_SHOP_ITEMS). */
export const GOLD_SHOP_ITEMS: Record<string, GoldShopItem> = {
  healthpotion: {
    name: 'Health Potion',
    cost: 10,
    description: 'Auto-heal when HP < 30%',
    type: 'potion',
  },
  xpboost: {
    name: 'XP Boost Scroll',
    cost: 25,
    description: '+50% XP for 5min combat time',
    type: 'buff',
    durationMs: 300_000,
  },
  attackbuff: {
    name: 'Sharpening Stone',
    cost: 15,
    description: '+10% ATK for 10min combat time',
    type: 'buff',
    durationMs: 600_000,
  },
  defensebuff: {
    name: 'Armor Polish',
    cost: 15,
    description: '+10% DEF for 10min combat time',
    type: 'buff',
    durationMs: 600_000,
  },
};

/** Chance each auto-buy check runs during travel/treasure (not during combat). */
export const AUTO_BUY_ATTEMPT_CHANCE = 0.3;

/** Minimum health potions before auto-buy skips potion purchase. */
export const AUTO_BUY_MIN_HEALTH_POTIONS = 2;
