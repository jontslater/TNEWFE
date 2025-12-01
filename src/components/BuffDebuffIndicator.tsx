/**
 * Buff/Debuff Visual Indicator Component
 * Displays active buffs and debuffs above sprites
 */

import React from 'react';

export interface BuffDebuffData {
  name: string;
  icon?: string;
  color?: string;
  remainingDuration?: number;
  value?: number;
}

interface BuffDebuffIndicatorProps {
  buffs?: BuffDebuffData[];
  debuffs?: BuffDebuffData[];
  style?: React.CSSProperties;
}

export default function BuffDebuffIndicator({ buffs = [], debuffs = [], style }: BuffDebuffIndicatorProps) {
  if (buffs.length === 0 && debuffs.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '-20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        alignItems: 'center',
        zIndex: 1000,
        pointerEvents: 'none',
        ...style,
      }}
    >
      {/* Buffs - Green/Positive */}
      {buffs.map((buff, index) => (
        <div
          key={`buff-${index}`}
          title={`${buff.name}${buff.remainingDuration && buff.remainingDuration !== Infinity ? ` (${Math.ceil(buff.remainingDuration / 1000)}s)` : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            padding: '2px 4px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            borderRadius: '4px',
            border: `1px solid ${buff.color || '#10b981'}`,
            fontSize: '10px',
            color: buff.color || '#10b981',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
          }}
        >
          {buff.icon && <span>{buff.icon}</span>}
          <span>{buff.name}</span>
          {buff.remainingDuration !== undefined && 
           buff.remainingDuration > 0 && 
           buff.remainingDuration !== Infinity && 
           isFinite(buff.remainingDuration) &&
           Math.ceil(buff.remainingDuration / 1000) > 0 && (
            <span style={{ fontSize: '8px', opacity: 0.8 }}>
              {Math.ceil(buff.remainingDuration / 1000)}s
            </span>
          )}
        </div>
      ))}

      {/* Debuffs - Red/Negative */}
      {debuffs.map((debuff, index) => (
        <div
          key={`debuff-${index}`}
          title={`${debuff.name}${debuff.remainingDuration ? ` (${Math.ceil(debuff.remainingDuration / 1000)}s)` : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            padding: '2px 4px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            borderRadius: '4px',
            border: `1px solid ${debuff.color || '#ef4444'}`,
            fontSize: '10px',
            color: debuff.color || '#ef4444',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
          }}
        >
          {debuff.icon && <span>{debuff.icon}</span>}
          <span>{debuff.name}</span>
          {debuff.remainingDuration !== undefined && debuff.remainingDuration > 0 && (
            <span style={{ fontSize: '8px', opacity: 0.8 }}>
              {Math.ceil(debuff.remainingDuration / 1000)}s
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
