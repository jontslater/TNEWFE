import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, QuerySnapshot, DocumentData, updateDoc, doc } from 'firebase/firestore';
import { db } from '../utils/firebase';

export interface ActiveInstance {
  type: 'raid' | 'dungeon' | null;
  instanceId: string | null;
}

/**
 * Real-time listener for active raid/dungeon instances for a user
 * Uses Firestore real-time listeners to detect when user joins/leaves instances
 * Only triggers when instances change, not on every poll
 */
export function useActiveInstanceListener(userId: string | null) {
  const [activeInstance, setActiveInstance] = useState<ActiveInstance>({
    type: null,
    instanceId: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setActiveInstance({ type: null, instanceId: null });
      setLoading(false);
      return;
    }

    console.log(`[ActiveInstance Listener] Setting up listeners for userId: ${userId}`);
    setLoading(true);

    // Listen for active raid instances where user is participant
    // Use participantIds array (array of userId strings) for efficient querying
    const raidQuery = query(
      collection(db, 'raidInstances'),
      where('participantIds', 'array-contains', userId),
      where('status', 'in', ['active', 'in-progress'])
    );

    const unsubscribeRaid = onSnapshot(
      raidQuery,
      async (snapshot: QuerySnapshot<DocumentData>) => {
        console.log(`[ActiveInstance Listener] Raid snapshot: ${snapshot.docs.length} active raids`);
        
        if (snapshot.docs.length > 0) {
          // User is in an active raid - prioritize raids over dungeons
          const instance = snapshot.docs[0];
          const raidData = instance.data();
          
          // SAFEGUARD: Check if raid is too old (2 hours timeout)
          const RAID_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours
          const createdAt = raidData.createdAt?.toDate?.() || new Date(0);
          const ageMs = Date.now() - createdAt.getTime();
          
          if (ageMs > RAID_TIMEOUT_MS) {
            console.warn(`[ActiveInstance Listener] ⏰ Raid ${instance.id} has timed out (${Math.round(ageMs / 1000 / 60)} minutes old)`);
            console.log(`[ActiveInstance Listener] 🔧 Auto-completing stale raid...`);
            
            // Auto-complete the raid
            try {
              const raidRef = doc(db, 'raidInstances', instance.id);
              await updateDoc(raidRef, {
                status: 'completed',
                completedAt: new Date(),
                timeoutReason: 'Auto-completed after 2 hour timeout'
              });
              console.log(`[ActiveInstance Listener] ✅ Stale raid auto-completed`);
            } catch (err) {
              console.error('[ActiveInstance Listener] Failed to auto-complete raid:', err);
            }
            
            // Clear state and return to idle
            setActiveInstance({ type: null, instanceId: null });
            setLoading(false);
            return;
          }
          
          setActiveInstance(prev => {
            // Only update if we don't already have this raid, or if we have a dungeon (raid takes priority)
            if (prev.type === 'raid' && prev.instanceId === instance.id) {
              return prev; // No change needed
            }
            return {
              type: 'raid',
              instanceId: instance.id
            };
          });
          setLoading(false);
          console.log(`[ActiveInstance Listener] Active raid found: ${instance.id} (age: ${Math.round(ageMs / 1000 / 60)} min)`);
        } else {
          // No active raid - clear raid state (dungeon listener will set dungeon if one exists)
          setActiveInstance(prev => {
            // Only clear if we currently have a raid
            if (prev.type === 'raid') {
              console.log(`[ActiveInstance Listener] Raid completed/failed, clearing raid state`);
              return { type: null, instanceId: null };
            }
            return prev; // Keep current state (might be dungeon or null)
          });
        }
      },
      (err) => {
        console.error('[ActiveInstance Listener] Raid listener error:', err);
        setLoading(false);
      }
    );

    // Listen for active dungeon instances where user is participant
    // Use participantIds array (array of userId strings) for efficient querying
    // Note: Adjust field names based on your dungeon instance structure
    const dungeonQuery = query(
      collection(db, 'dungeonInstances'),
      where('participantIds', 'array-contains', userId),
      where('status', 'in', ['active', 'in-progress'])
    );

    const unsubscribeDungeon = onSnapshot(
      dungeonQuery,
      async (snapshot: QuerySnapshot<DocumentData>) => {
        console.log(`[ActiveInstance Listener] Dungeon snapshot: ${snapshot.docs.length} active dungeons`);
        
        // Only set dungeon if no active raid (raid takes priority)
        setActiveInstance(prev => {
          // If we already have a raid, don't override with dungeon
          if (prev.type === 'raid') {
            return prev;
          }
          
          if (snapshot.docs.length > 0) {
            const instance = snapshot.docs[0];
            const dungeonData = instance.data();
            
            // SAFEGUARD: Check if dungeon is too old (2 hours timeout)
            const DUNGEON_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours
            const createdAt = dungeonData.createdAt?.toDate?.() || new Date(0);
            const ageMs = Date.now() - createdAt.getTime();
            
            if (ageMs > DUNGEON_TIMEOUT_MS) {
              console.warn(`[ActiveInstance Listener] ⏰ Dungeon ${instance.id} has timed out (${Math.round(ageMs / 1000 / 60)} minutes old)`);
              console.log(`[ActiveInstance Listener] 🔧 Auto-completing stale dungeon...`);
              
              // Auto-complete the dungeon
              const dungeonRef = doc(db, 'dungeonInstances', instance.id);
              updateDoc(dungeonRef, {
                status: 'completed',
                completedAt: new Date(),
                timeoutReason: 'Auto-completed after 2 hour timeout'
              }).catch(err => console.error('[ActiveInstance Listener] Failed to auto-complete dungeon:', err));
              
              return { type: null, instanceId: null };
            }
            
            // Only update if we don't already have this dungeon
            if (prev.type === 'dungeon' && prev.instanceId === instance.id) {
              return prev; // No change needed
            }
            console.log(`[ActiveInstance Listener] Active dungeon found: ${instance.id} (age: ${Math.round(ageMs / 1000 / 60)} min)`);
            return {
              type: 'dungeon',
              instanceId: instance.id
            };
          } else {
            // No active dungeon found in query - check if status changed or instance was deleted
            if (prev.type === 'dungeon') {
              console.log(`[ActiveInstance Listener] ⚠️ No active dungeon found in query!`);
              console.log(`[ActiveInstance Listener] This could mean:`);
              console.log(`  - Dungeon status changed to 'completed' or 'failed'`);
              console.log(`  - Dungeon was deleted`);
              console.log(`  - Query filter is too restrictive`);
              console.log(`[ActiveInstance Listener] Clearing dungeon state`);
              return { type: null, instanceId: null };
            }
            // If we already have null state, keep it
            return prev;
          }
        });
        setLoading(false);
      },
      (err) => {
        // If collection doesn't exist or query fails, just log and continue
        // This allows the hook to work even if dungeons aren't implemented yet
        console.warn('[ActiveInstance Listener] Dungeon listener error (may be expected):', err);
        setLoading(false);
      }
    );

    // Cleanup listeners on unmount
    return () => {
      unsubscribeRaid();
      unsubscribeDungeon();
    };
  }, [userId]);

  return { activeInstance, loading };
}
