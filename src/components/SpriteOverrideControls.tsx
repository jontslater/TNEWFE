import type { CSSProperties } from 'react';
import type { SpriteRuntimeOverride } from '../utils/spriteRuntimeOverrides';

const controlLabel: CSSProperties = {
  fontSize: 9,
  color: '#cbd5e1',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  width: '100%',
};

const inputStyle: CSSProperties = {
  width: '100%',
  fontSize: 10,
  padding: '2px 4px',
  borderRadius: 4,
  border: '1px solid #475569',
  background: '#0f172a',
  color: '#e2e8f0',
};

type Props = {
  id: string;
  entry?: SpriteRuntimeOverride;
  disabled?: boolean;
  onChange: (next: SpriteRuntimeOverride | undefined) => void;
  layout?: 'stack';
};

export function SpriteOverrideControls({
  id,
  entry,
  disabled,
  onChange,
  layout,
}: Props) {
  const flip = entry?.flip === true;
  const scale = entry?.scaleMultiplier ?? 1;
  const offsetY = entry?.offsetY ?? 0;

  const patch = (partial: Partial<SpriteRuntimeOverride>) => {
    const merged: SpriteRuntimeOverride = { ...(entry || {}) };
    if (partial.flip === true) merged.flip = true;
    if (partial.flip === false) delete merged.flip;
    if (partial.scaleMultiplier !== undefined) {
      if (partial.scaleMultiplier === 1) delete merged.scaleMultiplier;
      else merged.scaleMultiplier = partial.scaleMultiplier;
    }
    if (partial.offsetY !== undefined) {
      if (partial.offsetY === 0) delete merged.offsetY;
      else merged.offsetY = partial.offsetY;
    }
    const hasKeys = Object.keys(merged).length > 0;
    onChange(hasKeys ? merged : undefined);
  };

  const wrapperClass = layout === 'stack' ? 'bfe-controls' : undefined;

  return (
    <div
      className={wrapperClass}
      style={layout === 'stack' ? undefined : { width: '100%', marginTop: 4 }}
      data-override-controls={id}
    >
      <label style={layout === 'stack' ? undefined : controlLabel}>
        <span className={layout === 'stack' ? 'row' : undefined} style={layout === 'stack' ? undefined : { display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="checkbox"
            checked={flip}
            disabled={disabled}
            onChange={(e) => patch({ flip: e.target.checked ? true : false })}
          />
          Flip
        </span>
      </label>
      <label style={layout === 'stack' ? undefined : controlLabel}>
        Scale
        <input
          type="number"
          min={0.25}
          max={3}
          step={0.05}
          value={scale}
          disabled={disabled}
          style={layout === 'stack' ? undefined : inputStyle}
          onChange={(e) => patch({ scaleMultiplier: parseFloat(e.target.value) || 1 })}
        />
      </label>
      <label style={layout === 'stack' ? undefined : controlLabel}>
        Y nudge
        <input
          type="number"
          min={-48}
          max={48}
          step={1}
          value={offsetY}
          disabled={disabled}
          style={layout === 'stack' ? undefined : inputStyle}
          onChange={(e) => patch({ offsetY: parseInt(e.target.value, 10) || 0 })}
        />
      </label>
    </div>
  );
}
