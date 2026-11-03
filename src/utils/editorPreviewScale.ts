import { getBattlefieldSpriteScale } from './spriteDisplayScale';

type EnemyEntry = {
  enemyType: string;
  enemyName: string;
  isBoss?: boolean;
};

/** Display scale for editor card preview boxes (fits viewport in fixed-height stage). */
export function getHeroEditorPreviewScale(): number {
  return 2;
}

export function getEnemyEditorPreviewScale(entry: EnemyEntry): number {
  const battlefield = getBattlefieldSpriteScale({
    isBoss: entry.isBoss,
    enemyType: entry.enemyType,
    enemyName: entry.enemyName,
  });

  if (entry.enemyType === 'Elder Dragon') {
    return Math.min(battlefield, 1.05);
  }
  if (entry.enemyType === 'Dragon_1' || entry.enemyType === 'Dragon_2' || entry.enemyType === 'Dragon_3') {
    return Math.min(battlefield, 1.65);
  }
  if (entry.isBoss) {
    return Math.min(battlefield, 2.75);
  }
  if (entry.enemyType === 'Goblin' || entry.enemyType === 'Goblin Chief') {
    return 2;
  }
  return Math.min(battlefield, 2.25);
}

/** Scale for the battlefield preview strip (slightly smaller than live). */
export function getStripPreviewScale(entry: EnemyEntry): number {
  if (entry.enemyType === 'Elder Dragon') {
    return getBattlefieldSpriteScale({ isBoss: true, enemyType: entry.enemyType, enemyName: entry.enemyName }) * 0.22;
  }
  if (entry.enemyType === 'Dragon_1' || entry.enemyType === 'Dragon_2' || entry.enemyType === 'Dragon_3') {
    return getBattlefieldSpriteScale({
      isBoss: entry.isBoss,
      enemyType: entry.enemyType,
      enemyName: entry.enemyName,
    }) * 0.85;
  }
  return getBattlefieldSpriteScale({
    isBoss: entry.isBoss,
    enemyType: entry.enemyType,
    enemyName: entry.enemyName,
  });
}
