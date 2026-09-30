/**
 * Overlay Sync Manager
 * Handles periodic syncing of hero state and quest progress to backend
 */

import { Hero } from '../types/Hero';
import { questAPI } from '../api/client';

export interface SyncManagerConfig {
  apiUrl: string;
  syncIntervalMs?: number;
  questSyncIntervalMs?: number;
}

export class SyncManager {
  private config: SyncManagerConfig;
  private syncInterval: NodeJS.Timeout | null = null;
  private initialized = false;
  private lastQuestSync = 0;
  private questProgress: Map<string, Map<string, number>> = new Map();

  constructor(config: SyncManagerConfig) {
    this.config = {
      syncIntervalMs: 60000, // 60 seconds
      questSyncIntervalMs: 300000, // 5 minutes
      ...config
    };
  }

  /**
   * Start periodic sync
   */
  start(
    getHeroes: () => Hero[],
    addSCT: (text: string, x: number, y: number, type: string) => void
  ): void {
    if (this.initialized) {
      console.log('[Sync] ⚠️ Already initialized, skipping');
      return;
    }

    const heroes = getHeroes();
    if (heroes.length === 0) {
      console.log('[Sync] ⚠️ No heroes to sync, skipping initialization');
      return;
    }

    this.initialized = true;
    console.log('[Sync] ✅ Starting periodic sync (every 60s) for', heroes.length, 'heroes');

    this.syncInterval = setInterval(async () => {
      await this.performSync(getHeroes, addSCT);
    }, this.config.syncIntervalMs);
  }

  /**
   * Stop periodic sync
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.initialized = false;
    console.log('[Sync] ⏹️ Stopped periodic sync');
  }

  /**
   * Track quest progress
   */
  trackQuestProgress(heroId: string, trackingKey: string, increment: number = 1): void {
    if (!this.questProgress.has(heroId)) {
      this.questProgress.set(heroId, new Map());
    }
    const heroProgress = this.questProgress.get(heroId)!;
    heroProgress.set(trackingKey, (heroProgress.get(trackingKey) || 0) + increment);
  }

  /**
   * Perform sync operation
   */
  private async performSync(
    getHeroes: () => Hero[],
    addSCT: (text: string, x: number, y: number, type: string) => void
  ): Promise<void> {
    const currentHeroes = getHeroes();
    if (currentHeroes.length === 0) {
      console.log('[Sync] ⚠️ No heroes available to sync');
      return;
    }

    console.log('[Sync] Syncing', currentHeroes.length, 'heroes to Firebase...');

    const now = Date.now();
    const timeSinceLastSync = now - this.lastQuestSync;

    // Quest sync logic
    if (this.questProgress.size > 0) {
      console.log(`[Quest Sync] 🔍 Pending quest progress for ${this.questProgress.size} heroes (${Math.floor(timeSinceLastSync / 1000)}s since last sync)`);

      this.questProgress.forEach((heroProgress, heroId) => {
        const trackingKeys = Array.from(heroProgress.keys());
        const hero = currentHeroes.find(h => h.id === heroId);
        console.log(`[Quest Sync]   Hero ${heroId} (${hero?.name || 'unknown'}): ${trackingKeys.length} tracking keys:`,
          trackingKeys.map(key => `${key}:${heroProgress.get(key)}`).join(', '));
      });
    }

    if (this.questProgress.size > 0 && timeSinceLastSync >= this.config.questSyncIntervalMs!) {
      await this.syncQuests(currentHeroes, addSCT);
    }
  }

  /**
   * Sync quest progress to backend
   */
  private async syncQuests(
    currentHeroes: Hero[],
    addSCT: (text: string, x: number, y: number, type: string) => void
  ): Promise<void> {
    console.log('[Quest Sync] ✅ Syncing quest progress for', this.questProgress.size, 'heroes...');

    const questUpdates: Array<{
      userId: string;
      updates: Array<{ trackingKey: string; type: 'daily' | 'weekly' | 'monthly'; increment: number }>;
    }> = [];

    this.questProgress.forEach((heroProgress, heroId) => {
      const hero = currentHeroes.find(h => h.id === heroId);
      if (!hero) return;

      const twitchUserId = (hero as any).twitchUserId || (hero as any).twitchId;
      if (!twitchUserId) {
        console.warn(`[Quest Sync] ⚠️ No twitchUserId for hero ${heroId}, skipping quest sync`);
        return;
      }

      const updates: Array<{ trackingKey: string; type: 'daily' | 'weekly' | 'monthly'; increment: number }> = [];

      heroProgress.forEach((count, trackingKey) => {
        if (count > 0) {
          updates.push({ trackingKey, type: 'daily', increment: count });
          updates.push({ trackingKey, type: 'weekly', increment: count });
          updates.push({ trackingKey, type: 'monthly', increment: count });
        }
      });

      if (updates.length > 0) {
        questUpdates.push({ userId: twitchUserId, updates });
      }
    });

    if (questUpdates.length === 0) return;

    try {
      const response = await fetch(`${this.config.apiUrl}/api/quests/update-batch-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: questUpdates })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Quest Sync] ❌ Failed to sync quest progress:', response.status, errorText);
        return;
      }

      const result = await response.json();
      console.log('[Quest Sync] ✅ Quest progress synced:', result);

      // Check for completed quests and show SCT
      if (result.success && result.results) {
        result.results.forEach((userResult: any) => {
          if (userResult.completedQuests && userResult.completedQuests.length > 0) {
            userResult.completedQuests.forEach((completedQuest: any) => {
              console.log(`[Quest Complete] 🎉 ${completedQuest.questName} completed!`);

              const hero = currentHeroes.find(h =>
                (h as any).twitchUserId === userResult.userId ||
                (h as any).twitchId === userResult.userId
              );

              if (hero) {
                const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
                if (heroElement) {
                  const rect = heroElement.getBoundingClientRect();
                  addSCT(`Quest Complete!`, rect.left + rect.width / 2, rect.top - 20, 'questcomplete');
                }
              }
            });
          }
        });
      }

      console.log('[Quest Sync] 🧹 Clearing quest progress cache after successful sync');
      this.questProgress.clear();
      this.lastQuestSync = Date.now();

      // Auto-claim completed quests
      currentHeroes.forEach(async (hero) => {
        const twitchUserId = (hero as any).twitchUserId || (hero as any).twitchId;
        if (!twitchUserId) return;

        try {
          const claimResponse = await questAPI.claimAllQuests(twitchUserId);

          if (claimResponse.success && claimResponse.claimed > 0) {
            console.log(`[Quest Auto-Claim] ✅ ${hero.name} claimed ${claimResponse.claimed} quests!`);

            const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
            if (heroElement) {
              const rect = heroElement.getBoundingClientRect();
              addSCT(
                `+${claimResponse.totalXp} XP, +${claimResponse.totalGold} Gold`,
                rect.left + rect.width / 2,
                rect.top,
                'heal'
              );
            }
          }
        } catch (error) {
          console.error('[Quest Auto-Claim] ❌ Failed to claim quests:', error);
        }
      });
    } catch (error) {
      console.error('[Quest Sync] ❌ Error syncing quest progress:', error);
    }
  }

  /**
   * Reset quest sync state (for testing)
   */
  reset(): void {
    this.questProgress.clear();
    this.lastQuestSync = 0;
    console.log('[Sync] 🔄 Reset quest progress cache');
  }
}
