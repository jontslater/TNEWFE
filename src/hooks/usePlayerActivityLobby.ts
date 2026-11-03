import { useCallback, useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { dungeonAPI, raidAPI } from '../api/client';
import { useActiveInstanceListener } from './useActiveInstanceListener';
import {
  loadActivityAutoQueuePrefs,
  patchActivityAutoQueuePrefs,
  ActivityAutoQueuePrefs,
} from '../utils/activityQueuePreferences';
import { getCombatRoleFromClass } from '../utils/combatRole';
import { getItemScore } from '../utils/format';

export type RaidQueueState = {
  raidId: string;
  raidName: string;
  queueSize: number;
  roleCounts?: { tank: number; healer: number; dps: number };
  minPlayers: number;
};

export type BattlefieldQueueState = {
  code: string;
  name: string;
  type: 'dungeon' | 'raid';
  isReady?: boolean;
  launchAt?: { toMillis?: () => number; seconds?: number };
  requirements?: {
    roles?: {
      tank?: { current?: number; required?: number };
      healer?: { current?: number; required?: number };
      dps?: { current?: number; required?: number };
    };
  };
  participants?: unknown[];
  totalPlayers?: number;
};

export function usePlayerActivityLobby(options: {
  hero: any | null;
  authUserId?: string | null;
  twitchId?: string | null;
  availableRaids?: any[];
}) {
  const { hero, authUserId, twitchId, availableRaids = [] } = options;
  const listenerUserId = twitchId || authUserId || null;

  const [dungeonQueue, setDungeonQueue] = useState<any>(null);
  const [raidQueues, setRaidQueues] = useState<RaidQueueState[]>([]);
  const [battlefieldQueue, setBattlefieldQueue] = useState<BattlefieldQueueState | null>(null);
  const [autoPrefs, setAutoPrefs] = useState<ActivityAutoQueuePrefs>(() =>
    loadActivityAutoQueuePrefs()
  );
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const { activeInstance } = useActiveInstanceListener(listenerUserId);

  const refreshDungeonQueue = useCallback(async () => {
    if (!authUserId) return;
    try {
      const status = await dungeonAPI.getQueueStatus(authUserId);
      setDungeonQueue(status?.inQueue ? status : null);
    } catch {
      setDungeonQueue(null);
    }
  }, [authUserId]);

  const refreshRaidQueues = useCallback(async () => {
    if (!authUserId || !availableRaids.length) {
      setRaidQueues([]);
      return;
    }
    const active: RaidQueueState[] = [];
    await Promise.all(
      availableRaids.map(async (raid) => {
        try {
          const status = await raidAPI.getQueueStatus(raid.id, authUserId);
          if (status.inQueue) {
            active.push({
              raidId: raid.id,
              raidName: raid.name,
              queueSize: status.queueSize,
              roleCounts: status.roleCounts,
              minPlayers: raid.minPlayers || 4,
            });
          }
        } catch {
          /* ignore */
        }
      })
    );
    setRaidQueues(active);
  }, [authUserId, availableRaids]);

  useEffect(() => {
    refreshDungeonQueue();
    const interval = setInterval(refreshDungeonQueue, 8000);
    return () => clearInterval(interval);
  }, [refreshDungeonQueue]);

  useEffect(() => {
    refreshRaidQueues();
    const interval = setInterval(refreshRaidQueues, 8000);
    return () => clearInterval(interval);
  }, [refreshRaidQueues]);

  const battlefieldIdForHero = hero?.currentBattlefieldId as string | undefined;
  const battlefieldIdForStreamer = twitchId ? `twitch:${twitchId}` : null;
  const watchedBattlefieldId = battlefieldIdForHero || battlefieldIdForStreamer;

  useEffect(() => {
    if (!watchedBattlefieldId) {
      setBattlefieldQueue(null);
      return;
    }
    const queueRef = doc(db, 'battlefieldQueues', watchedBattlefieldId);
    const unsub = onSnapshot(
      queueRef,
      (snap) => {
        if (!snap.exists()) {
          setBattlefieldQueue(null);
          return;
        }
        setBattlefieldQueue(snap.data() as BattlefieldQueueState);
      },
      () => setBattlefieldQueue(null)
    );
    return () => unsub();
  }, [watchedBattlefieldId]);

  const lobbyPhase = useMemo(() => {
    if (activeInstance.type && activeInstance.instanceId) {
      return 'in_instance' as const;
    }
    if (dungeonQueue?.inQueue) return 'dungeon_queue' as const;
    if (raidQueues.length > 0) return 'raid_queue' as const;
    if (battlefieldQueue) return 'streamer_queue' as const;
    return 'idle' as const;
  }, [activeInstance, dungeonQueue, raidQueues, battlefieldQueue]);

  const updateAutoPrefs = useCallback((patch: Partial<ActivityAutoQueuePrefs>) => {
    setAutoPrefs(patchActivityAutoQueuePrefs(patch));
  }, []);

  const joinDungeonQueue = useCallback(
    async (difficulty: 'normal' | 'heroic' | 'mythic' = autoPrefs.preferredDungeonDifficulty) => {
      if (!hero || !authUserId) return;
      setBusy(true);
      setStatusMessage(null);
      try {
        const role = getCombatRoleFromClass(hero.role);
        await dungeonAPI.joinQueue(
          authUserId,
          hero.id || authUserId,
          role,
          getItemScore(hero.equipment || {}, hero.role),
          difficulty
        );
        await refreshDungeonQueue();
        setStatusMessage(`Joined dungeon queue (${difficulty}). Match starts when roles are filled.`);
      } catch (err: any) {
        setStatusMessage(err.response?.data?.error || 'Failed to join dungeon queue');
      } finally {
        setBusy(false);
      }
    },
    [hero, authUserId, autoPrefs.preferredDungeonDifficulty, refreshDungeonQueue]
  );

  const leaveDungeonQueue = useCallback(async () => {
    if (!authUserId) return;
    setBusy(true);
    try {
      await dungeonAPI.leaveQueue(authUserId);
      await refreshDungeonQueue();
      setStatusMessage('Left dungeon queue.');
    } catch (err: any) {
      setStatusMessage(err.response?.data?.error || 'Failed to leave dungeon queue');
    } finally {
      setBusy(false);
    }
  }, [authUserId, refreshDungeonQueue]);

  const joinRaidQueue = useCallback(
    async (raid: any) => {
      if (!hero || !authUserId) return;
      setBusy(true);
      setStatusMessage(null);
      try {
        await raidAPI.joinQueue(raid.id, {
          userId: authUserId,
          heroId: hero.id,
          role: getCombatRoleFromClass(hero.role),
          itemScore: getItemScore(hero.equipment || {}, hero.role),
        });
        await refreshRaidQueues();
        setStatusMessage(`Joined queue for ${raid.name}.`);
      } catch (err: any) {
        setStatusMessage(err.response?.data?.error || 'Failed to join raid queue');
      } finally {
        setBusy(false);
      }
    },
    [hero, authUserId, refreshRaidQueues]
  );

  const leaveRaidQueue = useCallback(
    async (raidId: string) => {
      if (!authUserId) return;
      setBusy(true);
      try {
        await raidAPI.leaveQueue(raidId, authUserId);
        await refreshRaidQueues();
        setStatusMessage('Left raid queue.');
      } catch (err: any) {
        setStatusMessage(err.response?.data?.error || 'Failed to leave raid queue');
      } finally {
        setBusy(false);
      }
    },
    [authUserId, refreshRaidQueues]
  );

  const quickJoinRaid = useCallback(async () => {
    if (!hero || !availableRaids.length) return;
    const difficulty = autoPrefs.preferredRaidDifficulty;
    const itemScore = getItemScore(hero.equipment || {}, hero.role);
    const level = hero.level || 1;
    const candidate =
      availableRaids.find(
        (r) =>
          r.difficulty === difficulty &&
          level >= r.minLevel &&
          itemScore >= r.minItemScore
      ) ||
      availableRaids.find((r) => level >= r.minLevel && itemScore >= r.minItemScore);
    if (!candidate) {
      setStatusMessage('No raid matches your level and gear yet.');
      return;
    }
    await joinRaidQueue(candidate);
  }, [hero, availableRaids, autoPrefs.preferredRaidDifficulty, joinRaidQueue]);

  const launchCountdownSec = useMemo(() => {
    if (!battlefieldQueue?.launchAt) return null;
    const ms =
      battlefieldQueue.launchAt.toMillis?.() ??
      (battlefieldQueue.launchAt.seconds
        ? battlefieldQueue.launchAt.seconds * 1000
        : null);
    if (!ms) return null;
    return Math.max(0, Math.ceil((ms - Date.now()) / 1000));
  }, [battlefieldQueue]);

  return {
    lobbyPhase,
    activeInstance,
    dungeonQueue,
    raidQueues,
    battlefieldQueue,
    watchedBattlefieldId,
    launchCountdownSec,
    autoPrefs,
    updateAutoPrefs,
    busy,
    statusMessage,
    setStatusMessage,
    refreshDungeonQueue,
    refreshRaidQueues,
    joinDungeonQueue,
    leaveDungeonQueue,
    joinRaidQueue,
    leaveRaidQueue,
    quickJoinRaid,
  };
}
