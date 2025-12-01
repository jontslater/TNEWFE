/**
 * Combat Text Utility
 * Creates floating damage/healing numbers above sprites
 * Adapted from IdleDnD/game.js:8060
 */

export type CombatTextType = 'damage' | 'crit' | 'heal' | 'heal-hot' | 'dot' | 'loot' | 'levelup' | 'questcomplete' | 'xp';

export interface CombatTextConfig {
  healing: number;
  damage: number;
  hot: number;
  dot: number;
}

// Combat Text Positioning Configuration
// Positive values move text DOWN (closer to sprite), negative values move text UP
export const COMBAT_TEXT_OFFSETS: CombatTextConfig = {
  healing: 60,  // Y-axis offset for healing text
  damage: 50,   // Y-axis offset for damage text
  hot: 60,      // Y-axis offset for HoT (Heal over Time) text
  dot: 50       // Y-axis offset for DoT (Damage over Time) text
};

/**
 * Create floating combat text above a sprite element
 * @param spriteElement - The sprite DOM element to position text relative to
 * @param amount - Numeric value to display
 * @param type - Type of combat text ('damage', 'crit', 'heal', 'heal-hot', 'dot')
 */
export function createCombatText(
  spriteElement: HTMLElement | null,
  amount: number | string,
  type: CombatTextType = 'damage'
): void {
  if (!spriteElement) {
    return;
  }
  
  // Skip if amount is too small (reduces clutter) - only for numeric amounts
  if (typeof amount === 'number' && amount < 1) return;
  
  // Format amount with commas for readability (only for numeric amounts)
  const formattedAmount = typeof amount === 'number' 
    ? Math.floor(amount).toLocaleString() 
    : amount;
  
  // Determine CSS class and text content based on type
  let textClass = 'combat-text damage';
  let textContent = formattedAmount;
  
  switch (type) {
    case 'crit':
      textClass = 'combat-text crit'; // Use crit class for gold color
      textContent = `CRIT! ${formattedAmount}`;
      break;
    case 'heal':
    case 'healing': // Support both 'heal' and 'healing' for compatibility
      textClass = 'combat-text healing'; // Green for healing
      textContent = `+${formattedAmount}`;
      break;
    case 'heal-hot':
      textClass = 'combat-text hot'; // Green for HoT healing
      textContent = `+${formattedAmount}`;
      break;
    case 'dot':
      textClass = 'combat-text dot'; // Purple for damage over time
      textContent = `-${formattedAmount}`; // DoT damage shows with minus sign
      break;
    case 'loot':
      textClass = 'combat-text loot'; // Gold/yellow for loot
      textContent = typeof amount === 'string' ? amount : `+${formattedAmount}`; // Support string for item names
      break;
    case 'levelup':
      textClass = 'combat-text levelup'; // Special styling for level up
      textContent = typeof amount === 'string' ? amount : 'LEVEL UP'; // Default to "LEVEL UP" if no string provided
      break;
    case 'questcomplete':
      textClass = 'combat-text questcomplete'; // Special styling for quest complete
      textContent = typeof amount === 'string' ? amount : 'QUEST COMPLETE!'; // Default to "QUEST COMPLETE!" if no string provided
      break;
    case 'xp':
      textClass = 'combat-text xp'; // Light blue for XP gain
      textContent = `+${formattedAmount} XP`;
      break;
    case 'damage':
    default:
      textClass = 'combat-text damage'; // Red for regular damage
      textContent = formattedAmount;
      break;
  }
  
  // Find the sprite container (the one with the ID, not the inner sprite element)
  // For heroes: battle-hero-{id} or the parent that has data-hero-id
  // For enemies: battle-enemy-{id} or the parent that has data-enemy-id
  let spriteContainer: HTMLElement | null = null;
  
  // Check if spriteElement is already the container
  if (spriteElement.id && (spriteElement.id.startsWith('battle-hero-') || spriteElement.id.startsWith('battle-enemy-'))) {
    spriteContainer = spriteElement;
  } else {
    // Find the container by going up the DOM tree
    let current: HTMLElement | null = spriteElement;
    while (current && current !== document.body) {
      if (current.id && (current.id.startsWith('battle-hero-') || current.id.startsWith('battle-enemy-'))) {
        spriteContainer = current;
        break;
      }
      if (current.hasAttribute('data-hero-id') || current.hasAttribute('data-enemy-id')) {
        spriteContainer = current;
        break;
      }
      current = current.parentElement;
    }
  }
  
  if (!spriteContainer) {
    spriteContainer = spriteElement; // Fallback to sprite element itself
  }
  
  // Create text element - simplified approach matching documentation
  const textElement = document.createElement('div');
  textElement.className = textClass;
  textElement.textContent = textContent;
  
  // Check if sprite container is flipped (has scaleX(-1) in transform)
  // Heroes facing left and enemies facing left both use scaleX(-1)
  let isFlipped = false;
  if (spriteContainer) {
    const containerStyle = window.getComputedStyle(spriteContainer);
    const transform = containerStyle.transform;
    // Check if transform contains scaleX(-1) - this flips the sprite horizontally
    // We need to flip the text too so numbers aren't backwards
    if (transform && transform !== 'none') {
      // Parse matrix or check for scaleX(-1) in the transform string
      // matrix(a, b, c, d, e, f) where a < 0 means horizontal flip
      const matrixMatch = transform.match(/matrix\(([^)]+)\)/);
      if (matrixMatch) {
        const values = matrixMatch[1].split(',').map(v => parseFloat(v.trim()));
        // matrix[0] (a) is scaleX - if negative, it's flipped
        if (values[0] < 0) {
          isFlipped = true;
        }
      } else if (transform.includes('scaleX') && (transform.includes('-1') || transform.match(/scaleX\([^)]*-1[^)]*\)/))) {
        isFlipped = true;
      }
    }
  }
  
  // Calculate random horizontal offset (-5px to +5px)
  const randomOffsetPx = (Math.random() * 10 - 5); // -5 to +5 pixels
  // Flip text if sprite is flipped to prevent backwards numbers
  const flipTransform = isFlipped ? ' scaleX(-1)' : '';
  textElement.style.transformOrigin = 'center center'; // Ensure centering works correctly
  
  // Set z-index for visibility
  textElement.style.zIndex = '10000'; // Very high z-index to ensure visibility
  
  // Set base font size
  textElement.style.fontSize = '10px';
  textElement.style.fontWeight = 'bold';
  textElement.style.whiteSpace = 'nowrap';
  textElement.style.lineHeight = '1';
  
  // Apply colors and styling based on type (use textClass to determine type, not type param)
  // Use setProperty with important to ensure colors aren't overridden
  if (textClass.includes('crit')) {
    textElement.style.fontSize = '12px'; // Larger for crits
    textElement.style.fontWeight = '900';
    textElement.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.9), 0 0 4px rgba(255, 215, 0, 0.6)';
    textElement.style.setProperty('color', '#ffd700', 'important'); // Gold for critical hits
    textElement.style.animation = 'floatUp 3s ease-out forwards'; // Longer for crits
  } else if (textClass.includes('healing')) {
    textElement.style.fontSize = '10px';
    textElement.style.setProperty('color', '#10b981', 'important'); // Green for healing
    textElement.style.animation = 'floatUp 1.2s ease-out forwards';
  } else if (textClass.includes('hot')) {
    textElement.style.fontSize = '8px'; // Smaller for HoT
    textElement.style.setProperty('color', '#10b981', 'important'); // Green for HoT healing
    textElement.style.animation = 'floatUp 1s ease-out forwards'; // Shorter for HoT
  } else if (textClass.includes('dot')) {
    textElement.style.fontSize = '10px';
    textElement.style.setProperty('color', '#9333ea', 'important'); // Purple for damage over time
    textElement.style.animation = 'floatUp 1.2s ease-out forwards';
  } else if (textClass.includes('loot')) {
    textElement.style.fontSize = '11px';
    textElement.style.fontWeight = '900';
    textElement.style.setProperty('color', '#f59e0b', 'important'); // Orange/gold for loot
    textElement.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.9), 0 0 8px rgba(245, 158, 11, 0.8)';
    textElement.style.animation = 'floatUp 2s ease-out forwards'; // Longer for loot notifications
  } else if (textClass.includes('levelup')) {
    textElement.style.fontSize = '18px'; // Much larger for level up
    textElement.style.fontWeight = '900';
    textElement.style.setProperty('color', '#ffd700', 'important'); // Gold for level up
    textElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.9), 0 0 12px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.6)';
    textElement.style.animation = 'floatUp 2.5s ease-out forwards'; // Longer animation for level up
    textElement.style.letterSpacing = '2px'; // Add spacing for dramatic effect
  } else if (textClass.includes('questcomplete')) {
    textElement.style.fontSize = '16px'; // Large for quest complete
    textElement.style.fontWeight = '900';
    textElement.style.setProperty('color', '#10b981', 'important'); // Green/gold for quest complete
    textElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.9), 0 0 12px rgba(16, 185, 129, 0.8), 0 0 20px rgba(16, 185, 129, 0.6)';
    textElement.style.animation = 'floatUp 2.5s ease-out forwards'; // Longer animation
    textElement.style.letterSpacing = '1px'; // Add some letter spacing
  } else {
    // Regular damage - red
    textElement.style.fontSize = '10px';
    textElement.style.setProperty('color', '#ef4444', 'important'); // Red for damage
    textElement.style.animation = 'floatUp 1.2s ease-out forwards';
  }
  
  
  // For crit text, always use fixed positioning to prevent clipping
  // For other text, try to find a parent with overflow: visible
  const isCrit = textClass.includes('crit');
  let useFixedPositioning = isCrit; // Always use fixed for crits
  
  if (!useFixedPositioning) {
    // Try to find a parent with overflow: visible for other text types
    let parent: HTMLElement | null = spriteContainer.parentElement;
    while (parent && parent !== document.body) {
      const parentStyle = window.getComputedStyle(parent);
      if (parentStyle.overflow === 'visible' || 
          parent.classList.contains('browser-source-page') ||
          parent.id === 'root') {
        useFixedPositioning = true;
        break;
      }
      parent = parent.parentElement;
    }
  }
  
  if (useFixedPositioning) {
    // Use fixed positioning to escape all containers (prevents clipping)
    const containerRect = spriteContainer.getBoundingClientRect();
    
    textElement.style.position = 'fixed'; // Fixed escapes all containers
    textElement.style.left = `${containerRect.left + containerRect.width * 0.45 + randomOffsetPx}px`;
    textElement.style.top = `${containerRect.top + containerRect.height * 0.5}px`;
    textElement.style.transform = `translate(-50%, -50%)${flipTransform}`;
    
    // Append to body for fixed positioning
    document.body.appendChild(textElement);
  } else {
    // Fallback: append to sprite container
    textElement.style.position = 'absolute';
    textElement.style.left = '45%';
    textElement.style.top = '50%';
    textElement.style.transform = `translate(-50%, -50%) translateX(${randomOffsetPx}px)${flipTransform}`;
    spriteContainer.appendChild(textElement);
  }
  
  // Remove element after animation completes
  const animationDuration = type === 'crit' ? 3000 : 
                            (type === 'heal-hot' ? 1000 : 
                            (type === 'loot' ? 2000 : 
                            (type === 'levelup' || type === 'questcomplete' ? 2500 : 
                            (type === 'xp' ? 1500 : 1200))));
  setTimeout(() => {
    if (textElement.parentNode) {
      textElement.parentNode.removeChild(textElement);
    }
  }, animationDuration);
}

/**
 * Show scrolling combat text for a hero or enemy
 * @param targetId - The ID of the hero or enemy
 * @param amount - Numeric value to display
 * @param type - Type of combat text
 * @param isHero - Whether the target is a hero (true) or enemy (false)
 */
export function showScrollingCombatText(
  targetId: string,
  amount: number | string,
  type: CombatTextType = 'damage',
  isHero: boolean = true
): void {
  // Skip if amount is too small (reduces clutter) - only for numeric amounts
  if (typeof amount === 'number' && amount < 1) return;
  
  // Find the sprite element using exact ID matching
  // Heroes: battle-hero-{id} or [data-hero-id="{id}"]
  // Enemies: battle-enemy-{id} or [data-enemy-id="{id}"]
  // CRITICAL: Use exact selectors only - no wildcards to avoid matching wrong hero
  
  let sprite: HTMLElement | null = null;
  
  if (isHero) {
    // Handle IDs that may already have the battle-hero- prefix
    let cleanId = targetId;
    if (targetId.startsWith('battle-hero-')) {
      cleanId = targetId.replace(/^battle-hero-/, '');
    }
    
    // CRITICAL: Find the actual sprite element inside the container, not the container itself
    // The sprite element has id="hero-sprite-{heroId}" and is the element that should receive SCT
    const container = document.querySelector(`#battle-hero-${cleanId}`) as HTMLElement ||
                      document.querySelector(`[data-hero-id="${cleanId}"]`) as HTMLElement;
    
    if (container) {
      // Find the sprite element inside the container (the actual animated sprite)
      sprite = container.querySelector(`#hero-sprite-${cleanId}`) as HTMLElement ||
               container.querySelector('.hero-sprite') as HTMLElement ||
               container; // Fallback to container if sprite element not found
    }
  } else {
    // CRITICAL: Find the actual sprite element inside the enemy container, not the container itself
    // Remove "battle-enemy-" prefix if present (some callers pass full ID, some pass just enemy.id)
    const cleanId = targetId.replace(/^battle-enemy-/, '');
    const container = document.querySelector(`#battle-enemy-${cleanId}`) as HTMLElement || 
                      document.querySelector(`[data-enemy-id="${cleanId}"]`) as HTMLElement;
    
    if (container) {
      // Find the sprite element inside the container (the actual animated sprite)
      sprite = container.querySelector(`#enemy-sprite-${cleanId}`) as HTMLElement ||
               container.querySelector('.enemy-sprite') as HTMLElement ||
               container; // Fallback to container if sprite element not found
    }
    
    // Fallback: if ID doesn't match (enemy regenerated), use first available enemy
    // This handles cases where enemies are regenerated mid-combat
    if (!sprite) {
      const allEnemies = document.querySelectorAll('[data-enemy-id]');
      if (allEnemies.length > 0) {
        const fallbackContainer = allEnemies[0] as HTMLElement;
        sprite = fallbackContainer.querySelector('.enemy-sprite') as HTMLElement || fallbackContainer;
      }
    }
  }
  
  if (!sprite) {
    // Silently fail - enemy may have been removed between action scheduling and execution
    // This is expected behavior when enemies die or are replaced
    return;
  }
  
  createCombatText(sprite, amount, type);
}
