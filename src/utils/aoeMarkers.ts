/**
 * AoE Marker System
 * Handles rendering and animation of AoE markers for boss mechanics
 */

export type AoEShape = 'circle' | 'rectangle' | 'line' | 'cone';

export interface AoEMarker {
  id: string;
  shape: AoEShape;
  x: number; // Center X position (percentage or pixels)
  y: number; // Center Y position (percentage or pixels)
  radius?: number; // For circle
  width?: number; // For rectangle/line
  height?: number; // For rectangle
  angle?: number; // For cone/line (degrees)
  duration: number; // Duration in milliseconds
  startTime: number; // Timestamp when marker appeared
  color: string; // Warning color
  pulse: boolean; // Whether to pulse
  damage?: number; // Damage when marker expires
}

/**
 * Create an AoE marker
 */
export function createAoEMarker(
  id: string,
  shape: AoEShape,
  x: number,
  y: number,
  options: {
    radius?: number;
    width?: number;
    height?: number;
    angle?: number;
    duration: number;
    color?: string;
    pulse?: boolean;
    damage?: number;
  }
): AoEMarker {
  return {
    id,
    shape,
    x,
    y,
    radius: options.radius,
    width: options.width,
    height: options.height,
    angle: options.angle,
    duration: options.duration,
    startTime: Date.now(),
    color: options.color || '#ff0000',
    pulse: options.pulse !== false,
    damage: options.damage
  };
}

/**
 * Check if an AoE marker is expired
 */
export function isAoEMarkerExpired(marker: AoEMarker, currentTime: number): boolean {
  const elapsed = currentTime - marker.startTime;
  return elapsed >= marker.duration;
}

/**
 * Get AoE marker progress (0-1)
 */
export function getAoEMarkerProgress(marker: AoEMarker, currentTime: number): number {
  const elapsed = currentTime - marker.startTime;
  return Math.min(1.0, Math.max(0, elapsed / marker.duration));
}

/**
 * Get AoE marker opacity based on progress (pulsing effect)
 */
export function getAoEMarkerOpacity(marker: AoEMarker, currentTime: number): number {
  if (!marker.pulse) {
    return 0.6;
  }

  const progress = getAoEMarkerProgress(marker, currentTime);
  
  // Pulse faster as it gets closer to expiration
  const pulseSpeed = 1.0 + (progress * 3.0); // 1x to 4x speed
  const pulsePhase = (currentTime / 100) * pulseSpeed;
  const pulse = (Math.sin(pulsePhase) + 1) / 2; // 0 to 1
  
  // Base opacity increases as expiration approaches
  const baseOpacity = 0.3 + (progress * 0.4);
  
  return baseOpacity + (pulse * 0.3);
}

/**
 * Get AoE marker scale based on progress
 */
export function getAoEMarkerScale(marker: AoEMarker, currentTime: number): number {
  const progress = getAoEMarkerProgress(marker, currentTime);
  
  // Slight scale increase as expiration approaches
  return 1.0 + (progress * 0.1);
}

/**
 * Check if a point is inside an AoE marker
 */
export function isPointInAoE(
  marker: AoEMarker,
  pointX: number,
  pointY: number,
  containerWidth: number,
  containerHeight: number
): boolean {
  const markerX = (marker.x / 100) * containerWidth;
  const markerY = (marker.y / 100) * containerHeight;

  switch (marker.shape) {
    case 'circle':
      if (!marker.radius) return false;
      const radius = marker.radius;
      const dx = pointX - markerX;
      const dy = pointY - markerY;
      return (dx * dx + dy * dy) <= (radius * radius);

    case 'rectangle':
      if (!marker.width || !marker.height) return false;
      const halfWidth = marker.width / 2;
      const halfHeight = marker.height / 2;
      return (
        pointX >= markerX - halfWidth &&
        pointX <= markerX + halfWidth &&
        pointY >= markerY - halfHeight &&
        pointY <= markerY + halfHeight
      );

    case 'line':
      // Line AoE - simplified check (would need angle calculation for full implementation)
      if (!marker.width) return false;
      const lineHalfWidth = marker.width / 2;
      return Math.abs(pointX - markerX) <= lineHalfWidth;

    case 'cone':
      // Cone AoE - simplified check (would need angle calculation for full implementation)
      if (!marker.radius) return false;
      const coneRadius = marker.radius;
      const coneDx = pointX - markerX;
      const coneDy = pointY - markerY;
      return (coneDx * coneDx + coneDy * coneDy) <= (coneRadius * coneRadius);

    default:
      return false;
  }
}

/**
 * Get CSS styles for AoE marker
 */
export function getAoEMarkerStyles(
  marker: AoEMarker,
  currentTime: number,
  containerWidth: number,
  containerHeight: number
): React.CSSProperties {
  const progress = getAoEMarkerProgress(marker, currentTime);
  const opacity = getAoEMarkerOpacity(marker, currentTime);
  const scale = getAoEMarkerScale(marker, currentTime);

  const x = (marker.x / 100) * containerWidth;
  const y = (marker.y / 100) * containerHeight;

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    transform: `translate(-50%, -50%) scale(${scale})`,
    opacity,
    pointerEvents: 'none',
    zIndex: 999,
    transition: 'opacity 0.1s, transform 0.1s'
  };

  switch (marker.shape) {
    case 'circle':
      return {
        ...baseStyle,
        width: marker.radius ? `${marker.radius * 2}px` : '100px',
        height: marker.radius ? `${marker.radius * 2}px` : '100px',
        borderRadius: '50%',
        border: `3px solid ${marker.color}`,
        backgroundColor: `${marker.color}33`
      };

    case 'rectangle':
      return {
        ...baseStyle,
        width: marker.width ? `${marker.width}px` : '200px',
        height: marker.height ? `${marker.height}px` : '100px',
        border: `3px solid ${marker.color}`,
        backgroundColor: `${marker.color}33`
      };

    case 'line':
      return {
        ...baseStyle,
        width: marker.width ? `${marker.width}px` : '300px',
        height: '10px',
        border: `2px solid ${marker.color}`,
        backgroundColor: `${marker.color}33`,
        transform: `translate(-50%, -50%) rotate(${marker.angle || 0}deg) scale(${scale})`
      };

    case 'cone':
      return {
        ...baseStyle,
        width: marker.radius ? `${marker.radius * 2}px` : '200px',
        height: marker.radius ? `${marker.radius * 2}px` : '200px',
        border: `3px solid ${marker.color}`,
        backgroundColor: `${marker.color}33`,
        clipPath: `polygon(50% 0%, 0% 100%, 100% 100%)`,
        transform: `translate(-50%, -50%) rotate(${marker.angle || 0}deg) scale(${scale})`
      };

    default:
      return baseStyle;
  }
}



