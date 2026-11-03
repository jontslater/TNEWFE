import { useCallback, useEffect, useState } from 'react';
import HeroSpriteJS from '../components/HeroSpriteJS';
import EnemySpriteJS from '../components/EnemySpriteJS';
import { BattlefieldLayoutPreviewStrip } from '../components/BattlefieldLayoutPreviewStrip';
import { BattlefieldSpriteEditorCard } from '../components/BattlefieldSpriteEditorCard';
import {
  GALLERY_BOSS_ENEMIES,
  GALLERY_STANDARD_ENEMIES,
  PLAYABLE_HERO_CLASSES,
} from '../data/battlefieldSpriteGalleryData';
import { useAuth } from '../hooks/useAuth';
import { useSpriteRuntimeOverrides } from '../hooks/useSpriteRuntimeOverrides';
import { spriteOverridesAPI } from '../api/client';
import {
  BATTLEFIELD_ENEMY_FACING,
  BATTLEFIELD_HERO_FACING,
} from '../utils/spriteFacing';
import {
  buildExportPayload,
  type SpriteRuntimeOverride,
} from '../utils/spriteRuntimeOverrides';
import { canEditSpriteOverrides } from '../utils/spriteOverrideAdmin';
import {
  getEnemyEditorPreviewScale,
  getHeroEditorPreviewScale,
} from '../utils/editorPreviewScale';
import './BattlefieldFacingEditor.css';

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
          'Save failed — is /api/config/sprite-overrides deployed?'
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

  return (
    <div className="bfe-page">
      <header className="bfe-toolbar">
        <div>
          <h1>Battlefield sprite editor</h1>
          <p>Flip · scale · Y nudge — Save updates live overrides for all players</p>
        </div>
        <div className="bfe-toolbar-actions">
          {!isAuthenticated && <span style={{ color: '#fbbf24', fontSize: 12 }}>Log in to save</span>}
          {isAuthenticated && !canSave && (
            <span style={{ color: '#94a3b8', fontSize: 12 }}>View only</span>
          )}
          <button type="button" className="bfe-btn" onClick={handleExport}>
            Export JSON
          </button>
          <button
            type="button"
            className="bfe-btn bfe-btn--primary"
            onClick={handleSave}
            disabled={!canSave || saving}
          >
            {saving ? 'Saving…' : dirty ? 'Save*' : 'Save'}
          </button>
        </div>
      </header>

      {(status || loading) && (
        <div className="bfe-status">
          {loading ? 'Loading overrides…' : status}
          {remote.updatedBy && !loading && (
            <span style={{ marginLeft: 12, color: '#64748b' }}>Last: {remote.updatedBy}</span>
          )}
        </div>
      )}

      <main className="bfe-main">
        <section className="bfe-section" aria-labelledby="bfe-heroes-heading">
          <h2 id="bfe-heroes-heading" className="bfe-section-title">
            Heroes ({PLAYABLE_HERO_CLASSES.length})
          </h2>
          <div className="bfe-grid" id="battlefield-hero-line">
            {PLAYABLE_HERO_CLASSES.map((role) => (
              <BattlefieldSpriteEditorCard
                key={role}
                id={role}
                name={role}
                facingLabel="→"
                preview={
                  <HeroSpriteJS
                    heroId={`card-hero-${role}`}
                    role={role}
                    facing={BATTLEFIELD_HERO_FACING}
                    scale={getHeroEditorPreviewScale()}
                    freezeIdleFrame
                    runtimeOverride={localHeroes[role]}
                  />
                }
                override={localHeroes[role]}
                canEdit={canSave}
                onOverrideChange={(next) => updateHero(role, next)}
              />
            ))}
          </div>
        </section>

        <section className="bfe-section" aria-labelledby="bfe-enemies-heading">
          <h2 id="bfe-enemies-heading" className="bfe-section-title">
            Enemies ({GALLERY_STANDARD_ENEMIES.length})
          </h2>
          <div className="bfe-grid" id="battlefield-enemy-grid">
            {GALLERY_STANDARD_ENEMIES.map((e) => (
              <BattlefieldSpriteEditorCard
                key={e.enemyType}
                id={e.enemyType}
                name={e.label}
                facingLabel="←"
                preview={
                  <EnemySpriteJS
                    enemyId={`card-enemy-${e.enemyType}`}
                    enemyType={e.enemyType}
                    enemyName={e.enemyName}
                    facing={BATTLEFIELD_ENEMY_FACING}
                    scale={getEnemyEditorPreviewScale(e)}
                    freezeIdleFrame
                    forceViewportClip
                    runtimeOverride={localEnemies[e.enemyType]}
                  />
                }
                override={localEnemies[e.enemyType]}
                canEdit={canSave}
                onOverrideChange={(next) => updateEnemy(e.enemyType, next)}
              />
            ))}
          </div>
        </section>

        <section className="bfe-section" aria-labelledby="bfe-bosses-heading">
          <h2 id="bfe-bosses-heading" className="bfe-section-title">
            Bosses &amp; large ({GALLERY_BOSS_ENEMIES.length})
          </h2>
          <div className="bfe-grid bfe-grid--bosses">
            {GALLERY_BOSS_ENEMIES.map((e) => (
              <BattlefieldSpriteEditorCard
                key={e.enemyType}
                id={e.enemyType}
                name={e.label}
                facingLabel="←"
                variant="boss"
                preview={
                  <EnemySpriteJS
                    enemyId={`card-boss-${e.enemyType}`}
                    enemyType={e.enemyType}
                    enemyName={e.enemyName}
                    facing={BATTLEFIELD_ENEMY_FACING}
                    scale={getEnemyEditorPreviewScale(e)}
                    freezeIdleFrame
                    forceViewportClip
                    runtimeOverride={localEnemies[e.enemyType]}
                  />
                }
                override={localEnemies[e.enemyType]}
                canEdit={canSave}
                onOverrideChange={(next) => updateEnemy(e.enemyType, next)}
              />
            ))}
          </div>
        </section>

        <BattlefieldLayoutPreviewStrip
          heroOverrides={localHeroes}
          enemyOverrides={localEnemies}
        />
      </main>
    </div>
  );
}
