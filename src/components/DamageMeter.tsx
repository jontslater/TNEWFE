/**
 * Damage Meter Component
 * Displays DPS, healing, and damage taken rankings
 */

import React from 'react';
import { DamageMeterData } from '../utils/damageMeters';

interface DamageMeterProps {
  meters: DamageMeterData[];
  showHealing?: boolean;
  showDamageTaken?: boolean;
  maxDisplay?: number;
  position?: 'left' | 'right' | 'top' | 'bottom';
}

export default function DamageMeter({
  meters,
  showHealing = false,
  showDamageTaken = false,
  maxDisplay = 10,
  position = 'right'
}: DamageMeterProps) {
  if (meters.length === 0) {
    return null;
  }

  const displayedMeters = meters.slice(0, maxDisplay);
  const maxDamage = meters[0]?.totalDamage || 1;

  const positionStyles: Record<string, React.CSSProperties> = {
    left: { left: '20px', top: '50%', transform: 'translateY(-50%)' },
    right: { right: '20px', top: '50%', transform: 'translateY(-50%)' },
    top: { top: '20px', left: '50%', transform: 'translateX(-50%)' },
    bottom: { bottom: '20px', left: '50%', transform: 'translateX(-50%)' }
  };

  return (
    <div
      style={{
        position: 'absolute',
        ...positionStyles[position],
        width: '300px',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        border: '2px solid #ffffff',
        borderRadius: '4px',
        padding: '12px',
        zIndex: 1000,
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}
    >
      <div style={{
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: '12px',
        textAlign: 'center',
        borderBottom: '1px solid #666',
        paddingBottom: '8px'
      }}>
        Damage Meter
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {displayedMeters.map((meter, index) => {
          const damageBarWidth = (meter.totalDamage / maxDamage) * 100;

          return (
            <div
              key={meter.heroId}
              style={{
                padding: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '3px',
                border: index === 0 ? '1px solid #ffd700' : '1px solid #666'
              }}
            >
              {/* Hero name and rank */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: index === 0 ? '#ffd700' : '#ffffff'
                }}>
                  #{index + 1} {meter.heroName}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#aaa'
                }}>
                  {meter.damagePercent.toFixed(1)}%
                </div>
              </div>

              {/* Damage bar */}
              <div style={{
                width: '100%',
                height: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '2px',
                overflow: 'hidden',
                marginBottom: '4px',
                position: 'relative'
              }}>
                <div
                  style={{
                    width: `${damageBarWidth}%`,
                    height: '100%',
                    backgroundColor: index === 0 ? '#4caf50' : '#2196f3',
                    transition: 'width 0.3s'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '4px',
                  transform: 'translateY(-50%)',
                  fontSize: '10px',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
                }}>
                  {Math.floor(meter.totalDamage).toLocaleString()}
                </div>
              </div>

              {/* Stats */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10px',
                color: '#aaa'
              }}>
                <span>DPS: {meter.dps.toFixed(1)}</span>
                {showHealing && meter.totalHealing > 0 && (
                  <span>HPS: {meter.hps.toFixed(1)}</span>
                )}
                {showDamageTaken && (
                  <span>Taken: {Math.floor(meter.totalDamageTaken).toLocaleString()}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}



