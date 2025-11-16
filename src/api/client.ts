import axios from 'axios';
import { Hero } from '../types/Hero';
import { Guild } from '../types/Guild';
import { Raid, WorldBoss } from '../types/Raid';
import { mockHero, mockGuild, mockRaids, mockWorldBoss } from './mock-data';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'; // Default to backend API

// API Client
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Hero API
export const heroAPI = {
  async getAllHeroes(): Promise<Hero[]> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve([mockHero]), 300);
      });
    }

    const response = await apiClient.get('/api/heroes');
    try {
      console.log('[HeroAPI] getAllHeroes response:', {
        count: Array.isArray(response.data) ? response.data.length : 0
      });
    } catch {
      // ignore logging errors
    }
    return response.data;
  },
  async getHero(userId: string): Promise<Hero> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockHero), 300);
      });
    }
    
    // IMPORTANT: Use the Twitch user ID lookup so we get the active character document
    // instead of assuming the hero document ID == userId.
    const response = await apiClient.get(`/api/heroes/twitch/${userId}`);

    // Debug logging to inspect what the backend is returning for hero + equipment
    try {
      // eslint-disable-next-line no-console
      console.log('[HeroAPI] getHero response:', {
        userId,
        id: response.data?.id,
        name: response.data?.name,
        role: response.data?.role,
        level: response.data?.level,
        equipment: response.data?.equipment,
      });
      if (response.data?.equipment) {
        // eslint-disable-next-line no-console
        console.log('[HeroAPI] equipment slots:', Object.keys(response.data.equipment));
      }
    } catch (e) {
      // Swallow logging errors – this is only for debugging in the browser console
    }

    return response.data;
  },
  
  async getHeroesByTwitchId(twitchUserId: string): Promise<Hero[]> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve([mockHero]), 300);
      });
    }

    const response = await apiClient.get(`/api/heroes/twitch/${twitchUserId}/all`);
    try {
      console.log('[HeroAPI] getHeroesByTwitchId response:', {
        twitchUserId,
        count: Array.isArray(response.data) ? response.data.length : 0,
        heroes: response.data?.map((h: any) => ({
          id: h.id,
          name: h.name,
          role: h.role,
          level: h.level
        }))
      });
    } catch (e) {
      // ignore logging errors
    }
    return response.data;
  },
  
  async updateHero(userId: string, updates: Partial<Hero>): Promise<Hero> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ ...mockHero, ...updates }), 300);
      });
    }
    
    const response = await apiClient.put(`/api/heroes/${userId}`, updates);
    return response.data;
  },
  
  async deleteHero(heroId: string): Promise<{ success: boolean }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 300);
      });
    }

    await apiClient.delete(`/api/heroes/${heroId}`);
    return { success: true };
  },
  
  async craftElixir(userId: string, recipeKey: string, cost: any, tier: number = 1, quantity: number = 1): Promise<{success: boolean, message: string}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'Crafted successfully!'
        }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/professions/${userId}/craft`, { 
      recipeKey, 
      cost, 
      tier, 
      quantity 
    });
    return response.data;
  },
  
  async useElixir(userId: string, itemKey: string): Promise<{success: boolean, message: string}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'Elixir used!'
        }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/professions/${userId}/use`, { itemKey });
    return response.data;
  },
  
  async chooseProfession(userId: string, type: 'herbalism' | 'mining' | 'enchanting'): Promise<{success: boolean}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/professions/${userId}/profession`, { type });
    return response.data;
  },
  
  async equipItem(userId: string, slot: string, item: any): Promise<{success: boolean}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/professions/${userId}/equip`, { slot, item });
    return response.data;
  },
  
  async unequipItem(userId: string, slot: string): Promise<{success: boolean}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/professions/${userId}/unequip`, { slot });
    return response.data;
  },

  async applyUpgrade(userId: string, itemId: string, equipmentSlot: string): Promise<{success: boolean, message: string}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: 'Upgrade applied!' }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/professions/${userId}/apply`, { itemId, equipmentSlot });
    return response.data;
  },

  async purchaseGoldItem(userId: string, itemKey: string): Promise<{success: boolean, message: string}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: 'Item purchased!' }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/heroes/${userId}/purchase/gold`, { itemKey });
    return response.data;
  },

  async purchaseTokenGear(userId: string, rarity: string, slot: string): Promise<{success: boolean, message: string, item: any}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ 
          success: true, 
          message: 'Gear purchased!',
          item: { name: `${rarity} ${slot}`, rarity, slot }
        }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/heroes/${userId}/purchase/tokens`, { rarity, slot });
    return response.data;
  }
};

// Guild API
export const guildAPI = {
  async getGuild(guildId: string): Promise<Guild> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockGuild), 300);
      });
    }
    
    const response = await apiClient.get(`/api/guilds/${guildId}`);
    return response.data;
  },
  
  async getMyGuild(userId: string): Promise<Guild | null> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockGuild), 300);
      });
    }
    
    const response = await apiClient.get(`/api/guilds/member/${userId}`);
    return response.data;
  },
  
  async createGuild(name: string, userId: string): Promise<Guild> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          ...mockGuild,
          id: 'new-guild',
          name,
          createdBy: userId
        }), 300);
      });
    }
    
    const response = await apiClient.post('/api/guilds', { name, userId });
    return response.data;
  },
  
  async joinGuild(guildId: string, userId: string): Promise<{success: boolean}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/guilds/${guildId}/join`, { userId });
    return response.data;
  },
  
  async leaveGuild(guildId: string, userId: string): Promise<{success: boolean}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/guilds/${guildId}/leave`, { userId });
    return response.data;
  },
  
  async depositToBank(guildId: string, userId: string, materials: any): Promise<{success: boolean}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/guilds/${guildId}/bank/deposit`, { userId, materials });
    return response.data;
  }
};

// Raid API
export const raidAPI = {
  async getRaids(type?: 'daily' | 'weekly' | 'monthly'): Promise<Raid[]> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        const filtered = type ? mockRaids.filter(r => r.type === type) : mockRaids;
        setTimeout(() => resolve(filtered), 300);
      });
    }
    
    const response = await apiClient.get('/api/raids', { params: { type } });
    return response.data;
  },
  
  async getAvailableRaids(userId: string): Promise<{heroLevel: number, itemScore: number, availableRaids: any[]}> {
    const response = await apiClient.get(`/api/raids/available/${userId}`);
    return response.data;
  },
  
  async startRaid(raidId: string, participants: string[]): Promise<{success: boolean, instanceId: string, raidData: any}> {
    const response = await apiClient.post(`/api/raids/${raidId}/start`, { participants });
    return response.data;
  },
  
  async getRaidInstanceStatus(instanceId: string): Promise<any> {
    const response = await apiClient.get(`/api/raids/instance/${instanceId}/status`);
    return response.data;
  },
  
  async updateRaidProgress(instanceId: string, wave: number, participants: any[], combatLogEntries: any[]): Promise<{success: boolean}> {
    const response = await apiClient.post(`/api/raids/instance/${instanceId}/progress`, { 
      wave, 
      participants, 
      combatLogEntries 
    });
    return response.data;
  },
  
  async completeRaid(instanceId: string, success: boolean, finalParticipants: any[], finalCombatLog: any[]): Promise<any> {
    const response = await apiClient.post(`/api/raids/instance/${instanceId}/complete`, { 
      success, 
      finalParticipants, 
      finalCombatLog 
    });
    return response.data;
  },
  
  async signupForRaid(raidId: string, guildId: string, participants: string[]): Promise<{success: boolean}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/raids/${raidId}/signup`, { guildId, participants });
    return response.data;
  },
  
  async getWorldBoss(): Promise<WorldBoss | null> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockWorldBoss), 300);
      });
    }
    
    const response = await apiClient.get('/api/worldboss/active');
    return response.data.worldBoss;
  },
  
  async joinWorldBoss(bossId: string, userId: string, username: string, heroLevel: number, heroRole: string): Promise<{success: boolean}> {
    const response = await apiClient.post(`/api/worldboss/${bossId}/join`, { 
      userId, 
      username, 
      heroLevel, 
      heroRole 
    });
    return response.data;
  },
  
  async submitWorldBossDamage(bossId: string, userId: string, damageDealt: number, healingDone: number, damageBlocked: number, newHp?: number): Promise<{success: boolean, bossHp: number, defeated: boolean}> {
    const response = await apiClient.post(`/api/worldboss/${bossId}/damage`, { 
      userId, 
      damageDealt, 
      healingDone, 
      damageBlocked, 
      newHp 
    });
    return response.data;
  },
  
  async getWorldBossLeaderboard(bossId: string, type: 'damage' | 'healing' | 'tanking' = 'damage'): Promise<{leaderboard: any[], type: string, totalParticipants: number}> {
    const response = await apiClient.get(`/api/worldboss/${bossId}/leaderboard`, { params: { type } });
    return response.data;
  },
  
  async signupForWorldBoss(userId: string): Promise<{success: boolean}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 300);
      });
    }
    
    const response = await apiClient.post('/api/worldboss/signup', { userId });
    return response.data;
  }
};

// Auth API
export const authAPI = {
  async loginWithTwitch(code: string): Promise<{user: any, token: string}> {
    const response = await apiClient.post('/api/auth/twitch', { code });
    return response.data;
  },
  
  async loginWithTikTok(code: string): Promise<{user: any, token: string}> {
    const response = await apiClient.post('/api/auth/tiktok', { code });
    return response.data;
  },
  
  async linkTikTok(userId: string, code: string): Promise<{success: boolean}> {
    const response = await apiClient.post('/api/auth/tiktok/link', { userId, code });
    return response.data;
  },
  
  async getCurrentUser(): Promise<any> {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  }
};

// Quest API
export const questAPI = {
  async getDailyQuests() {
    const response = await apiClient.get('/api/quests/daily');
    return response.data;
  },
  
  async getWeeklyQuests() {
    const response = await apiClient.get('/api/quests/weekly');
    return response.data;
  },
  
  async getMonthlyQuests() {
    const response = await apiClient.get('/api/quests/monthly');
    return response.data;
  },
  
  async getPlayerProgress(userId: string) {
    const response = await apiClient.get(`/api/quests/${userId}/progress`);
    return response.data;
  },
  
  async updateQuestProgress(userId: string, questId: string, progress: number) {
    const response = await apiClient.post(`/api/quests/${userId}/update/${questId}`, { progress });
    return response.data;
  },
  
  async claimQuestReward(userId: string, questId: string, type: 'daily' | 'weekly' | 'monthly') {
    const response = await apiClient.post(`/api/quests/${userId}/claim/${questId}`, { type });
    return response.data;
  },
  
  async claimCompletionBonus(userId: string, type: 'daily' | 'weekly' | 'monthly') {
    const response = await apiClient.post(`/api/quests/${userId}/claim-bonus/${type}`);
    return response.data;
  },
  
  async claimAllQuests(userId: string, type?: 'daily' | 'weekly' | 'monthly') {
    const response = await apiClient.post(`/api/quests/claim-all/${userId}`, { type });
    return response.data;
  }
};

export { apiClient };
