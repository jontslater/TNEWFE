import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import HeroSpriteJS from '../components/HeroSpriteJS';
import EnemySpriteJS from '../components/EnemySpriteJS';
import { SpriteOverrideControls } from '../components/SpriteOverrideControls';
import {
  BATTLEFIELD_GALLERY_ENEMIES,
  PLAYABLE_HERO_CLASSES,
} from '../data/battlefieldSpriteGalleryData';
import { useAuth } from '../hooks/useAuth';
import { useSpriteRuntimeOverrides } from '../hooks/useSpriteRuntimeOverrides';
import { spriteOverridesAPI } from '../api/client';
import { getBattlefieldEnemyPosition } from '../utils/battlefieldEnemyPosition';
import {
  getBattlefieldSpriteScale,
  SPRITE_DISPLAY_SCALE,
} from '../utils/spriteDisplayScale';
import { canEditSpriteOverrides } from '../utils/spriteOverrideAdmin';
import {
  BATTLEFIELD_ENEMY_FACING,
  BATTLEFIELD_HERO_FACING,
} from '../utils/spriteFacing';
import {
  buildExportPayload,
  type SpriteRuntimeOverride,
} from '../utils/spriteRuntimeOverrides';

export default function BattlefieldFacingPreviewPage() {
  const { user, isAuthenticated } = useAuth();
  const canSave = canEditSpriteOverrides(user);
  const { overrides: remote, loading, reload } = useSpriteRuntimeOverrides();

  const [localHeroes, setLocalHeroes] = useState<Record<string, SpriteRuntimeOverride>>({});
  const [localEnemies, setLocalEnemies] = useState<Record<string, SpriteRuntimeOverride>>({});
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading || dirty) return;
    setLocalHeroes(remote.heroes || {});
    setLocalEnemies(remote.enemies || {});
  }, [loading, dirty, remote.heroes, remote.enemies, remote.updatedAt]);

  const payload = buildExportPayload(localHeroes, localEnemies);

  const updateHero = useCallback((role: string, next: SpriteRuntimeOverride | undefined) => {
    setLocalHeroes((prev) => {
      const copy = { ...prev };
      if (next) copy[role] = next;
      else delete copy[role];
      return copy;
    });
    setDirty(true);
  }, []);

  const updateEnemy = useCallback((key: string, next: SpriteRuntimeOverride | undefined) => {
    setLocalEnemies((prev) => {
      const copy = { ...prev };
      if (next) copy[key] = next;
      else delete copy[key];
      return copy;
    });
    setDirty(true);
  }, []);

  const handleSave = async () => {
    if (!canSave) {
      setStatus('Sign in as theneverendingwar or tehchno to save.');
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      await spriteOverridesAPI.save(payload);
      setDirty(false);
      setStatus('Saved to Firestore config/spriteOverrides.');
      await reload();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; error?: string } } };
      setStatus(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Save failed — deploy backend PR with /api/config/sprite-overrides first.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    const json = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setStatus('Copied override JSON to clipboard.');
    } catch {
      window.prompt('Copy sprite override JSON:', json);
    }
  };

  const elderEntry = BATTLEFIELD_GALLERY_ENEMIES.find(
    (e) => e.enemyType === 'Elder Dragon'
  )!;
  const elderPos = getBattlefieldEnemyPosition(0, 1, true, elderEntry.enemyType, 'idle');
  const elderScale = getBattlefieldSpriteScale({
    enemyType: elderEntry.enemyType,
    enemyName: elderEntry.enemyName,
    isBoss: true,
  });
  const standardEnemies = BATTLEFIELD_GALLERY_ENEMIES.filter(
    (e) => e.enemyType !== 'Elder Dragon'
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', overflow: 'auto', paddingBottom: 48 }}>
      <div style={toolbarWrap}>
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: 20, fontWeight: 700, margin: 0 }}>
            Battlefield sprite editor
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 12, margin: '4px 0 0' }}>
            `/battlefield-facing` · Flip / scale / Y nudge · Save → Firestore `config/spriteOverrides`
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {!isAuthenticated && <span style={{ color: '#fbbf24', fontSize: 12 }}>Log in to save</span>}
          {isAuthenticated && !canSave && (
            <span style={{ color: '#94a3b8', fontSize: 12 }}>View only</span>
          )}
          <button type="button" onClick={handleExport} style={toolbarBtn}>
            Export JSON
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            style={{ ...toolbarBtn, background: canSave ? '#2563eb' : '#475569' }}
          >
            {saving ? 'Saving…' : dirty ? 'Save*' : 'Save'}
          </button>
        </div>
      </div>

      {(status || loading) && (
        <div style={{ padding: '8px 24px', color: '#cbd5e1', fontSize: 12 }}>
          {loading ? 'Loading overrides…' : status}
          {remote.updatedBy && !loading && (
            <span style={{ marginLeft: 12, color: '#64748b' }}>Last: {remote.updatedBy}</span>
          )}
        </div>
      )}

      <div
        id="battlefield-facing-preview"
        style={{
          width: '1920px',
          maxWidth: '100%',
          height: '1080px',
          backgroundColor: '#1a1a2e',
          position: 'relative',
          overflow: 'hidden',
          margin: '0 auto',
        }}
      >
        <div id="battlefield-hero-line" style={heroLineStyle}>
          {PLAYABLE_HERO_CLASSES.map((role) => (
            <div key={role} data-class={role} data-side="hero" style={cellStyle}>
              <HeroSpriteJS
                heroId={`gallery-${role}`}
                role={role}
                facing={BATTLEFIELD_HERO_FACING}
                scale={SPRITE_DISPLAY_SCALE}
                freezeIdleFrame
                runtimeOverride={localHeroes[role]}
              />
              <span style={labelStyle}>{role}</span>
              <SpriteOverrideControls
                id={role}
                entry={localHeroes[role]}
                disabled={!canSave}
                onChange={(next) => updateHero(role, next)}
              />
            </div>
          ))}
        </div>

        <div id="battlefield-enemy-grid" style={enemyGridStyle}>
          {standardEnemies.map((e) => (
            <div key={e.enemyType} data-side="enemy" style={{ ...cellStyle, width: 100 }}>
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
                runtimeOverride={localEnemies[e.enemyType]}
              />
              <span style={labelStyle}>{e.label}</span>
              <SpriteOverrideControls
                id={e.enemyType}
                entry={localEnemies[e.enemyType]}
                disabled={!canSave}
                onChange={(next) => updateEnemy(e.enemyType, next)}
              />
            </div>
          ))}
        </div>

        <div style={{ position: 'absolute', ...elderPos, ...elderWrap }}>
          <EnemySpriteJS
            enemyId="gallery-elder-dragon"
            enemyType={elderEntry.enemyType}
            enemyName={elderEntry.enemyName}
            facing={BATTLEFIELD_ENEMY_FACING}
            scale={elderScale}
            runtimeOverride={localEnemies[elderEntry.enemyType]}
          />
          <span style={{ color: '#fbbf24', fontSize: 11 }}>{elderEntry.label}</span>
          <SpriteOverrideControls
            id={elderEntry.enemyType}
            entry={localEnemies[elderEntry.enemyType]}
            disabled={!canSave}
            onChange={(next) => updateEnemy(elderEntry.enemyType, next)}
          />
        </div>
      </div>
    </div>
  );
}

const toolbarWrap: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 50,
  background: 'rgba(15, 23, 42, 0.95)',
  borderBottom: '1px solid #334155',
  padding: '12px 24px',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  alignItems: 'center',
  justifyContent: 'space-between',
};

const toolbarBtn: CSSProperties = {
  padding: '8px 14px',
  fontSize: 13,
  fontWeight: 600,
  borderRadius: 6,
  border: '1px solid #475569',
  background: '#334155',
  color: '#f8fafc',
  cursor: 'pointer',
};

const heroLineStyle: CSSProperties = {
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
  gap: '8px 12px',
  paddingRight: 16,
  borderBottom: '2px solid rgba(59,130,246,0.45)',
  minHeight: 200,
  maxHeight: 480,
  overflow: 'auto',
};

const enemyGridStyle: CSSProperties = {
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
  gap: '12px 16px',
  borderBottom: '2px solid rgba(239,68,68,0.45)',
  minHeight: 200,
  maxHeight: 480,
  overflow: 'auto',
  paddingBottom: 8,
};

const cellStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
  width: 88,
  paddingBottom: 4,
};

const labelStyle: CSSProperties = {
  color: '#94a3b8',
  fontSize: 9,
  textAlign: 'center',
};

const elderWrap: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  zIndex: 10,
  width: 320,
};
