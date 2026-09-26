'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ApiResponse,
  ApiSource,
  CreateTodoInput,
  Todo,
  UpdateTodoInput,
} from '../types';

const LIST_URL = '/api/todos';
const ITEM_URL = (id: string) => `/api/todos/${id}`;

export interface UseTodosOptions {
  onAuthRequired?: () => void;
}

export interface UseTodosResult {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  hydrated: boolean;
  responseTime: number | null;
  source: ApiSource | null;
  cached: boolean | null;
  lastOperation: string;
  refresh: (bypassCache?: boolean) => Promise<void>;
  invalidateCache: () => Promise<void>;
  createTodo: (input: CreateTodoInput) => Promise<Todo | null>;
  updateTodo: (id: string, updates: UpdateTodoInput) => Promise<Todo | null>;
  deleteTodo: (id: string) => Promise<boolean>;
  toggleComplete: (id: string, completed: boolean) => Promise<void>;
  clearError: () => void;
}

export function useTodos(options: UseTodosOptions = {}): UseTodosResult {
  const { onAuthRequired } = options;

  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [source, setSource] = useState<ApiSource | null>(null);
  const [cached, setCached] = useState<boolean | null>(null);
  const [lastOperation, setLastOperation] = useState('');

  const mountedRef = useRef(true);
  const onAuthRequiredRef = useRef(onAuthRequired);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    onAuthRequiredRef.current = onAuthRequired;
  }, [onAuthRequired]);

  const applyListResponse = useCallback((data: ApiResponse<Todo[]>) => {
    if (!mountedRef.current) return;
    if (Array.isArray(data.data)) {
      setTodos(data.data);
    }
    setCached(data.cached);
    setSource(data.source);
    setResponseTime(data.responseTimeMs);
    setLastOperation(
      `Loaded ${data.count} todo${data.count === 1 ? '' : 's'} ${
        data.cached ? '(cached)' : '(fresh)'
      } in ${data.responseTimeMs}ms`
    );
  }, []);

  const refresh = useCallback(
    async (bypassCache: boolean = false) => {
      setLoading(true);
      setError(null);
      try {
        const url = bypassCache ? `${LIST_URL}?refresh=true` : LIST_URL;
        const res = await fetch(url, { cache: 'no-store' });
        const data = (await res.json()) as ApiResponse<Todo[]>;
        if (!res.ok || data.error) {
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }
        applyListResponse(data);
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load todos');
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setHydrated(true);
        }
      }
    },
    [applyListResponse]
  );

  const invalidateCache = useCallback(async () => {
    await refresh(true);
  }, [refresh]);

  useEffect(() => {
    void refresh(false);
  }, [refresh]);

  const createTodo = useCallback(
    async (input: CreateTodoInput): Promise<Todo | null> => {
      setError(null);
      try {
        const res = await fetch(LIST_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
          cache: 'no-store',
        });
        const data = (await res.json()) as ApiResponse<Todo>;
        if (res.status === 401) {
          onAuthRequiredRef.current?.();
          throw new Error('Authentication required');
        }
        if (!res.ok || data.error) {
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }
        if (!mountedRef.current) return data.data;
        setTodos((prev) => [...prev, data.data]);
        setSource(data.source);
        setResponseTime(data.responseTimeMs);
        setLastOperation(
          `Created "${data.data.title}" in ${data.responseTimeMs}ms`
        );
        return data.data;
      } catch (err) {
        if (mountedRef.current) {
          setError(
            err instanceof Error ? err.message : 'Failed to create todo'
          );
        }
        return null;
      }
    },
    []
  );

  const updateTodo = useCallback(
    async (id: string, updates: UpdateTodoInput): Promise<Todo | null> => {
      setError(null);
      try {
        const res = await fetch(ITEM_URL(id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
          cache: 'no-store',
        });
        const data = (await res.json()) as ApiResponse<Todo>;
        if (res.status === 401) {
          onAuthRequiredRef.current?.();
          throw new Error('Authentication required');
        }
        if (!res.ok || data.error) {
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }
        if (!mountedRef.current) return data.data;
        setTodos((prev) =>
          prev.map((item) => (item.id === id ? data.data : item))
        );
        setSource(data.source);
        setResponseTime(data.responseTimeMs);
        setLastOperation(
          `Updated "${data.data.title}" in ${data.responseTimeMs}ms`
        );
        return data.data;
      } catch (err) {
        if (mountedRef.current) {
          setError(
            err instanceof Error ? err.message : 'Failed to update todo'
          );
        }
        return null;
      }
    },
    []
  );

  const deleteTodo = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);
      let removedIndex = -1;
      let removedItem: Todo | null = null;

      setTodos((prev) => {
        removedIndex = prev.findIndex((item) => item.id === id);
        if (removedIndex === -1) return prev;
        removedItem = prev[removedIndex];
        const next = prev.slice();
        next.splice(removedIndex, 1);
        return next;
      });

      try {
        const res = await fetch(ITEM_URL(id), {
          method: 'DELETE',
          cache: 'no-store',
        });
        const data = (await res.json()) as ApiResponse<{ id: string }>;
        if (res.status === 401) {
          onAuthRequiredRef.current?.();
          throw new Error('Authentication required');
        }
        if (!res.ok || data.error) {
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }
        if (!mountedRef.current) return true;
        setSource(data.source);
        setResponseTime(data.responseTimeMs);
        setLastOperation(`Deleted todo in ${data.responseTimeMs}ms`);
        return true;
      } catch (err) {
        if (mountedRef.current) {
          if (removedItem !== null && removedIndex !== -1) {
            const restored = removedItem;
            const index = removedIndex;
            setTodos((prev) => {
              const next = prev.slice();
              next.splice(index, 0, restored);
              return next;
            });
          }
          setError(
            err instanceof Error ? err.message : 'Failed to delete todo'
          );
        }
        return false;
      }
    },
    []
  );

  const toggleComplete = useCallback(
    async (id: string, completed: boolean): Promise<void> => {
      setError(null);
      setTodos((prev) =>
        prev.map((item) => (item.id === id ? { ...item, completed } : item))
      );

      try {
        const res = await fetch(ITEM_URL(id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed }),
          cache: 'no-store',
        });
        const data = (await res.json()) as ApiResponse<Todo>;
        if (res.status === 401) {
          onAuthRequiredRef.current?.();
          throw new Error('Authentication required');
        }
        if (!res.ok || data.error) {
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }
        if (!mountedRef.current) return;
        setTodos((prev) =>
          prev.map((item) => (item.id === id ? data.data : item))
        );
        setSource(data.source);
        setResponseTime(data.responseTimeMs);
        setLastOperation(
          `${completed ? 'Completed' : 'Reopened'} "${
            data.data.title
          }" in ${data.responseTimeMs}ms`
        );
      } catch (err) {
        if (mountedRef.current) {
          setTodos((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, completed: !completed } : item
            )
          );
          setError(
            err instanceof Error ? err.message : 'Failed to update todo'
          );
        }
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    todos,
    loading,
    error,
    hydrated,
    responseTime,
    source,
    cached,
    lastOperation,
    refresh,
    invalidateCache,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    clearError,
  };
}