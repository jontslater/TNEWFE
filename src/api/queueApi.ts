/**
 * Battlefield queue REST API — matches idleDnD-Backend docs/QUEUE_API.md
 */
import { apiClient } from './client';
import { normalizeQueueSnapshot } from '../utils/queueSnapshot';

export type QueueRole = 'tank' | 'healer' | 'dps';
export type QueueStatus = 'open' | 'ready' | 'launching';

export interface BattlefieldQueueSnapshot {
  /** Firestore doc id / route param: `twitch:{streamerTwitchId}` */
  id: string;
  battlefieldId: string;
  streamerId: string;
  code: string;
  type: 'raid' | 'dungeon';
  queueKey?: string;
  contentId?: string;
  status: QueueStatus;
  isReady?: boolean;
  /** Epoch ms (REST JSON); normalized from Firestore Timestamp in listeners */
  launchAt?: number | null;
  requirements?: {
    roles?: {
      tank?: { current: number; required: number };
      healer?: { current: number; required: number };
      dps?: { current: number; required: number };
    };
  };
  participants?: Array<{ heroId: string; role?: string; heroName?: string }>;
}

export interface GetQueueResponse {
  queue: BattlefieldQueueSnapshot | null;
}

export interface JoinQueueResponse {
  success: boolean;
  message?: string;
  queue?: BattlefieldQueueSnapshot;
  isReady?: boolean;
}

function parseApiError(error: unknown): string {
  const err = error as {
    response?: { data?: { error?: string; message?: string } };
    message?: string;
  };
  return (
    err.response?.data?.error ||
    err.response?.data?.message ||
    err.message ||
    'Request failed'
  );
}

function normalizeGetResponse(
  data: { queue?: Record<string, unknown> | null },
  twitchId: string
): GetQueueResponse {
  const docId = `twitch:${twitchId}`;
  const queue = data.queue
    ? normalizeQueueSnapshot(data.queue as Record<string, unknown>, docId)
    : null;
  return { queue };
}

export const queueAPI = {
  async getQueue(twitchId: string): Promise<GetQueueResponse> {
    const response = await apiClient.get<{ queue?: Record<string, unknown> | null }>(
      `/api/queues/${twitchId}`
    );
    return normalizeGetResponse(response.data, twitchId);
  },

  async createQueue(body: {
    twitchId: string;
    type: 'raid' | 'dungeon';
    queueKey: string;
  }): Promise<{ success: boolean; queue: BattlefieldQueueSnapshot; message?: string }> {
    const response = await apiClient.post(`/api/queues`, body);
    const docId = `twitch:${body.twitchId}`;
    const queue = normalizeQueueSnapshot(
      response.data.queue as Record<string, unknown>,
      docId
    );
    if (!queue) {
      throw new Error('Invalid queue response from server');
    }
    return { ...response.data, queue };
  },

  async joinQueue(
    queueDocId: string,
    body: { heroId: string }
  ): Promise<JoinQueueResponse> {
    try {
      const response = await apiClient.post<JoinQueueResponse>(
        `/api/queues/${encodeURIComponent(queueDocId)}/join`,
        body
      );
      const rawQueue = response.data.queue;
      const queue = rawQueue
        ? normalizeQueueSnapshot(
            rawQueue as unknown as Record<string, unknown>,
            queueDocId
          )
        : undefined;
      return { ...response.data, queue: queue ?? undefined };
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  },

  async leaveQueue(queueDocId: string): Promise<{ success: boolean; message?: string; queue?: BattlefieldQueueSnapshot }> {
    try {
      const response = await apiClient.post(
        `/api/queues/${encodeURIComponent(queueDocId)}/leave`
      );
      const rawQueue = response.data.queue;
      const queue = rawQueue
        ? normalizeQueueSnapshot(
            rawQueue as unknown as Record<string, unknown>,
            queueDocId
          )
        : undefined;
      return { ...response.data, queue: queue ?? undefined };
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  },
};
