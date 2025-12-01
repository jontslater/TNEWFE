/**
 * Boss Strategy Guide Component
 * Displays boss mechanics and strategies
 */

import React, { useState } from 'react';
import { BossMechanic, BossPhase } from '../types/BossMechanics';

interface BossStrategyGuideProps {
  bossName: string;
  mechanics: BossMechanic[];
  phases: BossPhase[];
  onClose?: () => void;
}

export default function BossStrategyGuide({
  bossName,
  mechanics,
  phases,
  onClose
}: BossStrategyGuideProps) {
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);

  const getMechanicTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      cast: '#ffd700',
      instant: '#ff6b6b',
      aoe: '#ff9800',
      adds: '#9c27b0',
      defensive: '#4ecdc4',
      enrage: '#ef4444',
      'tank-buster': '#ff0000'
    };
    return colors[type] || '#ffffff';
  };

  const getTargetDescription = (target: string): string => {
    const descriptions: Record<string, string> = {
      random: 'Random player',
      tank: 'Tank',
      'lowest-hp': 'Lowest HP player',
      'highest-threat': 'Highest threat player',
      all: 'All players',
      healer: 'Healer',
      'highest-dps': 'Highest DPS player'
    };
    return descriptions[target] || target;
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '800px',
        maxHeight: '90vh',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        border: '2px solid #ffffff',
        borderRadius: '8px',
        padding: '24px',
        zIndex: 10000,
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.5)',
        overflowY: 'auto'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '2px solid #ffffff',
        paddingBottom: '12px'
      }}>
        <h2 style={{
          color: '#ffffff',
          margin: 0,
          fontSize: '24px'
        }}>
          📖 {bossName} - Strategy Guide
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid #666',
              color: '#fff',
              padding: '6px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ✕ Close
          </button>
        )}
      </div>

      {/* Phases */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '12px' }}>
          Phases
        </h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {phases.map((phase, index) => {
            const hpPercent = Math.round(phase.hpThreshold * 100);
            const isSelected = selectedPhase === index + 1;

            return (
              <div
                key={index}
                onClick={() => setSelectedPhase(isSelected ? null : index + 1)}
                style={{
                  padding: '12px',
                  backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  border: `2px solid ${isSelected ? '#4caf50' : '#666'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: isSelected ? '8px' : '0'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#fff'
                  }}>
                    Phase {index + 1} - {hpPercent}% HP
                  </div>
                  {phase.adds && (
                    <div style={{
                      fontSize: '12px',
                      color: '#9c27b0'
                    }}>
                      Summons {phase.adds.count} {phase.adds.type}
                    </div>
                  )}
                </div>
                {isSelected && (
                  <div style={{
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid #666'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#aaa',
                      marginBottom: '4px'
                    }}>
                      Active Mechanics:
                    </div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '4px'
                    }}>
                      {phase.mechanics.map((mechanicName, mIndex) => {
                        const mechanic = mechanics.find(m => m.name === mechanicName);
                        if (!mechanic) return null;
                        return (
                          <div
                            key={mIndex}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: getMechanicTypeColor(mechanic.type),
                              color: '#000',
                              borderRadius: '3px',
                              fontSize: '11px',
                              fontWeight: 'bold'
                            }}
                          >
                            {mechanic.name}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mechanics */}
      <div>
        <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '12px' }}>
          Mechanics
        </h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {mechanics.map((mechanic, index) => (
            <div
              key={index}
              style={{
                padding: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${getMechanicTypeColor(mechanic.type)}`,
                borderRadius: '4px'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#fff'
                }}>
                  {mechanic.name}
                </div>
                <div style={{
                  padding: '2px 8px',
                  backgroundColor: getMechanicTypeColor(mechanic.type),
                  color: '#000',
                  borderRadius: '3px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  {mechanic.type}
                </div>
              </div>

              {mechanic.description && (
                <div style={{
                  fontSize: '12px',
                  color: '#aaa',
                  marginBottom: '6px'
                }}>
                  {mechanic.description}
                </div>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '6px',
                fontSize: '11px',
                color: '#ccc'
              }}>
                {mechanic.castTime && (
                  <div>
                    <strong>Cast Time:</strong> {mechanic.castTime / 1000}s
                  </div>
                )}
                {mechanic.cooldown && (
                  <div>
                    <strong>Cooldown:</strong> {mechanic.cooldown / 1000}s
                  </div>
                )}
                <div>
                  <strong>Target:</strong> {getTargetDescription(mechanic.target)}
                </div>
                {mechanic.damage && (
                  <div>
                    <strong>Damage:</strong> {mechanic.damage}
                  </div>
                )}
                {mechanic.interruptible !== undefined && (
                  <div>
                    <strong>Interruptible:</strong> {mechanic.interruptible ? 'Yes' : 'No'}
                  </div>
                )}
                {mechanic.phases && (
                  <div>
                    <strong>Phases:</strong> {mechanic.phases.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



