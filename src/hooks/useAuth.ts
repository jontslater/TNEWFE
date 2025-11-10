import { useState, useEffect } from 'react';
import { authAPI } from '../api/client';

interface User {
  id: string;
  twitchUsername: string;
  tiktokUsername?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Auth check failed', err);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const login = (token: string, userData: User) => {
    localStorage.setItem('auth_token', token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return { user, loading, isAuthenticated, login, logout, checkAuth };
}
