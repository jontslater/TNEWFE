/**
 * Test Logging System
 * Provides granular control over console logging for testing
 * Supports global, category, and individual mechanic-level toggles
 */

export type LogCategory = 
  | 'Combat'
  | 'Animations'
  | 'Healing'
  | 'Debuffs'
  | 'Buffs'
  | 'Abilities'
  | 'Enemy'
  | 'Adventure'
  | 'Loot'
  | 'Quest'
  | 'UI'
  | 'Damage'
  | 'Death'
  | 'Shields'
  | 'Resurrection'
  | 'Leveling'
  | 'Projectiles';

interface LoggingState {
  globalEnabled: boolean;
  categories: Record<LogCategory, boolean>;
  mechanics: Record<string, boolean>; // Format: "Category:Mechanic"
}

const STORAGE_KEY = 'testLoggingState';

/**
 * Get initial logging state from localStorage or defaults
 */
function getInitialState(): LoggingState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // Failed to read, use defaults
  }

  // Default: all disabled
  const defaultCategories: Record<LogCategory, boolean> = {
    Combat: false,
    Animations: false,
    Healing: false,
    Debuffs: false,
    Buffs: false,
    Abilities: false,
    Enemy: false,
    Adventure: false,
    Loot: false,
    Quest: false,
    UI: false,
    Damage: false,
    Death: false,
    Shields: false,
    Resurrection: false,
    Leveling: false,
    Projectiles: false,
  };

  return {
    globalEnabled: false,
    categories: defaultCategories,
    mechanics: {},
  };
}

class TestLogger {
  private state: LoggingState;

  constructor() {
    this.state = getInitialState();
  }

  /**
   * Save state to localStorage
   */
  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      // Failed to save
    }
  }

  /**
   * Enable/disable global logging
   */
  setGlobalEnabled(enabled: boolean) {
    this.state.globalEnabled = enabled;
    this.saveState();
  }

  /**
   * Get global enabled state
   */
  isGlobalEnabled(): boolean {
    return this.state.globalEnabled;
  }

  /**
   * Enable/disable a category
   */
  setCategoryEnabled(category: LogCategory, enabled: boolean) {
    this.state.categories[category] = enabled;
    this.saveState();
  }

  /**
   * Check if a category is enabled
   */
  isCategoryEnabled(category: LogCategory): boolean {
    return this.state.categories[category] || false;
  }

  /**
   * Enable/disable a specific mechanic
   */
  setMechanicEnabled(category: LogCategory, mechanic: string, enabled: boolean) {
    const key = `${category}:${mechanic}`;
    this.state.mechanics[key] = enabled;
    this.saveState();
  }

  /**
   * Check if a specific mechanic is enabled
   */
  isMechanicEnabled(category: LogCategory, mechanic: string): boolean {
    const key = `${category}:${mechanic}`;
    return this.state.mechanics[key] || false;
  }

  /**
   * Check if logging should occur for a given category and mechanic
   */
  shouldLog(category: LogCategory, mechanic: string): boolean {
    // If global is disabled, nothing logs
    if (!this.state.globalEnabled) {
      return false;
    }

    // Check specific mechanic first (most granular)
    const mechanicKey = `${category}:${mechanic}`;
    if (this.state.mechanics.hasOwnProperty(mechanicKey)) {
      return this.state.mechanics[mechanicKey] === true;
    }

    // Fall back to category level
    return this.state.categories[category] === true;
  }

  /**
   * Get all categories
   */
  getAllCategories(): LogCategory[] {
    return Object.keys(this.state.categories) as LogCategory[];
  }

  /**
   * Get current state (for UI display)
   */
  getState(): LoggingState {
    return { ...this.state };
  }

  /**
   * Reset to defaults
   */
  reset() {
    this.state = getInitialState();
    this.saveState();
  }
}

// Singleton instance
const testLogger = new TestLogger();

/**
 * Main logging function - use this instead of console.log
 * @param category - The category of the log (Combat, Healing, etc.)
 * @param mechanic - The specific mechanic being logged (e.g., "Hero Attack", "Shield Absorption")
 * @param args - Arguments to pass to console.log
 */
export function testLog(category: LogCategory, mechanic: string, ...args: any[]): void {
  // CRITICAL: No-op in production - test logging only works in development
  if (import.meta.env.MODE === 'production') {
    return; // Silent in production
  }
  
  if (testLogger.shouldLog(category, mechanic)) {
    console.log(`[${category}:${mechanic}]`, ...args);
  }
}

/**
 * Test logger instance for UI components
 */
export const getTestLogger = () => testLogger;

/**
 * Helper to check if a category/mechanic combination is enabled
 */
export function isLoggingEnabled(category: LogCategory, mechanic: string): boolean {
  return testLogger.shouldLog(category, mechanic);
}
