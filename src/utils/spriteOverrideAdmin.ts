const DEFAULT_ADMINS = new Set(['theneverendingwar', 'tehchno']);

/** Matches backend SPRITE_OVERRIDE_ADMIN_LOGINS default + owner account. */
export function canEditSpriteOverrides(
  user: { twitchUsername?: string } | null | undefined
): boolean {
  const login = user?.twitchUsername?.toLowerCase();
  if (!login) return false;
  return DEFAULT_ADMINS.has(login);
}
