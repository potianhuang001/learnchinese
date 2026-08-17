/**
 * AuthContext — global auth state.
 * Persists the user + token in localStorage and exposes
 * login / register / logout / updateUser / refreshUser actions.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

/** 是否持有有效会员（status=active 且未过期） */
function isMemberOf(user) {
  return Boolean(
    user?.membership?.status === 'active' &&
      user.membership.expiresAt &&
      new Date(user.membership.expiresAt).getTime() > Date.now(),
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lc_user') || 'null');
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // Persist user whenever it changes
  useEffect(() => {
    if (user) localStorage.setItem('lc_user', JSON.stringify(user));
    else localStorage.removeItem('lc_user');
  }, [user]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { token, user: userData } = data.data;
      localStorage.setItem('lc_token', token);
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (username, email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { username, email, password });
      const { token, user: userData } = data.data;
      localStorage.setItem('lc_token', token);
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('lc_token');
    setUser(null);
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => ({ ...prev, ...patch }));
  }, []);

  /** 从服务端拉取最新用户信息（支付成功 / 会员变更后调用） */
  const refreshUser = useCallback(async () => {
    try {
      const latest = await authApi.me();
      setUser(latest);
      return latest;
    } catch {
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      isMember: isMemberOf(user),
      loading,
      login,
      register,
      logout,
      updateUser,
      refreshUser,
    }),
    [user, loading, login, register, logout, updateUser, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
