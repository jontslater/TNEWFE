import { describe, expect, it } from 'vitest';
import { formatSpriteOverrideSaveError } from './formatSpriteOverrideSaveError';

describe('formatSpriteOverrideSaveError', () => {
  it('returns session expired for 401', () => {
    const result = formatSpriteOverrideSaveError({
      response: { status: 401, data: { error: 'Unauthorized' } },
    });
    expect(result.sessionExpired).toBe(true);
    expect(result.message).toMatch(/session expired/i);
  });

  it('prefers error field from response body', () => {
    const result = formatSpriteOverrideSaveError({
      response: { status: 403, data: { error: 'Admin only' } },
    });
    expect(result.sessionExpired).toBe(false);
    expect(result.message).toBe('Admin only');
  });

  it('falls back to message then default', () => {
    expect(
      formatSpriteOverrideSaveError({
        response: { status: 500, data: { message: 'Server broke' } },
      }).message
    ).toBe('Server broke');

    expect(formatSpriteOverrideSaveError({}).message).toMatch(/save failed/i);
  });
});
