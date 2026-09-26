'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type SetValue<T> = (value: React.SetStateAction<T>) => void;

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, SetValue<T>, boolean] {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);
  const skipStorageRef = useRef(false);

  useEffect(() => {
    hydratedRef.current = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        try {
          setValue(JSON.parse(raw) as T);
        } catch {
          window.localStorage.removeItem(key);
        }
      }
    } catch {
      // localStorage unavailable – keep initialValue
    } finally {
      setHydrated(true);
    }
  }, [key]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (skipStorageRef.current) {
      skipStorageRef.current = false;
      return;
    }
    try {
      if (value === null || value === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      // quota exceeded or storage disabled – state still updates
    }
  }, [key, value]);

  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key !== key) return;
      if (event.storageArea !== null && event.storageArea !== window.localStorage) {
        return;
      }
      if (event.newValue === null) {
        skipStorageRef.current = true;
        setValue(initialValue);
        return;
      }
      try {
        const parsed = JSON.parse(event.newValue) as T;
        skipStorageRef.current = true;
        setValue(parsed);
      } catch {
        // ignore malformed cross-tab writes
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key, initialValue]);

  const setStoredValue: SetValue<T> = useCallback((next) => {
    setValue((prev) => {
      const resolved =
        typeof next === 'function'
          ? (next as (previous: T) => T)(prev)
          : next;
      return resolved;
    });
  }, []);

  return [value, setStoredValue, hydrated];
}