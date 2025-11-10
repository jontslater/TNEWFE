import axios from 'axios';
import { Hero } from '../types/Hero';
import { Guild } from '../types/Guild';
import { Raid, WorldBoss } from '../types/Raid';
import { mockHero, mockGuild, mockRaids, mockWorldBoss } from './mock-data';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'; // Default to mock data

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
  async getHero(userId: string): Promise<Hero> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockHero), 300);
      });
    }
    
    const response = await apiClient.get(`/api/heroes/${userId}`);
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
  
  async craftElixir(userId: string, recipeKey: string): Promise<{success: boolean, message: string}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          success: true,
          message: 'Crafted successfully!'
        }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/heroes/${userId}/craft`, { recipeKey });
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
    
    const response = await apiClient.post(`/api/heroes/${userId}/use`, { itemKey });
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
  
  async signupForRaid(raidId: string, guildId: string, participants: string[]): Promise<{success: boolean}> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 300);
      });
    }
    
    const response = await apiClient.post(`/api/raids/${raidId}/signup`, { guildId, participants });
    return response.data;
  },
  
  async getWorldBoss(): Promise<WorldBoss> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockWorldBoss), 300);
      });
    }
    
    const response = await apiClient.get('/api/worldboss/current');
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
  
  async linkTikTok(userId: string, code: string): Promise<{success: boolean}> {
    const response = await apiClient.post('/api/auth/tiktok/link', { userId, code });
    return response.data;
  },
  
  async getCurrentUser(): Promise<any> {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  }
};

export { apiClient };
