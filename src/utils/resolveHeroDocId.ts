import { getStoredSelectedHeroId } from './selectedHeroStorage';

/**
 * Firestore hero document id for backend routes (skills, quests, inventory, etc.).
 * Never use Twitch user id here — backend looks up heroes collection by doc id.
 */
export function resolveHeroDocId(options: {
  hero?: { id?: string | null } | null;
  explicitHeroId?: string | null;
  twitchUserId?: string | null;
  authHeroId?: string | null;
}): string | null {
  const fromHero = options.hero?.id?.trim();
  if (fromHero) return fromHero;

  const explicit = options.explicitHeroId?.trim();
  if (explicit) return explicit;

  const stored = getStoredSelectedHeroId(options.twitchUserId ?? null)?.trim();
  if (stored) return stored;

  const authHero = options.authHeroId?.trim();
  if (authHero) return authHero;

  return null;
}
