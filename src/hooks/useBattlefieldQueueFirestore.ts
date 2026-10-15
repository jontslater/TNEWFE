import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import type { BattlefieldQueueSnapshot } from '../api/queueApi';
import { normalizeQueueSnapshot } from '../utils/queueSnapshot';

/**
 * Real-time open queue for a streamer battlefield (OBS overlay strip).
 */
export function useBattlefieldQueueFirestore(battlefieldId: string | null) {
  const [queue, setQueue] = useState<BattlefieldQueueSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!battlefieldId) {
      setQueue(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const queueRef = doc(db, 'battlefieldQueues', battlefieldId);

    const unsubscribe = onSnapshot(
      queueRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setQueue(null);
        } else {
          setQueue(normalizeQueueSnapshot(snapshot.data() as Record<string, unknown>, snapshot.id));
        }
        setLoading(false);
      },
      (error) => {
        console.error('[BattlefieldQueue] Listener error:', error);
        setQueue(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [battlefieldId]);

  return { queue, loading };
}
