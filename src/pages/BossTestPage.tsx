/**
 * Boss Test Page
 * Allows testing bosses with configurable HP and mechanics
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getRaidById } from '../data/sampleRaids';
import HeroSpriteJS, { HeroSpriteJSHandle } from '../components/HeroSpriteJS';
import EnemySprite, { EnemySpriteJSHandle } from '../components/EnemySpriteJS';
import { TestHero, TestEnemy } from './AnimationTestPage';
import BossHealthBar from '../components/BossHealthBar';
import BossCastBar from '../components/BossCastBar';
import BossAbilityTimer from '../components/BossAbilityTimer';
import BossStrategyGuide from '../components/BossStrategyGuide';
import { BossMechanic, BossPhase } from '../types/BossMechanics';
import { CastInfo } from '../types/BossMechanics';
import { BossMechanicsState, initializeBossMechanicsState } from '../utils/bossMechanics';

export default function BossTestPage() {
  const { user } = useAuth();
  const [selectedRaidId, setSelectedRaidId] = useState<string>('elder_dragon_normal');
  const [bossHpPercent, setBossHpPercent] = useState<number>(100);
  const [heroes, setHeroes] = useState<TestHero[]>([]);
  const [boss, setBoss] = useState<TestEnemy | null>(null);
  const [bossMechanicsState, setBossMechanicsState] = useState<BossMechanicsState | null>(null);
  const [activeCasts, setActiveCasts] = useState<CastInfo[]>([]);
  const [showStrategyGuide, setShowStrategyGuide] = useState(false);

  const raidData = selectedRaidId ? getRaidById(selectedRaidId) : null;
  const bossData = raidData?.boss;

  useEffect(() => {
    if (bossData) {
      // Create test boss
      const testBoss: TestEnemy = {
        id: 'test-boss',
        name: bossData.name,
        hp: Math.floor((bossData.hp * bossHpPercent) / 100),
        maxHp: bossData.hp,
        attack: bossData.attack || 100,
        defense: bossData.defense || 50,
        level: bossData.level || 20,
        role: 'enemy',
        activeBuffs: {},
        activeDebuffs: {},
        equipment: [],
        shield: 0
      };
      setBoss(testBoss);

      // Initialize mechanics state
      if (bossData.mechanics) {
        setBossMechanicsState(initializeBossMechanicsState());
      }
    }
  }, [selectedRaidId, bossHpPercent, bossData]);

  useEffect(() => {
    // Create test heroes
    const testHeroes: TestHero[] = [
      {
        id: 'test-hero-1',
        name: 'Test Tank',
        hp: 1000,
        maxHp: 1000,
        attack: 100,
        defense: 150,
        level: 20,
        role: 'Tank',
        class: 'Guardian',
        activeBuffs: {},
        activeDebuffs: {},
        equipment: [],
        shield: 0
      },
      {
        id: 'test-hero-2',
        name: 'Test Healer',
        hp: 800,
        maxHp: 800,
        attack: 80,
        defense: 100,
        level: 20,
        role: 'Healer',
        class: 'Cleric',
        activeBuffs: {},
        activeDebuffs: {},
        equipment: [],
        shield: 0
      },
      {
        id: 'test-hero-3',
        name: 'Test DPS',
        hp: 600,
        maxHp: 600,
        attack: 150,
        defense: 80,
        level: 20,
        role: 'DPS',
        class: 'Berserker',
        activeBuffs: {},
        activeDebuffs: {},
        equipment: [],
        shield: 0
      }
    ];
    setHeroes(testHeroes);
  }, []);

  const handleHpChange = (percent: number) => {
    setBossHpPercent(percent);
    if (boss) {
      setBoss({
        ...boss,
        hp: Math.floor((boss.maxHp * percent) / 100)
      });
    }
  };

  const currentPhase = bossMechanicsState?.currentPhase || 1;
  const mechanics = bossData?.mechanics || [];
  const phases = bossData?.phases || [];
  const mechanicCooldowns = bossMechanicsState?.mechanicCooldowns || new Map();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Boss Testing Page</h1>

      {/* Controls */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Raid Selection */}
          <div>
            <label className="block text-sm font-semibold mb-2">Select Raid</label>
            <select
              value={selectedRaidId}
              onChange={(e) => setSelectedRaidId(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="elder_dragon_normal">Elder Dragon (Normal)</option>
              <option value="elder_dragon_heroic">Elder Dragon (Heroic)</option>
              <option value="elder_dragon_mythic">Elder Dragon (Mythic)</option>
              <option value="corrupted_temple">Corrupted Temple</option>
              <option value="bandit_stronghold">Bandit Stronghold</option>
            </select>
          </div>

          {/* HP Slider */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Boss HP: {bossHpPercent}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={bossHpPercent}
              onChange={(e) => handleHpChange(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={() => setShowStrategyGuide(!showStrategyGuide)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold"
          >
            {showStrategyGuide ? 'Hide' : 'Show'} Strategy Guide
          </button>
        </div>
      </div>

      {/* Battlefield */}
      {boss && bossData && (
        <div className="relative w-full h-screen bg-gray-950 border-2 border-gray-700 rounded-lg overflow-hidden">
          {/* Boss Health Bar */}
          <BossHealthBar
            bossName={boss.name}
            currentHp={boss.hp}
            maxHp={boss.maxHp}
            phases={phases}
            currentPhase={currentPhase}
            position="top"
          />

          {/* Boss Cast Bar */}
          {activeCasts.length > 0 && (
            <BossCastBar
              cast={activeCasts[0]}
              bossName={boss.name}
              position="top"
            />
          )}

          {/* Ability Timer */}
          {mechanics.length > 0 && (
            <BossAbilityTimer
              mechanics={mechanics}
              currentPhase={currentPhase}
              mechanicCooldowns={mechanicCooldowns}
              currentTime={Date.now()}
            />
          )}

          {/* Strategy Guide */}
          {showStrategyGuide && bossData && (
            <BossStrategyGuide
              bossName={boss.name}
              mechanics={mechanics}
              phases={phases}
              onClose={() => setShowStrategyGuide(false)}
            />
          )}

          {/* Heroes */}
          <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-8">
            {heroes.map((hero, index) => (
              <div key={hero.id} className="relative">
                <HeroSpriteJS
                  ref={(ref) => {
                    // Store ref if needed
                  }}
                  hero={hero}
                  facing="right"
                  scale={3.0}
                />
                <div className="text-center mt-2">
                  <div className="text-white font-bold">{hero.name}</div>
                  <div className="text-sm text-gray-300">
                    {hero.hp} / {hero.maxHp} HP
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Boss */}
          <div className="absolute bottom-20 right-20">
            <EnemySprite
              ref={(ref) => {
                // Store ref if needed
              }}
              enemy={boss}
              facing="left"
              scale={5.0}
            />
          </div>
        </div>
      )}

      {/* Boss Info */}
      {bossData && (
        <div className="mt-6 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Boss Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-400">Level</div>
              <div className="text-lg font-bold">{bossData.level}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">HP</div>
              <div className="text-lg font-bold">{bossData.hp.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Attack</div>
              <div className="text-lg font-bold">{bossData.attack}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Defense</div>
              <div className="text-lg font-bold">{bossData.defense}</div>
            </div>
          </div>

          {mechanics.length > 0 && (
            <div className="mt-4">
              <div className="text-sm text-gray-400 mb-2">Mechanics</div>
              <div className="flex flex-wrap gap-2">
                {mechanics.map((mechanic, index) => (
                  <div
                    key={index}
                    className="px-3 py-1 bg-blue-900 rounded text-sm"
                  >
                    {mechanic.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



