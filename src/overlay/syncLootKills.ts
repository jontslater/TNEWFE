/** Pure kill payload helpers (no API client — safe for scripts/tests). */

export type OverlaySyncKill = {
  heroId: string;
  enemyLevel: number;
  kind: 'normal' | 'elite' | 'boss' | 'dungeonBoss' | 'raidBoss';
  contentId?: string;
  difficulty?: string;
  contentType?: string;
  instanceId?: string;
  fromAbility?: boolean;
};

const BLOCKED_LOOT_ROLL_KINDS = new Set(['boss', 'raidBoss', 'dungeonBoss', 'worldboss']);

export function mapEnemyKillKind(
  enemy: { isBoss?: boolean; isElite?: boolean },
  gameMode?: string
): OverlaySyncKill['kind'] {
  if (enemy.isBoss && gameMode === 'raid') return 'raidBoss';
  if (enemy.isBoss && gameMode === 'dungeon') return 'dungeonBoss';
  if (enemy.isBoss) return 'boss';
  if (enemy.isElite) return 'elite';
  return 'normal';
}

export function assignHeroIdsToKills(
  enemies: Array<{
    level?: number;
    isBoss?: boolean;
    isElite?: boolean;
    name?: string;
    lootCreditHeroId?: string;
    killedByAbility?: boolean;
  }>,
  heroIds: string[],
  gameMode?: string,
  instance?: { id?: string; dungeonId?: string; raidId?: string; difficulty?: string }
): OverlaySyncKill[] {
  if (!heroIds.length) return [];
  const contentId = instance?.dungeonId || instance?.raidId;
  const contentType =
    gameMode === 'dungeon' ? 'dungeon' : gameMode === 'raid' ? 'raid' : undefined;
  const instanceId = instance?.id;
  return enemies.map((enemy, i) => ({
    heroId: enemy.lootCreditHeroId || heroIds[i % heroIds.length],
    enemyLevel: enemy.level || 1,
    kind: mapEnemyKillKind(enemy, gameMode),
    contentId,
    difficulty: instance?.difficulty,
    contentType,
    instanceId,
    fromAbility: Boolean(enemy.killedByAbility),
  }));
}

export function killsForBattlefieldLootRoll(kills: OverlaySyncKill[]): Array<{
  heroId: string;
  enemyLevel: number;
  kind: string;
  contentType?: string;
  contentId?: string;
  difficulty?: string;
  instanceId?: string;
  fromAbility?: boolean;
}> {
  return kills
    .filter((k) => k.heroId && !BLOCKED_LOOT_ROLL_KINDS.has(k.kind))
    .map((k) => ({
      heroId: k.heroId,
      enemyLevel: k.enemyLevel,
      kind: k.kind,
      contentType: k.contentType,
      contentId: k.contentId,
      difficulty: k.difficulty,
      instanceId: k.instanceId,
      fromAbility: k.fromAbility,
    }));
}
