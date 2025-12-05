/**
 * Founder Title Colors
 * Colors for "Founder" title based on tier
 */

export type FounderTier = 'bronze' | 'silver' | 'gold' | 'platinum';

/**
 * Get color for founder title based on tier
 */
export function getFounderTitleColor(tier: FounderTier | string | null | undefined): string {
  if (!tier) return '#fbbf24'; // Default gold color

  const tierLower = tier.toLowerCase();
  
  switch (tierLower) {
    case 'bronze':
      return '#CD7F32'; // Bronze
    case 'silver':
      return '#C0C0C0'; // Silver
    case 'gold':
      return '#FFD700'; // Gold
    case 'platinum':
      return '#E5E4E2'; // Platinum
    default:
      return '#fbbf24'; // Default gold
  }
}

/**
 * Check if a title is a founder title and extract tier
 */
export function getFounderTierFromTitle(title: string | null | undefined): FounderTier | null {
  if (!title) return null;

  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('bronze')) return 'bronze';
  if (titleLower.includes('silver')) return 'silver';
  if (titleLower.includes('gold')) return 'gold';
  if (titleLower.includes('platinum')) return 'platinum';
  
  // Check for "Founder" titles
  if (titleLower.includes('founder')) {
    // Try to extract tier from badge or other source
    // For now, return null and let calling code determine
    return null;
  }
  
  return null;
}

/**
 * Get display text for founder title (just "Founder")
 */
export function getFounderTitleDisplay(title: string | null | undefined): string {
  if (!title) return '';
  
  const titleLower = title.toLowerCase();
  
  // If it's a founder title, return just "Founder"
  if (titleLower.includes('founder')) {
    return 'Founder';
  }
  
  return title;
}
