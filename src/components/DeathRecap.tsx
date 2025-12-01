/**
 * Death Recap Component
 * Shows what killed a hero
 */

import React from 'react';
import { DeathRecap } from '../utils/deathRecap';

interface DeathRecapProps {
  recap: DeathRecap | null;
  onClose: () => void;
}

export default function DeathRecapModal({ recap, onClose }: DeathRecapProps) {
  if (!recap) {
    return null;
  }

  const timeWindow = 10; // seconds
  const entries = recap.entries.slice(0, 10); // Show last 10 hits
  const totalDamage = recap.totalDamage;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 10000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          border: '2px solid #ff0000',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          borderBottom: '2px solid #ff0000',
          paddingBottom: '12px'
        }}>
          <h2 style={{
            color: '#ff0000',
            margin: 0,
            fontSize: '20px'
          }}>
            💀 {recap.heroName} - Death Recap
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid #666',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Killing blow */}
        {recap.killingBlow && (
          <div style={{
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            border: '2px solid #ff0000',
            borderRadius: '4px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#ff0000',
              marginBottom: '4px'
            }}>
              KILLING BLOW
            </div>
            <div style={{ color: '#fff', fontSize: '12px' }}>
              {recap.killingBlow.abilityName 
                ? `${recap.killingBlow.source}'s ${recap.killingBlow.abilityName}`
                : recap.killingBlow.source
              } - {Math.floor(recap.killingBlow.damage).toLocaleString()} damage
            </div>
          </div>
        )}

        {/* Damage timeline */}
        <div style={{
          marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '8px'
          }}>
            Last {timeWindow} seconds of damage:
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            {entries.map((entry, index) => {
              const secondsAgo = ((recap.deathTime - entry.timestamp) / 1000).toFixed(1);
              const damageTypeColors = {
                physical: '#ff6b6b',
                magic: '#4ecdc4',
                dot: '#ffe66d',
                environmental: '#95a5a6'
              };

              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ color: '#aaa' }}>
                    {secondsAgo}s ago
                  </div>
                  <div style={{ color: '#fff', flex: 1, marginLeft: '12px' }}>
                    {entry.abilityName 
                      ? `${entry.source}'s ${entry.abilityName}`
                      : entry.source
                    }
                  </div>
                  <div style={{
                    color: damageTypeColors[entry.damageType] || '#fff',
                    fontWeight: 'bold',
                    minWidth: '80px',
                    textAlign: 'right'
                  }}>
                    -{Math.floor(entry.damage).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total damage */}
        <div style={{
          borderTop: '1px solid #666',
          paddingTop: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: '#aaa', fontSize: '12px' }}>
            Total damage in last {timeWindow}s:
          </span>
          <span style={{ color: '#ff0000', fontWeight: 'bold', fontSize: '14px' }}>
            {Math.floor(totalDamage).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}



