import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  language?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);
  const idleRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const checkAuth = async () => {
      const tokens = localStorage.getItem('auth_tokens');
      if (!tokens) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.users.me();
        setUser(response.data || response);
        localStorage.setItem('user', JSON.stringify(response.data || response));
      } catch {
        localStorage.removeItem('auth_tokens');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  }, []);

  useEffect(() => {
    if (!user) return;

    const resetTimer = () => {
      clearTimeout(idleRef.current);
      idleRef.current = setTimeout(() => logout(), INACTIVITY_TIMEOUT);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(idleRef.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [user, logout]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.auth.login(email, password);
    const { user: userData, tokens } = response;
    localStorage.setItem('auth_tokens', JSON.stringify(tokens));
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  return { user, loading, login, logout };
}
