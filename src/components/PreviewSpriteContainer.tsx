/**
 * Preview Sprite Container Component
 * Applies layout settings in real-time with visible container outline
 */

import { useEffect, useRef } from 'react';
import { applySpriteLayout, SpriteLayout } from '../utils/spriteManipulation';

interface PreviewSpriteContainerProps {
  children: React.ReactNode;
  layout: SpriteLayout;
  isEditing: boolean;
  className: string;
  animation: string;
  style?: React.CSSProperties;
}

export function PreviewSpriteContainer({
  children,
  layout,
  isEditing,
  className,
  animation,
  style
}: PreviewSpriteContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Apply layout in real-time whenever layout changes
  useEffect(() => {
    if (containerRef.current && Object.keys(layout).length > 0) {
      applySpriteLayout(containerRef.current, layout);
    }
  }, [layout.containerWidth, layout.containerHeight, layout.spriteWidth, layout.spriteHeight, layout.spriteScale, layout.spriteOffsetX, layout.spriteOffsetY, layout.facingDirection]);
  
  const containerStyle: React.CSSProperties = {
    width: layout.containerWidth ? `${layout.containerWidth}px` : undefined,
    height: layout.containerHeight ? `${layout.containerHeight}px` : undefined,
    border: isEditing ? '2px dashed #8b5cf6' : '1px solid rgba(139, 92, 246, 0.3)',
    position: 'relative',
    boxSizing: 'border-box',
    ...style
  };
  
  return (
    <div
      ref={containerRef}
      className={className}
      data-animation={animation}
      style={containerStyle}
    >
      {children}
      {isEditing && (
        <div 
          className="absolute inset-0 border-2 border-purple-500 pointer-events-none" 
          style={{ zIndex: 1000 }} 
        />
      )}
    </div>
  );
}
