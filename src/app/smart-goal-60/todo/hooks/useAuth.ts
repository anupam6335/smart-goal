'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const AUTH_URL = '/api/todos/auth';
const CHANGE_URL = '/api/todos/auth/change';

export interface ChangePasswordOutcome {
  ok: boolean;
  error: string | null;
}

export interface UseAuthResult {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  hydrated: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<ChangePasswordOutcome>;
}

export function useAuth(): UseAuthResult {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(AUTH_URL, { method: 'GET', cache: 'no-store' });
      const data = (await res.json().catch(() => null)) as
        | { authenticated?: unknown }
        | null;
      if (!mountedRef.current) return;
      setIsAuthenticated(Boolean(data?.authenticated));
    } catch {
      if (!mountedRef.current) return;
      setIsAuthenticated(false);
    } finally {
      if (mountedRef.current) {
        setHydrated(true);
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        cache: 'no-store',
      });
      const data = (await res.json().catch(() => null)) as
        | { authenticated?: unknown; error?: unknown }
        | null;

      if (!mountedRef.current) return false;

      if (!res.ok || data?.authenticated !== true) {
        const message =
          typeof data?.error === 'string' ? data.error : 'Invalid credentials';
        setError(message);
        setIsAuthenticated(false);
        return false;
      }

      setError(null);
      setIsAuthenticated(true);
      return true;
    } catch {
      if (mountedRef.current) {
        setError('Network error. Please try again.');
        setIsAuthenticated(false);
      }
      return false;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetch(AUTH_URL, { method: 'DELETE', cache: 'no-store' });
    } catch {
      // Logout is idempotent from the client's perspective.
    } finally {
      if (mountedRef.current) {
        setIsAuthenticated(false);
        setLoading(false);
      }
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const changePassword = useCallback(
    async (
      currentPassword: string,
      newPassword: string
    ): Promise<ChangePasswordOutcome> => {
      setLoading(true);
      try {
        const res = await fetch(CHANGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword }),
          cache: 'no-store',
        });
        const data = (await res.json().catch(() => null)) as
          | { success?: unknown; error?: unknown }
          | null;

        if (!res.ok || data?.success !== true) {
          const message =
            typeof data?.error === 'string'
              ? data.error
              : 'Failed to change password';
          return { ok: false, error: message };
        }

        return { ok: true, error: null };
      } catch {
        return { ok: false, error: 'Network error. Please try again.' };
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    []
  );

  return {
    isAuthenticated,
    loading,
    error,
    hydrated,
    login,
    logout,
    refresh,
    clearError,
    changePassword,
  };
}