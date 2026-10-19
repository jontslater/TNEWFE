import type { Item } from '../types/Hero';

export type ItemBindingPolicy = 'none' | 'bop' | 'boe' | 'account';

export type ItemBindingState = {
  policy: ItemBindingPolicy;
  isBound: boolean;
  boundToHeroId?: string;
};

type RawBindingItem = Item & {
  binding?: string;
  bindType?: string;
  bindOn?: string;
  isBound?: boolean;
  bound?: boolean;
  soulbound?: boolean;
  boundToHeroId?: string;
  cosmetic?: boolean;
  itemKind?: string;
};

function normalizePolicy(raw: string | undefined): ItemBindingPolicy {
  const v = (raw || 'none').toLowerCase();
  if (v === 'bop' || v === 'bind_on_pickup' || v === 'pickup') return 'bop';
  if (v === 'boe' || v === 'bind_on_equip' || v === 'equip') return 'boe';
  if (v === 'account' || v === 'account_bound' || v === 'bnet') return 'account';
  return 'none';
}

export function getItemBindingState(item: Item | null | undefined): ItemBindingState {
  if (!item) return { policy: 'none', isBound: false };

  const raw = item as RawBindingItem;
  let policy = normalizePolicy(raw.binding || raw.bindType || raw.bindOn);
  if (policy === 'none' && (raw.cosmetic || raw.itemKind === 'cosmetic')) {
    policy = 'account';
  }

  const isBound = Boolean(
    raw.isBound ??
      raw.bound ??
      raw.soulbound ??
      (policy === 'account') ??
      (policy === 'bop' && raw.boundToHeroId)
  );

  return {
    policy,
    isBound: isBound || policy === 'account',
    boundToHeroId: raw.boundToHeroId,
  };
}

/** WoW-style binding line for tooltips; `null` when no label applies. */
export function getBindingTooltipText(item: Item): string | null {
  const raw = item as RawBindingItem;
  if (raw.cosmetic || raw.itemKind === 'cosmetic') {
    return 'Account bound';
  }

  const { policy, isBound } = getItemBindingState(item);
  if (policy === 'account') return 'Account bound';
  if (isBound && policy !== 'none') return 'Soulbound';
  if (policy === 'bop') return 'Binds when picked up';
  if (policy === 'boe') return 'Binds when equipped';
  return null;
}

/** Mail, auction house, and direct player trade. */
export function canTransferItem(item: Item): boolean {
  const raw = item as RawBindingItem;
  if (raw.cosmetic || raw.itemKind === 'cosmetic') return false;

  const { policy, isBound } = getItemBindingState(item);
  if (policy === 'account') return false;
  if (isBound) return false;
  if (policy === 'bop') return false;
  return true;
}

export function willBindOnEquip(item: Item): boolean {
  const { policy, isBound } = getItemBindingState(item);
  return policy === 'boe' && !isBound;
}

export const EQUIP_BIND_CONFIRM_MESSAGE =
  'Equipping this item will bind it to you. Continue?';
