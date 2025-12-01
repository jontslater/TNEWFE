/**
 * Test Panel Component
 * Provides UI controls for testing all game mechanics
 */

import React, { useState, useEffect } from 'react';
import { getTestLogger, LogCategory, testLog } from '../utils/testLogging';
import {
  spawnEnemy,
  spawnBoss,
  spawnPack,
  killAllEnemies,
  setHeroHp,
  killHero,
  resurrectHero,
  levelUpHero,
  giveGold,
  applyDebuffToHero,
  applyDebuffToEnemy,
  clearHeroDebuffs,
  clearAllDebuffs,
  healHero,
  giveShield,
  clearShields,
  forceCombatRound,
  startCombat,
  stopCombat,
  triggerEnemyEncounter,
  triggerTreasureFind,
  triggerPeacefulTravel,
  triggerGathering,
  resetCooldowns
} from '../utils/testHelpers';
import { Hero, Enemy } from '../utils/combat/types';
import { DEBUFFS } from '../utils/fullCombatEngine';
import { testRunner } from '../utils/testRunner';

interface TestPanelProps {
  heroes: Hero[];
  enemies: Enemy[];
  onHeroesChange?: () => void;
  combatEngine?: any; // FullCombatEngine instance
}

export default function TestPanel({ heroes, enemies, onHeroesChange, combatEngine }: TestPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    testing: false,
    combat: false,
    heroes: false,
    enemies: false,
    debuffs: false,
    healing: false,
    shields: false,
    adventure: false,
    logging: true // Default to open logging section
  });
  const [logger] = useState(() => getTestLogger());
  const [loggingState, setLoggingState] = useState(logger.getState());
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Update logging state when it changes
  useEffect(() => {
    const interval = setInterval(() => {
      setLoggingState(logger.getState());
    }, 100);
    return () => clearInterval(interval);
  }, [logger]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleGlobalLogging = () => {
    const newState = !logger.isGlobalEnabled();
    logger.setGlobalEnabled(newState);
    setLoggingState(logger.getState());
    console.log(`[Test Panel] Global logging ${newState ? 'ENABLED' : 'DISABLED'}`);
    setStatusMessage(`Global logging ${newState ? 'ENABLED' : 'DISABLED'}`);
    setTimeout(() => setStatusMessage(''), 2000);
    // Show a test log to verify it works
    if (newState) {
      testLog('UI', 'Test', 'Global logging enabled - this is a test message');
    }
  };

  const toggleCategoryLogging = (category: LogCategory) => {
    const newState = !logger.isCategoryEnabled(category);
    logger.setCategoryEnabled(category, newState);
    setLoggingState(logger.getState());
    setStatusMessage(`${category} logging ${newState ? 'ENABLED' : 'DISABLED'}`);
    setTimeout(() => setStatusMessage(''), 2000);
    // Show a test log to verify it works
    if (newState && logger.isGlobalEnabled()) {
      testLog(category, 'Test', `${category} logging enabled - this is a test message`);
    }
  };

  const selectedHeroId = heroes.length > 0 ? (heroes[0].id || heroes[0].username) : '';
  const selectedEnemyId = enemies.length > 0 ? enemies[0].id : '';

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 10000,
          padding: '8px 16px',
          backgroundColor: 'rgba(59, 130, 246, 0.9)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        🧪 Test Panel
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        width: '400px',
        maxHeight: '90vh',
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        border: '2px solid rgba(59, 130, 246, 0.5)',
        borderRadius: '8px',
        padding: '16px',
        zIndex: 10000,
        overflowY: 'auto',
        color: 'white',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>🧪 Test Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'rgba(239, 68, 68, 0.7)',
            border: 'none',
            color: 'white',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div style={{
          padding: '8px',
          marginBottom: '12px',
          backgroundColor: statusMessage.startsWith('Error') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)',
          borderRadius: '4px',
          fontSize: '11px',
          color: 'white'
        }}>
          {statusMessage}
        </div>
      )}

      {/* Test Runner */}
      <Section
        title="Test Runner"
        expanded={expandedSections.testing || false}
        onToggle={() => toggleSection('testing')}
      >
        <div style={{ marginBottom: '8px', padding: '8px', backgroundColor: 'rgba(34, 197, 94, 0.2)', borderRadius: '4px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
            Run comprehensive tests on all game systems. Results will appear in the console.
          </div>
          <ButtonGroup>
            <button 
              onClick={async () => {
                try {
                  setStatusMessage('Running tests...');
                  const engine = combatEngine || (window as any).testHelperContext?.combatEngine;
                  if (!engine) {
                    setStatusMessage('Combat engine not available');
                    setTimeout(() => setStatusMessage(''), 3000);
                    return;
                  }
                  const results = await testRunner.runAllTests(engine);
                  setStatusMessage(`Tests complete! Passed: ${results.passed}, Failed: ${results.failed}, Pass Rate: ${results.passRate}%`);
                  setTimeout(() => setStatusMessage(''), 5000);
                  console.log('[Test Panel] Test results:', results);
                } catch (e) {
                  console.error('[Test Panel] Error running tests:', e);
                  setStatusMessage('Error running tests - check console');
                  setTimeout(() => setStatusMessage(''), 3000);
                }
              }}
              style={{ 
                backgroundColor: '#22c55e', 
                color: 'white', 
                fontWeight: 'bold',
                padding: '10px 20px'
              }}
            >
              🧪 Run All Tests
            </button>
          </ButtonGroup>
          <div style={{ marginTop: '8px', fontSize: '10px', color: '#9ca3af' }}>
            Individual tests:
          </div>
          <ButtonGroup>
            <button 
              onClick={() => {
                try {
                  const engine = combatEngine || (window as any).testHelperContext?.combatEngine;
                  if (!engine) {
                    setStatusMessage('Combat engine not available');
                    setTimeout(() => setStatusMessage(''), 2000);
                    return;
                  }
                  testRunner.testCombatSystem(engine);
                  setStatusMessage('Combat system test complete - check console');
                  setTimeout(() => setStatusMessage(''), 3000);
                } catch (e) {
                  console.error('[Test Panel] Error:', e);
                  setStatusMessage('Error running test - check console');
                  setTimeout(() => setStatusMessage(''), 3000);
                }
              }}
              style={{ fontSize: '10px' }}
            >
              Test Combat
            </button>
            <button 
              onClick={() => {
                try {
                  const engine = combatEngine || (window as any).testHelperContext?.combatEngine;
                  if (!engine) {
                    setStatusMessage('Combat engine not available');
                    setTimeout(() => setStatusMessage(''), 2000);
                    return;
                  }
                  testRunner.testDeathDetection(engine);
                  setStatusMessage('Death detection test complete - check console');
                  setTimeout(() => setStatusMessage(''), 3000);
                } catch (e) {
                  console.error('[Test Panel] Error:', e);
                  setStatusMessage('Error running test - check console');
                  setTimeout(() => setStatusMessage(''), 3000);
                }
              }}
              style={{ fontSize: '10px' }}
            >
              Test Death
            </button>
            <button 
              onClick={() => {
                try {
                  const engine = combatEngine || (window as any).testHelperContext?.combatEngine;
                  if (!engine) {
                    setStatusMessage('Combat engine not available');
                    setTimeout(() => setStatusMessage(''), 2000);
                    return;
                  }
                  testRunner.testDebuffSystem(engine);
                  setStatusMessage('Debuff system test complete - check console');
                  setTimeout(() => setStatusMessage(''), 3000);
                } catch (e) {
                  console.error('[Test Panel] Error:', e);
                  setStatusMessage('Error running test - check console');
                  setTimeout(() => setStatusMessage(''), 3000);
                }
              }}
              style={{ fontSize: '10px' }}
            >
              Test Debuffs
            </button>
            <button 
              onClick={() => {
                try {
                  const engine = combatEngine || (window as any).testHelperContext?.combatEngine;
                  if (!engine) {
                    setStatusMessage('Combat engine not available');
                    setTimeout(() => setStatusMessage(''), 2000);
                    return;
                  }
                  testRunner.testStateConsistency(engine);
                  setStatusMessage('State consistency test complete - check console');
                  setTimeout(() => setStatusMessage(''), 3000);
                } catch (e) {
                  console.error('[Test Panel] Error:', e);
                  setStatusMessage('Error running test - check console');
                  setTimeout(() => setStatusMessage(''), 3000);
                }
              }}
              style={{ fontSize: '10px' }}
            >
              Test State
            </button>
          </ButtonGroup>
        </div>
      </Section>

      {/* Logging Controls */}
      <Section
        title="Logging"
        expanded={expandedSections.logging}
        onToggle={() => toggleSection('logging')}
      >
        <div style={{ marginBottom: '8px', padding: '8px', backgroundColor: 'rgba(59, 130, 246, 0.2)', borderRadius: '4px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
            ⚠️ Enable "Global Logging" first, then enable specific categories to see logs in the console.
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={loggingState.globalEnabled}
              onChange={toggleGlobalLogging}
            />
            <span style={{ fontWeight: 'bold' }}>Global Logging</span>
            {loggingState.globalEnabled && <span style={{ color: '#10b981', fontSize: '10px' }}>✓ Enabled</span>}
          </label>
        </div>
        {logger.getAllCategories().map(category => (
          <div key={category} style={{ marginBottom: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={loggingState.categories[category] || false}
                onChange={() => toggleCategoryLogging(category)}
                disabled={!loggingState.globalEnabled}
              />
              <span>{category}</span>
            </label>
          </div>
        ))}
      </Section>

      {/* Combat Controls */}
      <Section
        title="Combat"
        expanded={expandedSections.combat}
        onToggle={() => toggleSection('combat')}
      >
        <ButtonGroup>
          <button onClick={() => {
            try {
              startCombat();
              setStatusMessage('Combat started');
              setTimeout(() => setStatusMessage(''), 2000);
            } catch (e) {
              console.error('[Test Panel] Error starting combat:', e);
              setStatusMessage('Error starting combat - check console');
              setTimeout(() => setStatusMessage(''), 3000);
            }
          }}>Start Combat</button>
          <button onClick={() => {
            try {
              stopCombat();
              setStatusMessage('Combat stopped');
              setTimeout(() => setStatusMessage(''), 2000);
            } catch (e) {
              console.error('[Test Panel] Error stopping combat:', e);
              setStatusMessage('Error stopping combat - check console');
              setTimeout(() => setStatusMessage(''), 3000);
            }
          }}>Stop Combat</button>
          <button onClick={() => {
            try {
              forceCombatRound();
              setStatusMessage('Forced combat round');
              setTimeout(() => setStatusMessage(''), 2000);
            } catch (e) {
              console.error('[Test Panel] Error forcing round:', e);
              setStatusMessage('Error forcing round - check console');
              setTimeout(() => setStatusMessage(''), 3000);
            }
          }}>Force Round</button>
        </ButtonGroup>
        <ButtonGroup>
          <button onClick={() => {
            try {
              const enemies = spawnEnemy('Kobold Warrior');
              setStatusMessage(enemies.length > 0 ? `Spawned ${enemies.length} enemy/enemies` : 'Failed to spawn enemy');
              setTimeout(() => setStatusMessage(''), 2000);
            } catch (e) {
              console.error('[Test Panel] Error spawning enemy:', e);
              setStatusMessage('Error spawning enemy - check console');
              setTimeout(() => setStatusMessage(''), 3000);
            }
          }}>Spawn Enemy</button>
          <button onClick={() => {
            try {
              const enemies = spawnBoss();
              setStatusMessage(enemies.length > 0 ? `Spawned ${enemies.length} boss/bosses` : 'Failed to spawn boss');
              setTimeout(() => setStatusMessage(''), 2000);
            } catch (e) {
              console.error('[Test Panel] Error spawning boss:', e);
              setStatusMessage('Error spawning boss - check console');
              setTimeout(() => setStatusMessage(''), 3000);
            }
          }}>Spawn Boss</button>
          <button onClick={() => {
            try {
              const enemies = spawnPack(2);
              setStatusMessage(enemies.length > 0 ? `Spawned pack of ${enemies.length} enemies` : 'Failed to spawn pack');
              setTimeout(() => setStatusMessage(''), 2000);
            } catch (e) {
              console.error('[Test Panel] Error spawning pack:', e);
              setStatusMessage('Error spawning pack - check console');
              setTimeout(() => setStatusMessage(''), 3000);
            }
          }}>Spawn Pack</button>
        </ButtonGroup>
        <ButtonGroup>
          <button onClick={() => {
            try {
              killAllEnemies();
              setStatusMessage('All enemies killed');
              setTimeout(() => setStatusMessage(''), 2000);
            } catch (e) {
              console.error('[Test Panel] Error killing enemies:', e);
              setStatusMessage('Error killing enemies - check console');
              setTimeout(() => setStatusMessage(''), 3000);
            }
          }}>Kill All Enemies</button>
        </ButtonGroup>
      </Section>

      {/* Hero Controls */}
      <Section
        title="Heroes"
        expanded={expandedSections.heroes}
        onToggle={() => toggleSection('heroes')}
      >
        {heroes.length === 0 ? (
          <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>No heroes available</div>
        ) : (
          <>
            <div style={{ marginBottom: '8px', color: '#9ca3af', fontSize: '11px' }}>
              Selected: {selectedHeroId || 'None'}
            </div>
            <ButtonGroup>
              <button onClick={() => {
                try {
                  if (!selectedHeroId) {
                    setStatusMessage('No hero selected');
                    setTimeout(() => setStatusMessage(''), 2000);
                    return;
                  }
                  setHeroHp(selectedHeroId, 100);
                  setStatusMessage(`Set ${selectedHeroId} HP to 100%`);
                  setTimeout(() => setStatusMessage(''), 2000);
                } catch (e) {
                  console.error('[Test Panel] Error setting HP:', e);
                  setStatusMessage('Error setting HP - check console');
                  setTimeout(() => setStatusMessage(''), 3000);
                }
              }}>HP: 100%</button>
              <button onClick={() => {
                try {
                  if (!selectedHeroId) {
                    setStatusMessage('No hero selected');
                    setTimeout(() => setStatusMessage(''), 2000);
                    return;
                  }
                  setHeroHp(selectedHeroId, 50);
                  setStatusMessage(`Set ${selectedHeroId} HP to 50%`);
                  setTimeout(() => setStatusMessage(''), 2000);
                } catch (e) {
                  console.error('[Test Panel] Error setting HP:', e);
                  setStatusMessage('Error setting HP - check console');
                  setTimeout(() => setStatusMessage(''), 3000);
                }
              }}>HP: 50%</button>
              <button onClick={() => {
                try {
                  if (!selectedHeroId) {
                    setStatusMessage('No hero selected');
                    setTimeout(() => setStatusMessage(''), 2000);
                    return;
                  }
                  setHeroHp(selectedHeroId, 25);
                  setStatusMessage(`Set ${selectedHeroId} HP to 25%`);
                  setTimeout(() => setStatusMessage(''), 2000);
                } catch (e) {
                  console.error('[Test Panel] Error setting HP:', e);
                  setStatusMessage('Error setting HP - check console');
                  setTimeout(() => setStatusMessage(''), 3000);
                }
              }}>HP: 25%</button>
              <button onClick={() => {
                try {
                  if (!selectedHeroId) {
                    setStatusMessage('No hero selected');
                    setTimeout(() => setStatusMessage(''), 2000);
                    return;
                  }
                  setHeroHp(selectedHeroId, 1);
                  setStatusMessage(`Set ${selectedHeroId} HP to 1%`);
                  setTimeout(() => setStatusMessage(''), 2000);
                } catch (e) {
                  console.error('[Test Panel] Error setting HP:', e);
                  setStatusMessage('Error setting HP - check console');
                  setTimeout(() => setStatusMessage(''), 3000);
                }
              }}>HP: 1%</button>
            </ButtonGroup>
            <ButtonGroup>
              <button onClick={() => {
                try {
                  if (!selectedHeroId) {
                    setStatusMessage('No hero selected');
                    setTimeout(() => setStatusMessage(''), 2000);
                    return;
                  }
                  killHero(selectedHeroId);
                  setStatusMessage(`Killed ${selectedHeroId}`);
                  setTimeout(() => setStatusMessage(''), 2000);
                } catch (e) {
                  console.error('[Test Panel] Error killing hero:', e);
                  setStatusMessage('Error killing hero - check console');
                  setTimeout(() => setStatusMessage(''), 3000);
                }
              }}>Kill</button>
              <button onClick={() => {
                try {
                  if (!selectedHeroId) {
                    setStatusMessage('No hero selected');
                    setTimeout(() => setStatusMessage(''), 2000);
                    return;
                  }
                  resurrectHero(selectedHeroId);
                  setStatusMessage(`Resurrected ${selectedHeroId}`);
                  setTimeout(() => setStatusMessage(''), 2000);
                } catch (e) {
                  console.error('[Test Panel] Error resurrecting hero:', e);
                  setStatusMessage('Error resurrecting hero - check console');
                  setTimeout(() => setStatusMessage(''), 3000);
                }
              }}>Resurrect</button>
              <button onClick={() => {
                try {
                  if (!selectedHeroId) {
                    setStatusMessage('No hero selected');
                    setTimeout(() => setStatusMessage(''), 2000);
                    return;
                  }
                  levelUpHero(selectedHeroId);
                  setStatusMessage(`Leveled up ${selectedHeroId}`);
                  setTimeout(() => setStatusMessage(''), 2000);
                } catch (e) {
                  console.error('[Test Panel] Error leveling up hero:', e);
                  setStatusMessage('Error leveling up hero - check console');
                  setTimeout(() => setStatusMessage(''), 3000);
                }
              }}>Level Up</button>
            </ButtonGroup>
            <ButtonGroup>
              <button onClick={() => {
                try {
                  if (!selectedHeroId) {
                    setStatusMessage('No hero selected');
                    setTimeout(() => setStatusMessage(''), 2000);
                    return;
                  }
                  giveGold(selectedHeroId, 100);
                  setStatusMessage(`Gave 100 gold to ${selectedHeroId}`);
                  setTimeout(() => setStatusMessage(''), 2000);
                } catch (e) {
                  console.error('[Test Panel] Error giving gold:', e);
                  setStatusMessage('Error giving gold - check console');
                  setTimeout(() => setStatusMessage(''), 3000);
                }
              }}>+100 Gold</button>
              <button onClick={() => {
                try {
                  if (!selectedHeroId) {
                    setStatusMessage('No hero selected');
                    setTimeout(() => setStatusMessage(''), 2000);
                    return;
                  }
                  giveGold(selectedHeroId, 1000);
                  setStatusMessage(`Gave 1000 gold to ${selectedHeroId}`);
                  setTimeout(() => setStatusMessage(''), 2000);
                } catch (e) {
                  console.error('[Test Panel] Error giving gold:', e);
                  setStatusMessage('Error giving gold - check console');
                  setTimeout(() => setStatusMessage(''), 3000);
                }
              }}>+1000 Gold</button>
              <button onClick={() => {
                try {
                  if (!selectedHeroId) {
                    setStatusMessage('No hero selected');
                    setTimeout(() => setStatusMessage(''), 2000);
                    return;
                  }
                  resetCooldowns(selectedHeroId);
                  setStatusMessage(`Reset cooldowns for ${selectedHeroId}`);
                  setTimeout(() => setStatusMessage(''), 2000);
                } catch (e) {
                  console.error('[Test Panel] Error resetting cooldowns:', e);
                  setStatusMessage('Error resetting cooldowns - check console');
                  setTimeout(() => setStatusMessage(''), 3000);
                }
              }}>Reset CDs</button>
            </ButtonGroup>
          </>
        )}
      </Section>

      {/* Enemy Controls */}
      <Section
        title="Enemies"
        expanded={expandedSections.enemies}
        onToggle={() => toggleSection('enemies')}
      >
        {enemies.length === 0 ? (
          <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>No enemies available</div>
        ) : (
          <div style={{ color: '#9ca3af', fontSize: '11px' }}>
            {enemies.map(e => (
              <div key={e.id} style={{ marginBottom: '4px' }}>
                {e.name}: {Math.floor(e.hp)}/{e.maxHp} HP {e.isDead ? '(DEAD)' : ''}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Debuff Controls */}
      <Section
        title="Debuffs"
        expanded={expandedSections.debuffs}
        onToggle={() => toggleSection('debuffs')}
      >
        <div style={{ marginBottom: '8px', fontSize: '11px', color: '#9ca3af' }}>
          Apply to Hero: {selectedHeroId || 'None'}
        </div>
        <ButtonGroup>
          {Object.keys(DEBUFFS).slice(0, 4).map(debuffKey => (
            <button
              key={debuffKey}
              onClick={() => {
                try {
                  if (!selectedHeroId) {
                    setStatusMessage('No hero selected');
                    setTimeout(() => setStatusMessage(''), 2000);
                    return;
                  }
                  applyDebuffToHero(selectedHeroId, debuffKey as keyof typeof DEBUFFS);
                  setStatusMessage(`Applied ${DEBUFFS[debuffKey as keyof typeof DEBUFFS].name} to ${selectedHeroId}`);
                  setTimeout(() => setStatusMessage(''), 2000);
                } catch (e) {
                  console.error('[Test Panel] Error applying debuff:', e);
                  setStatusMessage('Error applying debuff - check console');
                  setTimeout(() => setStatusMessage(''), 3000);
                }
              }}
              style={{ fontSize: '10px' }}
            >
              {DEBUFFS[debuffKey].icon} {DEBUFFS[debuffKey].name}
            </button>
          ))}
        </ButtonGroup>
        <ButtonGroup>
          {Object.keys(DEBUFFS).slice(4).map(debuffKey => (
            <button
              key={debuffKey}
              onClick={() => {
                try {
                  if (!selectedHeroId) {
                    setStatusMessage('No hero selected');
                    setTimeout(() => setStatusMessage(''), 2000);
                    return;
                  }
                  applyDebuffToHero(selectedHeroId, debuffKey as keyof typeof DEBUFFS);
                  setStatusMessage(`Applied ${DEBUFFS[debuffKey as keyof typeof DEBUFFS].name} to ${selectedHeroId}`);
                  setTimeout(() => setStatusMessage(''), 2000);
                } catch (e) {
                  console.error('[Test Panel] Error applying debuff:', e);
                  setStatusMessage('Error applying debuff - check console');
                  setTimeout(() => setStatusMessage(''), 3000);
                }
              }}
              style={{ fontSize: '10px' }}
            >
              {DEBUFFS[debuffKey].icon} {DEBUFFS[debuffKey].name}
            </button>
          ))}
        </ButtonGroup>
        <ButtonGroup>
          <button onClick={() => {
            try {
              if (!selectedHeroId) {
                setStatusMessage('No hero selected');
                setTimeout(() => setStatusMessage(''), 2000);
                return;
              }
              clearHeroDebuffs(selectedHeroId);
              setStatusMessage(`Cleared debuffs from ${selectedHeroId}`);
              setTimeout(() => setStatusMessage(''), 2000);
            } catch (e) {
              console.error('[Test Panel] Error clearing debuffs:', e);
              setStatusMessage('Error clearing debuffs - check console');
              setTimeout(() => setStatusMessage(''), 3000);
            }
          }}>Clear Hero Debuffs</button>
          <button onClick={() => {
            try {
              clearAllDebuffs();
              setStatusMessage('Cleared all debuffs');
              setTimeout(() => setStatusMessage(''), 2000);
            } catch (e) {
              console.error('[Test Panel] Error clearing all debuffs:', e);
              setStatusMessage('Error clearing all debuffs - check console');
              setTimeout(() => setStatusMessage(''), 3000);
            }
          }}>Clear All Debuffs</button>
        </ButtonGroup>
      </Section>

      {/* Healing Controls */}
      <Section
        title="Healing"
        expanded={expandedSections.healing}
        onToggle={() => toggleSection('healing')}
      >
        <ButtonGroup>
          <button onClick={() => {
            try {
              if (!selectedHeroId) {
                setStatusMessage('No hero selected');
                setTimeout(() => setStatusMessage(''), 2000);
                return;
              }
              healHero(selectedHeroId, 50);
              setStatusMessage(`Healed ${selectedHeroId} for 50 HP`);
              setTimeout(() => setStatusMessage(''), 2000);
            } catch (e) {
              console.error('[Test Panel] Error healing:', e);
              setStatusMessage('Error healing - check console');
              setTimeout(() => setStatusMessage(''), 3000);
            }
          }}>Heal +50</button>
          <button onClick={() => {
            try {
              if (!selectedHeroId) {
                setStatusMessage('No hero selected');
                setTimeout(() => setStatusMessage(''), 2000);
                return;
              }
              healHero(selectedHeroId, 100);
              setStatusMessage(`Healed ${selectedHeroId} for 100 HP`);
              setTimeout(() => setStatusMessage(''), 2000);
            } catch (e) {
              console.error('[Test Panel] Error healing:', e);
              setStatusMessage('Error healing - check console');
              setTimeout(() => setStatusMessage(''), 3000);
            }
          }}>Heal +100</button>
          <button onClick={() => {
            try {
              if (!selectedHeroId) {
                setStatusMessage('No hero selected');
                setTimeout(() => setStatusMessage(''), 2000);
                return;
              }
              healHero(selectedHeroId, 200);
              setStatusMessage(`Healed ${selectedHeroId} for 200 HP`);
              setTimeout(() => setStatusMessage(''), 2000);
            } catch (e) {
              console.error('[Test Panel] Error healing:', e);
              setStatusMessage('Error healing - check console');
              setTimeout(() => setStatusMessage(''), 3000);
            }
          }}>Heal +200</button>
        </ButtonGroup>
      </Section>

      {/* Shield Controls */}
      <Section
        title="Shields"
        expanded={expandedSections.shields}
        onToggle={() => toggleSection('shields')}
      >
        <ButtonGroup>
          <button onClick={() => {
            try {
              if (!selectedHeroId) {
                setStatusMessage('No hero selected');
                setTimeout(() => setStatusMessage(''), 2000);
                return;
              }
              giveShield(selectedHeroId, 50, 10000);
              setStatusMessage(`Gave 50 shield to ${selectedHeroId}`);
              setTimeout(() => setStatusMessage(''), 2000);
            } catch (e) {
              console.error('[Test Panel] Error giving shield:', e);
              setStatusMessage('Error giving shield - check console');
              setTimeout(() => setStatusMessage(''), 3000);
            }
          }}>Shield +50</button>
          <button onClick={() => {
            try {
              if (!selectedHeroId) {
                setStatusMessage('No hero selected');
                setTimeout(() => setStatusMessage(''), 2000);
                return;
              }
              giveShield(selectedHeroId, 100, 10000);
              setStatusMessage(`Gave 100 shield to ${selectedHeroId}`);
              setTimeout(() => setStatusMessage(''), 2000);
            } catch (e) {
              console.error('[Test Panel] Error giving shield:', e);
              setStatusMessage('Error giving shield - check console');
              setTimeout(() => setStatusMessage(''), 3000);
            }
          }}>Shield +100</button>
          <button onClick={() => {
            try {
              if (!selectedHeroId) {
                setStatusMessage('No hero selected');
                setTimeout(() => setStatusMessage(''), 2000);
                return;
              }
              giveShield(selectedHeroId, 200, 10000);
              setStatusMessage(`Gave 200 shield to ${selectedHeroId}`);
              setTimeout(() => setStatusMessage(''), 2000);
            } catch (e) {
              console.error('[Test Panel] Error giving shield:', e);
              setStatusMessage('Error giving shield - check console');
              setTimeout(() => setStatusMessage(''), 3000);
            }
          }}>Shield +200</button>
        </ButtonGroup>
        <ButtonGroup>
          <button onClick={() => {
            try {
              if (!selectedHeroId) {
                setStatusMessage('No hero selected');
                setTimeout(() => setStatusMessage(''), 2000);
                return;
              }
              clearShields(selectedHeroId);
              setStatusMessage(`Cleared shields from ${selectedHeroId}`);
              setTimeout(() => setStatusMessage(''), 2000);
            } catch (e) {
              console.error('[Test Panel] Error clearing shields:', e);
              setStatusMessage('Error clearing shields - check console');
              setTimeout(() => setStatusMessage(''), 3000);
            }
          }}>Clear Shields</button>
        </ButtonGroup>
      </Section>

      {/* Adventure Controls */}
      <Section
        title="Adventure"
        expanded={expandedSections.adventure}
        onToggle={() => toggleSection('adventure')}
      >
        <ButtonGroup>
          <button onClick={() => {
            try {
              triggerEnemyEncounter(false);
              setStatusMessage('Triggered enemy encounter');
              setTimeout(() => setStatusMessage(''), 2000);
            } catch (e) {
              console.error('[Test Panel] Error triggering encounter:', e);
              setStatusMessage('Error triggering encounter - check console');
              setTimeout(() => setStatusMessage(''), 3000);
            }
          }}>Enemy Encounter</button>
          <button onClick={() => {
            try {
              triggerEnemyEncounter(true);
              setStatusMessage('Triggered boss encounter');
              setTimeout(() => setStatusMessage(''), 2000);
            } catch (e) {
              console.error('[Test Panel] Error triggering boss encounter:', e);
              setStatusMessage('Error triggering boss encounter - check console');
              setTimeout(() => setStatusMessage(''), 3000);
            }
          }}>Boss Encounter</button>
        </ButtonGroup>
        <ButtonGroup>
          <button onClick={() => {
            try {
              triggerTreasureFind();
              setStatusMessage('Triggered treasure find');
              setTimeout(() => setStatusMessage(''), 2000);
            } catch (e) {
              console.error('[Test Panel] Error triggering treasure find:', e);
              setStatusMessage('Error triggering treasure find - check console');
              setTimeout(() => setStatusMessage(''), 3000);
            }
          }}>Treasure Find</button>
          <button onClick={() => {
            try {
              triggerPeacefulTravel();
              setStatusMessage('Triggered peaceful travel');
              setTimeout(() => setStatusMessage(''), 2000);
            } catch (e) {
              console.error('[Test Panel] Error triggering peaceful travel:', e);
              setStatusMessage('Error triggering peaceful travel - check console');
              setTimeout(() => setStatusMessage(''), 3000);
            }
          }}>Peaceful Travel</button>
          <button onClick={() => {
            try {
              triggerGathering();
              setStatusMessage('Triggered gathering');
              setTimeout(() => setStatusMessage(''), 2000);
            } catch (e) {
              console.error('[Test Panel] Error triggering gathering:', e);
              setStatusMessage('Error triggering gathering - check console');
              setTimeout(() => setStatusMessage(''), 3000);
            }
          }}>Gathering</button>
        </ButtonGroup>
      </Section>
    </div>
  );
}

interface SectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ title, expanded, onToggle, children }: SectionProps) {
  return (
    <div style={{ marginBottom: '12px', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '4px' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '8px',
          background: 'rgba(59, 130, 246, 0.2)',
          border: 'none',
          color: 'white',
          textAlign: 'left',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '13px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>{title}</span>
        <span>{expanded ? '▼' : '▶'}</span>
      </button>
      {expanded && (
        <div style={{ padding: '8px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

interface ButtonGroupProps {
  children: React.ReactNode;
}

function ButtonGroup({ children }: ButtonGroupProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
      {children}
    </div>
  );
}

// Export button style for reuse
export const testButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  backgroundColor: 'rgba(59, 130, 246, 0.7)',
  color: 'white',
  border: '1px solid rgba(59, 130, 246, 0.5)',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '11px',
  fontWeight: 'normal',
  transition: 'background-color 0.2s'
};
