import type { BattlefieldQueueSnapshot, QueueStatus } from '../api/queueApi';

/** Parse launchAt from REST (epoch ms), Firestore Timestamp, or legacy shapes. */
export function parseLaunchAtMs(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'object' && value !== null) {
    const v = value as {
      toMillis?: () => number;
      seconds?: number;
      _seconds?: number;
    };
    if (typeof v.toMillis === 'function') return v.toMillis();
    if (typeof v.seconds === 'number') return v.seconds * 1000;
    if (typeof v._seconds === 'number') return v._seconds * 1000;
  }
  return null;
}

function normalizeStatus(raw: unknown): QueueStatus {
  if (raw === 'open' || raw === 'ready' || raw === 'launching') return raw;
  return 'open';
}

/**
 * Doc id for POST /api/queues/:queueId/join|leave — always `twitch:{streamerTwitchId}`.
 */
export function queueDocumentId(
  queue: Pick<BattlefieldQueueSnapshot, 'id' | 'battlefieldId'> | null | undefined,
  streamerTwitchId?: string
): string | null {
  if (queue?.id) return queue.id;
  if (queue?.battlefieldId) return queue.battlefieldId;
  if (streamerTwitchId) return `twitch:${streamerTwitchId}`;
  return null;
}

export function normalizeQueueSnapshot(
  raw: Record<string, unknown> | null | undefined,
  docId?: string
): BattlefieldQueueSnapshot | null {
  if (!raw) return null;

  const streamerId =
    (typeof raw.streamerId === 'string' && raw.streamerId) ||
    (typeof raw.twitchId === 'string' && raw.twitchId) ||
    '';

  const battlefieldId =
    (typeof raw.battlefieldId === 'string' && raw.battlefieldId) ||
    (docId && docId.startsWith('twitch:') ? docId : streamerId ? `twitch:${streamerId}` : docId) ||
    '';

  const id = docId || battlefieldId;
  if (!id) return null;

  const code = typeof raw.code === 'string' ? raw.code : '';

  return {
    id,
    battlefieldId,
    streamerId: streamerId || id.replace(/^twitch:/, ''),
    code,
    type: raw.type === 'dungeon' ? 'dungeon' : 'raid',
    queueKey: typeof raw.queueKey === 'string' ? raw.queueKey : undefined,
    contentId: typeof raw.contentId === 'string' ? raw.contentId : undefined,
    status: normalizeStatus(raw.status),
    isReady: typeof raw.isReady === 'boolean' ? raw.isReady : undefined,
    launchAt: parseLaunchAtMs(raw.launchAt),
    requirements: raw.requirements as BattlefieldQueueSnapshot['requirements'],
    participants: Array.isArray(raw.participants)
      ? (raw.participants as BattlefieldQueueSnapshot['participants'])
      : undefined,
  };
}
