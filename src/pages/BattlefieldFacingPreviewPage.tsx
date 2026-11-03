/**
 * Visual QA: heroes on the left facing right, enemies on the right facing left.
 * Uses the same sprite components and facing helpers as CleanBattlefieldSource.
 */
import HeroSpriteJS from '../components/HeroSpriteJS';
import EnemySpriteJS from '../components/EnemySpriteJS';
import { getBattlefieldSpriteScale } from '../utils/spriteDisplayScale';
import {
  BATTLEFIELD_ENEMY_FACING,
  BATTLEFIELD_HERO_FACING,
} from '../utils/spriteFacing';

const DEMO_HEROES = [
  { id: 'demo-guardian', role: 'guardian', label: 'Guardian' },
  { id: 'demo-mage', role: 'mage', label: 'Mage (LuizMelo)' },
  { id: 'demo-monk', role: 'monk', label: 'Monk' },
] as const;

const DEMO_ENEMIES = [
  {
    id: 'demo-imp',
    enemyType: 'Imp',
    enemyName: 'Imp',
    label: 'Imp',
  },
  {
    id: 'demo-dragon1',
    enemyType: 'Dragon_1',
    enemyName: 'Dragon Whelp',
    label: 'Dragon Whelp',
  },
  {
    id: 'demo-elder',
    enemyType: 'Elder Dragon',
    enemyName: 'Elder Dragon',
    label: 'Elder Dragon',
    isBoss: true,
  },
] as const;

export default function BattlefieldFacingPreviewPage() {
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
          left: 80,
          top: 120,
          bottom: 80,
          width: '42%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 48,
          borderRight: '1px dashed rgba(148,163,184,0.35)',
          paddingRight: 40,
        }}
      >
        <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 8 }}>Heroes (left)</div>
        {DEMO_HEROES.map((h) => (
          <div
            key={h.id}
            data-side="hero"
            style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}
          >
            <HeroSpriteJS
              heroId={h.id}
              role={h.role}
              facing={BATTLEFIELD_HERO_FACING}
              scale={2.5}
            />
            <span style={{ color: '#e2e8f0', fontSize: 18 }}>{h.label}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          right: 80,
          top: 120,
          bottom: 80,
          width: '42%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'flex-end',
          gap: 48,
          paddingLeft: 40,
        }}
      >
        <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 8, alignSelf: 'flex-end' }}>
          Enemies (right)
        </div>
        {DEMO_ENEMIES.map((e) => {
          const isBoss = 'isBoss' in e && Boolean(e.isBoss);
          const scale = getBattlefieldSpriteScale({
            enemyType: e.enemyType,
            enemyName: e.enemyName,
            isBoss,
          });
          return (
            <div
              key={e.id}
              data-side="enemy"
              style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexDirection: 'row-reverse' }}
            >
              <div style={{ overflow: 'visible', minWidth: isBoss ? 720 : undefined }}>
                <EnemySpriteJS
                  enemyId={e.id}
                  enemyType={e.enemyType}
                  enemyName={e.enemyName}
                  facing={BATTLEFIELD_ENEMY_FACING}
                  scale={scale}
                />
              </div>
              <span style={{ color: '#e2e8f0', fontSize: 18 }}>{e.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
