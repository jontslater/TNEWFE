/**
 * Spell Effects for Founder Pack Cosmetics
 * Visual enhancements for projectiles and abilities
 */

export type SpellEffectType = 'bronze' | 'silver' | 'gold' | 'platinum' | null;

export interface SpellEffectFilter {
  filter: string;
  scale?: number; // Optional scale multiplier for projectile size
  glowIntensity?: number; // Glow intensity (0-1)
}

/**
 * Get CSS filter for spell effect - enhances projectiles and abilities
 * Effects are layered on top of existing element filters
 */
export function getSpellEffectFilter(spellEffect: SpellEffectType): SpellEffectFilter | null {
  if (!spellEffect) return null;

  switch (spellEffect) {
    case 'bronze':
      // Subtle bronze glow
      return {
        filter: 'drop-shadow(0 0 4px rgba(205, 127, 50, 0.6)) drop-shadow(0 0 8px rgba(205, 127, 50, 0.4))',
        scale: 1.1,
        glowIntensity: 0.6,
      };

    case 'silver':
      // Enhanced silver glow
      return {
        filter: 'drop-shadow(0 0 5px rgba(192, 192, 192, 0.7)) drop-shadow(0 0 10px rgba(192, 192, 192, 0.5)) drop-shadow(0 0 15px rgba(255, 255, 255, 0.3))',
        scale: 1.15,
        glowIntensity: 0.7,
      };

    case 'gold':
      // Enhanced gold glow with particle trail effect
      return {
        filter: 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.8)) drop-shadow(0 0 12px rgba(255, 215, 0, 0.6)) drop-shadow(0 0 18px rgba(255, 200, 0, 0.4)) brightness(1.1) saturate(1.2)',
        scale: 1.2,
        glowIntensity: 0.8,
      };

    case 'platinum':
      // Enhanced platinum glow with holographic sparkles
      return {
        filter: 'drop-shadow(0 0 6px rgba(229, 228, 226, 0.8)) drop-shadow(0 0 12px rgba(147, 112, 219, 0.7)) drop-shadow(0 0 18px rgba(221, 160, 221, 0.6)) drop-shadow(0 0 8px rgba(255, 255, 255, 0.5)) brightness(1.15) saturate(1.3)',
        scale: 1.25,
        glowIntensity: 0.9,
      };

    default:
      return null;
  }
}

/**
 * Get animation class for spell effect (for animated effects)
 */
export function getSpellEffectAnimation(spellEffect: SpellEffectType): string | null {
  if (!spellEffect) return null;

  switch (spellEffect) {
    case 'gold':
      return 'spell-effect-gold-pulse';
    case 'platinum':
      return 'spell-effect-platinum-sparkle';
    default:
      return null;
  }
}

export const SPELL_EFFECTS = [
  { id: 'none', name: 'None', value: null },
  { id: 'bronze', name: 'Bronze Spell Effect', value: 'bronze' as SpellEffectType },
  { id: 'silver', name: 'Silver Spell Effect', value: 'silver' as SpellEffectType },
  { id: 'gold', name: 'Gold Spell Effect', value: 'gold' as SpellEffectType },
  { id: 'platinum', name: 'Platinum Spell Effect', value: 'platinum' as SpellEffectType },
];

