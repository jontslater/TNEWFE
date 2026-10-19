/** Merge role-active charge tick results into overlay heroes without double-counting damage meter stats. */
export function mergeHeroesAfterRoleActive<T extends {
  id: string;
  hp?: number;
  isDead?: boolean;
  stats?: { totalDamage?: number; totalHealing?: number; damageBlocked?: number };
  cooldowns?: Record<string, number | undefined>;
  activeBuffs?: Record<string, unknown>;
  tauntExpiry?: number;
}>(prev: T[], outcome: T[], liveSnapshot?: T[]): T[] {
  return prev.map((h) => {
    const from = outcome.find((o) => o.id === h.id);
    const live = liveSnapshot?.find((l) => l.id === h.id);
    if (!from) return h;
    return {
      ...h,
      hp: from.hp ?? h.hp,
      isDead: from.isDead ?? h.isDead,
      stats: live?.stats ?? h.stats,
      cooldowns: from.cooldowns ?? h.cooldowns,
      activeBuffs: { ...h.activeBuffs, ...from.activeBuffs },
      tauntExpiry: from.tauntExpiry ?? h.tauntExpiry,
    };
  });
}
