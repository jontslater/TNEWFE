/**
 * Enemy Animation Test Page
 * Displays all enemies cycling through their full animations
 */

import { useState, useEffect, useRef } from 'react';
import EnemySpriteJS, { EnemySpriteJSHandle } from '../components/EnemySpriteJS';
import { getEnemyAnimationKey, ENEMY_ANIMATIONS } from '../utils/spriteAnimationData';

const ALL_ENEMIES = [
  'Kobold Warrior',
  'Baby Dragon',
  'Imp',
  'Lizardman',
  'Masked Orc',
  'Werewolf',
  'Skeleton Mage',
  'Witch',
  'Mimic',
  'Gryphon',
  'Minotaur',
  'Headless Horseman',
  'Adult Dragon',
  'Demon Lord'
];

// Animation sequence for each enemy (in order)
const ANIMATION_SEQUENCE = ['idle', 'attack', 'hurt', 'death'];

export default function EnemyAnimationTestPage() {
  const [currentAnimations, setCurrentAnimations] = useState<Record<string, string>>({});
  const spriteRefs = useRef<Record<string, EnemySpriteJSHandle | null>>({});
  const animationTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Get all available animations for an enemy
  const getEnemyAnimations = (enemyName: string): string[] => {
    const key = getEnemyAnimationKey(enemyName);
    const animations = ENEMY_ANIMATIONS[key];
    if (!animations) return [];
    
    // Return animations in the desired sequence, filtering out ones that don't exist
    return ANIMATION_SEQUENCE.filter(anim => animations[anim]);
  };

  // Cycle through animations for a single enemy
  const cycleEnemyAnimations = (enemyName: string, animations: string[], currentIndex: number = 0) => {
    if (animations.length === 0) return;

    const animation = animations[currentIndex];
    const spriteRef = spriteRefs.current[enemyName];

    if (spriteRef) {
      spriteRef.playAnimation(animation);
      setCurrentAnimations(prev => ({ ...prev, [enemyName]: animation }));
    }

    // Get animation duration
    const key = getEnemyAnimationKey(enemyName);
    const animData = ENEMY_ANIMATIONS[key]?.[animation];
    const duration = animData?.duration || 1000;

    // Schedule next animation
    const nextIndex = (currentIndex + 1) % animations.length;
    const delay = duration + 500; // Add 500ms pause between animations

    animationTimers.current[enemyName] = setTimeout(() => {
      cycleEnemyAnimations(enemyName, animations, nextIndex);
    }, delay);
  };

  // Start animation cycles for all enemies
  useEffect(() => {
    ALL_ENEMIES.forEach(enemyName => {
      const animations = getEnemyAnimations(enemyName);
      if (animations.length > 0) {
        // Stagger start times slightly for visual variety
        const delay = ALL_ENEMIES.indexOf(enemyName) * 200;
        setTimeout(() => {
          cycleEnemyAnimations(enemyName, animations, 0);
        }, delay);
      }
    });

    return () => {
      // Cleanup timers
      Object.values(animationTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  // Calculate grid layout
  const columns = 4;
  const rows = Math.ceil(ALL_ENEMIES.length / columns);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#111827',
      color: 'white',
      padding: '40px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '1920px', margin: '0 auto' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          Enemy Animation Test
        </h1>
        <p style={{
          textAlign: 'center',
          color: '#9CA3AF',
          marginBottom: '3rem',
          fontSize: '1.1rem'
        }}>
          All enemies cycling through their animations (idle → attack → hurt → death)
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '60px',
          justifyContent: 'center',
          alignItems: 'start'
        }}>
          {ALL_ENEMIES.map((enemyName, index) => {
            const animations = getEnemyAnimations(enemyName);
            const currentAnim = currentAnimations[enemyName] || 'idle';
            const hasAnimations = animations.length > 0;

            return (
              <div
                key={enemyName}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '20px',
                  padding: '20px',
                  backgroundColor: '#1F2937',
                  borderRadius: '12px',
                  border: '2px solid #374151',
                  minHeight: '300px',
                  justifyContent: 'center'
                }}
              >
                {/* Enemy Name */}
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  color: '#F3F4F6'
                }}>
                  {enemyName}
                </div>

                {/* Sprite Container */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '200px',
                  width: '100%',
                  position: 'relative'
                }}>
                  {hasAnimations ? (
                    <EnemySpriteJS
                      ref={(ref) => {
                        spriteRefs.current[enemyName] = ref;
                      }}
                      enemyId={`test-${enemyName.toLowerCase().replace(/\s+/g, '-')}`}
                      enemyType={enemyName}
                      enemyName={enemyName}
                      spriteUrl=""
                      facing="left"
                      scale={2.5}
                    />
                  ) : (
                    <div style={{
                      color: '#EF4444',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>
                      No animations found
                    </div>
                  )}
                </div>

                {/* Current Animation Indicator */}
                {hasAnimations && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    width: '100%',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#9CA3AF',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Current: <span style={{ color: '#60A5FA', fontWeight: 'bold' }}>{currentAnim}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '4px',
                      flexWrap: 'wrap',
                      justifyContent: 'center'
                    }}>
                      {animations.map(anim => (
                        <div
                          key={anim}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            backgroundColor: currentAnim === anim ? '#3B82F6' : '#374151',
                            color: currentAnim === anim ? 'white' : '#9CA3AF',
                            fontWeight: currentAnim === anim ? 'bold' : 'normal'
                          }}
                        >
                          {anim}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        <div style={{
          marginTop: '60px',
          padding: '24px',
          backgroundColor: '#1F2937',
          borderRadius: '12px',
          border: '2px solid #374151'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: '#F3F4F6'
          }}>
            Instructions
          </h2>
          <ul style={{
            listStyle: 'disc',
            paddingLeft: '24px',
            color: '#D1D5DB',
            lineHeight: '1.8',
            fontSize: '1rem'
          }}>
            <li>Each enemy cycles through: <strong>idle → attack → hurt → death → repeat</strong></li>
            <li>Animations are evenly spaced in a 4-column grid</li>
            <li>Each animation plays for its full duration plus a 500ms pause</li>
            <li>Check that all animations display correctly without scrolling, squishing, or flickering</li>
            <li>Verify that feet are aligned at the bottom for all animations</li>
            <li>Ensure attack animations (if larger than 48×48) scale correctly to fit the viewport</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
