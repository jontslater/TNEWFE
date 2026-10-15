import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import type { BattlefieldQueueSnapshot } from '../api/queueApi';

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
          const data = snapshot.data();
          setQueue({
            queueId: data.queueId || snapshot.id,
            twitchId: data.twitchId || battlefieldId.replace(/^twitch:/, ''),
            battlefieldId,
            type: data.type || 'raid',
            joinCode: data.code || data.joinCode || '',
            code: data.code,
            name: data.name,
            contentId: data.contentId,
            status: data.status || 'open',
            requirements: data.requirements,
            rolesRequired: data.rolesRequired,
            rolesFilled: data.rolesFilled,
            countdownEndsAt: data.countdownEndsAt,
            autoStartAt: data.autoStartAt,
            participants: data.participants,
          });
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
