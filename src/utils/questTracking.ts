/**
 * Quest Tracking Utility
 * Tracks quest progress during combat and updates backend
 */

export type QuestTrackingKey = 
  | 'kill'
  | 'defeatBosses'
  | 'completeWaves'
  | 'surviveBosses'
  | 'dealDamage'
  | 'healAmount'
  | 'blockDamage'
  | 'gather'
  | 'craft'
  | 'use';

export interface QuestProgressUpdate {
  trackingKey: QuestTrackingKey;
  type: 'daily' | 'weekly' | 'monthly';
  increment: number;
}

export interface CompletedQuest {
  questId: string;
  questName: string;
  type: 'daily' | 'weekly' | 'monthly';
}

/**
 * Quest tracking accumulator
 * Batches updates and sends them periodically to reduce API calls
 */
export class QuestTracker {
  private updates: Map<string, number> = new Map(); // key: `${type}:${trackingKey}`, value: increment
  private batchInterval: number = 5000; // Send updates every 5 seconds
  private intervalId: NodeJS.Timeout | null = null;
  private onUpdate: (updates: QuestProgressUpdate[]) => Promise<{ completed?: CompletedQuest[] }>;
  private onQuestComplete?: (completedQuests: CompletedQuest[]) => void;

  constructor(
    onUpdate: (updates: QuestProgressUpdate[]) => Promise<{ completed?: CompletedQuest[] }>,
    onQuestComplete?: (completedQuests: CompletedQuest[]) => void
  ) {
    this.onUpdate = onUpdate;
    this.onQuestComplete = onQuestComplete;
    this.startBatchTimer();
  }

  /**
   * Track quest progress
   */
  track(trackingKey: QuestTrackingKey, increment: number = 1, type: 'daily' | 'weekly' | 'monthly' = 'daily') {
    const key = `${type}:${trackingKey}`;
    const current = this.updates.get(key) || 0;
    this.updates.set(key, current + increment);
  }

  /**
   * Track multiple quest types at once
   */
  trackBatch(updates: QuestProgressUpdate[]) {
    updates.forEach(update => {
      this.track(update.trackingKey, update.increment, update.type);
    });
  }

  /**
   * Start batch timer to send updates periodically
   */
  private startBatchTimer() {
    this.intervalId = setInterval(() => {
      this.flush();
    }, this.batchInterval);
  }

  /**
   * Flush accumulated updates to backend
   */
  async flush() {
    if (this.updates.size === 0) return;

    const updates: QuestProgressUpdate[] = [];
    
    this.updates.forEach((increment, key) => {
      const [type, trackingKey] = key.split(':') as [string, QuestTrackingKey];
      updates.push({
        trackingKey,
        type: type as 'daily' | 'weekly' | 'monthly',
        increment
      });
    });

    if (updates.length > 0) {
      try {
        const response = await this.onUpdate(updates);
        this.updates.clear(); // Clear after successful update
        
        // Check for completed quests and trigger callback
        if (response?.completed && response.completed.length > 0 && this.onQuestComplete) {
          this.onQuestComplete(response.completed);
        }
      } catch (error) {
        console.error('Error updating quest progress:', error);
        // Keep updates for retry on next flush
      }
    }
  }

  /**
   * Stop tracking (cleanup)
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    // Flush any remaining updates
    this.flush();
  }
}

/**
 * Helper to determine if enemy is a boss
 */
export function isBossEnemy(enemyName: string): boolean {
  const bossNames = ['Demon Lord', 'Adult Dragon', 'Elder Dragon', 'World Boss'];
  return bossNames.some(boss => enemyName.includes(boss));
}

/**
 * Helper to format quest progress for display
 */
export function formatQuestProgress(current: number, target: number): string {
  if (target >= 1000) {
    return `${(current / 1000).toFixed(1)}k / ${(target / 1000).toFixed(1)}k`;
  }
  return `${current} / ${target}`;
}
