import { useLayoutEffect, useRef, useState } from 'react';
import HeroSpriteJS from './HeroSpriteJS';
import EnemySpriteJS from './EnemySpriteJS';
import { STRIP_PREVIEW_ENEMIES, STRIP_PREVIEW_HEROES } from '../data/battlefieldSpriteGalleryData';
import {
  BATTLEFIELD_ENEMY_FACING,
  BATTLEFIELD_HERO_FACING,
} from '../utils/spriteFacing';
import type { SpriteRuntimeOverride } from '../utils/spriteRuntimeOverrides';
import { getStripPreviewScale } from '../utils/editorPreviewScale';
import { SPRITE_DISPLAY_SCALE } from '../utils/spriteDisplayScale';

type Props = {
  heroOverrides: Record<string, SpriteRuntimeOverride>;
  enemyOverrides: Record<string, SpriteRuntimeOverride>;
};

export function BattlefieldLayoutPreviewStrip({ heroOverrides, enemyOverrides }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      setScale(Math.min(1, w / 1200));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <section className="bfe-strip-section" aria-labelledby="bfe-strip-heading">
      <h2 id="bfe-strip-heading" className="bfe-section-title">
        Battlefield preview
      </h2>
      <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.75rem' }}>
        Sample lineup on a shared baseline — heroes face →, enemies face ←
      </p>
      <div className="bfe-strip-wrap" ref={wrapRef}>
        <div
          className="bfe-strip-scaler"
          style={{ height: `${280 * scale}px` }}
        >
          <div
            id="battlefield-layout-preview-strip"
            className="bfe-strip-inner"
            style={{
              transform: `translateX(-50%) scale(${scale})`,
              transformOrigin: 'top center',
              left: '50%',
            }}
          >
            <div className="bfe-strip-label">Heroes · Enemies</div>
            <div className="bfe-strip-heroes">
              {STRIP_PREVIEW_HEROES.map((role) => (
                <div key={role} className="bfe-strip-unit" data-side="hero">
                  <HeroSpriteJS
                    heroId={`strip-${role}`}
                    role={role}
                    facing={BATTLEFIELD_HERO_FACING}
                    scale={SPRITE_DISPLAY_SCALE}
                    freezeIdleFrame
                    runtimeOverride={heroOverrides[role]}
                  />
                  <span>{role}</span>
                </div>
              ))}
            </div>
            <div className="bfe-strip-enemies">
              {STRIP_PREVIEW_ENEMIES.map((e) => (
                <div key={e.enemyType} className="bfe-strip-unit" data-side="enemy">
                  <EnemySpriteJS
                    enemyId={`strip-${e.enemyType}`}
                    enemyType={e.enemyType}
                    enemyName={e.enemyName}
                    facing={BATTLEFIELD_ENEMY_FACING}
                    scale={getStripPreviewScale(e)}
                    freezeIdleFrame
                    forceViewportClip
                    runtimeOverride={enemyOverrides[e.enemyType]}
                  />
                  <span>{e.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
