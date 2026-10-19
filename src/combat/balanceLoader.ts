import bundled from './data/balance.json';

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
  fetcher: () => Promise<BalancePayload>
): Promise<BalancePayload> {
  try {
    const payload = await fetcher();
    setRemoteBalance(payload);
    return payload;
  } catch {
    return getBundledBalance();
  }
}
