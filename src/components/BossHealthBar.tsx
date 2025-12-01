/**
 * Enhanced Boss Health Bar Component
 * Displays boss health with phase indicators, enrage timer, and cast bar integration
 */

import React from 'react';
import { BossPhase } from '../types/BossMechanics';

interface BossHealthBarProps {
  bossName: string;
  currentHp: number;
  maxHp: number;
  phases?: BossPhase[];
  currentPhase?: number;
  enrageActive?: boolean;
  enrageTimeRemaining?: number; // seconds
  position?: 'top' | 'bottom';
  showPhaseIndicators?: boolean;
}

export default function BossHealthBar({
  bossName,
  currentHp,
  maxHp,
  phases = [],
  currentPhase = 1,
  enrageActive = false,
  enrageTimeRemaining,
  position = 'top',
  showPhaseIndicators = true
}: BossHealthBarProps) {
  const hpPercent = maxHp > 0 ? (currentHp / maxHp) * 100 : 0;
  const hpPercentRounded = Math.max(0, Math.min(100, Math.round(hpPercent)));

  // Sort phases by HP threshold (highest to lowest)
  const sortedPhases = [...phases].sort((a, b) => b.hpThreshold - a.hpThreshold);

  return (
    <div
      style={{
        position: 'absolute',
        [position]: position === 'top' ? '20px' : '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '800px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      {/* Boss name */}
      <div style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#ffffff',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
        textAlign: 'center'
      }}>
        {bossName}
      </div>

      {/* Health bar container */}
      <div style={{
        width: '100%',
        height: '40px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        border: '3px solid #ffffff',
        borderRadius: '4px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Health fill */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${hpPercent}%`,
            backgroundColor: hpPercent > 50 ? '#4ade80' : hpPercent > 25 ? '#fbbf24' : '#ef4444',
            transition: 'width 0.3s ease-out, background-color 0.3s',
            boxShadow: `inset 0 0 20px ${hpPercent > 50 ? '#22c55e' : hpPercent > 25 ? '#f59e0b' : '#dc2626'}`
          }}
        />

        {/* Phase indicators */}
        {showPhaseIndicators && sortedPhases.length > 0 && (
          <>
            {sortedPhases.map((phase, index) => {
              const phasePercent = phase.hpThreshold * 100;
              const isPastPhase = hpPercent < phasePercent;
              
              return (
                <div
                  key={`phase-${index}`}
                  style={{
                    position: 'absolute',
                    left: `${phasePercent}%`,
                    top: 0,
                    width: '2px',
                    height: '100%',
                    backgroundColor: isPastPhase ? '#ef4444' : '#ffffff',
                    opacity: isPastPhase ? 0.8 : 0.5,
                    zIndex: 10
                  }}
                  title={`Phase ${index + 1} (${Math.round(phasePercent)}%)`}
                />
              );
            })}
          </>
        )}

        {/* HP text overlay */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#ffffff',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{hpPercentRounded}%</span>
          <span style={{ fontSize: '14px', opacity: 0.8 }}>
            ({Math.floor(currentHp).toLocaleString()} / {Math.floor(maxHp).toLocaleString()})
          </span>
        </div>
      </div>

      {/* Enrage timer */}
      {enrageActive && enrageTimeRemaining !== undefined && (
        <div style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#ef4444',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
          animation: 'pulse 1s infinite'
        }}>
          ⚠️ ENRAGE: {Math.max(0, Math.ceil(enrageTimeRemaining))}s
        </div>
      )}

      {/* Phase indicator text */}
      {showPhaseIndicators && sortedPhases.length > 0 && (
        <div style={{
          fontSize: '14px',
          color: '#ffffff',
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
          opacity: 0.8
        }}>
          Phase {currentPhase} / {sortedPhases.length}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}



