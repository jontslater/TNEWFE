/**
 * Projectile Animation Utility
 * Creates and animates projectile elements that move from attacker to target
 * Uses JS-driven frame animation (like EnemySpriteJS) while moving across battlefield
 */

import { getEnemyAnimationKey, ENEMY_ANIMATIONS, getHeroProjectileData, HERO_PROJECTILE_MAPPING } from './spriteAnimationData';
import { getSpellEffectFilter, getSpellEffectAnimation, SpellEffectType } from './spellEffects';

/**
 * Create and animate a projectile from attacker to target
 * Supports both enemy and hero projectiles
 * @param attackerElement - DOM element of the attacking sprite
 * @param targetElement - DOM element of the target sprite
 * @param attackerType - Name of the enemy (e.g., "Baby Dragon") OR hero role (e.g., "mage", "necromancer")
 * @param projectileType - 'projectile' | 'projectileDiagonal' (optional for heroes, auto-detected)
 * @param onComplete - Callback when projectile reaches target
 * @param isHero - Whether the attacker is a hero (default: false)
 * @param elementType - Element type for mage projectiles: 'fire' | 'frost' | 'arcane' (optional)
 * @param spellEffect - Spell effect for founder pack tiers: 'bronze' | 'silver' | 'gold' | 'platinum' (optional)
 */
export function createProjectile(
  attackerElement: HTMLElement | null,
  targetElement: HTMLElement | null,
  attackerType: string,
  projectileType?: 'projectile' | 'projectileDiagonal',
  onComplete?: () => void,
  isHero: boolean = false,
  elementType?: 'fire' | 'frost' | 'arcane',
  spellEffect?: SpellEffectType
): Promise<void> {
  return new Promise((resolve) => {
    if (!attackerElement || !targetElement) {
      if (onComplete) onComplete();
      resolve();
      return;
    }

  // Get projectile animation data
  let projectileData: any | null = null;
  let actualProjectileType: 'projectile' | 'projectileDiagonal' = 'projectile';
  
  if (isHero) {
    // Hero projectile - get from hero role mapping
    const heroRole = attackerType.toLowerCase();
    const mapping = HERO_PROJECTILE_MAPPING[heroRole];
    actualProjectileType = projectileType || mapping?.projectileType || 'projectile';
    projectileData = getHeroProjectileData(heroRole, actualProjectileType);
  } else {
    // Enemy projectile - use existing logic
    const enemyKey = getEnemyAnimationKey(attackerType);
    const animations = ENEMY_ANIMATIONS[enemyKey];
    actualProjectileType = projectileType || 'projectile';
    projectileData = animations?.[actualProjectileType] || null;
  }
  
    if (!projectileData) {
      if (onComplete) onComplete();
      resolve();
      return;
    }

  // Get positions of attacker and target
  const attackerRect = attackerElement.getBoundingClientRect();
  const targetRect = targetElement.getBoundingClientRect();
  
  // Find the battlefield container - needs to be a container that spans the entire battlefield
  // The projectile needs to move across the screen, so it can't be in a small sprite container
  let battlefieldContainer: HTMLElement | null = null;
  
  // Strategy 1: Try common class names first (most reliable)
  battlefieldContainer = document.querySelector('.browser-source-page') as HTMLElement;
  if (!battlefieldContainer) {
    battlefieldContainer = attackerElement.closest('.browser-source-page') as HTMLElement;
  }
  
  // Strategy 2: Find the root page container (for AnimationTestPage)
  // Look for a div with fixed width/height (like 1920px x 1080px) that contains both elements
  if (!battlefieldContainer) {
    let current: HTMLElement | null = attackerElement.parentElement;
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current);
      const width = style.width;
      const height = style.height;
      const position = style.position;
      
      // Look for a container with explicit dimensions (like 1920px x 1080px)
      // This is likely the main page container
      if (position === 'relative' && 
          (width.includes('px') || width.includes('%')) && 
          (height.includes('px') || height.includes('%')) &&
          current.contains(attackerElement) && current.contains(targetElement)) {
        // Check if this container is large enough (not a sprite container)
        const rect = current.getBoundingClientRect();
        if (rect.width > 500 && rect.height > 500) {
          battlefieldContainer = current;
          break;
        }
      }
      current = current.parentElement;
    }
  }
  
  // Strategy 3: Find any positioned container that contains both elements
  if (!battlefieldContainer) {
    let current: HTMLElement | null = attackerElement.parentElement;
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current);
      const position = style.position;
      if ((position === 'relative' || position === 'absolute' || position === 'fixed') && 
          current.contains(attackerElement) && current.contains(targetElement)) {
        const rect = current.getBoundingClientRect();
        // Make sure it's not a tiny sprite container
        if (rect.width > 200 && rect.height > 200) {
          battlefieldContainer = current;
          break;
        }
      }
      current = current.parentElement;
    }
  }
  
  // Fallback to body
  if (!battlefieldContainer) {
    battlefieldContainer = document.body;
  }
  
  const containerRect = battlefieldContainer.getBoundingClientRect();

  // Calculate start and end positions relative to battlefield container
  // Start position: center of attacker sprite
  const startX = attackerRect.left - containerRect.left + attackerRect.width / 2;
  const startY = attackerRect.top - containerRect.top + attackerRect.height / 2;
  
  // End position: center of target sprite
  const endX = targetRect.left - containerRect.left + targetRect.width / 2;
  const endY = targetRect.top - containerRect.top + targetRect.height / 2;
  

  // Create projectile container (clipping wrapper)
  const projectile = document.createElement('div');
  projectile.className = 'enemy-projectile';
  projectile.style.position = 'absolute';
  
  // Scale projectile for large enemies like Elder Dragon
  // Elder Dragon uses 725x445 frames, so scale up 48x48 projectiles
  let projectileScale = 1;
  if (!isHero && attackerType) {
    const enemyKey = getEnemyAnimationKey(attackerType);
    if (enemyKey === 'elderDragon') {
      // Scale up projectile to be more visible for the huge dragon
      projectileScale = 2.5; // Make it 2.5x larger (120x120 instead of 48x48)
    }
  }
  
  // Apply spell effect scale multiplier (for founder pack tiers)
  const spellEffectData = spellEffect ? getSpellEffectFilter(spellEffect) : null;
  if (spellEffectData && spellEffectData.scale) {
    projectileScale *= spellEffectData.scale;
  }
  
  const scaledWidth = projectileData.frameWidth * projectileScale;
  const scaledHeight = projectileData.frameHeight * projectileScale;
  
  projectile.style.width = `${scaledWidth}px`;
  projectile.style.height = `${scaledHeight}px`;
  projectile.style.left = `${startX - scaledWidth / 2}px`;
  projectile.style.top = `${startY - scaledHeight / 2}px`;
  projectile.style.zIndex = '150';
  projectile.style.pointerEvents = 'none';
  projectile.style.overflow = 'hidden';
  projectile.style.imageRendering = 'pixelated';

  // Determine if projectile should be flipped
  // Heroes face right by default, so hero projectiles need to be flipped (projectile sprites face left)
  // Enemies face left by default, so enemy projectiles don't need flipping
  // But we also need to account for manual facing changes
  let shouldFlipProjectile = false;
  
  if (isHero) {
    // For heroes: check if they're actually flipped from default (facing left)
    // If hero is facing right (not flipped), flip the projectile
    // If hero is facing left (flipped), don't flip the projectile
    let heroIsFlipped = false;
    if (attackerElement) {
      const container = attackerElement.closest('[id^="battle-hero-"]') as HTMLElement;
      if (container) {
        const containerStyle = window.getComputedStyle(container);
        const transform = containerStyle.transform;
        if (transform && transform !== 'none') {
          const matrixMatch = transform.match(/matrix\(([^)]+)\)/);
          if (matrixMatch) {
            const values = matrixMatch[1].split(',').map(v => parseFloat(v.trim()));
            if (values.length >= 1) {
              heroIsFlipped = values[0] < 0;
            }
          } else if (transform.includes('scaleX') && transform.includes('-1')) {
            heroIsFlipped = true;
          }
        }
      }
    }
    // Flip projectile if hero is NOT flipped (facing right)
    shouldFlipProjectile = !heroIsFlipped;
  } else {
    // For enemies: check if they're flipped from default (facing right)
    // Enemies face left by default, so if they're flipped (facing right), flip the projectile
    // Special case: Elder Dragon projectile should always be flipped horizontally
    if (attackerType === 'Elder Dragon') {
      shouldFlipProjectile = true;
    } else {
      let enemyIsFlipped = false;
      if (attackerElement) {
        const container = attackerElement.closest('[id^="battle-enemy-"]') as HTMLElement;
        if (container) {
          const containerStyle = window.getComputedStyle(container);
          const transform = containerStyle.transform;
          if (transform && transform !== 'none') {
            const matrixMatch = transform.match(/matrix\(([^)]+)\)/);
            if (matrixMatch) {
              const values = matrixMatch[1].split(',').map(v => parseFloat(v.trim()));
              if (values.length >= 1) {
                enemyIsFlipped = values[0] < 0;
              }
            } else if (transform.includes('scaleX') && transform.includes('-1')) {
              enemyIsFlipped = true;
            }
          }
        }
      }
      // Flip projectile if enemy IS flipped (facing right, opposite of default)
      shouldFlipProjectile = enemyIsFlipped;
    }
  }

  // Create sprite element for frame animation
  const spriteElement = document.createElement('div');
  const spriteSheetWidth = projectileData.frameWidth * projectileData.frameCount;
  const scaledSpriteWidth = spriteSheetWidth * projectileScale;
  const scaledSpriteHeight = projectileData.frameHeight * projectileScale;
  
  spriteElement.style.width = `${scaledSpriteWidth}px`;
  spriteElement.style.height = `${scaledSpriteHeight}px`;
  spriteElement.style.backgroundImage = `url(${encodeURI(projectileData.spriteSheet)})`;
  spriteElement.style.backgroundRepeat = 'no-repeat';
  spriteElement.style.backgroundPosition = '0 0';
  spriteElement.style.backgroundSize = `${scaledSpriteWidth}px ${scaledSpriteHeight}px`;
  spriteElement.style.transition = 'none';
  spriteElement.style.animation = 'none';
  spriteElement.style.imageRendering = 'pixelated';
  spriteElement.style.transformOrigin = 'top left';
  spriteElement.style.transform = 'translateX(0px)';

  // Build filter stack: element filter + spell effect filter
  const filters: string[] = [];
  
  // Apply element-based color filter for mage projectiles and Monk Chi Burst
  if (elementType && isHero) {
    switch (elementType) {
      case 'fire':
        // Red/orange tint with warm glow
        filters.push('hue-rotate(-20deg) saturate(1.4) brightness(1.2) drop-shadow(0 0 4px rgba(255, 100, 0, 0.8))');
        break;
      case 'frost':
        // Blue/cyan tint with cool glow (used for Mage Frost and Monk Chi Burst)
        filters.push('hue-rotate(180deg) saturate(1.3) brightness(1.15) drop-shadow(0 0 4px rgba(100, 200, 255, 0.8))');
        break;
      case 'arcane':
        // Purple/magenta tint with magical glow
        filters.push('hue-rotate(280deg) saturate(1.5) brightness(1.1) drop-shadow(0 0 4px rgba(200, 100, 255, 0.8))');
        break;
    }
  }
  
  // Apply spell effect filter (founder pack tiers) - layers on top of element filter
  if (spellEffectData && spellEffectData.filter) {
    filters.push(spellEffectData.filter);
  }
  
  // Combine all filters
  if (filters.length > 0) {
    spriteElement.style.filter = filters.join(' ');
  }
  
  // Apply spell effect animation class if needed
  const spellAnimationClass = spellEffect ? getSpellEffectAnimation(spellEffect) : null;
  if (spellAnimationClass) {
    spriteElement.classList.add(spellAnimationClass);
  }

  projectile.appendChild(spriteElement);
  battlefieldContainer.appendChild(projectile);

  // Animation state
  let frameIndex = 0;
  let lastFrameTime = performance.now();
  const frameDuration = projectileData.duration / projectileData.frameCount;
  const travelDuration = 1200; // 1.2 seconds to travel
  const startTime = performance.now();
  let rafId: number | null = null;

  // Animate frames and movement simultaneously
  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const delta = currentTime - lastFrameTime;

    // Update frame animation (discrete frame steps)
    if (delta >= frameDuration) {
      frameIndex = (frameIndex + 1) % projectileData.frameCount;
      const translateX = -(frameIndex * scaledWidth);
      
      // Force discrete transform update
      spriteElement.style.removeProperty('transform');
      void spriteElement.offsetWidth;
      // Apply flip if needed, then translate
      const flipTransform = shouldFlipProjectile ? 'scaleX(-1) ' : '';
      spriteElement.style.setProperty('transform', `${flipTransform}translateX(${translateX}px)`, 'important');
      spriteElement.style.transformOrigin = 'top left';
      
      lastFrameTime = currentTime - (delta % frameDuration);
    }

    // Update position (linear interpolation)
    if (elapsed < travelDuration) {
      const progress = elapsed / travelDuration;
      const currentX = startX + (endX - startX) * progress;
      const currentY = startY + (endY - startY) * progress;
      
      projectile.style.left = `${currentX - scaledWidth / 2}px`;
      projectile.style.top = `${currentY - scaledHeight / 2}px`;
      
      rafId = requestAnimationFrame(animate);
    } else {
      // Animation complete
      if (rafId) cancelAnimationFrame(rafId);
      projectile.remove();
      if (onComplete) onComplete();
      resolve();
    }
  };

  // Force initial reflow
  void projectile.offsetWidth;
  
  // Start animation
  rafId = requestAnimationFrame(animate);
  });
}
