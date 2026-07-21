import { getRedisClient } from './redis';

/**
 * Retrieves a value from the cache.
 * @param key - The cache key.
 * @returns The parsed value if found, otherwise null.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    if (value === null) return null;

    // Attempt to parse JSON; if it fails, return the raw string.
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  } catch (error) {
    console.error(`[Cache] Get error for key "${key}":`, error);
    return null;
  }
}

/**
 * Stores a value in the cache with an optional TTL.
 * @param key - The cache key.
 * @param value - The value to store (will be serialized to JSON if object).
 * @param ttl - Time‑to‑live in seconds (default 300).
 * @returns true if successful, false otherwise.
 */
export async function cacheSet<T>(key: string, value: T, ttl: number = 300): Promise<boolean> {
  try {
    const client = getRedisClient();
    let serialized: string;
    if (typeof value === 'string') {
      serialized = value;
    } else {
      serialized = JSON.stringify(value);
    }
    if (ttl > 0) {
      await client.setex(key, ttl, serialized);
    } else {
      await client.set(key, serialized);
    }
    return true;
  } catch (error) {
    console.error(`[Cache] Set error for key "${key}":`, error);
    return false;
  }
}

/**
 * Deletes a single key from the cache.
 * @param key - The cache key.
 * @returns true if key was deleted, false if not found or error.
 */
export async function cacheDelete(key: string): Promise<boolean> {
  try {
    const client = getRedisClient();
    const result = await client.del(key);
    return result > 0;
  } catch (error) {
    console.error(`[Cache] Delete error for key "${key}":`, error);
    return false;
  }
}

/**
 * Clears all keys matching a pattern using SCAN (non‑blocking).
 * @param pattern - The glob‑style pattern (e.g., "posts:*").
 * @returns The number of keys deleted, or -1 if an error occurred.
 */
export async function cacheClear(pattern: string): Promise<number> {
  try {
    const client = getRedisClient();
    let cursor = '0';
    let deletedCount = 0;

    do {
      const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        const delResult = await client.del(...keys);
        deletedCount += delResult;
      }
    } while (cursor !== '0');

    return deletedCount;
  } catch (error) {
    console.error(`[Cache] Clear error for pattern "${pattern}":`, error);
    return -1;
  }
}

/**
 * Returns the remaining TTL (in seconds) for a given key.
 * @param key - The cache key.
 * @returns The TTL in seconds, -1 if no expiry, -2 if key does not exist, or -3 on error.
 */
export async function cacheTTL(key: string): Promise<number> {
  try {
    const client = getRedisClient();
    const ttl = await client.ttl(key);
    return ttl;
  } catch (error) {
    console.error(`[Cache] TTL error for key "${key}":`, error);
    return -3;
  }
}