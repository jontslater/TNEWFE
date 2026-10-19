/** Render metadata for cosmetics (mirrors backend `data/cosmetics.js` store + founder ids). */
export type CosmeticRender = {
  color?: string;
  gradient?: boolean;
  frameId?: string;
  effectId?: string;
  variant?: string;
  title?: string;
  imagePath?: string;
  palette?: string;
  auraId?: string;
  spellId?: string;
};

const RENDER_BY_ID: Record<string, CosmeticRender> = {
  name_iron: { color: '#9CA3AF' },
  name_emerald: { color: '#10B981' },
  name_sunset_gradient: { color: '#F97316', gradient: true },
  frame_iron: { frameId: 'iron' },
  frame_rune: { frameId: 'rune' },
  kill_sparkle: { effectId: 'sparkle' },
  level_firework: { effectId: 'firework' },
  charge_flame: { variant: 'flame' },
  title_the_idle: { title: 'the Idle' },
  title_chat_champion: { title: 'Chat Champion' },
  skin_ashen_tank: { palette: 'ashen' },
  skin_verdant_healer: { palette: 'verdant' },
  founder_badge_bronze: { imagePath: '/Badges/FoundersBronze.png' },
  founder_badge_silver: { imagePath: '/Badges/FoundersSilver.png' },
  founder_badge_gold: { imagePath: '/Badges/FoundersGold.png' },
  founder_badge_platinum: { imagePath: '/Badges/FoundersPlatinum.png' },
  founder_name_bronze: { color: '#CD7F32' },
  founder_name_silver: { color: '#C0C0C0' },
  founder_name_gold: { color: '#FFD700' },
  founder_name_platinum: { color: '#E5E4E2' },
  founder_frame_silver: { frameId: 'founder_silver' },
  founder_aura_gold: { auraId: 'founder_gold' },
  founder_spell_gold: { spellId: 'founder_gold' },
  founder_title: { title: 'Founder' },
};

export function getCosmeticRender(cosmeticId?: string | null): CosmeticRender | null {
  if (!cosmeticId) return null;
  return RENDER_BY_ID[cosmeticId] ?? null;
}

export const CHARGE_BAR_VARIANTS: Record<string, { fill: string; glow: string }> = {
  default: { fill: '', glow: '' },
  flame: {
    fill: 'linear-gradient(90deg, #f97316 0%, #ef4444 100%)',
    glow: '#f97316',
  },
};

export const CLASS_PALETTE_FILTERS: Record<string, string> = {
  ashen: 'sepia(0.35) saturate(0.7) brightness(0.95)',
  verdant: 'hue-rotate(85deg) saturate(1.2) brightness(1.05)',
};

export function resolveEquippedCosmeticIds(
  equipped?: Record<string, string | undefined> | null
): Record<string, string | undefined> {
  return equipped ?? {};
}
