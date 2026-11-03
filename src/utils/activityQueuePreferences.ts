export type ActivityAutoQueuePrefs = {
  autoJoinDungeon: boolean;
  autoJoinRaid: boolean;
  preferredDungeonDifficulty: 'normal' | 'heroic' | 'mythic';
  preferredRaidDifficulty: 'normal' | 'heroic' | 'mythic';
};

const STORAGE_KEY = 'tnew_activity_auto_queue_v1';

const DEFAULT_PREFS: ActivityAutoQueuePrefs = {
  autoJoinDungeon: false,
  autoJoinRaid: false,
  preferredDungeonDifficulty: 'normal',
  preferredRaidDifficulty: 'normal',
};

export function loadActivityAutoQueuePrefs(): ActivityAutoQueuePrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function saveActivityAutoQueuePrefs(prefs: ActivityAutoQueuePrefs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function patchActivityAutoQueuePrefs(
  patch: Partial<ActivityAutoQueuePrefs>
): ActivityAutoQueuePrefs {
  const next = { ...loadActivityAutoQueuePrefs(), ...patch };
  saveActivityAutoQueuePrefs(next);
  return next;
}
