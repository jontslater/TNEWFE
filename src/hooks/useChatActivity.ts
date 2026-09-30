/**
 * Chat Activity Hook
 * 
 * Fetches real-time chat activity data from backend for stream boost display.
 */

import { useState, useEffect } from 'react';

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

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/api/chat/activity/${streamerId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch chat activity: ${response.statusText}`);
        }

        const activityData = await response.json();

        // Calculate boosts from chatter count (formula from backend PR)
        const chatterCount = activityData.chatterCount || 0;
        const groupBonus = Math.min(0.25, chatterCount * 0.005);
        
        // Convert to percentage for display
        const boostPercent = Math.round(groupBonus * 100);

        setData({
          chatterCount,
          chatActivityLevel: Math.min(100, chatterCount * 2), // 50 chatters = 100% activity
          activeBoosts: {
            attack: boostPercent,
            defense: boostPercent,
            healing: boostPercent,
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
