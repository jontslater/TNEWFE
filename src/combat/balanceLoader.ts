import bundled from './data/balance.json';
import { normalizeRemoteBalance } from './normalizeBalance';

export type BalancePayload = typeof bundled;

let cachedRemote: BalancePayload | null = null;

export function getBundledBalance(): BalancePayload {
  return bundled;
}

export function getBalancePayload(): BalancePayload {
  return cachedRemote ?? bundled;
}

export function setRemoteBalance(payload: BalancePayload): void {
  cachedRemote = payload;
}

export async function fetchBalance(
  fetcher: () => Promise<unknown>
): Promise<BalancePayload> {
  try {
    const raw = await fetcher();
    const payload = normalizeRemoteBalance(raw);
    if (payload) {
      setRemoteBalance(payload);
      return payload;
    }
    console.warn('[balance] Remote payload shape unrecognized; using bundled balance.json');
    return getBundledBalance();
  } catch {
    return getBundledBalance();
  }
}
