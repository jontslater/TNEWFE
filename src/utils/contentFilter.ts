// Content filter utilities for chat moderation

// Blocked words list (slurs, profanity, etc.)
// This list filters racial slurs, hate speech, and inappropriate content
// Words are checked with word boundaries to avoid false positives
const BLOCKED_WORDS = [
  // Racial slurs and hate speech
  'nigger', 'nigga', 'niger', 'niga',
  'kike', 'kyke',
  'chink', 'gook', 'nip',
  'spic', 'wetback',
  'towelhead', 'raghead', 'sandnigger',
  'cracker', 'honkey', 'honkie',
  'slant', 'gook',
  'beaner',
  'taco',
  
  // Other slurs and hate speech
  'faggot', 'fag', 'faggy',
  'dyke', 'lesbo',
  'tranny', 'trap',
  'retard', 'retarded', 'tard',
  'mongoloid',
  
  // Extreme profanity (moderate/strict maturity filters handle common profanity)
  'cocksucker', 'cockhead',
  'motherfucker', 'motherfucking',
  'cunt', 'cunty',
  
  // Add more blocked words here as needed
];

// Maturity levels
export type MaturityLevel = 'none' | 'mild' | 'moderate' | 'strict';

// Filter settings
export interface FilterSettings {
  maturityFilter: boolean;
  blockedWordsFilter: boolean;
  maturityLevel: MaturityLevel;
}

// Default settings
export const DEFAULT_FILTER_SETTINGS: FilterSettings = {
  maturityFilter: true,
  blockedWordsFilter: true,
  maturityLevel: 'moderate'
};

/**
 * Check if a message should be filtered
 */
export function shouldFilterMessage(
  message: string,
  settings: FilterSettings
): { filtered: boolean; reason?: string } {
  const lowerMessage = message.toLowerCase();

  // Blocked words filter
  if (settings.blockedWordsFilter) {
    for (const word of BLOCKED_WORDS) {
      // Check for word boundaries to avoid false positives
      const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lowerMessage)) {
        return { filtered: true, reason: 'Contains blocked word' };
      }
    }
  }

  // Maturity filter based on level
  if (settings.maturityFilter) {
    // Strict: Filter common profanity patterns
    if (settings.maturityLevel === 'strict') {
      const strictPatterns = [
        /\b(f\*ck|fuck|sh\*t|shit|b\*tch|bitch|a\*s|ass)\b/i,
        /\b(d\*mn|damn|h\*ll|hell)\b/i,
      ];
      
      for (const pattern of strictPatterns) {
        if (pattern.test(message)) {
          return { filtered: true, reason: 'Maturity filter (strict)' };
        }
      }
    }

    // Moderate: Filter stronger profanity
    if (settings.maturityLevel === 'moderate' || settings.maturityLevel === 'strict') {
      const moderatePatterns = [
        /\b(f\*ck|fuck|sh\*t|shit)\b/i,
      ];
      
      for (const pattern of moderatePatterns) {
        if (pattern.test(message)) {
          return { filtered: true, reason: 'Maturity filter (moderate)' };
        }
      }
    }

    // Mild: Only filter extreme slurs (handled by blocked words)
    // 'mild' and 'none' rely on blocked words list only
  }

  return { filtered: false };
}

/**
 * Get filter settings from localStorage
 */
export function getFilterSettings(): FilterSettings {
  try {
    const stored = localStorage.getItem('chatFilterSettings');
    if (stored) {
      return { ...DEFAULT_FILTER_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('[ContentFilter] Error loading filter settings:', error);
  }
  return DEFAULT_FILTER_SETTINGS;
}

/**
 * Save filter settings to localStorage
 */
export function saveFilterSettings(settings: FilterSettings): void {
  try {
    localStorage.setItem('chatFilterSettings', JSON.stringify(settings));
  } catch (error) {
    console.error('[ContentFilter] Error saving filter settings:', error);
  }
}
