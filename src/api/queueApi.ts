/**
 * Chat battlefield queue REST API (portal).
 * Shapes assumed until backend docs/QUEUE_API.md lands on cursor/fix-critical-issues-3f3e.
 */
import { apiClient } from './client';

export type QueueRole = 'tank' | 'healer' | 'dps';

export interface BattlefieldQueueRoles {
  tank: number;
  healer: number;
  dps: number;
}

export interface BattlefieldQueueSnapshot {
  queueId: string;
  twitchId: string;
  battlefieldId: string;
  type: 'raid' | 'dungeon';
  joinCode: string;
  code?: string;
  name?: string;
  contentId?: string;
  status: 'open' | 'full' | 'countdown' | 'launched' | string;
  rolesRequired?: BattlefieldQueueRoles;
  rolesFilled?: BattlefieldQueueRoles;
  requirements?: {
    roles?: {
      tank?: { current: number; required: number };
      healer?: { current: number; required: number };
      dps?: { current: number; required: number };
    };
  };
  countdownEndsAt?: string | number | { _seconds: number };
  autoStartAt?: string | number | { _seconds: number };
  participants?: Array<{ heroId: string; role?: string; heroName?: string }>;
}

export interface GetQueueResponse {
  queue: BattlefieldQueueSnapshot | null;
}

export interface JoinQueueRequest {
  heroId: string;
  twitchUserId?: string;
  role?: QueueRole;
}

export interface JoinQueueResponse {
  success: boolean;
  message?: string;
  queue?: BattlefieldQueueSnapshot;
}

function parseApiError(error: unknown): string {
  const err = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
  return err.response?.data?.error || err.response?.data?.message || err.message || 'Request failed';
}

export const queueAPI = {
  async getQueue(twitchId: string): Promise<GetQueueResponse> {
    const response = await apiClient.get<GetQueueResponse>(`/api/queues/${twitchId}`);
    return response.data;
  },

  async createQueue(body: {
    twitchId: string;
    type: 'raid' | 'dungeon';
    contentId: string;
    name?: string;
  }): Promise<{ success: boolean; queue: BattlefieldQueueSnapshot }> {
    const response = await apiClient.post(`/api/queues`, body);
    return response.data;
  },

  async joinQueue(queueId: string, body: JoinQueueRequest): Promise<JoinQueueResponse> {
    try {
      const response = await apiClient.post<JoinQueueResponse>(`/api/queues/${queueId}/join`, body);
      return response.data;
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  },

  async leaveQueue(queueId: string, body: { heroId: string }): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.post(`/api/queues/${queueId}/leave`, body);
      return response.data;
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  },
};
