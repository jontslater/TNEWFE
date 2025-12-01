/**
 * Boss Ability Timer Component
 * Shows upcoming boss abilities with cooldowns
 */

import React, { useEffect, useState } from 'react';
import { BossMechanic } from '../types/BossMechanics';

interface BossAbilityTimerProps {
  mechanics: BossMechanic[];
  currentPhase: number;
  mechanicCooldowns: Map<string, { lastUsed: number; cooldown: number }>;
  currentTime: number;
  maxDisplay?: number;
}

export default function BossAbilityTimer({
  mechanics,
  currentPhase,
  mechanicCooldowns,
  currentTime,
  maxDisplay = 5
}: BossAbilityTimerProps) {
  const [upcomingAbilities, setUpcomingAbilities] = useState<Array<{
    mechanic: BossMechanic;
    timeUntilAvailable: number;
    isAvailable: boolean;
  }>>([]);

  useEffect(() => {
    // Filter mechanics active in current phase
    const activeMechanics = mechanics.filter(m => 
      !m.phases || m.phases.includes(currentPhase)
    );

    // Calculate time until each ability is available
    const abilities = activeMechanics.map(mechanic => {
      const cooldown = mechanicCooldowns.get(mechanic.name);
      if (!cooldown) {
        return {
          mechanic,
          timeUntilAvailable: 0,
          isAvailable: true
        };
      }

      const timeSinceLastUse = currentTime - cooldown.lastUsed;
      const timeUntilAvailable = Math.max(0, cooldown.cooldown - timeSinceLastUse);
      const isAvailable = timeUntilAvailable <= 0;

      return {
        mechanic,
        timeUntilAvailable,
        isAvailable
      };
    });

    // Sort by availability (available first) then by time until available
    abilities.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) {
        return a.isAvailable ? -1 : 1;
      }
      return a.timeUntilAvailable - b.timeUntilAvailable;
    });

    // Take top N
    setUpcomingAbilities(abilities.slice(0, maxDisplay));
  }, [mechanics, currentPhase, mechanicCooldowns, currentTime, maxDisplay]);

  if (upcomingAbilities.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '80px',
        right: '20px',
        width: '300px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        border: '2px solid #ffffff',
        borderRadius: '4px',
        padding: '12px',
        zIndex: 1000,
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)'
      }}
    >
      <div style={{
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: '8px',
        textAlign: 'center'
      }}>
        Upcoming Abilities
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        {upcomingAbilities.map((ability, index) => {
          const seconds = Math.ceil(ability.timeUntilAvailable / 1000);
          const isReady = ability.isAvailable;

          return (
            <div
              key={`${ability.mechanic.name}-${index}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                backgroundColor: isReady ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                borderRadius: '3px',
                border: `1px solid ${isReady ? '#4caf50' : '#666666'}`,
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                fontSize: '12px',
                color: '#ffffff',
                fontWeight: isReady ? 'bold' : 'normal'
              }}>
                {ability.mechanic.name}
              </div>
              <div style={{
                fontSize: '12px',
                color: isReady ? '#4caf50' : '#ffd700',
                fontWeight: 'bold',
                minWidth: '50px',
                textAlign: 'right'
              }}>
                {isReady ? 'READY' : `${seconds}s`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}



