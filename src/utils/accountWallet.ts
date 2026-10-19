import type { Hero } from '../types/Hero';

/** Premium tokens shared across all heroes on the account (backend `accountTokens` when present). */
export function resolveAccountTokens(
  user: { accountTokens?: number } | null | undefined,
  heroes: Hero[],
  activeHero: Hero | null
): number {
  if (typeof user?.accountTokens === 'number') return user.accountTokens;
  const activeRaw = activeHero as Hero & { accountTokens?: number };
  if (typeof activeRaw?.accountTokens === 'number') return activeRaw.accountTokens;
  const fromHeroes = heroes
    .map((h) => (h as Hero & { accountTokens?: number }).accountTokens)
    .filter((v): v is number => typeof v === 'number');
  if (fromHeroes.length > 0) return Math.max(...fromHeroes);
  return activeHero?.tokens ?? 0;
}

export function accountHasCosmeticUnlock(heroes: Hero[]): boolean {
  return heroes.some((h) => {
    const raw = h as Hero & {
      founderPackTier?: string;
      nameFrame?: string;
      auraEffect?: string;
      spellEffect?: string;
      accountCosmetics?: boolean;
    };
    return Boolean(
      raw.accountCosmetics ||
        raw.founderPackTier ||
        raw.nameFrame ||
        raw.auraEffect ||
        raw.spellEffect
    );
  });
}
