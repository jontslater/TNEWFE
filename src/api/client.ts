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
  
  async getHeroById(heroId: string): Promise<Hero> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockHero), 300);
      });
    }

    const response = await apiClient.get(`/api/heroes/${heroId}`);
    try {
      console.log('[HeroAPI] getHeroById response:', {
        heroId,
        id: response.data?.id,
        name: response.data?.name,
        role: response.data?.role,
        level: response.data?.level
      });
    } catch (e) {
      // ignore logging errors
    }
    return response.data;
  },
  
  async pinHero(userId: string): Promise<Hero> {
    const response = await apiClient.post(`/api/heroes/${userId}/pin`);
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

  async updateHeroById(heroId: string, updates: Partial<Hero>): Promise<Hero> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ ...mockHero, ...updates }), 300);
      });
    }
    
    const response = await apiClient.put(`/api/heroes/${heroId}`, updates);
    return response.data;
  },
  
  async deleteHero(heroId: string, userId: string): Promise<{ message: string }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ message: 'Hero deleted successfully' }), 300);
      });
    }
    
    const response = await apiClient.delete(`/api/heroes/${heroId}`, { data: { userId } });
    return response.data;
  },
  
  async getHeroCreationCostInfo(twitchUserId?: string, tiktokUserId?: string): Promise<{
    heroCount: number;
    maxHeroes: number;
    canCreateMore: boolean;
    cost: { tokens: number; price: number };
    availableTokens: number;
    canAffordWithTokens: boolean;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          heroCount: 0,
          maxHeroes: 10,
          canCreateMore: true,
          cost: { tokens: 0, price: 0 },
          availableTokens: 0,
          canAffordWithTokens: true
        }), 300);
      });
    }

    const params = new URLSearchParams();
    if (twitchUserId) params.append('twitchUserId', twitchUserId);
    if (tiktokUserId) params.append('tiktokUserId', tiktokUserId);

    const response = await apiClient.get(`/api/heroes/create/cost-info?${params.toString()}`);
    return response.data;
  },

  async createHero(classKey: string, twitchUserId?: string, tiktokUserId?: string, paymentMethod?: 'tokens' | 'payment'): Promise<Hero & { heroCount: number; maxHeroes: number }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          ...mockHero,
          heroCount: 1,
          maxHeroes: 10
        }), 300);
      });
    }

    const response = await apiClient.post('/api/heroes/create', {
      class: classKey,
      twitchUserId,
      tiktokUserId,
      paymentMethod
    });
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
  },

  async upgradeItem(userId: string, itemId: string, selectedStats: Array<{ type: string; value: number }>): Promise<{success: boolean, message: string, item: any, newGold: number}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ 
          success: true, 
          message: 'Item upgraded!',
          item: { id: itemId, upgradeLevel: 1, upgradeStats: [{ level: 1, selectedStats }] },
          newGold: 0
        }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/heroes/${userId}/upgrade-item`, { itemId, selectedStats });
    return response.data;
  },

  async reforgeItem(userId: string, itemId: string): Promise<{success: boolean, message: string, item: any, newGold: number}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ 
          success: true, 
          message: 'Item reforged!',
          item: { id: itemId },
          newGold: 0
        }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/heroes/${userId}/reforge-item`, { itemId });
    return response.data;
  },

  async expandStorage(userId: string, slots: number = 10): Promise<{success: boolean, message: string, newBankSize: number, newGold: number}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ 
          success: true, 
          message: 'Storage expanded!',
          newBankSize: 50,
          newGold: 0
        }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/heroes/${userId}/expand-storage`, { slots });
    return response.data;
  }
};

// Guild API
export const guildAPI = {
  async getAllGuilds(): Promise<Guild[]> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve([mockGuild]), 300);
      });
    }
    
    const response = await apiClient.get('/api/guilds');
    return response.data;
  },
  
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
  
  async createGuild(name: string, heroId: string, heroName?: string, heroRole?: string, heroLevel?: number): Promise<Guild> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          ...mockGuild,
          id: 'new-guild',
          name,
          createdBy: heroId
        }), 300);
      });
    }
    
    const response = await apiClient.post('/api/guilds', { 
      name, 
      createdBy: heroId, // Hero ID (not user ID)
      creatorHeroName: heroName || 'Unknown', // Hero name for display
      creatorUsername: heroName || 'Unknown', // Deprecated, but kept for compatibility
      heroRole: heroRole || 'warrior', // Hero class/role
      heroLevel: heroLevel || 1 // Hero level
    });
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
  },
  
  async getGuildMembersWithHeroes(guildId: string): Promise<{members: Array<{userId: string, username: string, hero: any | null}>}> {
    const response = await apiClient.get(`/api/guilds/${guildId}/members-with-heroes`);
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
  
  async simulateRaid(raidId: string, participants: string[]): Promise<{success: boolean, outcome: 'success' | 'failure', rewards: any, message: string}> {
    const response = await apiClient.post(`/api/raids/${raidId}/simulate`, { participants });
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

  async getUpcomingRaids(): Promise<{scheduledRaids: any[]}> {
    const response = await apiClient.get('/api/raids/upcoming');
    return response.data;
  },

  async getRaidInstance(instanceId: string, userId?: string): Promise<any> {
    const params = userId ? { userId } : {};
    const response = await apiClient.get(`/api/raids/instance/${instanceId}`, { params });
    return response.data;
  },

  async sendInstanceCommand(instanceId: string, userId: string, command: string): Promise<{success: boolean}> {
    const response = await apiClient.post(`/api/raids/instance/${instanceId}/command`, {
      userId,
      command
    });
    return response.data;
  },

  async sendInstanceChat(instanceId: string, userId: string, message: string): Promise<{success: boolean}> {
    const response = await apiClient.post(`/api/raids/instance/${instanceId}/chat`, {
      userId,
      message
    });
    return response.data;
  },

  async joinRaidQueue(raidId: string, userId: string, heroName: string, heroLevel: number, heroRole: string, itemScore: number): Promise<{success: boolean}> {
    const response = await apiClient.post(`/api/raids/queue/${raidId}/join`, {
      userId,
      heroName,
      heroLevel,
      heroRole,
      itemScore
    });
    return response.data;
  },

  async leaveRaidQueue(raidId: string, userId: string): Promise<{success: boolean}> {
    const response = await apiClient.post(`/api/raids/queue/${raidId}/leave`, { userId });
    return response.data;
  },

  async getRaidQueueStatus(raidId: string): Promise<any> {
    const response = await apiClient.get(`/api/raids/queue/${raidId}`);
    return response.data;
  },

  async createTestRaidInstance(organizerId: string, raidId?: string): Promise<{success: boolean, instanceId: string}> {
    const response = await apiClient.post('/api/raids/test-instance', {
      organizerId,
      raidId
    });
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
  },
  
  // Queue methods
  async joinQueue(raidId: string, userId: string, heroName: string, heroLevel: number, heroRole: string, itemScore: number): Promise<{success: boolean, message: string, position?: number, queueSize?: number, spotsRemaining?: number, autoStarted?: boolean, instanceId?: string}> {
    const response = await apiClient.post(`/api/raids/queue/${raidId}/join`, {
      userId,
      heroName,
      heroLevel,
      heroRole,
      itemScore
    });
    return response.data;
  },
  
  async leaveQueue(raidId: string, userId: string): Promise<{success: boolean, message: string}> {
    const response = await apiClient.post(`/api/raids/queue/${raidId}/leave`, { userId });
    return response.data;
  },
  
  async getQueueStatus(raidId: string): Promise<{queueSize: number, participants: any[], lastUpdated?: any}> {
    const response = await apiClient.get(`/api/raids/queue/${raidId}`);
    return response.data;
  },
  
  // Guild signup methods
  async getGuildRaidSignup(raidId: string, guildId: string): Promise<{signedUp: boolean, signup: any | null}> {
    const response = await apiClient.get(`/api/raids/${raidId}/guild-signup/${guildId}`);
    return response.data;
  },
  
  async guildSignupForRaid(raidId: string, guildId: string, assignedPlayers: any[], scheduledTime?: string): Promise<{success: boolean, signupId?: string, message: string}> {
    const response = await apiClient.post(`/api/raids/${raidId}/guild-signup`, {
      guildId,
      assignedPlayers,
      scheduledTime: scheduledTime || null
    });
    return response.data;
  },
  
  async createScheduledGuildRaid(raidId: string, guildId: string, signupData: {scheduledTime: string | null, organizer: string, organizerName: string, initialAssignments: any[], status: string}): Promise<{success: boolean, signupId: string}> {
    const response = await apiClient.post(`/api/raids/${raidId}/schedule`, {
      guildId,
      ...signupData
    });
    return response.data;
  },
  
  async signUpForScheduledRaid(signupId: string, heroId: string, heroName: string, heroLevel: number, heroRole: string, itemScore: number): Promise<{success: boolean}> {
    const response = await apiClient.post(`/api/raids/scheduled/${signupId}/signup`, {
      heroId,
      heroName,
      heroLevel,
      heroRole,
      itemScore
    });
    return response.data;
  },
  
  async leaveScheduledRaid(signupId: string, heroId: string): Promise<{success: boolean}> {
    const response = await apiClient.post(`/api/raids/scheduled/${signupId}/leave`, {
      heroId
    });
    return response.data;
  },
  
  async getGuildScheduledRaids(guildId: string): Promise<any[]> {
    const response = await apiClient.get(`/api/raids/scheduled/guild/${guildId}`);
    return response.data;
  },
  
  async startScheduledRaid(signupId: string): Promise<{success: boolean, instanceId: string}> {
    const response = await apiClient.post(`/api/raids/scheduled/${signupId}/start`);
    return response.data;
  },
  
  async deleteScheduledRaid(signupId: string, organizerId: string): Promise<{success: boolean}> {
    const response = await apiClient.delete(`/api/raids/scheduled/${signupId}`, {
      data: { organizerId }
    });
    return response.data;
  },
  
  async updateGuildRaidSignup(raidId: string, guildId: string, assignedPlayers: any[]): Promise<{success: boolean, message: string}> {
    const response = await apiClient.put(`/api/raids/${raidId}/guild-signup/${guildId}`, {
      assignedPlayers
    });
    return response.data;
  },
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
  },

  async updateQuestProgressBatch(userId: string, updates: Array<{ trackingKey: string; type: 'daily' | 'weekly' | 'monthly'; increment: number }>) {
    const response = await apiClient.post(`/api/quests/${userId}/update-batch`, { updates });
    return response.data;
  }
};

// Skills API
export const skillsAPI = {
  async getAllSkills() {
    const response = await apiClient.get('/api/skills');
    return response.data;
  },
  
  async getClassSkills(className: string) {
    const response = await apiClient.get(`/api/skills/class/${className}`);
    return response.data;
  },
  
  async getHeroSkills(userId: string) {
    const response = await apiClient.get(`/api/skills/${userId}`);
    return response.data;
  },
  
  async allocateSkillPoint(userId: string, skillId: string) {
    const response = await apiClient.post(`/api/skills/${userId}/allocate`, { skillId });
    return response.data;
  },
  
  async resetSkills(userId: string, cost?: number) {
    const response = await apiClient.post(`/api/skills/${userId}/reset`, { cost });
    return response.data;
  },

  async addRetroactivePoints(userId: string) {
    const response = await apiClient.post(`/api/skills/retroactive-points/${userId}`);
    return response.data;
  }
};

// Auction House API
export const auctionAPI = {
  async getListings(filters?: any) {
    const response = await apiClient.get('/api/auction/listings', { params: filters });
    return response.data;
  },
  
  async createListing(sellerId: string, sellerUsername: string, item: any, startingPrice: number, buyoutPrice?: number, currency: 'gold' | 'tokens' = 'gold') {
    const response = await apiClient.post('/api/auction/list', {
      sellerId,
      sellerUsername,
      item,
      startingPrice,
      buyoutPrice,
      currency
    });
    return response.data;
  },
  
  async placeBid(listingId: string, userId: string, username: string, amount: number) {
    const response = await apiClient.post(`/api/auction/${listingId}/bid`, {
      userId,
      username,
      amount
    });
    return response.data;
  },
  
  async buyout(listingId: string, userId: string, username: string) {
    const response = await apiClient.post(`/api/auction/${listingId}/buyout`, {
      userId,
      username
    });
    return response.data;
  },
  
  async cancelListing(listingId: string, userId: string) {
    const response = await apiClient.post(`/api/auction/${listingId}/cancel`, { userId });
    return response.data;
  },
  
  async getMyListings(userId: string) {
    const response = await apiClient.get(`/api/auction/my-listings/${userId}`);
    return response.data;
  },
  
  async getMyBids(userId: string) {
    const response = await apiClient.get(`/api/auction/my-bids/${userId}`);
    return response.data;
  },
  
  async getHistory(userId: string) {
    const response = await apiClient.get(`/api/auction/history/${userId}`);
    return response.data;
  }
};

// Enhanced Guild API
export const enhancedGuildAPI = {
  ...guildAPI,
  
  async applyToGuild(guildId: string, userId: string, username: string, message?: string) {
    const response = await apiClient.post(`/api/guilds/${guildId}/apply`, {
      userId,
      username,
      message
    });
    return response.data;
  },
  
  async approveApplication(guildId: string, userId: string, approverId: string) {
    const response = await apiClient.post(`/api/guilds/${guildId}/approve/${userId}`, {
      approverId
    });
    return response.data;
  },
  
  async rejectApplication(guildId: string, userId: string, approverId: string) {
    const response = await apiClient.post(`/api/guilds/${guildId}/reject/${userId}`, {
      approverId
    });
    return response.data;
  },
  
  async updateGuildSettings(guildId: string, userId: string, joinMode?: 'open' | 'approval') {
    const response = await apiClient.put(`/api/guilds/${guildId}/settings`, {
      userId,
      joinMode
    });
    return response.data;
  },
  
  async assignLoot(guildId: string, userId: string, itemId: string, assignedTo: string) {
    const response = await apiClient.post(`/api/guilds/${guildId}/loot/assign`, {
      userId,
      itemId,
      assignedTo
    });
    return response.data;
  },
  
  async getGuildLoot(guildId: string) {
    const response = await apiClient.get(`/api/guilds/${guildId}/loot`);
    return response.data;
  },
  
  async getGuildLootHistory(guildId: string) {
    const response = await apiClient.get(`/api/guilds/${guildId}/loot/history`);
    return response.data;
  }
};

// Battlefield API
export const battlefieldAPI = {
  async getBattlefieldHeroes(battlefieldId: string) {
    const response = await apiClient.get(`/api/battlefields/${battlefieldId}/heroes`);
    return response.data;
  },
  
  async getBattlefieldState(battlefieldId: string) {
    // URL encode the battlefieldId to handle colons and special characters
    const encodedId = encodeURIComponent(battlefieldId);
    const response = await apiClient.get(`/api/battlefields/${encodedId}/state`);
    return response.data;
  },
  
  async getActiveBattlefields() {
    const response = await apiClient.get('/api/battlefields/active');
    return response.data;
  },
  
  async portHero(userId: string, battlefieldId: string, battlefieldType?: 'world' | 'streamer') {
    const response = await apiClient.post(`/api/heroes/${userId}/port`, {
      battlefieldId,
      battlefieldType
    });
    return response.data;
  },
  
  async registerBrowserSource(battlefieldId: string, userId: string, token: string) {
    const response = await apiClient.post('/api/battlefields/register', {
      battlefieldId,
      userId,
      token
    });
    return response.data;
  },
  
  async saveSpriteFacingPreference(userId: string, spriteName: string, facing: 'left' | 'right') {
    const response = await apiClient.post('/api/battlefields/preferences/sprite-facing', {
      userId,
      spriteName,
      facing
    });
    return response.data;
  },
  
  async getSpriteFacingPreferences(userId: string) {
    const response = await apiClient.get(`/api/battlefields/preferences/sprite-facing/${userId}`);
    return response.data.preferences || {};
  },
  
  async saveBulkSpriteFacingPreferences(userId: string, preferences: Record<string, 'left' | 'right'>) {
    const response = await apiClient.post('/api/battlefields/preferences/sprite-facing/bulk', {
      userId,
      preferences
    });
    return response.data;
  }
};

// Achievement API
export const achievementAPI = {
  async getAllAchievements(category?: string) {
    const response = await apiClient.get('/api/achievements', { params: { category } });
    return response.data;
  },
  
  async getHeroAchievements(heroId: string) {
    const response = await apiClient.get(`/api/achievements/${heroId}`);
    return response.data;
  },
  
  async setActiveTitle(heroId: string, title: string) {
    const response = await apiClient.put(`/api/achievements/${heroId}/title`, { title });
    return response.data;
  }
};

// Leaderboard API
export const leaderboardAPI = {
  async getLeaderboard(type: 'global' | 'guild', category: string, timeframe?: string) {
    const params = timeframe ? { timeframe } : {};
    const response = await apiClient.get(`/api/leaderboards/${type}/${category}`, { params });
    return response.data;
  },
  
  async getUserRankings(userId: string) {
    const response = await apiClient.get(`/api/leaderboards/user/${userId}`);
    return response.data;
  }
};

// Login Reward API
export const loginRewardAPI = {
  async claimReward(userId: string, provider: 'twitch' | 'tiktok' = 'twitch') {
    const response = await apiClient.post(`/api/heroes/login-reward/${userId}`, { provider });
    return response.data;
  },
  
  async getStatus(userId: string, provider: 'twitch' | 'tiktok' = 'twitch') {
    const response = await apiClient.get(`/api/heroes/login-reward/${userId}/status`);
    return response.data;
  }
};

// Dungeon Finder API
export const dungeonAPI = {
  async joinQueue(userId: string, heroId: string, role: 'tank' | 'healer' | 'dps', itemScore: number, dungeonType: 'normal' | 'heroic' | 'mythic' = 'normal') {
    const response = await apiClient.post('/api/dungeon/queue', {
      userId,
      heroId,
      role,
      itemScore,
      dungeonType
    });
    return response.data;
  },
  
  async leaveQueue(userId: string) {
    const response = await apiClient.delete('/api/dungeon/queue', { data: { userId } });
    return response.data;
  },
  
  async getQueueStatus(userId: string) {
    const response = await apiClient.get('/api/dungeon/queue/status', { params: { userId } });
    return response.data;
  },
  
  async acceptGroupInvite(userId: string, groupId: string) {
    const response = await apiClient.post('/api/dungeon/group/accept', {
      userId,
      groupId
    });
    return response.data;
  }
};

// Enchanting API
export const enchantingAPI = {
  async applyEnchantment(userId: string, itemId: string, enchantmentType: string, enchantmentLevel: number) {
    const response = await apiClient.post(`/api/enchanting/${userId}/enchant`, {
      itemId,
      enchantmentType,
      enchantmentLevel
    });
    return response.data;
  },
  
  async getEnchantments(userId: string) {
    const response = await apiClient.get(`/api/enchanting/${userId}/enchantments`);
    return response.data;
  },
  
  async getEnchantmentsForSlot(slot: string) {
    const response = await apiClient.get(`/api/enchanting/enchantments/${slot}`);
    return response.data;
  },
  
  async getAllEnchantments() {
    const response = await apiClient.get('/api/enchanting/enchantments');
    return response.data;
  }
};

// Founders Pack API
export const foundersPackAPI = {
  /**
   * Initiate a founders pack purchase
   * @param userId - User ID
   * @param packTier - Pack tier ID ('bronze' | 'silver' | 'gold' | 'platinum')
   * @returns Purchase session data including payment intent ID
   */
  async initiatePurchase(userId: string, packTier: 'bronze' | 'silver' | 'gold' | 'platinum'): Promise<{
    success: boolean;
    purchaseId: string;
    sessionId?: string; // Stripe session ID when ready
    message: string;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          purchaseId: `mock-${Date.now()}`,
          message: 'Purchase initiated (mock)'
        }), 300);
      });
    }

    const response = await apiClient.post('/api/purchases/founders-pack', {
      userId,
      packTier
    });
    return response.data;
  },

  /**
   * Check purchase status
   * @param purchaseId - Purchase ID from initiatePurchase
   * @returns Purchase status and completion details
   */
  async getPurchaseStatus(purchaseId: string): Promise<{
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    packTier?: string;
    badgeAssigned?: boolean;
    message?: string;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          status: 'pending',
          message: 'Purchase pending (mock)'
        }), 300);
      });
    }

    const response = await apiClient.get(`/api/purchases/status/${purchaseId}`);
    return response.data;
  },

  /**
   * Complete purchase after payment processing
   * This will be called by the backend webhook when Stripe payment completes
   * Frontend can poll getPurchaseStatus instead
   */
  async completePurchase(purchaseId: string): Promise<{
    success: boolean;
    badgeAssigned: boolean;
    titleAssigned: boolean;
    tokensAdded: boolean;
    message: string;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          badgeAssigned: true,
          titleAssigned: true,
          tokensAdded: true,
          message: 'Purchase completed (mock)'
        }), 300);
      });
    }

    const response = await apiClient.post(`/api/purchases/complete/${purchaseId}`);
    return response.data;
  }
};

export { apiClient };
