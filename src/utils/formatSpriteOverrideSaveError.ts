export type SpriteOverrideSaveErrorDisplay = {
  message: string;
  sessionExpired: boolean;
};

export function formatSpriteOverrideSaveError(err: unknown): SpriteOverrideSaveErrorDisplay {
  const axiosErr = err as {
    response?: { status?: number; data?: { error?: string; message?: string } };
  };
  const status = axiosErr.response?.status;
  const data = axiosErr.response?.data;

  if (status === 401) {
    return {
      message: 'Session expired — log in again to save.',
      sessionExpired: true,
    };
  }

  const message =
    data?.error ||
    data?.message ||
    'Save failed — is /api/config/sprite-overrides deployed?';

  return { message, sessionExpired: false };
}
