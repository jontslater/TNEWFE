/**
 * Craft recipe keys and costs from backend `data/craftRecipes.json` (37 keys).
 * Display metadata is client-side; costs are authoritative on the server.
 */
import serverCraftRecipes from './craftRecipes.json';

const CRAFTED_ITEM_SLOTS = {
  weapon: ['weapon'],
  armor: ['armor', 'helm', 'cloak', 'gloves', 'boots', 'shield'],
  accessory: ['accessory', 'ring1', 'ring2'],
  all: ['weapon', 'armor', 'accessory', 'helm', 'cloak', 'gloves', 'ring1', 'ring2', 'boots', 'shield'],
};

type ServerCraftTable = typeof serverCraftRecipes;

export type CraftRecipeDef = {
  name: string;
  tier: number;
  minProfessionLevel: number;
  cost: Record<string, unknown>;
  description: string;
  effect: string;
  applicableSlots: string[];
};

function titleCaseKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function tierForKey(key: string): number {
  if (key.includes('legendary') || key.includes('adamantite') || key.includes('superior')) return 4;
  if (key.includes('mithril') || key.includes('powerful') || key.includes('advanced')) return 3;
  if (key.includes('steel') || key.includes('refined')) return 2;
  return 1;
}

function buildRecipes(
  profession: keyof ServerCraftTable,
  slotDefault: string[]
): Record<string, CraftRecipeDef> {
  const table = serverCraftRecipes[profession] as Record<string, Record<string, unknown>>;
  const out: Record<string, CraftRecipeDef> = {};
  for (const [key, cost] of Object.entries(table || {})) {
    out[key] = {
      name: titleCaseKey(key),
      tier: tierForKey(key),
      minProfessionLevel: tierForKey(key) * 10,
      cost,
      description: 'Server-authoritative recipe',
      effect: key,
      applicableSlots: key === 'gem_socket' ? [] : slotDefault,
    };
  }
  return out;
}

export const HERBALISM_RECIPES = buildRecipes('herbalism', []);
export const MINING_RECIPES = buildRecipes('mining', CRAFTED_ITEM_SLOTS.armor);
export const ENCHANTING_RECIPES = buildRecipes('enchanting', CRAFTED_ITEM_SLOTS.all);
