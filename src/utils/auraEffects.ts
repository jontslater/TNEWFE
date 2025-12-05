/**
 * Aura Effects for Founder Cosmetics
 * CSS-based visual effects that wrap around hero sprites
 */

export type AuraEffectType = 'bronze' | 'silver' | 'gold' | 'platinum' | null;

export interface AuraEffectStyle {
  filter?: string;
  animation?: string;
}

/**
 * Convert hex color to rgba
 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Get default color for aura tier
 */
function getAuraTierColor(aura: AuraEffectType): string | null {
  switch (aura) {
    case 'bronze':
      return '#CD7F32'; // Bronze
    case 'silver':
      return '#C0C0C0'; // Silver
    case 'gold':
      return '#FFD700'; // Gold
    case 'platinum':
      return '#E5E4E2'; // Platinum
    default:
      return null;
  }
}

/**
 * Get filter for aura effect - targets the sprite directly
 * More subtle to layer with shield/enrage glows
 * @param aura - The aura tier type
 * @param customColor - Optional custom hex color to override tier default
 */
export function getAuraFilter(aura: AuraEffectType, customColor?: string | null): string | null {
  if (!aura) return null;

  // Use custom color if provided, otherwise use tier default
  const colorHex = customColor || getAuraTierColor(aura);
  if (!colorHex) return null;

  // Convert hex to rgba values for drop-shadow
  const r = parseInt(colorHex.slice(1, 3), 16);
  const g = parseInt(colorHex.slice(3, 5), 16);
  const b = parseInt(colorHex.slice(5, 7), 16);

  switch (aura) {
    case 'bronze':
      // Subtle glow that works with combat effects
      return `drop-shadow(0 0 4px rgba(${r}, ${g}, ${b}, 0.5)) drop-shadow(0 0 8px rgba(${r}, ${g}, ${b}, 0.3))`;
    
    case 'silver':
      // Subtle glow
      return `drop-shadow(0 0 5px rgba(${r}, ${g}, ${b}, 0.6)) drop-shadow(0 0 10px rgba(${r}, ${g}, ${b}, 0.4))`;
    
    case 'gold':
      // Subtle glow with pulsing animation
      return `drop-shadow(0 0 6px rgba(${r}, ${g}, ${b}, 0.6)) drop-shadow(0 0 12px rgba(${r}, ${g}, ${b}, 0.4))`;
    
    case 'platinum':
      // More vibrant glow with sparkle effect
      // For platinum, also add a complementary purple tint if custom color
      if (customColor) {
        // Use custom color as primary, add a lighter version as accent
        return `drop-shadow(0 0 6px rgba(${r}, ${g}, ${b}, 0.7)) drop-shadow(0 0 12px rgba(${r}, ${g}, ${b}, 0.6)) drop-shadow(0 0 18px rgba(${Math.min(255, r + 20)}, ${Math.min(255, g + 20)}, ${Math.min(255, b + 20)}, 0.4))`;
      } else {
        // Default platinum with purple accent
        return 'drop-shadow(0 0 6px rgba(229, 228, 226, 0.7)) drop-shadow(0 0 12px rgba(147, 112, 219, 0.6)) drop-shadow(0 0 18px rgba(221, 160, 221, 0.4))';
      }
    
    default:
      return null;
  }
}

/**
 * Get CSS keyframes for aura animations
 */
export function getAuraKeyframes(): string {
  return `
    @keyframes goldAuraPulse {
      0%, 100% {
        box-shadow: 0 0 25px rgba(255, 215, 0, 0.8), 0 0 50px rgba(255, 215, 0, 0.6), 0 0 75px rgba(255, 215, 0, 0.4);
      }
      50% {
        box-shadow: 0 0 35px rgba(255, 215, 0, 1), 0 0 70px rgba(255, 215, 0, 0.8), 0 0 105px rgba(255, 215, 0, 0.6);
      }
    }
    
    @keyframes platinumAuraPulse {
      0%, 100% {
        box-shadow: 0 0 30px rgba(229, 228, 226, 0.8), 0 0 60px rgba(147, 112, 219, 0.6), 0 0 90px rgba(147, 112, 219, 0.4);
        filter: drop-shadow(0 0 15px rgba(229, 228, 226, 0.9)) drop-shadow(0 0 25px rgba(147, 112, 219, 0.7));
      }
      50% {
        box-shadow: 0 0 40px rgba(229, 228, 226, 1), 0 0 80px rgba(147, 112, 219, 0.8), 0 0 120px rgba(147, 112, 219, 0.6);
        filter: drop-shadow(0 0 20px rgba(229, 228, 226, 1)) drop-shadow(0 0 35px rgba(147, 112, 219, 0.9));
      }
    }
  `;
}

export const AURA_EFFECTS = [
  { id: 'none', name: 'None', value: null },
  { id: 'bronze', name: 'Bronze Aura', value: 'bronze' as AuraEffectType },
  { id: 'silver', name: 'Silver Aura', value: 'silver' as AuraEffectType },
  { id: 'gold', name: 'Gold Aura', value: 'gold' as AuraEffectType },
  { id: 'platinum', name: 'Platinum Aura', value: 'platinum' as AuraEffectType },
];
