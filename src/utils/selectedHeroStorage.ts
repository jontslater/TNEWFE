/** localStorage key for the Portal hero picker selection (Twitch user id scope). */
export function getSelectedHeroStorageKey(twitchUserId: string): string {
  return `selectedHeroId_${twitchUserId}`;
}

export function getStoredSelectedHeroId(twitchUserId: string | null | undefined): string | null {
  if (!twitchUserId) return null;
  return localStorage.getItem(getSelectedHeroStorageKey(twitchUserId));
}

/** Pick saved hero from list, or first hero when none saved / invalid. */
export function resolveSelectedHero<T extends { id: string }>(
  heroes: T[],
  twitchUserId: string | null | undefined
): T | null {
  if (heroes.length === 0) return null;
  const savedId = getStoredSelectedHeroId(twitchUserId);
  if (savedId) {
    const match = heroes.find((h) => h.id === savedId);
    if (match) return match;
  }
  return heroes[0];
}
