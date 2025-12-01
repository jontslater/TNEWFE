/**
 * Clean OBS Browser Output Page
 * Minimal 1920x1080 component for OBS browser source - Sprites only, transparent background
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { battlefieldAPI } from '../api/client';
import { useBattlefieldListener } from '../hooks/useBattlefieldListener';
import { AnimatedSprite } from '../components/AnimatedSprite';

// -------------------------------
// Types
// -------------------------------

interface SlotPosition {
  left: string;   // percentage or pixel
  bottom: string; // percentage or pixel
}

interface Slots {
  [key: string]: SlotPosition;
}

// -------------------------------
// OBS Page Component
// -------------------------------

export default function OBSPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const urlToken = searchParams.get('token');
  const token = urlToken || localStorage.getItem('auth_token');

  // Battlefield ID from URL
  const [battlefieldId, setBattlefieldId] = useState<string | null>(null);

  // Slot positions from localStorage
  const [slots, setSlots] = useState<Slots>(() => {
    const saved = localStorage.getItem('spriteSlotPositions');
    return saved ? JSON.parse(saved) : {};
  });

  // Sprite facing preferences
  const [facingPreferences, setFacingPreferences] = useState<Record<string, 'left' | 'right'>>(() => {
    const saved = localStorage.getItem('spriteFacingPreferences');
    return saved ? JSON.parse(saved) : {};
  });

  // Battlefield listener for real-time data
  const { battlefieldState, loading: battlefieldLoading, error: battlefieldError } = useBattlefieldListener(battlefieldId);

  // Fixed dimensions - always 1920x1080
  const WIDTH = 1920;
  const HEIGHT = 1080;

  // Set body/html styles for OBS - transparent, no margins, fixed size
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    
    body.style.margin = '0';
    body.style.padding = '0';
    body.style.overflow = 'hidden';
    body.style.backgroundColor = 'transparent';
    body.style.width = `${WIDTH}px`;
    body.style.height = `${HEIGHT}px`;
    body.style.position = 'fixed';
    body.style.top = '0';
    body.style.left = '0';
    
    html.style.margin = '0';
    html.style.padding = '0';
    html.style.backgroundColor = 'transparent';
    html.style.width = `${WIDTH}px`;
    html.style.height = `${HEIGHT}px`;
    html.style.overflow = 'hidden';
    
    return () => {
      body.style.margin = '';
      body.style.padding = '';
      body.style.overflow = '';
      body.style.backgroundColor = '';
      body.style.width = '';
      body.style.height = '';
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      
      html.style.margin = '';
      html.style.padding = '';
      html.style.backgroundColor = '';
      html.style.width = '';
      html.style.height = '';
      html.style.overflow = '';
    };
  }, []);

  // Determine battlefield ID
  useEffect(() => {
    const idParam = searchParams.get('battlefieldId');
    const streamerUsername = searchParams.get('streamerUsername');
    const streamerId = searchParams.get('streamerId');
    
    if (idParam) {
      let normalizedId = idParam;
      if (idParam.startsWith('twitch:') && user?.twitchUsername) {
        const identifier = idParam.split(':')[1];
        if ((identifier.length > 20 || /^[a-z0-9]{20,}$/i.test(identifier))) {
          normalizedId = `twitch:${user.twitchUsername.toLowerCase().trim()}`;
        }
      }
      setBattlefieldId(normalizedId);
    } else if (streamerUsername) {
      setBattlefieldId(`twitch:${streamerUsername.toLowerCase().trim()}`);
    } else if (streamerId && user?.twitchUsername && streamerId === user.twitchId) {
      setBattlefieldId(`twitch:${user.twitchUsername.toLowerCase().trim()}`);
    } else if (user?.twitchUsername || user?.displayName) {
      const username = (user.twitchUsername || user.displayName || '').toLowerCase().trim();
      if (username) setBattlefieldId(`twitch:${username}`);
    } else if (user?.hero?.twitchUsername) {
      setBattlefieldId(`twitch:${user.hero.twitchUsername.toLowerCase().trim()}`);
    }
  }, [searchParams, user]);

  // Register browser source
  useEffect(() => {
    if (battlefieldId && user?.id && token) {
      battlefieldAPI.registerBrowserSource(battlefieldId, user.id, token).catch(console.error);
    }
  }, [battlefieldId, user, token]);

  // Load sprite preferences from backend
  useEffect(() => {
    if (user?.id) {
      battlefieldAPI.getSpriteFacingPreferences(user.id)
        .then(prefs => {
          setFacingPreferences(prefs);
          localStorage.setItem('spriteFacingPreferences', JSON.stringify(prefs));
        })
        .catch(err => {
          console.error('Failed to load sprite preferences:', err);
          const saved = localStorage.getItem('spriteFacingPreferences');
          if (saved) {
            try {
              setFacingPreferences(JSON.parse(saved));
            } catch (e) {
              // ignore
            }
          }
        });
    }
  }, [user?.id]);

  // Store token from URL
  useEffect(() => {
    if (urlToken) {
      localStorage.setItem('auth_token', urlToken);
    }
  }, [urlToken]);

  // Get slot position helper
  const getSlotPosition = (slotKey: string, defaultLeft: string, defaultBottom: string): SlotPosition => {
    return slots[slotKey] || { left: defaultLeft, bottom: defaultBottom };
  };

  // Get facing direction
  const getFacingDirection = (role: string, defaultFacing: 'left' | 'right' = 'right'): 'left' | 'right' => {
    return facingPreferences[role] || defaultFacing;
  };

  // Convert percentage or pixel string to pixel number (always relative to 1920x1080)
  const toPixels = (value: string, dimension: 'width' | 'height'): number => {
    if (value.endsWith('%')) {
      const percent = parseFloat(value) / 100;
      return dimension === 'width' ? percent * WIDTH : percent * HEIGHT;
    }
    return parseFloat(value) || 0;
  };

  // Display data
  const displayHeroes = battlefieldState?.heroes || [];
  const displayEnemies = battlefieldState?.enemies || [];
  const isLoading = battlefieldLoading && !battlefieldState;

  return (
    <div
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        width: `${WIDTH}px`,
        height: `${HEIGHT}px`,
        overflow: 'hidden',
        margin: '0',
        padding: '0',
        backgroundColor: 'transparent',
      }}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div className="animate-spin" style={{
              width: '48px',
              height: '48px',
              border: '4px solid #8b5cf6',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              margin: '0 auto 16px'
            }}></div>
            <p>Loading battlefield...</p>
          </div>
        </div>
      )}

      {/* Heroes */}
      {displayHeroes.map((hero, index) => {
        const slotKey = `battle-hero-slot-${index}`;
        const slotPos = getSlotPosition(slotKey, `${(index + 1) * 15}%`, '10%');
        
        // Determine animation state
        let animation: 'idle' | 'attack' | 'hurt' | 'death' = 'idle';
        if (hero.isDead || (hero.hp !== undefined && hero.hp <= 0)) {
          animation = 'death';
        } else if (battlefieldState?.inCombat) {
          animation = 'idle'; // TODO: track attack state
        }

        const leftPx = toPixels(slotPos.left, 'width');
        const bottomPx = toPixels(slotPos.bottom, 'height');

        return (
          <div
            key={hero.id}
            style={{
              position: 'absolute',
              left: `${leftPx}px`,
              bottom: `${bottomPx}px`,
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 100,
            }}
          >
            {/* Hero Sprite */}
            <div style={{ position: 'relative' }}>
              <AnimatedSprite
                role={hero.role || 'berserker'}
                animation={animation}
                facing={getFacingDirection(hero.role || 'berserker', 'right')}
              />
            </div>

            {/* Overhead UI */}
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              minWidth: '100px',
              pointerEvents: 'none'
            }}>
              {/* Name */}
              <div style={{
                fontSize: '0.75em',
                fontWeight: '700',
                color: '#fbbf24',
                textShadow: '0 0 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(251, 191, 36, 0.6)',
                whiteSpace: 'nowrap',
                textAlign: 'center'
              }}>
                {hero.name || hero.characterName || 'Unknown'} <span style={{ color: '#a78bfa' }}>Lv{hero.level || 1}</span>
              </div>

              {/* HP Bar */}
              <div style={{
                width: '80px',
                height: '6px',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderRadius: '3px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{
                  height: '100%',
                  backgroundColor: hero.hp && hero.maxHp && (hero.hp / hero.maxHp) > 0.5 ? '#22c55e' : 
                                   (hero.hp && hero.maxHp && (hero.hp / hero.maxHp) > 0.25 ? '#eab308' : '#dc2626'),
                  width: `${((hero.hp || 0) / (hero.maxHp || 1)) * 100}%`,
                  transition: 'width 0.3s ease, background-color 0.3s ease'
                }} />
              </div>

              {/* HP Text */}
              <div style={{
                fontSize: '0.65em',
                color: '#d1d5db',
                textShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
                fontFamily: 'monospace'
              }}>
                {Math.floor(hero.hp || 0)} / {Math.floor(hero.maxHp || 100)}
              </div>
            </div>
          </div>
        );
      })}

      {/* Enemies */}
      {displayEnemies.map((enemy: any, index: number) => {
        const slotKey = `battle-enemy-slot-${index}`;
        const slotPos = getSlotPosition(slotKey, `${70 + index * 10}%`, '20%');
        
        const leftPx = toPixels(slotPos.left, 'width');
        const bottomPx = toPixels(slotPos.bottom, 'height');

        return (
          <div
            key={enemy.id || index}
            style={{
              position: 'absolute',
              left: `${leftPx}px`,
              bottom: `${bottomPx}px`,
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 100,
            }}
          >
            {/* Enemy Sprite */}
            {enemy.sprite ? (
              <img
                src={`/Sprites/enemies/EnemySprites/${enemy.sprite}.png`}
                alt={enemy.name || 'Enemy'}
                style={{
                  width: '150px',
                  height: '150px',
                  objectFit: 'contain',
                  imageRendering: 'pixelated'
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div style={{ fontSize: '4rem' }}>👹</div>
            )}

            {/* Enemy Name */}
            <div style={{
              fontSize: '0.875rem',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
              textAlign: 'center',
              marginTop: '4px'
            }}>
              {enemy.name || 'Enemy'}
            </div>

            {/* HP Bar */}
            <div style={{
              width: '96px',
              height: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              borderRadius: '4px',
              overflow: 'hidden',
              marginTop: '4px'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#dc2626',
                width: `${((enemy.hp || 0) / (enemy.maxHp || 1)) * 100}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>

            {/* HP Text */}
            <div style={{
              fontSize: '0.75rem',
              color: '#d1d5db',
              textShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
              marginTop: '4px'
            }}>
              {Math.floor(enemy.hp || 0)} / {Math.floor(enemy.maxHp || 100)}
            </div>
          </div>
        );
      })}

      {/* Error Display */}
      {battlefieldError && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          backgroundColor: 'rgba(220, 38, 38, 0.9)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          zIndex: 1000,
          fontSize: '0.875rem'
        }}>
          Error: {battlefieldError}
        </div>
      )}
    </div>
  );
}
