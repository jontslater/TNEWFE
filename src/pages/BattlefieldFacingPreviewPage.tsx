/**
 * Visual QA: heroes on the left facing right, enemies on the right facing left.
 * Uses the same sprite components, scaling, and positioning helpers as CleanBattlefieldSource.
 */
import HeroSpriteJS from '../components/HeroSpriteJS';
import EnemySpriteJS from '../components/EnemySpriteJS';
import { getBattlefieldEnemyPosition } from '../utils/battlefieldEnemyPosition';
import { getBattlefieldSpriteScale } from '../utils/spriteDisplayScale';
import {
  BATTLEFIELD_ENEMY_FACING,
  BATTLEFIELD_HERO_FACING,
} from '../utils/spriteFacing';

const DEMO_HEROES = [
  { id: 'demo-guardian', role: 'guardian', label: 'Guardian' },
  { id: 'demo-chronomancer', role: 'chronomancer', label: 'Chronomancer' },
  { id: 'demo-stormwarrior', role: 'stormwarrior', label: 'Stormwarrior' },
  { id: 'demo-mage', role: 'mage', label: 'Mage' },
  { id: 'demo-hunter', role: 'hunter', label: 'Hunter' },
  { id: 'demo-monk', role: 'monk', label: 'Monk' },
] as const;

const DEMO_MOBS = [
  {
    id: 'demo-imp',
    enemyType: 'Imp',
    enemyName: 'Imp',
    label: 'Imp',
  },
  {
    id: 'demo-kobold',
    enemyType: 'Kobold Warrior',
    enemyName: 'Kobold Warrior',
    label: 'Kobold',
  },
] as const;

const DEMO_DRAGON_WHELP = {
  id: 'demo-dragon1',
  enemyType: 'Dragon_1',
  enemyName: 'Dragon Whelp',
  label: 'Dragon Whelp',
} as const;

const DEMO_ELDER = {
  id: 'demo-elder',
  enemyType: 'Elder Dragon',
  enemyName: 'Elder Dragon',
  label: 'Elder Dragon',
} as const;

export default function BattlefieldFacingPreviewPage() {
  const whelpPos = getBattlefieldEnemyPosition(0, 1, false, DEMO_DRAGON_WHELP.enemyType, 'idle');
  const elderPos = getBattlefieldEnemyPosition(0, 1, true, DEMO_ELDER.enemyType, 'idle');
  const whelpScale = getBattlefieldSpriteScale({
    enemyType: DEMO_DRAGON_WHELP.enemyType,
    enemyName: DEMO_DRAGON_WHELP.enemyName,
  });
  const elderScale = getBattlefieldSpriteScale({
    enemyType: DEMO_ELDER.enemyType,
    enemyName: DEMO_ELDER.enemyName,
    isBoss: true,
  });

  return (
    <div
      id="battlefield-facing-preview"
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
          fontSize: 26,
          fontWeight: 'bold',
          textAlign: 'center',
        }}
      >
        Battlefield facing — heroes → right · enemies → left
      </div>

      <div
        style={{
          position: 'absolute',
          left: 48,
          right: '50%',
          bottom: 72,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'flex-start',
          gap: 28,
          paddingRight: 24,
          borderBottom: '2px solid rgba(59,130,246,0.35)',
          minHeight: 220,
        }}
      >
        {DEMO_HEROES.map((h) => (
          <div
            key={h.id}
            data-hero-id={h.id}
            data-side="hero"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <HeroSpriteJS
              heroId={h.id}
              role={h.role}
              facing={BATTLEFIELD_HERO_FACING}
              scale={2.5}
            />
            <span style={{ color: '#e2e8f0', fontSize: 13, textAlign: 'center' }}>
              {h.label}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          right: 120,
          bottom: 72,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 40,
          borderBottom: '2px solid rgba(239,68,68,0.35)',
          minHeight: 120,
          paddingBottom: 8,
        }}
      >
        {DEMO_MOBS.map((e) => (
          <div
            key={e.id}
            data-side="enemy"
            data-enemy-id={e.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <EnemySpriteJS
              enemyId={e.id}
              enemyType={e.enemyType}
              enemyName={e.enemyName}
              facing={BATTLEFIELD_ENEMY_FACING}
              scale={getBattlefieldSpriteScale({
                enemyType: e.enemyType,
                enemyName: e.enemyName,
              })}
            />
            <span style={{ color: '#e2e8f0', fontSize: 13 }}>{e.label}</span>
          </div>
        ))}
      </div>

      <div
        data-side="enemy"
        data-enemy-id={DEMO_DRAGON_WHELP.id}
        style={{
          position: 'absolute',
          ...whelpPos,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 20,
        }}
      >
        <EnemySpriteJS
          enemyId={DEMO_DRAGON_WHELP.id}
          enemyType={DEMO_DRAGON_WHELP.enemyType}
          enemyName={DEMO_DRAGON_WHELP.enemyName}
          facing={BATTLEFIELD_ENEMY_FACING}
          scale={whelpScale}
        />
        <span style={{ color: '#e2e8f0', fontSize: 13, marginTop: 8 }}>
          {DEMO_DRAGON_WHELP.label}
        </span>
      </div>

      <div
        data-side="enemy"
        data-enemy-id={DEMO_ELDER.id}
        style={{
          position: 'absolute',
          ...elderPos,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        <div style={{ width: 1200, display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
          <EnemySpriteJS
            enemyId={DEMO_ELDER.id}
            enemyType={DEMO_ELDER.enemyType}
            enemyName={DEMO_ELDER.enemyName}
            facing={BATTLEFIELD_ENEMY_FACING}
            scale={elderScale}
          />
        </div>
        <span style={{ color: '#fbbf24', fontSize: 14, marginTop: 8 }}>
          {DEMO_ELDER.label}
        </span>
      </div>
    </div>
  );
}
