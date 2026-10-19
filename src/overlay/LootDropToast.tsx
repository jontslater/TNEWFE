import React from 'react';
import { wowRarityColor } from '../gear/itemDisplay';

export type LootToast = {
  id: string;
  heroId: string;
  heroName: string;
  itemName: string;
  rarity: string;
  isSetPiece?: boolean;
};

const MAX_TOASTS = 3;

export function LootDropToastStack({
  toasts,
}: {
  toasts: LootToast[];
}) {
  const visible = toasts.slice(-MAX_TOASTS);
  return (
    <div
      className="pointer-events-none fixed left-4 bottom-24 z-[9998] flex flex-col gap-1"
      aria-live="polite"
    >
      {visible.map((t) => (
        <div
          key={t.id}
          className="text-xs font-semibold px-2 py-1 rounded shadow-lg bg-black/75 border border-gray-700 animate-pulse"
          style={{
            color: wowRarityColor(t.rarity),
            borderColor: wowRarityColor(t.rarity),
          }}
        >
          {t.isSetPiece ? '◆ ' : ''}
          {t.heroName}: {t.itemName}
        </div>
      ))}
    </div>
  );
}

export function pushLootToast(
  list: LootToast[],
  entry: Omit<LootToast, 'id'>
): LootToast[] {
  const next = [...list, { ...entry, id: `loot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }];
  return next.slice(-MAX_TOASTS);
}
