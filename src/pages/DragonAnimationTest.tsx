/**
 * Four-dragon showcase: 3 raid wave dragons (flight-capable) + Elder Dragon boss.
 * Used for visual QA of slicing and battlefield scale tiers.
 */

import React, { useEffect, useRef } from 'react';
import EnemySpriteJS, { EnemySpriteJSHandle } from '../components/EnemySpriteJS';
import { getBattlefieldSpriteScale } from '../utils/spriteDisplayScale';
import { BATTLEFIELD_ENEMY_FACING } from '../utils/spriteFacing';

const DRAGONS: {
  id: string;
  label: string;
  enemyType: string;
  enemyName: string;
  defaultAnim: string;
  flightAnim?: string;
}[] = [
  {
    id: 'whelp',
    label: 'Dragon Whelp',
    enemyType: 'Dragon_1',
    enemyName: 'Dragon Whelp',
    defaultAnim: 'idle',
    flightAnim: 'flight',
  },
  {
    id: 'guardian',
    label: 'Dragon Guardian',
    enemyType: 'Dragon_2',
    enemyName: 'Dragon Guardian',
    defaultAnim: 'idle',
    flightAnim: 'flight',
  },
  {
    id: 'sentinel',
    label: 'Dragon Sentinel',
    enemyType: 'Dragon_3',
    enemyName: 'Dragon Sentinel',
    defaultAnim: 'idle',
    flightAnim: 'flight',
  },
  {
    id: 'elder',
    label: 'Elder Dragon (Raid Boss)',
    enemyType: 'Elder Dragon',
    enemyName: 'Elder Dragon',
    defaultAnim: 'idleBattle',
  },
];

export default function DragonAnimationTest() {
  const refs = useRef<Record<string, EnemySpriteJSHandle | null>>({});

  useEffect(() => {
    const t = window.setTimeout(() => {
      DRAGONS.forEach((d) => {
        const ref = refs.current[d.id];
        if (!ref) return;
        ref.playAnimation(d.flightAnim ?? d.defaultAnim);
      });
    }, 400);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        width: '1920px',
        height: '1080px',
        backgroundColor: '#1a1a2e',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          fontSize: 28,
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        }}
      >
        Dragon roster — flight (wave) + idleBattle (Elder boss)
      </div>

      <div
        style={{
          position: 'absolute',
          top: 120,
          left: 0,
          right: 0,
          bottom: 40,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'flex-end',
          padding: '0 40px',
        }}
      >
        {DRAGONS.map((d) => {
          const scale = getBattlefieldSpriteScale({
            enemyType: d.enemyType,
            enemyName: d.enemyName,
            isBoss: d.enemyType === 'Elder Dragon',
          });
          return (
            <div
              key={d.id}
              data-dragon-id={d.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                overflow: 'visible',
                minWidth: d.enemyType === 'Elder Dragon' ? 520 : 320,
                flex: 1,
                maxHeight: '100%',
                paddingBottom: 8,
              }}
            >
              <div
                style={{
                  color: '#fbbf24',
                  fontSize: 18,
                  fontWeight: 'bold',
                  marginBottom: 8,
                  textAlign: 'center',
                }}
              >
                {d.label}
                <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 'normal' }}>
                  {d.enemyType} · scale {scale}× · viewport{' '}
                  {d.enemyType === 'Elder Dragon' ? 48 : 96}px
                </div>
              </div>
              <div style={{ overflow: 'visible', lineHeight: 0 }}>
                <EnemySpriteJS
                  ref={(el) => {
                    refs.current[d.id] = el;
                  }}
                  enemyId={`dragon-test-${d.id}`}
                  enemyType={d.enemyType}
                  enemyName={d.enemyName}
                  facing={BATTLEFIELD_ENEMY_FACING}
                  scale={scale}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
