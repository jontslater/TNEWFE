import React, { useEffect, useRef } from 'react';
import { HERO_SPRITES, SPRITE_SCALE_FACTOR } from '../utils/spriteConfig';

interface AnimatedSpriteProps {
  role: string;
  animation: 'idle' | 'attack' | 'hurt' | 'death';
  facing?: 'left' | 'right'; // Default: right (facing enemies)
  className?: string;
  style?: React.CSSProperties;
}

export const AnimatedSprite: React.FC<AnimatedSpriteProps> = ({
  role,
  animation,
  facing = 'right',
  className = '',
  style = {}
}) => {
  const spriteRef = useRef<HTMLDivElement>(null);

  const spriteConfig = HERO_SPRITES[role];
  if (!spriteConfig) {
    return null;
  }

  const spriteSize = spriteConfig.spriteSize || 48;
  const frameCount = spriteConfig.frameCount?.[animation] || 1;
  const animationPath = spriteConfig.animations?.[animation] || spriteConfig.sprite;

  useEffect(() => {
    if (!spriteRef.current) return;

    const spriteElement = spriteRef.current;
    
    // Set data-animation attribute for CSS animations
    spriteElement.setAttribute('data-animation', animation);

    // Apply base styles - let CSS handle background-size and animation
    spriteElement.style.width = `${spriteSize}px`;
    spriteElement.style.height = `${spriteSize}px`;
    spriteElement.style.backgroundImage = `url('${animationPath}')`;
    // Don't set background-size here - let CSS handle it based on data-animation
    spriteElement.style.backgroundRepeat = 'no-repeat';
    spriteElement.style.backgroundPosition = '0px 0px';
    spriteElement.style.imageRendering = 'pixelated';
    spriteElement.style.transformOrigin = 'center center';
    spriteElement.style.marginBottom = '15px';
    spriteElement.style.flexShrink = '0';

    // Apply scale and facing direction (matching Electron app)
    const scale = SPRITE_SCALE_FACTOR;
    const scaleX = facing === 'left' ? -1 : 1;
    spriteElement.style.transform = `scale(${scale}) scaleX(${scaleX})`;
  }, [role, animation, facing, spriteSize, animationPath]);

  return (
    <div
      ref={spriteRef}
      className={`sprite-img ${className}`}
      data-animation={animation}
      style={style}
    />
  );
};
