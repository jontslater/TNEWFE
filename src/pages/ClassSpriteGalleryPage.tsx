import HeroSpriteJS from '../components/HeroSpriteJS';
import { BATTLEFIELD_HERO_FACING } from '../utils/spriteFacing';

import { PLAYABLE_HERO_CLASSES } from '../data/battlefieldSpriteGalleryData';

export default function ClassSpriteGalleryPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-2">Hero class sprites</h1>
      <p className="text-slate-400 mb-8 max-w-3xl">
        Idle animation preview for every playable class (LuizMelo CC0 packs mixed with existing hero art).
      </p>
      <div
        id="class-sprite-gallery"
        className="grid gap-6"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        }}
      >
        {PLAYABLE_HERO_CLASSES.map((role) => (
          <div
            key={role}
            className="flex flex-col items-center rounded-lg border border-slate-700 bg-slate-900/80 p-4"
            data-class={role}
          >
            <div className="mb-3 flex h-[120px] w-[120px] items-end justify-center rounded bg-slate-800/80">
              <HeroSpriteJS
                heroId={`gallery-${role}`}
                role={role}
                scale={2.5}
                facing={BATTLEFIELD_HERO_FACING}
                freezeIdleFrame
              />
            </div>
            <span className="text-sm font-medium capitalize text-slate-200">{role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
