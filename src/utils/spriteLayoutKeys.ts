/**
 * Sprite Layout Key Utilities
 * Generate keys for storing sprite layouts by type
 */

/**
 * Get hero category (Tank, Healer, DPS) from role
 */
export function getHeroCategory(role: string): 'tank' | 'healer' | 'dps' {
  const tanks = ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'];
  const healers = ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'];
  if (tanks.includes(role)) return 'tank';
  if (healers.includes(role)) return 'healer';
  return 'dps';
}

/**
 * Generate sprite key for storing layouts
 * @param type - 'hero' | 'enemy'
 * @param identifier - Hero role or enemy type name (for heroes, will be converted to category)
 * @param slot - Optional slot index
 * @param useCategory - For heroes, if true, use category (tank/healer/dps) instead of individual role
 * @returns Sprite key string, e.g., 'hero-tank-slot-0', 'enemy-kobold-warrior'
 */
export function getSpriteKey(type: 'hero' | 'enemy', identifier: string, slot?: number | null, useCategory: boolean = true): string {
  if (type === 'hero') {
    // Group heroes by category (Tank, Healer, DPS) instead of individual roles
    const category = useCategory ? getHeroCategory(identifier) : identifier.toLowerCase();
    const baseName = `hero-${category}`; // e.g., 'hero-tank', 'hero-healer', 'hero-dps'
    // If slot is specified, include it in the key (for per-slot positioning)
    if (slot !== null && slot !== undefined) {
      return `${baseName}-slot-${slot}`; // e.g., 'hero-tank-slot-0'
    }
    return baseName; // e.g., 'hero-tank'
  } else if (type === 'enemy') {
    const baseName = `enemy-${identifier.toLowerCase().replace(/ /g, '-')}`;
    // If slot is specified, include it in the key (for per-slot positioning)
    if (slot !== null && slot !== undefined) {
      return `${baseName}-slot-${slot}`; // e.g., 'enemy-kobold-warrior-slot-0'
    }
    return baseName; // e.g., 'enemy-kobold-warrior'
  }
  return '';
}

/**
 * Load all sprite layouts from localStorage
 */
export function loadAllSpriteLayouts(): Record<string, any> {
  try {
    const saved = localStorage.getItem('spriteLayouts');
    if (saved) {
      const layouts = JSON.parse(saved);
      // Only log on initial load, not on every poll (prevents console spam)
      // Logging removed - use browser devtools to inspect localStorage if needed
      return layouts;
    }
  } catch (e) {
    console.error('Error loading sprite layouts:', e);
  }
  return {};
}

/**
 * Save sprite layout to localStorage
 */
export function saveSpriteLayoutToStorage(spriteKey: string, layout: any): void {
  try {
    const allLayouts = loadAllSpriteLayouts();
    allLayouts[spriteKey] = layout;
    localStorage.setItem('spriteLayouts', JSON.stringify(allLayouts));
  } catch (e) {
    console.error(`Failed to save sprite layout for ${spriteKey}:`, e);
  }
}
