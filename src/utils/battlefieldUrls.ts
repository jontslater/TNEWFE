export function getCleanBattlefieldUrl(twitchId: string, options?: { darkMode?: boolean }): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const params = new URLSearchParams({ battlefieldId: `twitch:${twitchId}` });
  if (options?.darkMode) params.set('darkMode', 'true');
  return `${origin}/clean-battlefield?${params.toString()}`;
}

export function openCleanBattlefield(twitchId: string, options?: { darkMode?: boolean; newTab?: boolean }) {
  const url = getCleanBattlefieldUrl(twitchId, options);
  if (options?.newTab !== false) {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    window.location.href = url;
  }
}
