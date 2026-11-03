import HeroSpriteJS from '../components/HeroSpriteJS';
import EnemySpriteJS from '../components/EnemySpriteJS';
import {
  BATTLEFIELD_GALLERY_ENEMIES,
  PLAYABLE_HERO_CLASSES,
} from '../data/battlefieldSpriteGalleryData';
import { getBattlefieldEnemyPosition } from '../utils/battlefieldEnemyPosition';
import {
  getBattlefieldSpriteScale,
  SPRITE_DISPLAY_SCALE,
} from '../utils/spriteDisplayScale';
import {
  BATTLEFIELD_ENEMY_FACING,
  BATTLEFIELD_HERO_FACING,
} from '../utils/spriteFacing';

/**
 * Visual QA on the real battlefield layout: all hero classes (left, facing right)
 * and all enemy types (right, facing left), shared ground line via feet anchoring.
 */
export default function BattlefieldFacingPreviewPage() {
  const elderEntry = BATTLEFIELD_GALLERY_ENEMIES.find(
    (e) => e.enemyType === 'Elder Dragon'
  )!;
  const elderPos = getBattlefieldEnemyPosition(
    0,
    1,
    true,
    elderEntry.enemyType,
    'idle'
  );
  const elderScale = getBattlefieldSpriteScale({
    enemyType: elderEntry.enemyType,
    enemyName: elderEntry.enemyName,
    isBoss: true,
  });

  const standardEnemies = BATTLEFIELD_GALLERY_ENEMIES.filter(
    (e) => e.enemyType !== 'Elder Dragon'
  );

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
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          fontSize: 22,
          fontWeight: 'bold',
          textAlign: 'center',
        }}
      >
        Battlefield sprite gallery — heroes → right · enemies → left · shared baseline
      </div>

      <div
        id="battlefield-hero-line"
        style={{
          position: 'absolute',
          left: 32,
          right: '42%',
          bottom: 72,
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          alignContent: 'flex-end',
          justifyContent: 'flex-start',
          gap: '12px 16px',
          paddingRight: 16,
          borderBottom: '2px solid rgba(59,130,246,0.45)',
          minHeight: 200,
          maxHeight: 420,
          overflow: 'hidden',
        }}
      >
        {PLAYABLE_HERO_CLASSES.map((role) => (
          <div
            key={role}
            data-hero-id={`gallery-${role}`}
            data-side="hero"
            data-class={role}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              width: 72,
            }}
          >
            <HeroSpriteJS
              heroId={`gallery-${role}`}
              role={role}
              facing={BATTLEFIELD_HERO_FACING}
              scale={SPRITE_DISPLAY_SCALE}
              freezeIdleFrame
            />
            <span
              style={{
                color: '#94a3b8',
                fontSize: 9,
                textAlign: 'center',
                lineHeight: 1.1,
              }}
            >
              {role}
            </span>
          </div>
        ))}
      </div>

      <div
        id="battlefield-enemy-grid"
        style={{
          position: 'absolute',
          left: '58%',
          right: 24,
          bottom: 72,
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          alignContent: 'flex-end',
          justifyContent: 'flex-start',
          gap: '16px 20px',
          borderBottom: '2px solid rgba(239,68,68,0.45)',
          minHeight: 200,
          maxHeight: 420,
          overflow: 'auto',
          paddingBottom: 8,
        }}
      >
        {standardEnemies.map((e) => (
          <div
            key={e.enemyType}
            data-side="enemy"
            data-enemy-id={`gallery-${e.enemyType}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <EnemySpriteJS
              enemyId={`gallery-${e.enemyType}`}
              enemyType={e.enemyType}
              enemyName={e.enemyName}
              facing={BATTLEFIELD_ENEMY_FACING}
              scale={getBattlefieldSpriteScale({
                isBoss: e.isBoss,
                enemyType: e.enemyType,
                enemyName: e.enemyName,
              })}
            />
            <span style={{ color: '#94a3b8', fontSize: 9, textAlign: 'center' }}>
              {e.label}
            </span>
          </div>
        ))}
      </div>

      <div
        data-side="enemy"
        data-enemy-id="gallery-elder-dragon"
        style={{
          position: 'absolute',
          ...elderPos,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: 900,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
          }}
        >
          <EnemySpriteJS
            enemyId="gallery-elder-dragon"
            enemyType={elderEntry.enemyType}
            enemyName={elderEntry.enemyName}
            facing={BATTLEFIELD_ENEMY_FACING}
            scale={elderScale}
          />
        </div>
        <span style={{ color: '#fbbf24', fontSize: 11, marginTop: 4 }}>
          {elderEntry.label}
        </span>
      </div>
    </div>
  );
}
