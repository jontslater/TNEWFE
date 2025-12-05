/**
 * Exhaust Effects for Huge Knight Critical Hits
 * Visual effects that appear when tanks (Huge Knight sprite) crit
 * Only for Gold and Platinum founder tiers
 */

import { SpellEffectType, getSpellEffectFilter } from './spellEffects';

/**
 * Create an exhaust effect on crit for Huge Knight (tanks)
 * @param heroElement - The hero sprite element
 * @param spellEffect - The founder tier spell effect (gold or platinum)
 * @param exhaustType - Which exhaust GIF to use ('exhaust01' or 'exhaust02')
 * @param targetElement - Optional target element (enemy) to travel towards. If not provided, stays at hero position
 */
export function createExhaustEffect(
  heroElement: HTMLElement | null,
  spellEffect: 'gold' | 'platinum',
  exhaustType: 'exhaust01' | 'exhaust02' = 'exhaust01',
  targetElement?: HTMLElement | null
): void {
  if (!heroElement) return;

  // Find the battlefield container
  let battlefieldContainer: HTMLElement | null = null;
  
  // Try to find the main container
  battlefieldContainer = document.querySelector('.browser-source-page') as HTMLElement;
  if (!battlefieldContainer) {
    battlefieldContainer = heroElement.closest('.browser-source-page') as HTMLElement;
  }
  
  // Fallback to parent container
  if (!battlefieldContainer) {
    let current: HTMLElement | null = heroElement.parentElement;
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current);
      const position = style.position;
      if ((position === 'relative' || position === 'absolute' || position === 'fixed') && 
          current.offsetWidth > 200 && current.offsetHeight > 200) {
        battlefieldContainer = current;
        break;
      }
      current = current.parentElement;
    }
  }
  
  if (!battlefieldContainer) {
    battlefieldContainer = document.body;
  }

  const containerRect = battlefieldContainer.getBoundingClientRect();
  const heroRect = heroElement.getBoundingClientRect();
  
  // Calculate start position (hero's center)
  const startX = heroRect.left - containerRect.left + heroRect.width / 2;
  const startY = heroRect.top - containerRect.top + heroRect.height / 2;
  
  // Calculate end position (enemy center, or stay at hero if no target)
  let endX = startX;
  let endY = startY;
  let shouldTravel = false;
  
  if (targetElement) {
    const targetRect = targetElement.getBoundingClientRect();
    endX = targetRect.left - containerRect.left + targetRect.width / 2;
    endY = targetRect.top - containerRect.top + targetRect.height / 2;
    shouldTravel = true;
  }

  // Determine which exhaust GIF to use
  const exhaustPath = exhaustType === 'exhaust01' 
    ? '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/exhaust_01_preview.gif'
    : '/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/exhaust02_preview.gif';

  // Create exhaust element
  const exhaust = document.createElement('div');
  exhaust.style.position = 'absolute';
  exhaust.style.pointerEvents = 'none';
  exhaust.style.zIndex = '100'; // Above sprites, below SCT
  
  // Create img element for the GIF (GIFs need to animate, so use img tag)
  const img = document.createElement('img');
  img.src = exhaustPath;
  img.style.display = 'block';
  img.style.imageRendering = 'pixelated';
  img.style.pointerEvents = 'none';
  
  // Apply spell effect filter (gold or platinum)
  const spellEffectData = getSpellEffectFilter(spellEffect);
  if (spellEffectData && spellEffectData.filter) {
    img.style.filter = spellEffectData.filter;
  }
  
  exhaust.appendChild(img);
  battlefieldContainer.appendChild(exhaust);
  
  // Animation variables
  let rafId: number | null = null;
  const travelDuration = shouldTravel ? 800 : 0; // 0.8 seconds to travel, or 0 if no target
  
  // Wait for image to load to get dimensions and start animation
  img.onload = () => {
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    
    // Rotate 90 degrees clockwise (right) - from vertical to horizontal
    // After rotation, width and height swap
    const rotatedWidth = naturalHeight;
    const rotatedHeight = naturalWidth;
    
    // Set image size to natural size
    img.style.width = `${naturalWidth}px`;
    img.style.height = `${naturalHeight}px`;
    
    // Calculate angle for rotation if traveling
    // Base rotation is 90deg (vertical to horizontal), then add travel angle to point toward enemy
    let totalRotation = 90; // Base: rotate from vertical to horizontal
    if (shouldTravel) {
      const dx = endX - startX;
      const dy = endY - startY;
      const travelAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      totalRotation = 90 + travelAngle; // Add travel angle to base rotation so exhaust points toward enemy
    }
    
    // Apply combined rotation to the image (base 90deg + travel angle if applicable)
    img.style.transform = `rotate(${totalRotation}deg)`;
    img.style.transformOrigin = 'center center';
    
    // Set container size to fit rotated image (after rotation, dimensions are swapped)
    exhaust.style.width = `${rotatedWidth}px`;
    exhaust.style.height = `${rotatedHeight}px`;
    
    // Start at hero position (bottom center)
    exhaust.style.left = `${startX}px`;
    exhaust.style.top = `${startY}px`;
    exhaust.style.transform = 'translate(-50%, -50%)';
    
    if (shouldTravel) {
      // Animate travel from hero to enemy
      const startTime = performance.now();
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        
        if (elapsed < travelDuration) {
          const progress = elapsed / travelDuration;
          // Use easing for smoother animation
          const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
          
          const currentX = startX + (endX - startX) * easedProgress;
          const currentY = startY + (endY - startY) * easedProgress;
          
          exhaust.style.left = `${currentX}px`;
          exhaust.style.top = `${currentY}px`;
          
          rafId = requestAnimationFrame(animate);
        } else {
          // Travel complete, fade out
          exhaust.style.transition = 'opacity 0.3s ease-out';
          exhaust.style.opacity = '0';
          
          setTimeout(() => {
            if (exhaust.parentNode) {
              exhaust.parentNode.removeChild(exhaust);
            }
          }, 300);
        }
      };
      
      // Force initial reflow
      void exhaust.offsetWidth;
      rafId = requestAnimationFrame(animate);
    } else {
      // No travel - just show and fade out
      setTimeout(() => {
        exhaust.style.transition = 'opacity 0.5s ease-out';
        exhaust.style.opacity = '0';
        
        setTimeout(() => {
          if (exhaust.parentNode) {
            exhaust.parentNode.removeChild(exhaust);
          }
        }, 500);
      }, 2000); // Show for 2 seconds if no travel
    }
  };
}

/**
 * Check if hero should show exhaust effect on crit
 * Only for tanks (Huge Knight) with gold or platinum spell effect
 */
export function shouldShowExhaustEffect(heroRole: string, spellEffect?: string | null): boolean {
  // Check if hero is a tank (uses Huge Knight sprite)
  const tanks = ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'];
  const isTank = tanks.includes(heroRole.toLowerCase());
  
  if (!isTank) return false;
  
  // Check if hero has gold or platinum spell effect
  return spellEffect === 'gold' || spellEffect === 'platinum';
}
