import { CLASS_PALETTE_FILTERS, getCosmeticRender } from './renderCatalog';

type HeroCosmeticFields = {
  equippedCosmetics?: Record<string, string | undefined> | null;
};

export function getHeroChargeBarVariant(hero: HeroCosmeticFields): string | undefined {
  const id = hero.equippedCosmetics?.chargeBar;
  return getCosmeticRender(id)?.variant;
}

export function getHeroSpritePaletteFilter(hero: HeroCosmeticFields): string | undefined {
  const palette = getCosmeticRender(hero.equippedCosmetics?.skin)?.palette;
  if (!palette) return undefined;
  return CLASS_PALETTE_FILTERS[palette];
}

export function getHeroLevelFxLabel(hero: HeroCosmeticFields): string | null {
  const fx = getCosmeticRender(hero.equippedCosmetics?.levelFx)?.effectId;
  if (fx === 'firework') return '🎆';
  return null;
}

export function getHeroKillFxLabel(hero: HeroCosmeticFields): string | null {
  const fx = getCosmeticRender(hero.equippedCosmetics?.killFx)?.effectId;
  if (fx === 'sparkle') return '✨';
  return null;
}
