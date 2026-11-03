/** Shared logic for axios 401/403 response handling (testable without DOM). */
export function shouldApplyGlobalAuthFailureHandling(options: {
  status?: number;
  skipAuthRedirect?: boolean;
}): boolean {
  const { status, skipAuthRedirect } = options;
  if (status !== 401 && status !== 403) return false;
  if (skipAuthRedirect) return false;
  return true;
}

export function shouldRedirectToHomeAfterAuthFailure(currentPath: string): boolean {
  return currentPath !== '/' && !currentPath.includes('/auth/callback');
}
