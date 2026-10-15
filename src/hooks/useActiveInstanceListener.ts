import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, QuerySnapshot, DocumentData, updateDoc, doc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { ACTIVE_INSTANCE_STATUSES } from '../constants/instanceStatus';

export interface ActiveInstance {
  type: 'raid' | 'dungeon' | null;
  instanceId: string | null;
}

export interface UseActiveInstanceListenerOptions {
  /** When set (e.g. twitch:123), detect chat-launched instances for this battlefield. */
  battlefieldId?: string | null;
}

/**
 * Real-time listener for active raid/dungeon instances.
 * Overlay: prefer battlefieldId. Portal: participant userId (Twitch id).
 */
export function useActiveInstanceListener(
  userId: string | null,
  options?: UseActiveInstanceListenerOptions
) {
  const battlefieldId = options?.battlefieldId ?? null;
  const [activeInstance, setActiveInstance] = useState<ActiveInstance>({
    type: null,
    instanceId: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId && !battlefieldId) {
      setActiveInstance({ type: null, instanceId: null });
      setLoading(false);
      return;
    }

    console.log(
      `[ActiveInstance Listener] userId=${userId ?? 'none'} battlefieldId=${battlefieldId ?? 'none'}`
    );
    setLoading(true);

    const statusFilter = [...ACTIVE_INSTANCE_STATUSES];

    const applyRaidSnapshot = async (snapshot: QuerySnapshot<DocumentData>) => {
      if (snapshot.docs.length > 0) {
        const instance = snapshot.docs[0];
        const raidData = instance.data();

        const RAID_TIMEOUT_MS = 2 * 60 * 60 * 1000;
        const createdAt = raidData.createdAt?.toDate?.() || new Date(0);
        const ageMs = Date.now() - createdAt.getTime();

        if (ageMs > RAID_TIMEOUT_MS) {
          try {
            await updateDoc(doc(db, 'raidInstances', instance.id), {
              status: 'completed',
              completedAt: new Date(),
              timeoutReason: 'Auto-completed after 2 hour timeout',
            });
          } catch (err) {
            console.error('[ActiveInstance Listener] Failed to auto-complete raid:', err);
          }
          setActiveInstance({ type: null, instanceId: null });
          setLoading(false);
          return;
        }

        setActiveInstance((prev) => {
          if (prev.type === 'raid' && prev.instanceId === instance.id) return prev;
          return { type: 'raid', instanceId: instance.id };
        });
        setLoading(false);
        return;
      }

      setActiveInstance((prev) => {
        if (prev.type === 'raid') {
          return { type: null, instanceId: null };
        }
        return prev;
      });
    };

    const applyDungeonSnapshot = async (snapshot: QuerySnapshot<DocumentData>) => {
      setActiveInstance((prev) => {
        if (prev.type === 'raid') return prev;

        if (snapshot.docs.length > 0) {
          const instance = snapshot.docs[0];
          const dungeonData = instance.data();
          const DUNGEON_TIMEOUT_MS = 2 * 60 * 60 * 1000;
          const createdAt = dungeonData.createdAt?.toDate?.() || new Date(0);
          const ageMs = Date.now() - createdAt.getTime();

          if (ageMs > DUNGEON_TIMEOUT_MS) {
            updateDoc(doc(db, 'dungeonInstances', instance.id), {
              status: 'completed',
              completedAt: new Date(),
              timeoutReason: 'Auto-completed after 2 hour timeout',
            }).catch((err) => console.error('[ActiveInstance Listener] dungeon timeout:', err));
            return { type: null, instanceId: null };
          }

          if (prev.type === 'dungeon' && prev.instanceId === instance.id) return prev;
          return { type: 'dungeon', instanceId: instance.id };
        }

        if (prev.type === 'dungeon') {
          return { type: null, instanceId: null };
        }
        return prev;
      });
      setLoading(false);
    };

    const unsubscribers: Array<() => void> = [];

    if (battlefieldId) {
      const raidBfQuery = query(
        collection(db, 'raidInstances'),
        where('battlefieldId', '==', battlefieldId),
        where('status', 'in', statusFilter)
      );
      unsubscribers.push(
        onSnapshot(raidBfQuery, applyRaidSnapshot, (err) => {
          console.error('[ActiveInstance Listener] Raid (battlefield) error:', err);
          setLoading(false);
        })
      );

      const dungeonBfQuery = query(
        collection(db, 'dungeonInstances'),
        where('battlefieldId', '==', battlefieldId),
        where('status', 'in', statusFilter)
      );
      unsubscribers.push(
        onSnapshot(dungeonBfQuery, applyDungeonSnapshot, (err) => {
          console.warn('[ActiveInstance Listener] Dungeon (battlefield) error:', err);
          setLoading(false);
        })
      );
    } else if (userId) {
      const raidQuery = query(
        collection(db, 'raidInstances'),
        where('participantIds', 'array-contains', userId),
        where('status', 'in', statusFilter)
      );
      unsubscribers.push(
        onSnapshot(raidQuery, applyRaidSnapshot, (err) => {
          console.error('[ActiveInstance Listener] Raid (participant) error:', err);
          setLoading(false);
        })
      );

      const dungeonQuery = query(
        collection(db, 'dungeonInstances'),
        where('participantIds', 'array-contains', userId),
        where('status', 'in', statusFilter)
      );
      unsubscribers.push(
        onSnapshot(dungeonQuery, applyDungeonSnapshot, (err) => {
          console.warn('[ActiveInstance Listener] Dungeon (participant) error:', err);
          setLoading(false);
        })
      );
    }

    return () => {
      unsubscribers.forEach((u) => u());
    };
  }, [userId, battlefieldId]);

  return { activeInstance, loading };
}
