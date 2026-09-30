/**
 * Overlay Sync Hook
 * 
 * Manages robust synchronization of hero data from browser source to backend
 * with retry logic, pending delta tracking, and flush on close.
 */

import { useEffect, useRef, useCallback } from 'react';
import { heroAPI } from '../api/client';
import { retryWithBackoff, PendingDeltaManager, setupFlushOnClose } from '../utils/robustSync';

interface HeroStatChanges {
  level?: number;
  xp?: number;
  gold?: number;
  hp?: number;
  maxHp?: number;
  attack?: number;
  defense?: number;
  stats?: {
    totalDamage?: number;
    totalHealing?: number;
    damageBlocked?: number;
  };
}

interface UseOverlaySyncOptions {
  syncIntervalMs?: number;
  enabled?: boolean;
}

interface Hero {
  id: string;
  name?: string;
  level?: number;
  xp?: number;
  maxXp?: number;
  gold?: number;
  hp?: number;
  maxHp?: number;
  equipment?: any;
  inventory?: any[];
  profession?: any;
  [key: string]: any;
}

/**
 * Merge hero stat changes (sum numerical deltas)
 */
function mergeStatChanges(existing: HeroStatChanges, incoming: HeroStatChanges): HeroStatChanges {
  const merged: HeroStatChanges = { ...existing };
  
  // Merge XP (additive)
  if (incoming.xp !== undefined) {
    merged.xp = (existing.xp || 0) + incoming.xp;
  }
  
  // Merge gold (additive)
  if (incoming.gold !== undefined) {
    merged.gold = (existing.gold || 0) + incoming.gold;
  }
  
  // Level changes override (not additive)
  if (incoming.level !== undefined) {
    merged.level = incoming.level;
  }
  
  // HP/maxHp override (not additive)
  if (incoming.hp !== undefined) {
    merged.hp = incoming.hp;
  }
  if (incoming.maxHp !== undefined) {
    merged.maxHp = incoming.maxHp;
  }
  if (incoming.attack !== undefined) {
    merged.attack = incoming.attack;
  }
  if (incoming.defense !== undefined) {
    merged.defense = incoming.defense;
  }
  
  // Merge stats
  if (incoming.stats) {
    merged.stats = {
      totalDamage: (existing.stats?.totalDamage || 0) + (incoming.stats.totalDamage || 0),
      totalHealing: (existing.stats?.totalHealing || 0) + (incoming.stats.totalHealing || 0),
      damageBlocked: (existing.stats?.damageBlocked || 0) + (incoming.stats.damageBlocked || 0),
    };
  }
  
  return merged;
}

export function useOverlaySync(
  heroes: Hero[],
  options: UseOverlaySyncOptions = {}
) {
  const {
    syncIntervalMs = 60000, // Default 60 seconds (reduced from 5 minutes)
    enabled = true,
  } = options;

  // Pending delta managers
  const heroStatChanges = useRef(new PendingDeltaManager<string, HeroStatChanges>(mergeStatChanges));
  const equipmentChanges = useRef(new PendingDeltaManager<string, any>((existing, incoming) => incoming));
  const inventoryChanges = useRef(new PendingDeltaManager<string, any[]>((existing, incoming) => incoming));
  
  // Track last synced state to detect changes
  const lastSyncedState = useRef(new Map<string, {
    equipment: any;
    inventory: any[];
  }>());
  
  // Sync timestamps
  const lastStatSyncTime = useRef(0);
  const lastEquipmentSyncTime = useRef(0);
  const lastInventorySyncTime = useRef(0);

  /**
   * Track a stat change for a hero
   */
  const trackStatChange = useCallback((heroId: string, changes: HeroStatChanges) => {
    heroStatChanges.current.add(heroId, changes);
  }, []);

  /**
   * Track an equipment change for a hero
   */
  const trackEquipmentChange = useCallback((heroId: string, equipment: any) => {
    equipmentChanges.current.add(heroId, equipment);
  }, []);

  /**
   * Track an inventory change for a hero
   */
  const trackInventoryChange = useCallback((heroId: string, inventory: any[]) => {
    inventoryChanges.current.add(heroId, inventory);
  }, []);

  /**
   * Sync all pending changes using new batch overlay sync endpoint
   * Uses overlayAPI.syncBatch() which sends X-Streamer-Key or JWT
   */
  const syncAllPending = useCallback(async () => {
    const now = Date.now();
    const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Collect all pending changes into batch format
    const batchUpdates: Array<{ heroId: string; stats?: any; equipment?: any; inventory?: any }> = [];
    
    // Collect stat changes
    heroStatChanges.current.getAll().forEach((changes, heroId) => {
      const hero = heroes.find(h => h.id === heroId);
      if (!hero) return;

      const statsUpdate: any = {};

      // Level sync protection
      if (changes.level !== undefined) {
        statsUpdate.xp = hero.xp !== undefined ? Math.max(0, hero.xp) : 0;
        if (hero.maxXp !== undefined) {
          statsUpdate.maxXp = hero.maxXp;
        }
        
        const MAX_LEVEL = 100;
        let newLevel = changes.level;
        
        if (newLevel > MAX_LEVEL) {
          console.warn(`[OverlaySync] Capping level ${newLevel} at ${MAX_LEVEL} for hero ${hero.name}`);
          newLevel = MAX_LEVEL;
        }
        
        if (newLevel >= 1 && newLevel <= MAX_LEVEL) {
          statsUpdate.level = newLevel;
        }
      } else {
        // Apply XP delta
        if (changes.xp !== undefined && changes.xp !== 0) {
          const currentXP = hero.xp || 0;
          statsUpdate.xp = Math.max(0, currentXP + changes.xp);
        }
      }

      // Apply gold delta
      if (changes.gold !== undefined && changes.gold !== 0) {
        const currentGold = hero.gold || 0;
        statsUpdate.gold = Math.max(0, currentGold + changes.gold);
      }

      // Other stat changes
      if (changes.hp !== undefined) statsUpdate.hp = changes.hp;
      if (changes.maxHp !== undefined) statsUpdate.maxHp = changes.maxHp;
      if (changes.attack !== undefined) statsUpdate.attack = changes.attack;
      if (changes.defense !== undefined) statsUpdate.defense = changes.defense;

      // Stats
      if (changes.stats) {
        const currentStats = (hero as any).stats || {};
        statsUpdate.stats = {
          totalDamage: (currentStats.totalDamage || 0) + (changes.stats.totalDamage || 0),
          totalHealing: (currentStats.totalHealing || 0) + (changes.stats.totalHealing || 0),
          damageBlocked: (currentStats.damageBlocked || 0) + (changes.stats.damageBlocked || 0),
        };
      }

      if (Object.keys(statsUpdate).length > 0) {
        batchUpdates.push({ heroId, stats: statsUpdate });
      }
    });

    // Collect equipment changes
    equipmentChanges.current.getAll().forEach((equipment, heroId) => {
      const existing = batchUpdates.find(u => u.heroId === heroId);
      if (existing) {
        existing.equipment = equipment;
      } else {
        batchUpdates.push({ heroId, equipment });
      }
    });

    // Collect inventory changes
    inventoryChanges.current.getAll().forEach((inventory, heroId) => {
      const existing = batchUpdates.find(u => u.heroId === heroId);
      if (existing) {
        existing.inventory = inventory;
      } else {
        batchUpdates.push({ heroId, inventory });
      }
    });

    // Send batch sync if there are updates
    if (batchUpdates.length > 0) {
      try {
        const { overlayAPI } = await import('../api/client');
        const result = await overlayAPI.syncBatch(batchId, batchUpdates);
        
        if (result.duplicate) {
          console.log(`[OverlaySync] Batch ${batchId} already processed (idempotent)`);
        } else {
          console.log(`[OverlaySync] ✅ Batch synced: ${result.syncedCount} heroes, ${result.skippedCount} skipped`);
        }
        
        // Mark all as synced on success
        batchUpdates.forEach(({ heroId }) => {
          heroStatChanges.current.markSynced(heroId);
          equipmentChanges.current.markSynced(heroId);
          inventoryChanges.current.markSynced(heroId);
        });
      } catch (err) {
        console.error(`[OverlaySync] ❌ Batch sync failed:`, err);
        // Mark all as failed for retry
        batchUpdates.forEach(({ heroId }) => {
          heroStatChanges.current.markFailed(heroId);
          equipmentChanges.current.markFailed(heroId);
          inventoryChanges.current.markFailed(heroId);
        });
      }
    }

    lastStatSyncTime.current = now;
  }, [heroes]);

  /**
   * Sync equipment changes with retry logic
   */
  const syncEquipment = useCallback(async () => {
    const pending = equipmentChanges.current.getAll();
    if (pending.size === 0) return;

    const now = Date.now();
    console.log(`[OverlaySync] Syncing equipment for ${pending.size} heroes...`);

    const syncPromises: Promise<void>[] = [];

    for (const [heroId, equipment] of pending.entries()) {
      const hero = heroes.find(h => h.id === heroId);
      if (!hero) continue;

      const lastSynced = lastSyncedState.current.get(heroId)?.equipment;
      const currentEquipmentStr = JSON.stringify(equipment);
      const lastSyncedStr = JSON.stringify(lastSynced);

      // Only sync if changed
      if (currentEquipmentStr !== lastSyncedStr) {
        const syncPromise = retryWithBackoff(
          () => heroAPI.updateHeroById(heroId, { equipment }),
          {
            maxRetries: 3,
            initialDelayMs: 1000,
            maxDelayMs: 8000,
          }
        )
          .then(() => {
            console.log(`[OverlaySync] ✅ Synced equipment for ${hero.name}`);
            
            // Update last synced state
            const state = lastSyncedState.current.get(heroId) || { equipment: {}, inventory: [] };
            state.equipment = JSON.parse(currentEquipmentStr);
            lastSyncedState.current.set(heroId, state);
            
            equipmentChanges.current.markSynced(heroId);
          })
          .catch((err) => {
            console.error(`[OverlaySync] ❌ Failed to sync equipment for ${hero.name}:`, err);
            equipmentChanges.current.markFailed(heroId);
          });

        syncPromises.push(syncPromise);
      } else {
        equipmentChanges.current.markSynced(heroId);
      }
    }

    await Promise.allSettled(syncPromises);
    lastEquipmentSyncTime.current = now;
  }, [heroes]);

  /**
   * Sync inventory changes with retry logic
   */
  const syncInventory = useCallback(async () => {
    const pending = inventoryChanges.current.getAll();
    if (pending.size === 0) return;

    const now = Date.now();
    console.log(`[OverlaySync] Syncing inventory for ${pending.size} heroes...`);

    const syncPromises: Promise<void>[] = [];

    for (const [heroId, inventory] of pending.entries()) {
      const hero = heroes.find(h => h.id === heroId);
      if (!hero) continue;

      const lastSynced = lastSyncedState.current.get(heroId)?.inventory || [];
      const currentInventoryStr = JSON.stringify(
        inventory.map((item: any) => ({ id: item.id, quantity: item.quantity || 1 })).sort((a, b) => a.id.localeCompare(b.id))
      );
      const lastSyncedStr = JSON.stringify(
        lastSynced.map((item: any) => ({ id: item.id, quantity: item.quantity || 1 })).sort((a, b) => a.id.localeCompare(b.id))
      );

      // Only sync if changed
      if (currentInventoryStr !== lastSyncedStr) {
        const syncPromise = retryWithBackoff(
          () => heroAPI.updateHeroById(heroId, { inventory }),
          {
            maxRetries: 3,
            initialDelayMs: 1000,
            maxDelayMs: 8000,
          }
        )
          .then(() => {
            console.log(`[OverlaySync] ✅ Synced inventory for ${hero.name} (${inventory.length} items)`);
            
            // Update last synced state
            const state = lastSyncedState.current.get(heroId) || { equipment: {}, inventory: [] };
            state.inventory = JSON.parse(JSON.stringify(inventory));
            lastSyncedState.current.set(heroId, state);
            
            inventoryChanges.current.markSynced(heroId);
          })
          .catch((err) => {
            console.error(`[OverlaySync] ❌ Failed to sync inventory for ${hero.name}:`, err);
            inventoryChanges.current.markFailed(heroId);
          });

        syncPromises.push(syncPromise);
      } else {
        inventoryChanges.current.markSynced(heroId);
      }
    }

    await Promise.allSettled(syncPromises);
    lastInventorySyncTime.current = now;
  }, [heroes]);

  /**
   * Flush all pending changes (called on page close)
   */
  const flushAll = useCallback(async () => {
    console.log('[OverlaySync] Flushing all pending changes...');
    
    await Promise.allSettled([
      syncHeroStats(),
      syncEquipment(),
      syncInventory(),
    ]);
    
    console.log('[OverlaySync] Flush complete');
  }, [syncHeroStats, syncEquipment, syncInventory]);

  // Setup periodic sync
  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(async () => {
      await Promise.allSettled([
        syncHeroStats(),
        syncEquipment(),
        syncInventory(),
      ]);
    }, syncIntervalMs);

    console.log(`[OverlaySync] Started sync interval (${syncIntervalMs}ms)`);

    return () => {
      clearInterval(intervalId);
      console.log('[OverlaySync] Stopped sync interval');
    };
  }, [enabled, syncIntervalMs, syncHeroStats, syncEquipment, syncInventory]);

  // Setup flush on close
  useEffect(() => {
    if (!enabled) return;

    const cleanup = setupFlushOnClose(flushAll);
    
    return cleanup;
  }, [enabled, flushAll]);

  return {
    trackStatChange,
    trackEquipmentChange,
    trackInventoryChange,
    syncHeroStats,
    syncEquipment,
    syncInventory,
    flushAll,
    hasPendingStats: () => heroStatChanges.current.hasPending(),
    hasPendingEquipment: () => equipmentChanges.current.hasPending(),
    hasPendingInventory: () => inventoryChanges.current.hasPending(),
  };
}
