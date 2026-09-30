import axios from 'axios';
import { Hero } from '../types/Hero';
import { Guild } from '../types/Guild';
import { Raid, WorldBoss } from '../types/Raid';
import { mockHero, mockGuild, mockRaids, mockWorldBoss } from './mock-data';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'; // Default to backend API

// API Client (for portal/authenticated routes)
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

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401/403 errors globally
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear invalid token
      localStorage.removeItem('auth_token');
      // Only redirect if not already on auth callback or home page
      const currentPath = window.location.pathname;
      if (currentPath !== '/' && !currentPath.includes('/auth/callback')) {
        console.warn('Authentication token expired or invalid. Redirecting to home...');
        // Use setTimeout to avoid navigation during render
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

// Overlay API Client (for browser-source/overlay routes using streamer keys)
const overlayClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add streamer key OR auth token to overlay requests
overlayClient.interceptors.request.use((config) => {
  // Try streamer key first (for browser source/overlay)
  const streamerKey = sessionStorage.getItem('streamer_key');
  if (streamerKey) {
    config.headers['X-Streamer-Key'] = streamerKey;
  } else {
    // Fall back to JWT for authenticated portal access
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Overlay client does NOT redirect on 401 (overlay runs in OBS, not browser)
overlayClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error('[Overlay] Auth error:', error.response?.data?.error || 'Unauthorized');
      // Log but don't redirect (overlay context)
    }
    return Promise.reject(error);
  }
);

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
       
      console.log('[HeroAPI] getHero response:', {
        userId,
        id: response.data?.id,
        name: response.data?.name,
        role: response.data?.role,
        level: response.data?.level,
        equipment: response.data?.equipment,
      });
      if (response.data?.equipment) {
         
        console.log('[HeroAPI] equipment slots:', Object.keys(response.data.equipment));
      }
    } catch (e) {
      // Swallow logging errors – this is only for debugging in the browser console
    }

    return response.data;
  },
  
  async renameHero(heroId: string, newName: string): Promise<{
    success: boolean;
    message: string;
    heroId: string;
    newName: string;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'Hero renamed successfully',
          heroId,
          newName
        }), 300);
      });
    }

    const response = await apiClient.patch(`/api/heroes/${heroId}/rename`, {
      newName
    });
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
  
  async deleteHero(heroId: string, userId?: string): Promise<{ message?: string; success?: boolean }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ message: 'Hero deleted successfully', success: true }), 300);
      });
    }
    
    const response = await apiClient.delete(`/api/heroes/${heroId}`, { 
      data: userId ? { userId } : {} 
    });
    return response.data || { success: true, message: 'Hero deleted successfully' };
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

  async claimIdleRewards(userId: string): Promise<{
    success: boolean;
    message: string;
    data?: { tokensClaimed: number; totalTokens: number; hoursSinceClaim: number; tokensPerHour: number; lastTokenClaim?: number };
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'Claimed 5 idle tokens! (Total: 100 tokens)',
          data: { tokensClaimed: 5, totalTokens: 100, hoursSinceClaim: 2, tokensPerHour: 2.5 }
        }), 300);
      });
    }

    try {
      const response = await apiClient.post(`/api/heroes/${userId}/claim-idle-rewards`);
      return response.data;
    } catch (error: any) {
      // Handle 400 responses (like "no tokens available") as valid responses, not errors
      if (error.response?.status === 400 && error.response?.data) {
        // Return the response data directly (has success: false and message)
        return error.response.data;
      }
      // Re-throw actual errors
      throw error;
    }
  },

  async getSlotInfo(userId: string, twitchUserId?: string, tiktokUserId?: string): Promise<{
    slotsUnlocked: number;
    heroCount: number;
    nextSlot: number;
    nextSlotCost: number | null;
    totalTokens: number;
    maxHeroes: number;
    canUnlock: boolean;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          slotsUnlocked: 3,
          heroCount: 2,
          nextSlot: 4,
          nextSlotCost: 500,
          totalTokens: 1000,
          maxHeroes: 20,
          canUnlock: true
        }), 300);
      });
    }

    const params = new URLSearchParams();
    if (twitchUserId) params.append('twitchUserId', twitchUserId);
    if (tiktokUserId) params.append('tiktokUserId', tiktokUserId);

    const response = await apiClient.get(`/api/heroes/${userId}/slots?${params.toString()}`);
    return response.data;
  },

  async unlockHeroSlot(userId: string, twitchUserId?: string, tiktokUserId?: string): Promise<{
    success: boolean;
    slotsUnlocked: number;
    tokensSpent: number;
    remainingTokens: number;
    nextSlotCost: number | null;
    maxHeroes: number;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          slotsUnlocked: 4,
          tokensSpent: 500,
          remainingTokens: 500,
          nextSlotCost: 500,
          maxHeroes: 20
        }), 300);
      });
    }

    const response = await apiClient.post(`/api/heroes/${userId}/unlock-slot`, {
      twitchUserId,
      tiktokUserId
    });
    return response.data;
  },

  /**
   * Create a test hero for testing (dev only)
   */
  async createTestHero(userId: string, username: string, heroName: string, role?: string, level?: number): Promise<{
    success: boolean;
    message: string;
    hero: Hero;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'Test hero created successfully',
          hero: mockHero
        }), 300);
      });
    }

    const response = await apiClient.post('/api/heroes/test/create', {
      userId,
      username,
      heroName,
      role: role || 'berserker',
      level: level || 20
    });
    return response.data;
  },

  async createHero(classKey: string, twitchUserId?: string, tiktokUserId?: string, paymentMethod?: 'tokens' | 'payment', twitchUsername?: string): Promise<Hero & { heroCount: number; maxHeroes: number }> {
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
      paymentMethod,
      twitchUsername
    });
    return response.data;
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
  
  async useElixir(userId: string, itemKeyOrId: string): Promise<{success: boolean, message: string}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'Elixir used!'
        }), 300);
      });
    }
    
    // Support both itemKey and itemId - backend will figure it out
    const response = await apiClient.post(`/api/professions/${userId}/use`, { itemKey: itemKeyOrId, itemId: itemKeyOrId });
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

  async gather(userId: string) {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: 'Materials gathered!', gathered: {} }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/professions/${userId}/gather`);
    return response.data;
  },

  async applySocket(userId: string, heroId: string, itemId: string, socketItemId: string, slot?: string): Promise<{success: boolean, message: string, item: any}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: 'Socket applied!', item: {} }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/professions/${userId}/apply-socket`, {
      heroId,
      itemId,
      socketItemId,
      slot
    });
    return response.data;
  },

  async insertGem(userId: string, heroId: string, itemId: string, socketId: string, gemId: string): Promise<{success: boolean, message: string, item: any}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: 'Gem inserted!', item: {} }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/professions/${userId}/gem`, {
      heroId,
      itemId,
      socketId,
      gemId
    });
    return response.data;
  },

  async removeGem(userId: string, heroId: string, itemId: string, socketId: string): Promise<{success: boolean, message: string, item: any}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: 'Gem removed!', item: {} }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/professions/${userId}/remove-gem`, {
      heroId,
      itemId,
      socketId
    });
    return response.data;
  },

  async purchaseGoldItem(userId: string, itemKey: string, quantity: number = 1): Promise<{success: boolean, message: string, quantity?: number, itemsAdded?: number}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: 'Item purchased!', quantity, itemsAdded: quantity }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/heroes/${userId}/purchase/gold`, { itemKey, quantity });
    return response.data;
  },

  async purchaseTokenGear(userId: string, rarity: string, slot: string, quantity: number = 1): Promise<{success: boolean, message: string, items?: any[], quantity?: number}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ 
          success: true, 
          message: 'Gear purchased!',
          items: [{ name: `${rarity} ${slot}`, rarity, slot }],
          quantity
        }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/heroes/${userId}/purchase/tokens`, { rarity, slot, quantity });
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

  async expandStorage(userId: string, slots: number = 15, currency: 'gold' | 'tokens' = 'gold'): Promise<{success: boolean, message: string, newBankSize: number, newGold?: number, newTokens?: number}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ 
          success: true, 
          message: 'Storage expanded!',
          newBankSize: 50,
          newGold: currency === 'gold' ? 0 : undefined,
          newTokens: currency === 'tokens' ? 0 : undefined
        }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/heroes/${userId}/expand-storage`, { slots, currency });
    return response.data;
  },

  async lockEquipment(userId: string, slot: string): Promise<{
    success: boolean;
    message: string;
    item: any;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'Item locked',
          item: { locked: true }
        }), 300);
      });
    }

    const response = await apiClient.post(`/api/heroes/${userId}/equipment/${slot}/lock`);
    return response.data;
  },

  async unlockEquipment(userId: string, slot: string): Promise<{
    success: boolean;
    message: string;
    item: any;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'Item unlocked',
          item: { locked: false }
        }), 300);
      });
    }

    const response = await apiClient.post(`/api/heroes/${userId}/equipment/${slot}/unlock`);
    return response.data;
  },

  async prestigeHero(userId: string): Promise<{
    success: boolean;
    message: string;
    hero: Hero;
    prestigeLevel: number;
    prestigeTokens: number;
    boosts: {
      xpGain: number;
      goldGain: number;
      idleTicketGain: number;
      statBoost: {
        attack: number;
        defense: number;
        hp: number;
      };
    };
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'Prestige successful!',
          hero: mockHero,
          prestigeLevel: 1,
          prestigeTokens: 1,
          boosts: {
            xpGain: 1.02,
            goldGain: 1.025,
            idleTicketGain: 1.01,
            statBoost: { attack: 2, defense: 1, hp: 5 }
          }
        }), 300);
      });
    }

    const response = await apiClient.post(`/api/heroes/${userId}/prestige`);
    return response.data;
  },

  async getPrestigeStore(userId: string): Promise<{
    success: boolean;
    prestigeLevel: number;
    prestigeTokens: number;
    catalog: Array<{
      tier: string;
      name: string;
      tokenCost: number;
      prestigeRequired: number;
      statBonus: { attack: number; defense: number; hp: number };
      bonus: { xpGain: number; goldGain: number };
      color: string;
      canAfford: boolean;
    }>;
    availableTiers: string[];
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          prestigeLevel: 1,
          prestigeTokens: 2,
          catalog: [],
          availableTiers: ['bronze']
        }), 300);
      });
    }

    const response = await apiClient.get(`/api/heroes/${userId}/prestige-store`);
    return response.data;
  },

  async purchasePrestigeCore(userId: string, tier: string): Promise<{
    success: boolean;
    message: string;
    item: any;
    prestigeTokens: number;
    tokensSpent: number;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'Purchased prestige core!',
          item: {},
          prestigeTokens: 1,
          tokensSpent: 1
        }), 300);
      });
    }

    const response = await apiClient.post(`/api/heroes/${userId}/prestige-store/purchase`, {
      tier
    });
    return response.data;
  },

  async applyPrestigeCore(userId: string, coreId: string, slot: string): Promise<{
    success: boolean;
    message: string;
    prestigeSlotCores: any;
    replacedCore: any;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'Applied prestige core to slot!',
          prestigeSlotCores: {},
          replacedCore: null
        }), 300);
      });
    }

    const response = await apiClient.post(`/api/heroes/${userId}/prestige-store/apply`, {
      coreId,
      slot
    });
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
  
  async joinGuild(
    guildId: string, 
    heroId: string, 
    heroName?: string, 
    heroRole?: string, 
    heroLevel?: number, 
    message?: string
  ): Promise<{success: boolean, message: string}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: 'Joined guild successfully' }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/guilds/${guildId}/join`, { 
      heroId, 
      heroName, 
      heroRole, 
      heroLevel, 
      message 
    });
    return response.data;
  },
  
  async applyToGuild(
    guildId: string, 
    heroId: string, 
    heroName?: string, 
    heroRole?: string, 
    heroLevel?: number, 
    message?: string
  ): Promise<{success: boolean, message: string}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: 'Application submitted' }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/guilds/${guildId}/apply`, { 
      heroId, 
      heroName, 
      heroRole, 
      heroLevel, 
      message 
    });
    return response.data;
  },
  
  async leaveGuild(guildId: string, heroId: string): Promise<{success: boolean}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/guilds/${guildId}/leave`, { heroId });
    return response.data;
  },
  
  async updateGuildSettings(
    guildId: string, 
    heroId: string, 
    joinMode: 'open' | 'approval'
  ): Promise<Guild> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ ...mockGuild, joinMode }), 300);
      });
    }
    
    const response = await apiClient.put(`/api/guilds/${guildId}/settings`, { 
      heroId, 
      joinMode 
    });
    return response.data;
  },
  
  async approveApplication(
    guildId: string, 
    applicantHeroId: string, 
    approverHeroId: string
  ): Promise<{success: boolean, message: string}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: 'Application approved' }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/guilds/${guildId}/approve/${applicantHeroId}`, { 
      approverHeroId 
    });
    return response.data;
  },
  
  async rejectApplication(
    guildId: string, 
    applicantHeroId: string, 
    approverHeroId: string
  ): Promise<{success: boolean, message: string}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: 'Application rejected' }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/guilds/${guildId}/reject/${applicantHeroId}`, { 
      approverHeroId 
    });
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
  },
  
  async inviteToGuild(
    guildId: string,
    inviteeHeroId: string,
    inviteeHeroName: string,
    inviterHeroId: string,
    inviterHeroName: string
  ): Promise<{success: boolean, inviteId: string, invite: any}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ 
          success: true, 
          inviteId: 'mock-invite-id',
          invite: { id: 'mock-invite-id', guildId, inviteeHeroId, status: 'pending' }
        }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/guilds/${guildId}/invite`, {
      inviteeHeroId,
      inviteeHeroName,
      inviterHeroId,
      inviterHeroName
    });
    return response.data;
  },
  
  async getInvite(inviteId: string): Promise<any> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ 
          id: inviteId, 
          guildId: 'mock-guild',
          status: 'pending' 
        }), 300);
      });
    }
    
    const response = await apiClient.get(`/api/guilds/invite/${inviteId}`);
    return response.data;
  },
  
  async acceptInvite(
    inviteId: string,
    heroId: string,
    heroName?: string,
    heroRole?: string,
    heroLevel?: number
  ): Promise<{success: boolean, message: string}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: 'Joined guild successfully' }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/guilds/invite/${inviteId}/accept`, {
      heroId,
      heroName,
      heroRole,
      heroLevel
    });
    return response.data;
  },
  
  async getPendingInvites(heroId: string): Promise<{invites: any[]}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ invites: [] }), 300);
      });
    }
    
    const response = await apiClient.get(`/api/guilds/invites/pending/${heroId}`);
    return response.data;
  },
  
  async getGuildInvites(guildId: string): Promise<{invites: any[]}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ invites: [] }), 300);
      });
    }
    
    const response = await apiClient.get(`/api/guilds/${guildId}/invites`);
    return response.data;
  },
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
  
  async createListing(sellerId: string, sellerUsername: string, item: any, startingPrice: number, buyoutPrice?: number, currency: 'gold' | 'tokens' = 'gold', quantity: number = 1, duration: '12' | '24' | '48' = '24') {
    const response = await apiClient.post('/api/auction/list', {
      sellerId,
      sellerUsername,
      item,
      startingPrice,
      buyoutPrice,
      currency,
      quantity,
      duration
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
  
  async syncAchievementTitles(heroId: string) {
    const response = await apiClient.post(`/api/achievements/${heroId}/sync-titles`);
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
  async getAllDungeons() {
    const response = await apiClient.get('/api/dungeon/');
    return response.data;
  },
  
  async joinQueue(userId: string, heroId: string, role: 'tank' | 'healer' | 'dps', itemScore: number, dungeonType: 'normal' | 'heroic' | 'mythic' = 'normal', dungeonId?: string) {
    const response = await apiClient.post('/api/dungeon/queue', {
      userId,
      heroId,
      role,
      itemScore,
      dungeonType,
      dungeonId // Pass dungeonId for solo dungeon detection
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
export const tokenPackAPI = {
  /**
   * Initiate a token pack purchase
   * @param userId - User's Twitch ID
   * @param packType - Pack type: 'impulse', 'starter', 'value', 'premium'
   * @param heroId - Hero document ID to receive tokens/gold
   * @returns Purchase session data including purchase ID
   */
  async initiatePurchase(userId: string, packType: 'impulse' | 'starter' | 'value' | 'premium', heroId: string): Promise<{
    success: boolean;
    purchaseId: string;
    sessionId: string | null;
    message: string;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          purchaseId: `mock-${Date.now()}`,
          sessionId: null,
          message: 'Purchase initiated (mock)'
        }), 300);
      });
    }

    const response = await apiClient.post('/api/purchases/token-pack', {
      userId,
      packType,
      heroId
    });

    return response.data;
  },

  /**
   * Complete token pack purchase after payment processing
   * @param purchaseId - Purchase ID from initiatePurchase
   * @returns Purchase completion details
   */
  async completePurchase(purchaseId: string): Promise<{
    success: boolean;
    message: string;
    tokensGranted: number;
    goldGranted: number;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'Purchase completed (mock)',
          tokensGranted: 100,
          goldGranted: 1000
        }), 300);
      });
    }

    const response = await apiClient.post('/api/purchases/complete-token-pack', {
      purchaseId
    });

    return response.data;
  }
};

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
  },

  /**
   * Get purchase history for a user
   * @param userId - User's Twitch ID
   * @returns List of all purchases
   */
  async getPurchaseHistory(userId: string): Promise<{
    purchases: Array<{
      id: string;
      userId: string;
      packTier?: string;
      packType?: string;
      heroId?: string;
      price: number;
      status: 'pending' | 'completed' | 'failed' | 'cancelled';
      createdAt: any;
      completedAt?: any;
      premiumCurrency?: number;
      tokens?: number;
      gold?: number;
    }>;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          purchases: []
        }), 300);
      });
    }

    const response = await apiClient.get(`/api/purchases/history/${userId}`);
    return response.data;
  },

  /**
   * Get detailed purchase information including hero details
   * @param purchaseId - Purchase ID
   * @returns Purchase details with hero information
   */
  async getPurchaseDetails(purchaseId: string): Promise<{
    purchase: any;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          purchase: {}
        }), 300);
      });
    }

    const response = await apiClient.get(`/api/purchases/${purchaseId}/details`);
    return response.data;
  },

  /**
   * Get all Platinum founders for Founders Hall
   * @returns List of all Platinum tier founders
   */
  async getFounders(): Promise<{
    success: boolean;
    founders: Array<{
      userId: string;
      username: string;
      heroName?: string;
      heroRole?: string;
      tier: string;
      purchaseDate: number;
      purchaseId: string;
    }>;
    debug?: any;
  }> {
    if (USE_MOCK) {
      console.log('[FoundersPackAPI] Using MOCK data');
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          founders: [
            { userId: 'mock1', username: 'Founder1', tier: 'platinum', purchaseDate: Date.now(), purchaseId: 'mock1' },
            { userId: 'mock2', username: 'Founder2', tier: 'platinum', purchaseDate: Date.now() - 86400000, purchaseId: 'mock2' }
          ]
        }), 300);
      });
    }

    const url = `${API_URL}/api/purchases/founders`;
    console.log('[FoundersPackAPI] Calling GET', url);
    console.log('[FoundersPackAPI] API_URL:', API_URL);
    console.log('[FoundersPackAPI] USE_MOCK:', USE_MOCK);
    
    try {
      const response = await apiClient.get('/api/purchases/founders');
      console.log('[FoundersPackAPI] Response received:', response);
      console.log('[FoundersPackAPI] Response data:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[FoundersPackAPI] Error calling API:', error);
      console.error('[FoundersPackAPI] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      throw error;
    }
  },

  /**
   * Set founder pack tier for a user (admin/manual grant)
   * @param userId - Twitch user ID
   * @param tier - Pack tier ('bronze' | 'silver' | 'gold' | 'platinum')
   * @returns Success status and updated heroes
   */
  async setFounderStatus(userId: string, tier: 'bronze' | 'silver' | 'gold' | 'platinum'): Promise<{
    success: boolean;
    message: string;
    tier: string;
    heroesUpdated: number;
    heroes: Array<{ heroId: string; heroName: string }>;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: `Set ${tier} founder status (mock)`,
          tier,
          heroesUpdated: 1,
          heroes: [{ heroId: 'mock', heroName: 'Mock Hero' }]
        }), 300);
      });
    }

    const response = await apiClient.post('/api/purchases/set-founder', {
      userId,
      tier
    });
    return response.data;
  },

  /**
   * Set founder pack tier by username (admin/manual grant)
   * @param username - Twitch username
   * @param tier - Pack tier ('bronze' | 'silver' | 'gold' | 'platinum')
   * @returns Success status and updated heroes
   */
  async setFounderStatusByUsername(username: string, tier: 'bronze' | 'silver' | 'gold' | 'platinum'): Promise<{
    success: boolean;
    message: string;
    tier: string;
    heroesUpdated: number;
    heroes: Array<{ heroId: string; heroName: string }>;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: `Set ${tier} founder status for ${username} (mock)`,
          tier,
          heroesUpdated: 1,
          heroes: [{ heroId: 'mock', heroName: 'Mock Hero' }]
        }), 300);
      });
    }

    const response = await apiClient.post('/api/purchases/set-founder', {
      username,
      tier
    });
    return response.data;
  },

  /**
   * Remove founder pack status from a user (admin only)
   * @param userId - Twitch user ID
   * @returns Success status
   */
  async removeFounderStatus(userId: string): Promise<{
    success: boolean;
    message: string;
    heroesUpdated: number;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'Removed founder status (mock)',
          heroesUpdated: 1
        }), 300);
      });
    }

    const response = await apiClient.post('/api/purchases/remove-founder', {
      userId
    });
    return response.data;
  }
};

// Party API
export const partyAPI = {
  /**
   * Create a new party
   */
  async createParty(leaderId: string, leaderName: string, heroId: string, heroName: string, heroRole: string, heroLevel: number): Promise<{
    success: boolean;
    partyId: string;
    party: any;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          partyId: 'mock-party-1',
          party: {
            id: 'mock-party-1',
            leaderId,
            members: [leaderId],
            memberData: [{ userId: leaderId, username: leaderName, heroId, heroName, heroRole, heroLevel }],
            status: 'forming',
            createdAt: Date.now()
          }
        }), 300);
      });
    }

    const response = await apiClient.post('/api/parties/create', {
      leaderId,
      leaderName,
      heroId,
      heroName,
      heroRole,
      heroLevel
    });
    return response.data;
  },

  /**
   * Get user's current party
   */
  async getParty(userId: string): Promise<{
    success: boolean;
    party: any | null;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          party: null
        }), 300);
      });
    }

    const response = await apiClient.get(`/api/parties/${userId}`);
    return response.data;
  },

  /**
   * Invite player to party
   */
  async invitePlayer(partyId: string, inviterId: string, inviteeId: string, inviteeName: string, heroId: string, heroName: string, heroRole: string, heroLevel: number): Promise<{
    success: boolean;
    inviteId: string;
    message: string;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          inviteId: 'mock-invite-1',
          message: 'Invite sent successfully'
        }), 300);
      });
    }

    const response = await apiClient.post(`/api/parties/${partyId}/invite`, {
      inviterId,
      inviteeId,
      inviteeName,
      heroId,
      heroName,
      heroRole,
      heroLevel
    });
    return response.data;
  },

  /**
   * Accept party invite
   */
  async acceptInvite(inviteId: string, userId: string): Promise<{
    success: boolean;
    partyId: string;
    message: string;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          partyId: 'mock-party-1',
          message: 'Joined party successfully'
        }), 300);
      });
    }

    const response = await apiClient.post(`/api/parties/invites/${inviteId}/accept`, { userId });
    return response.data;
  },

  /**
   * Decline party invite
   */
  async declineInvite(inviteId: string, userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'Invite declined'
        }), 300);
      });
    }

    const response = await apiClient.post(`/api/parties/invites/${inviteId}/decline`, { userId });
    return response.data;
  },

  /**
   * Leave party
   */
  async leaveParty(partyId: string, userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'Left party successfully'
        }), 300);
      });
    }

    const response = await apiClient.post(`/api/parties/${partyId}/leave`, { userId });
    return response.data;
  },

  /**
   * Kick member from party (leader only)
   */
  async kickMember(partyId: string, leaderId: string, memberId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'Member kicked successfully'
        }), 300);
      });
    }

    const response = await apiClient.post(`/api/parties/${partyId}/kick`, { leaderId, memberId });
    return response.data;
  },

  /**
   * Transfer leadership
   */
  async transferLeadership(partyId: string, currentLeaderId: string, newLeaderId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'Leadership transferred successfully'
        }), 300);
      });
    }

    const response = await apiClient.post(`/api/parties/${partyId}/transfer`, { currentLeaderId, newLeaderId });
    return response.data;
  },

  /**
   * Search for users by Twitch username
   */
  async searchUsers(username: string): Promise<{
    success: boolean;
    matches: Array<{
      userId: string;
      twitchUserId?: string; // Explicit twitchUserId field for whispers
      username: string;
      heroId: string;
      heroName: string;
      heroRole: string;
      heroLevel: number;
    }>;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          matches: []
        }), 300);
      });
    }

    const response = await apiClient.get('/api/parties/search', {
      params: { username }
    });
    return response.data;
  },

  /**
   * Queue entire party for dungeon or raid
   */
  async queueParty(partyId: string, queueType: 'dungeon' | 'raid', raidId?: string, dungeonType?: string, dungeonId?: string, fillParty?: boolean): Promise<{
    success: boolean;
    queued: number;
    total: number;
    errors?: Array<{ userId: string; error: string }>;
    message: string;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          queued: 5,
          total: 5,
          message: 'Successfully queued all party members'
        }), 300);
      });
    }

    const response = await apiClient.post(`/api/parties/${partyId}/queue`, {
      queueType,
      raidId,
      dungeonType,
      dungeonId,
      fillParty
    });
    return response.data;
  },

  /**
   * Cancel party queue
   */
  async cancelQueue(partyId: string, userId: string): Promise<{
    success: boolean;
    message: string;
    removed?: number;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'Queue cancelled successfully',
          removed: 5
        }), 300);
      });
    }

    const response = await apiClient.post(`/api/parties/${partyId}/cancel-queue`, { userId });
    return response.data;
  },

  /**
   * Get pending invites for a user
   */
  async getInvites(userId: string): Promise<{
    success: boolean;
    invites: Array<{
      id: string;
      partyId: string;
      inviterId: string;
      inviterName?: string;
      inviteeId: string;
      inviteeName: string;
      heroId: string;
      heroName: string;
      heroRole: string;
      heroLevel: number;
      status: string;
      createdAt: number;
      expiresAt: number | null;
    }>;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          invites: []
        }), 300);
      });
    }

    const response = await apiClient.get(`/api/parties/invites/${userId}`);
    return response.data;
  }
};

/**
 * Web Chat API
 */
export const webChatAPI = {
  /**
   * Send a chat message
   */
  async sendMessage(
    userId: string,
    heroId: string,
    channel: 'party' | 'world' | 'whisper' | 'guild',
    message: string,
    partyId?: string,
    guildId?: string,
    recipientId?: string
  ): Promise<{
    success: boolean;
    messageId?: string;
    message?: any;
    error?: string;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          messageId: 'mock-msg-1',
          message: {
            id: 'mock-msg-1',
            channel,
            userId,
            heroId,
            message,
            timestamp: Date.now()
          }
        }), 300);
      });
    }

    const response = await apiClient.post('/api/web-chat/send', {
      userId,
      heroId,
      channel,
      message,
      partyId,
      guildId,
      recipientId
    });
    return response.data;
  },

  /**
   * Get chat history
   */
  async getHistory(
    channel: 'party' | 'world' | 'whisper' | 'guild',
    partyId?: string,
    guildId?: string,
    recipientId?: string,
    heroId?: string,
    limit: number = 50
  ): Promise<{
    success: boolean;
    messages: Array<{
      id: string;
      channel: 'party' | 'world' | 'whisper' | 'guild';
      userId: string;
      username: string;
      heroId: string;
      heroName: string;
      heroRole: string;
      heroLevel?: number;
      message: string;
      timestamp: number;
      partyId?: string;
      guildId?: string;
      recipientId?: string;
      recipientHeroId?: string;
      recipientHeroName?: string;
    }>;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          messages: []
        }), 300);
      });
    }

    const params: any = { channel, limit };
    if (partyId) params.partyId = partyId;
    if (guildId) params.guildId = guildId;
    if (recipientId) params.recipientId = recipientId;
    if (heroId) params.heroId = heroId;

    const response = await apiClient.get('/api/web-chat/history', { params });
    return response.data;
  },

  /**
   * Block a user
   */
  async blockUser(userId: string, blockedUserId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'User blocked'
        }), 300);
      });
    }

    const response = await apiClient.post('/api/web-chat/block', {
      userId,
      blockedUserId
    });
    return response.data;
  },

  /**
   * Unblock a user
   */
  async unblockUser(userId: string, blockedUserId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'User unblocked'
        }), 300);
      });
    }

    const response = await apiClient.delete('/api/web-chat/block', {
      data: { userId, blockedUserId }
    });
    return response.data;
  },

  /**
   * Get blocked users list
   */
  async getBlockedUsers(userId: string): Promise<{
    success: boolean;
    blockedUserIds: string[];
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          blockedUserIds: []
        }), 300);
      });
    }

    const response = await apiClient.get(`/api/web-chat/blocks/${userId}`);
    return response.data;
  },

  /**
   * Report a user or message
   */
  async reportUser(
    reporterId: string,
    reportedUserId: string,
    reason: 'spam' | 'harassment' | 'inappropriate' | 'other',
    reportedMessageId?: string
  ): Promise<{
    success: boolean;
    message: string;
    reportId: string;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'Report submitted',
          reportId: 'mock-report-id'
        }), 300);
      });
    }

    const response = await apiClient.post('/api/web-chat/report', {
      reporterId,
      reportedUserId,
      reportedMessageId,
      reason
    });
    return response.data;
  },

  /**
   * Delete any message (admin only)
   */
  async deleteMessageAdmin(messageId: string, adminId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'Message deleted by admin'
        }), 300);
      });
    }

    const response = await apiClient.delete(`/api/web-chat/admin/message/${messageId}`, {
      data: { userId: adminId }
    });
    return response.data;
  },

  /**
   * Ban user from chat (admin only)
   */
  async banUser(
    adminId: string,
    bannedUserId: string,
    duration?: number
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: duration ? `User banned for ${duration} hours` : 'User permanently banned'
        }), 300);
      });
    }

    const response = await apiClient.post('/api/web-chat/admin/ban', {
      adminId,
      bannedUserId,
      duration
    });
    return response.data;
  },

  /**
   * Unban user from chat (admin only)
   */
  async unbanUser(adminId: string, bannedUserId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'User unbanned'
        }), 300);
      });
    }

    const response = await apiClient.delete(`/api/web-chat/admin/ban/${bannedUserId}`, {
      data: { adminId }
    });
    return response.data;
  },

  /**
   * Delete own message
   */
  async deleteMessage(messageId: string, userId: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'Message deleted'
        }), 300);
      });
    }

    const response = await apiClient.delete(`/api/web-chat/message/${messageId}`, {
      data: { userId }
    });
    return response.data;
  }
};

// Mail API
export interface MailItem {
  id: string;
  itemId: string;
  quantity?: number;
}

export interface Mail {
  id: string;
  senderId: string;
  senderHeroId: string;
  senderName: string;
  recipientId: string;
  subject: string;
  message: string;
  items?: Array<any>;
  gold?: number;
  tokens?: number;
  codAmount?: number;
  read: boolean;
  claimed: boolean;
  createdAt: number;
  expiresAt?: number | null;
  isExpired?: boolean;
  daysUntilExpiry?: number;
}

export const mailAPI = {
  /**
   * Send mail to another player
   */
  async sendMail(
    senderId: string,
    senderHeroId: string,
    recipientId: string,
    subject: string,
    message: string,
    items?: MailItem[],
    gold?: number,
    tokens?: number,
    codAmount?: number
  ): Promise<{
    success: boolean;
    messageId: string;
    message: string;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          messageId: 'mock-mail-id',
          message: 'Mail sent successfully'
        }), 300);
      });
    }

    const response = await apiClient.post('/api/mail/send', {
      senderId,
      senderHeroId,
      recipientId,
      subject,
      message,
      items,
      gold,
      tokens,
      codAmount: codAmount || 0
    });
    return response.data;
  },

  /**
   * Get all mail for a user
   */
  async getMail(
    userId: string,
    unreadOnly?: boolean
  ): Promise<{
    success: boolean;
    mails: Mail[];
    unreadCount: number;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          mails: [],
          unreadCount: 0
        }), 300);
      });
    }

    const response = await apiClient.get(`/api/mail/${userId}`, {
      params: { unreadOnly }
    });
    return response.data;
  },

  /**
   * Mark mail as read
   */
  async markAsRead(
    mailId: string,
    userId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'Mail marked as read'
        }), 300);
      });
    }

    const response = await apiClient.post(`/api/mail/${mailId}/read`, {
      userId
    });
    return response.data;
  },

  /**
   * Claim items/gold from mail (with COD payment if required)
   */
  async claimMail(
    mailId: string,
    userId: string,
    heroId: string
  ): Promise<{
    success: boolean;
    message: string;
    codPaid: number;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'Mail claimed successfully',
          codPaid: 0
        }), 300);
      });
    }

    const response = await apiClient.post(`/api/mail/${mailId}/claim`, {
      userId,
      heroId
    });
    return response.data;
  },

  /**
   * Delete mail
   */
  async deleteMail(
    mailId: string,
    userId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'Mail deleted'
        }), 300);
      });
    }

    const response = await apiClient.delete(`/api/mail/${mailId}`, {
      data: { userId }
    });
    return response.data;
  }
};

// Reports API
export interface Report {
  id: string;
  userId: string;
  username: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  adminNotes?: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SubmitReportData {
  userId: string;
  username: string;
  title: string;
  description: string;
  category?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
}

export const reportsAPI = {
  /**
   * Submit a new report
   */
  async submitReport(data: SubmitReportData): Promise<{
    success: boolean;
    reportId: string;
    message: string;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          reportId: 'mock-report-id',
          message: 'Report submitted successfully'
        }), 300);
      });
    }

    const response = await apiClient.post('/api/reports', data);
    return response.data;
  },

  /**
   * Get all reports (for admin)
   */
  async getAllReports(params?: {
    status?: string;
    limit?: number;
    orderBy?: string;
    order?: 'asc' | 'desc';
  }): Promise<{
    success: boolean;
    reports: Report[];
    count: number;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          reports: [],
          count: 0
        }), 300);
      });
    }

    const response = await apiClient.get('/api/reports', { params });
    return response.data;
  },

  /**
   * Get a single report by ID
   */
  async getReport(reportId: string): Promise<{
    success: boolean;
    report: Report;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          report: {
            id: reportId,
            userId: 'mock-user',
            username: 'MockUser',
            title: 'Mock Report',
            description: 'Mock description',
            category: 'general',
            severity: 'medium',
            status: 'open',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }), 300);
      });
    }

    const response = await apiClient.get(`/api/reports/${reportId}`);
    return response.data;
  },

  /**
   * Update report status (for admin)
   */
  async updateReportStatus(
    reportId: string,
    status: 'open' | 'in-progress' | 'resolved' | 'closed',
    username: string,
    adminNotes?: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'Report updated successfully'
        }), 300);
      });
    }

    const response = await apiClient.patch(`/api/reports/${reportId}`, {
      status,
      username,
      adminNotes
    });
    return response.data;
  }
};

// Stream Settings API
export const streamSettingsAPI = {
  async getSettings(twitchId: string): Promise<{
    success: boolean;
    settings: {
      enabled: boolean;
      intervalMinutes: number;
      showWaves: boolean;
      showXp: boolean;
      showLevelUps: boolean;
      showGold: boolean;
      customMessage: string | null;
    };
  }> {
    const response = await apiClient.get(`/api/stream/settings/${twitchId}`);
    return response.data;
  },

  async updateSettings(twitchId: string, settings: {
    enabled?: boolean;
    intervalMinutes?: number;
    showWaves?: boolean;
    showXp?: boolean;
    showLevelUps?: boolean;
    showGold?: boolean;
    customMessage?: string | null;
  }): Promise<{
    success: boolean;
    message: string;
    settings: any;
  }> {
    const response = await apiClient.put(`/api/stream/settings/${twitchId}`, settings);
    return response.data;
  },

  async testChatUpdate(twitchId: string): Promise<{
    success: boolean;
    message: string;
    testMessage?: string;
    error?: string;
  }> {
    const response = await apiClient.post(`/api/stream/settings/${twitchId}/test`);
    return response.data;
  }
};

// Overlay API (uses streamer keys or JWT)
export const overlayAPI = {
  /**
   * Sync hero stats/equipment/inventory in batch (idempotent with batchId)
   * Requires X-Streamer-Key header or ownership via JWT
   */
  async syncBatch(batchId: string, updates: Array<{
    heroId: string;
    stats?: Record<string, any>;
    equipment?: Record<string, any>;
    inventory?: any[];
  }>): Promise<{
    success: boolean;
    syncedCount: number;
    skippedCount: number;
    duplicate?: boolean;
  }> {
    const response = await overlayClient.post('/api/overlay/sync', {
      batchId,
      updates
    });
    return response.data;
  },

  /**
   * Get current chat activity metrics for a streamer
   * Requires X-Streamer-Key header or ownership via JWT
   */
  async getChatActivity(streamerId: string): Promise<{
    streamerId: string;
    activeUsers: number;
    groupBoost: {
      active: boolean;
      multiplier: number;
      attackBonus: number;
      defenseBonus: number;
      healingBonus: number;
    };
  }> {
    const response = await overlayClient.get(`/api/chat/activity/${streamerId}`);
    return response.data;
  }
};

export { apiClient, overlayClient };
