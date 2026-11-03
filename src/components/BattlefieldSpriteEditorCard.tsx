import type { ReactNode } from 'react';
import type { SpriteRuntimeOverride } from '../utils/spriteRuntimeOverrides';
import { SpriteOverrideControls } from './SpriteOverrideControls';

type Props = {
  id: string;
  name: string;
  facingLabel: string;
  variant?: 'standard' | 'boss';
  preview: ReactNode;
  override?: SpriteRuntimeOverride;
  canEdit: boolean;
  onOverrideChange: (next: SpriteRuntimeOverride | undefined) => void;
};

export function BattlefieldSpriteEditorCard({
  id,
  name,
  facingLabel,
  variant = 'standard',
  preview,
  override,
  canEdit,
  onOverrideChange,
}: Props) {
  return (
    <article className="bfe-card" data-sprite-card={id}>
      <div
        className={
          variant === 'boss' ? 'bfe-card__preview bfe-card__preview--boss' : 'bfe-card__preview'
        }
      >
        <span className="bfe-card__facing" aria-hidden title="Battlefield facing">
          {facingLabel}
        </span>
        <div className="bfe-card__ground" aria-hidden />
        <div className="bfe-card__stage">
          <div className="bfe-card__stage-inner">{preview}</div>
        </div>
      </div>
      <div className="bfe-card__body">
        <h3 className="bfe-card__name">{name}</h3>
        <SpriteOverrideControls
          id={id}
          entry={override}
          disabled={!canEdit}
          onChange={onOverrideChange}
          layout="stack"
        />
      </div>
    </article>
  );
}
