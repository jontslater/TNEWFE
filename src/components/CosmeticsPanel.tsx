import { useCallback, useEffect, useMemo, useState } from 'react';
import { cosmeticsAPI } from '../api/client';
import type { Hero } from '../types/Hero';
import { getCosmeticRender } from '../cosmetics/renderCatalog';

const WARDROBE_SLOTS = [
  'skin',
  'nameColor',
  'frame',
  'title',
  'badge',
  'chargeBar',
  'killFx',
  'levelFx',
  'auraEffect',
  'spellEffect',
] as const;

type CatalogItem = {
  id: string;
  category: string;
  name: string;
  priceTokens: number;
  rarity: string;
  purchasable: boolean;
  source: string;
  roleFilter?: string;
};

type Props = {
  hero: Hero;
  onHeroRefresh: () => void;
};

export default function CosmeticsPanel({ hero, onHeroRefresh }: Props) {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [owned, setOwned] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [mode, setMode] = useState<'shop' | 'wardrobe'>('shop');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, ownedRes] = await Promise.all([
        cosmeticsAPI.getCatalog(),
        cosmeticsAPI.getOwned(),
      ]);
      setCatalog(catRes.catalog || []);
      setOwned(ownedRes.ownedCosmetics || []);
    } catch (e) {
      console.error('[Cosmetics] load failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const equipped = (hero.equippedCosmetics || {}) as Record<string, string | undefined>;
  const shopItems = useMemo(
    () => catalog.filter((c) => c.purchasable && c.source === 'store'),
    [catalog]
  );

  const handlePurchase = async (cosmeticId: string) => {
    if (!hero.id) return;
    setBusy(cosmeticId);
    try {
      await cosmeticsAPI.purchase(cosmeticId, hero.id);
      await load();
      onHeroRefresh();
    } catch (e: any) {
      alert(e?.response?.data?.error || e?.message || 'Purchase failed');
    } finally {
      setBusy(null);
    }
  };

  const handleEquip = async (slot: string, cosmeticId: string | null) => {
    if (!hero.id) return;
    setBusy(`${slot}:${cosmeticId ?? 'clear'}`);
    try {
      await cosmeticsAPI.equip(hero.id, slot, cosmeticId);
      onHeroRefresh();
    } catch (e: any) {
      alert(e?.response?.data?.error || e?.message || 'Equip failed');
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return <div className="text-gray-400 p-6">Loading cosmetics…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('shop')}
          className={`px-4 py-2 rounded font-semibold ${mode === 'shop' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          Shop
        </button>
        <button
          type="button"
          onClick={() => setMode('wardrobe')}
          className={`px-4 py-2 rounded font-semibold ${mode === 'wardrobe' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          Wardrobe
        </button>
      </div>

      {mode === 'shop' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shopItems.map((item) => {
            const has = owned.includes(item.id);
            return (
              <div key={item.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="font-bold text-white">{item.name}</div>
                <div className="text-xs text-gray-400 capitalize mb-2">
                  {item.category} · {item.rarity}
                </div>
                <div className="text-blue-300 mb-3">{item.priceTokens} tokens</div>
                <button
                  type="button"
                  disabled={has || busy === item.id}
                  onClick={() => handlePurchase(item.id)}
                  className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm font-semibold"
                >
                  {has ? 'Owned' : busy === item.id ? '…' : 'Purchase'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {mode === 'wardrobe' && (
        <div className="space-y-6">
          {WARDROBE_SLOTS.map((slot) => {
            const options = catalog.filter((c) => c.category === slot && owned.includes(c.id));
            const current = equipped[slot];
            return (
              <div key={slot} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="font-semibold text-white capitalize mb-2">{slot}</div>
                <div className="text-sm text-gray-400 mb-2">
                  Equipped: {current || 'none'}
                  {current && getCosmeticRender(current)?.color && (
                    <span
                      className="ml-2 inline-block w-3 h-3 rounded-full border border-gray-500"
                      style={{ background: getCosmeticRender(current)?.color }}
                    />
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleEquip(slot, null)}
                    className="px-3 py-1 text-xs rounded bg-gray-700 text-gray-200"
                  >
                    Clear
                  </button>
                  {options.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={busy !== null}
                      onClick={() => handleEquip(slot, opt.id)}
                      className={`px-3 py-1 text-xs rounded ${
                        current === opt.id ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-200'
                      }`}
                    >
                      {opt.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
