import { describe, expect, it } from 'vitest';
import { getCleanBattlefieldUrl } from './battlefieldUrls';

describe('battlefieldUrls', () => {
  it('builds clean battlefield URL with twitch id', () => {
    const url = getCleanBattlefieldUrl('999', { darkMode: true });
    expect(url).toContain('battlefieldId=twitch%3A999');
    expect(url).toContain('darkMode=true');
    expect(url).toContain('/clean-battlefield');
  });
});
