/**
 * Chat Activity Hook
 * 
 * Fetches real-time chat activity data from backend for stream boost display.
 * Uses backend's smooth diminishing returns curve: bonus = 0.5 * (users / (users + 20))
 */

import { useState, useEffect } from 'react';
import { overlayAPI } from '../api/client';

interface ChatActivityData {
  chatterCount: number;
  chatActivityLevel: number; // 0-100
  activeBoosts: {
    attack?: number;
    defense?: number;
    healing?: number;
  };
}

/**
 * Fetch chat activity for a streamer
 * 
 * @param streamerId - Twitch username (from battlefieldId like "twitch:username")
 * @param enabled - Whether to poll for updates
 * @param pollIntervalMs - How often to poll (default 30s)
 */
export function useChatActivity(
  streamerId: string | undefined,
  enabled: boolean = true,
  pollIntervalMs: number = 30000
): { data: ChatActivityData | null; loading: boolean; error: Error | null } {
  const [data, setData] = useState<ChatActivityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !streamerId) {
      return;
    }

    const fetchActivity = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use overlayAPI which handles X-Streamer-Key or JWT auth
        const activityData = await overlayAPI.getChatActivity(streamerId);

        // Backend now returns full groupBoost object with smooth curve already calculated
        const chatterCount = activityData.activeUsers || 0;
        const { attackBonus, defenseBonus, healingBonus, multiplier } = activityData.groupBoost;

        // Calculate activity level for visual display (0-100%)
        // At 20 users, we're at 25% boost (half-point), show as ~60% activity level
        const chatActivityLevel = Math.min(100, Math.round(multiplier * 200));

        setData({
          chatterCount,
          chatActivityLevel,
          activeBoosts: {
            attack: attackBonus,
            defense: defenseBonus,
            healing: healingBonus,
          },
        });
      } catch (err) {
        console.error('[ChatActivity] Error fetching activity:', err);
        setError(err as Error);
        
        // Graceful fallback - show zero activity instead of crashing
        setData({
          chatterCount: 0,
          chatActivityLevel: 0,
          activeBoosts: {},
        });
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchActivity();

    // Poll for updates
    const intervalId = setInterval(fetchActivity, pollIntervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [streamerId, enabled, pollIntervalMs]);

  return { data, loading, error };
}
