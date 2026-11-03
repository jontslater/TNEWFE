import { describe, expect, it } from 'vitest';
import { resolveHeroDocId } from './resolveHeroDocId';

describe('resolveHeroDocId', () => {
  it('prefers hero.id over auth and stored ids', () => {
    expect(
      resolveHeroDocId({
        hero: { id: 'heroDocA' },
        explicitHeroId: 'heroDocB',
        twitchUserId: '123',
        authHeroId: 'heroDocC',
      })
    ).toBe('heroDocA');
  });

  it('falls back to explicit heroId prop', () => {
    expect(
      resolveHeroDocId({
        explicitHeroId: 'heroDocB',
        authHeroId: 'wrong',
      })
    ).toBe('heroDocB');
  });
});
