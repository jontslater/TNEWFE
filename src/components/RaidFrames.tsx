/**
 * Raid Frames Component
 * Displays party health bars with buffs/debuffs
 */

import React from 'react';
import BuffDebuffIndicator, { BuffDebuffData } from './BuffDebuffIndicator';

interface RaidFrameHero {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  role: string;
  isAlive: boolean;
  activeBuffs?: Record<string, any>;
  activeDebuffs?: Record<string, any>;
}

interface RaidFramesProps {
  heroes: RaidFrameHero[];
  position?: 'left' | 'right' | 'top' | 'bottom';
  showBuffs?: boolean;
  showDebuffs?: boolean;
}

export default function RaidFrames({
  heroes,
  position = 'left',
  showBuffs = true,
  showDebuffs = true
}: RaidFramesProps) {
  if (heroes.length === 0) {
    return null;
  }

  const positionStyles: Record<string, React.CSSProperties> = {
    left: { left: '20px', top: '50%', transform: 'translateY(-50%)' },
    right: { right: '20px', top: '50%', transform: 'translateY(-50%)' },
    top: { top: '20px', left: '50%', transform: 'translateX(-50%)', flexDirection: 'row' },
    bottom: { bottom: '20px', left: '50%', transform: 'translateX(-50%)', flexDirection: 'row' }
  };

  const getRoleColor = (role: string): string => {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('tank') || roleLower.includes('guardian') || roleLower.includes('paladin')) {
      return '#4a90e2';
    }
    if (roleLower.includes('heal') || roleLower.includes('cleric') || roleLower.includes('druid')) {
      return '#4caf50';
    }
    if (roleLower.includes('mage') || roleLower.includes('wizard')) {
      return '#9c27b0';
    }
    return '#ff9800';
  };

  return (
    <div
      style={{
        position: 'absolute',
        ...positionStyles[position],
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        zIndex: 1000,
        maxHeight: '80vh',
        overflowY: 'auto'
      }}
    >
      {heroes.map((hero) => {
        const hpPercent = hero.maxHp > 0 ? (hero.hp / hero.maxHp) * 100 : 0;
        const roleColor = getRoleColor(hero.role);

        // Convert buffs/debuffs to BuffDebuffData format
        const buffs: BuffDebuffData[] = showBuffs && hero.activeBuffs
          ? Object.values(hero.activeBuffs).map(buff => ({
              name: buff.name || 'Buff',
              icon: buff.icon || '✨',
              color: buff.color || '#4caf50',
              remainingDuration: buff.remainingDuration || 0
            }))
          : [];

        const debuffs: BuffDebuffData[] = showDebuffs && hero.activeDebuffs
          ? Object.values(hero.activeDebuffs).map(debuff => ({
              name: debuff.name || 'Debuff',
              icon: debuff.icon || '⚠️',
              color: debuff.color || '#ef4444',
              remainingDuration: debuff.remainingDuration || 0
            }))
          : [];

        return (
          <div
            key={hero.id}
            style={{
              width: '250px',
              backgroundColor: hero.isAlive ? 'rgba(0, 0, 0, 0.8)' : 'rgba(50, 50, 50, 0.8)',
              border: `2px solid ${hero.isAlive ? roleColor : '#666'}`,
              borderRadius: '4px',
              padding: '8px',
              opacity: hero.isAlive ? 1 : 0.6
            }}
          >
            {/* Hero name and role */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: hero.isAlive ? '#fff' : '#999'
              }}>
                {hero.name}
              </div>
              <div style={{
                fontSize: '10px',
                color: roleColor,
                textTransform: 'uppercase'
              }}>
                {hero.role}
              </div>
            </div>

            {/* Health bar */}
            <div style={{
              width: '100%',
              height: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '2px',
              overflow: 'hidden',
              marginBottom: '4px',
              position: 'relative'
            }}>
              <div
                style={{
                  width: `${hpPercent}%`,
                  height: '100%',
                  backgroundColor: hero.isAlive
                    ? (hpPercent > 60 ? '#4caf50' : hpPercent > 30 ? '#ff9800' : '#ef4444')
                    : '#666',
                  transition: 'width 0.3s, background-color 0.3s'
                }}
              />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '10px',
                color: '#fff',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
              }}>
                {Math.floor(hero.hp)} / {Math.floor(hero.maxHp)} ({Math.round(hpPercent)}%)
              </div>
            </div>

            {/* Buffs/Debuffs */}
            {(buffs.length > 0 || debuffs.length > 0) && (
              <div style={{ marginTop: '4px' }}>
                <BuffDebuffIndicator
                  buffs={buffs}
                  debuffs={debuffs}
                  size="small"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}



