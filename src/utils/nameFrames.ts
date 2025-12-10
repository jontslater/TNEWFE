/**
 * Name Frame CSS Styles
 * Simple CSS-based frames for hero names
 */

export type NameFrameType = 'bronze' | 'silver' | 'gold' | 'platinum' | null;

export interface NameFrameStyle {
  border: string;
  borderRadius: string;
  padding: string;
  boxShadow?: string;
  background?: string;
}

/**
 * Get CSS styles for a name frame
 */
export function getNameFrameStyles(frame: NameFrameType): NameFrameStyle | null {
  if (!frame) return null;

  const baseStyle = {
    borderRadius: '4px',
    padding: '2px 8px',
  };

  switch (frame) {
    case 'bronze':
      return {
        ...baseStyle,
        border: '2px solid #CD7F32',
        boxShadow: '0 0 4px rgba(205, 127, 50, 0.5)',
      };
    
    case 'silver':
      return {
        ...baseStyle,
        border: '2px solid #C0C0C0',
        boxShadow: '0 0 6px rgba(192, 192, 192, 0.6)',
      };
    
    case 'gold':
      return {
        ...baseStyle,
        border: '2px solid #FFD700',
        boxShadow: '0 0 8px rgba(255, 215, 0, 0.7)',
        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%)',
      };
    
    case 'platinum':
      return {
        ...baseStyle,
        border: '2px solid #E5E4E2',
        boxShadow: '0 0 10px rgba(229, 228, 226, 0.8), 0 0 15px rgba(147, 112, 219, 0.4)',
        background: 'linear-gradient(135deg, rgba(229, 228, 226, 0.15) 0%, rgba(147, 112, 219, 0.1) 100%)',
      };
    
    default:
      return null;
  }
}

export const NAME_FRAMES = [
  { id: 'none', name: 'None', value: null },
  { id: 'bronze', name: 'Bronze Frame', value: 'bronze' as NameFrameType },
  { id: 'silver', name: 'Silver Frame', value: 'silver' as NameFrameType },
  { id: 'gold', name: 'Gold Frame', value: 'gold' as NameFrameType },
  { id: 'platinum', name: 'Platinum Frame', value: 'platinum' as NameFrameType },
];

