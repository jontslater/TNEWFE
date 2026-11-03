/**
 * Static raid-layout QA: four dragons positioned with the same rules as /clean-battlefield raid mode.
 */

import React, { useEffect, useRef } from 'react';
import EnemySpriteJS, { EnemySpriteJSHandle } from '../components/EnemySpriteJS';
import { getBattlefieldEnemyPosition } from '../utils/battlefieldEnemyPosition';
import { getBattlefieldSpriteScale } from '../utils/spriteDisplayScale';

const RAID_ENEMIES = [
  {
    id: 'whelp',
    name: 'Dragon Whelp',
    enemyType: 'Dragon_1',
    level: 40,
    isBoss: false,
    anim: 'flight',
  },
  {
    id: 'guardian',
    name: 'Dragon Guardian',
    enemyType: 'Dragon_2',
    level: 42,
    isBoss: false,
    anim: 'flight',
  },
  {
    id: 'sentinel',
    name: 'Dragon Sentinel',
    enemyType: 'Dragon_3',
    level: 44,
    isBoss: false,
    anim: 'flight',
  },
  {
    id: 'elder',
    name: 'Elder Dragon',
    enemyType: 'Elder Dragon',
    level: 50,
    isBoss: true,
    anim: 'idleBattle',
  },
] as const;

export default function DragonRaidBattlefieldPreview() {
  const refs = useRef<Record<string, EnemySpriteJSHandle | null>>({});

  useEffect(() => {
    const t = window.setTimeout(() => {
      RAID_ENEMIES.forEach((e) => {
        refs.current[e.id]?.playAnimation(e.anim);
      });
    }, 400);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      className="clean-battlefield-page"
      style={{
        width: '1920px',
        height: '1080px',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 45%, #14532d 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 24,
          color: '#e2e8f0',
          fontSize: 22,
          fontWeight: 700,
          textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
        }}
      >
        Raid layout preview — shared positioning with /clean-battlefield
      </div>

      {RAID_ENEMIES.filter((e) => !e.isBoss).map((enemy, index, wave) => {
        const position = getBattlefieldEnemyPosition(
          index,
          wave.length,
          false,
          enemy.enemyType,
          'raid'
        );
        const scale = getBattlefieldSpriteScale({
          enemyType: enemy.enemyType,
          enemyName: enemy.name,
        });

        return (
          <div
            key={enemy.id}
            data-enemy-id={enemy.id}
            style={{
              position: 'absolute',
              ...position,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                color: '#ef4444',
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '6px',
                textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
                transform: 'translateY(-48px)',
                position: 'relative',
                zIndex: 100,
              }}
            >
              {enemy.name} (Lv{enemy.level})
            </div>

            <div style={{ overflow: 'visible' }}>
              <EnemySpriteJS
                ref={(el) => {
                  refs.current[enemy.id] = el;
                }}
                enemyId={`raid-preview-${enemy.id}`}
                enemyType={enemy.enemyType}
                enemyName={enemy.name}
                facing="left"
                scale={scale}
              />
            </div>
          </div>
        );
      })}

      {RAID_ENEMIES.filter((e) => e.isBoss).map((enemy) => {
        const position = getBattlefieldEnemyPosition(0, 1, true, enemy.enemyType, 'raid');
        const scale = getBattlefieldSpriteScale({
          enemyType: enemy.enemyType,
          enemyName: enemy.name,
          isBoss: true,
        });

        return (
          <div
            key={enemy.id}
            data-enemy-id={enemy.id}
            style={{
              position: 'absolute',
              ...position,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ overflow: 'visible' }}>
              <EnemySpriteJS
                ref={(el) => {
                  refs.current[enemy.id] = el;
                }}
                enemyId={`raid-preview-${enemy.id}`}
                enemyType={enemy.enemyType}
                enemyName={enemy.name}
                facing="left"
                scale={scale}
              />
            </div>

            <div
              style={{
                marginTop: 8,
                color: '#fbbf24',
                fontSize: 20,
                fontWeight: 'bold',
                textShadow: '2px 2px 6px rgba(0,0,0,0.9)',
              }}
            >
              {enemy.name} — Raid Boss
            </div>
          </div>
        );
      })}
    </div>
  );
}
