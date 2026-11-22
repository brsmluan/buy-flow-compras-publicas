// =============================================================================
// BUY-FLOW FRONTEND - Auth Context (React + Zustand pattern)
// =============================================================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import type { User, Login } from '@buy-flow/shared/index.js';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: Login) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!accessToken;

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const storedToken = localStorage.getItem('accessToken');
      if (storedToken) {
        setAccessToken(storedToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

        const response = await api.get('/auth/me');
        setUser(response.data.data.user);
      }
    } catch {
      await refreshAccessToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (credentials: Login) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', credentials);
      const { accessToken: token, user: userData } = response.data.data;

      setAccessToken(token);
      setUser(userData);
      localStorage.setItem('accessToken', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
      delete api.defaults.headers.common['Authorization'];
    }
  }, []);

  const refreshAccessToken = useCallback(async () => {
    try {
      const response = await api.post('/auth/refresh');
      const { accessToken: token } = response.data.data;

      setAccessToken(token);
      localStorage.setItem('accessToken', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
      delete api.defaults.headers.common['Authorization'];
      throw new Error('Session expired');
    }
  }, []);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      isAuthenticated,
      isLoading,
      login,
      logout,
      refreshAccessToken,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}