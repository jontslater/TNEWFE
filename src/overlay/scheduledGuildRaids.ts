/**
 * Future scheduled guild raid auto-start (disabled until backend routes exist).
 */
import { useEffect, useRef } from 'react';
import { FEATURES } from '../config/features';
import { overlayClient } from '../api/client';

/**
 * When FEATURES.scheduledRaids is true, polls scheduled raid endpoints and sets browser timers.
 * Disabled by default — server owns auto-start for chat queues.
 */
export function useScheduledGuildRaidsMonitoring(
  battlefieldId: string | null,
  gameMode: 'idle' | 'dungeon' | 'raid'
): void {
  const scheduledRaidTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (!FEATURES.scheduledRaids) {
      return;
    }

    if (!battlefieldId || gameMode !== 'idle') {
      return;
    }

    const battlefieldTwitchId = battlefieldId.split(':')[1];
    if (!battlefieldTwitchId) return;

    console.log('[Scheduled Raids] 🔍 Monitoring (feature flag enabled)...');

    const checkScheduledRaids = async () => {
      try {
        const response = await overlayClient.get(`/api/raids/scheduled/battlefield/${battlefieldId}`);
        const scheduledRaids = response.data;

        scheduledRaids.forEach((raid: any) => {
          const existingTimeout = scheduledRaidTimeouts.current.get(raid.id);
          if (existingTimeout) clearTimeout(existingTimeout);

          if (!raid.scheduledTime || raid.status !== 'recruiting') return;

          const scheduledDate = new Date(raid.scheduledTime._seconds * 1000);
          const timeUntilStart = scheduledDate.getTime() - Date.now();
          const minPlayers = raid.minPlayers || 5;

          if (timeUntilStart > 0 && timeUntilStart < 86400000 && raid.participants.length >= minPlayers) {
            const timeout = setTimeout(async () => {
              try {
                if (raid.simulateMode) {
                  const heroIds = raid.participants.map((p: any) => p.heroId);
                  await overlayClient.post(`/api/raids/${raid.raidId}/simulate`, { participants: heroIds });
                } else {
                  await overlayClient.post(`/api/raids/scheduled/${raid.id}/start`);
                }
              } catch (err) {
                console.error('[Scheduled Raids] Failed to start:', err);
              }
            }, timeUntilStart);
            scheduledRaidTimeouts.current.set(raid.id, timeout);
          }
        });
      } catch {
        console.log('[Scheduled Raids] Endpoint not ready');
      }
    };

    checkScheduledRaids();
    const interval = setInterval(checkScheduledRaids, 60000);

    return () => {
      clearInterval(interval);
      scheduledRaidTimeouts.current.forEach((t) => clearTimeout(t));
      scheduledRaidTimeouts.current.clear();
    };
  }, [battlefieldId, gameMode]);
}
