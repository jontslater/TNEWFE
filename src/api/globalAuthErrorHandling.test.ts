import { describe, expect, it } from 'vitest';
import {
  shouldApplyGlobalAuthFailureHandling,
  shouldRedirectToHomeAfterAuthFailure,
} from './globalAuthErrorHandling';

describe('globalAuthErrorHandling', () => {
  it('applies global handling for 401/403 by default', () => {
    expect(shouldApplyGlobalAuthFailureHandling({ status: 401 })).toBe(true);
    expect(shouldApplyGlobalAuthFailureHandling({ status: 403 })).toBe(true);
  });

  it('skips global handling when skipAuthRedirect is set', () => {
    expect(
      shouldApplyGlobalAuthFailureHandling({ status: 401, skipAuthRedirect: true })
    ).toBe(false);
    expect(
      shouldApplyGlobalAuthFailureHandling({ status: 403, skipAuthRedirect: true })
    ).toBe(false);
  });

  it('ignores non-auth statuses', () => {
    expect(shouldApplyGlobalAuthFailureHandling({ status: 404 })).toBe(false);
    expect(shouldApplyGlobalAuthFailureHandling({ status: undefined })).toBe(false);
  });

  it('redirects except on home and auth callback', () => {
    expect(shouldRedirectToHomeAfterAuthFailure('/battlefield-facing')).toBe(true);
    expect(shouldRedirectToHomeAfterAuthFailure('/')).toBe(false);
    expect(shouldRedirectToHomeAfterAuthFailure('/auth/callback')).toBe(false);
    expect(shouldRedirectToHomeAfterAuthFailure('/auth/tiktok/callback')).toBe(true);
  });
});
