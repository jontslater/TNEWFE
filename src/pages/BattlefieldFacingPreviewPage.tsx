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
  { id: 'demo-chronomancer', role: 'chronomancer', label: 'Chronomancer' },
  { id: 'demo-stormwarrior', role: 'stormwarrior', label: 'Stormwarrior' },
  { id: 'demo-mage', role: 'mage', label: 'Mage' },
  { id: 'demo-hunter', role: 'hunter', label: 'Hunter' },
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
    id: 'demo-kobold',
    enemyType: 'Kobold Warrior',
    enemyName: 'Kobold Warrior',
    label: 'Kobold',
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
      className="clean-battlefield-page"
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
          left: '50%',
          right: 48,
          bottom: 72,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          gap: 32,
          paddingLeft: 24,
          borderBottom: '2px solid rgba(239,68,68,0.35)',
          minHeight: 220,
        }}
      >
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
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
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
              <span style={{ color: '#e2e8f0', fontSize: 13, textAlign: 'center' }}>
                {e.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
