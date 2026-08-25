/**
 * Caching patterns implementation for Next.js applications.
 * Patterns: Cache-Aside, Write-Through, Write-Behind
 */

import { cacheGet, cacheSet, cacheDelete } from './cache-utils';
import { CACHE_KEYS, DEFAULT_CACHE_TTL } from './constants';

/**
 * Cache-Aside (Lazy Loading)
 *
 * How it works:
 * 1. Check cache for the key
 * 2. If found → return cached data
 * 3. If not found → fetch from database, store in cache, return
 *
 * Use case: Read-heavy applications where data changes infrequently.
 *
 * @param key - Cache key
 * @param fetchFn - Function to fetch data from database
 * @param ttl - Time-to-live in seconds (default: 60)
 * @returns The data (either from cache or fresh)
 */
export async function cacheAside<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_CACHE_TTL
): Promise<T> {
  // 1. Check cache
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // 2. Cache miss → fetch fresh
  const freshData = await fetchFn();

  // 3. Store in cache
  await cacheSet(key, freshData, ttl);

  return freshData;
}

/**
 * Write-Through
 *
 * How it works:
 * 1. Write to database first
 * 2. Write to cache (or invalidate) synchronously
 * 3. Return success only after both operations complete
 *
 * Use case: Applications where consistency is critical (e.g., inventory, user profiles).
 *
 * @param key - Cache key
 * @param data - Data to write
 * @param dbWriteFn - Function to write to database
 * @param ttl - Time-to-live in seconds (default: 60)
 * @returns The written data
 */
export async function writeThrough<T>(
  key: string,
  data: T,
  dbWriteFn: () => Promise<T>,
  ttl: number = DEFAULT_CACHE_TTL
): Promise<T> {
  // 1. Write to database
  const result = await dbWriteFn();

  // 2. Write to cache synchronously
  await cacheSet(key, result, ttl);

  return result;
}

/**
 * Write-Through with Cache Invalidation (for updates/deletes)
 *
 * Instead of updating the cache, we invalidate it so the next read
 * will fetch fresh data using Cache-Aside.
 *
 * @param key - Cache key to invalidate
 * @param dbWriteFn - Function to write to database
 * @returns The result of the database write
 */
export async function writeThroughInvalidate<T>(
  key: string,
  dbWriteFn: () => Promise<T>
): Promise<T> {
  // 1. Write to database
  const result = await dbWriteFn();

  // 2. Invalidate cache synchronously
  await cacheDelete(key);

  return result;
}

/**
 * Write-Behind (Write-Back) - Simple Queue Version
 *
 * How it works:
 * 1. Write to cache immediately
 * 2. Queue database write for later (async)
 * 3. Return success quickly
 * 4. Database write happens in background
 *
 * Use case: High-throughput write-heavy applications (logs, analytics, IoT data).
 *
 * @param key - Cache key
 * @param data - Data to write
 * @param dbWriteFn - Function to write to database
 * @param ttl - Time-to-live in seconds (default: 60)
 * @returns The written data (from cache)
 */
export async function writeBehindSimple<T>(
  key: string,
  data: T,
  dbWriteFn: () => Promise<T>,
  ttl: number = DEFAULT_CACHE_TTL
): Promise<T> {
  // 1. Write to cache immediately
  await cacheSet(key, data, ttl);

  // 2. Schedule database write (async)
  setImmediate(async () => {
    try {
      await dbWriteFn();
      console.log('[Write-Behind] Database write completed for key:', key);
    } catch (error) {
      console.error('[Write-Behind] Database write failed for key:', key, error);
    }
  });

  return data;
}

/**
 * Write-Behind (Write-Back) - Queue-Based Version
 *
 * Batch multiple writes together for better performance.
 *
 * How it works:
 * 1. Write to cache immediately
 * 2. Add write operation to a queue
 * 3. Queue processor flushes writes in batches
 * 4. Return success quickly
 *
 * Use case: High-frequency writes that can be batched.
 */
const writeQueue: Array<{ key: string; data: any; dbWriteFn: () => Promise<any> }> = [];
const BATCH_INTERVAL = 2000; // 2 seconds
const MAX_BATCH_SIZE = 10;
let isProcessing = false;

// Start the background queue processor
setInterval(async () => {
  if (isProcessing || writeQueue.length === 0) return;
  isProcessing = true;

  try {
    const batch = writeQueue.splice(0, MAX_BATCH_SIZE);
    console.log(`[Write-Behind Queue] Processing ${batch.length} items...`);

    await Promise.all(batch.map((item) => item.dbWriteFn()));
    console.log(`[Write-Behind Queue] Batch completed: ${batch.length} items`);
  } catch (error) {
    console.error('[Write-Behind Queue] Batch failed:', error);
  } finally {
    isProcessing = false;
  }
}, BATCH_INTERVAL);

export async function writeBehindQueue<T>(
  key: string,
  data: T,
  dbWriteFn: () => Promise<T>,
  ttl: number = DEFAULT_CACHE_TTL
): Promise<T> {
  // 1. Write to cache immediately
  await cacheSet(key, data, ttl);

  // 2. Add to queue for batch processing
  writeQueue.push({
    key,
    data,
    dbWriteFn: dbWriteFn as () => Promise<any>,
  });

  return data;
}

/**
 * Get the current queue size (for monitoring)
 */
export function getQueueSize(): number {
  return writeQueue.length;
}

/**
 * Flush the queue immediately (useful for testing or shutdown)
 */
export async function flushWriteQueue(): Promise<void> {
  if (writeQueue.length === 0) return;
  const batch = writeQueue.splice(0, writeQueue.length);
  await Promise.all(batch.map((item) => item.dbWriteFn()));
  console.log(`[Write-Behind Queue] Flushed ${batch.length} items`);
}

/**
 * Get the patterns cache key (for use in API routes)
 */
export function getPatternsCacheKey(): string {
  return CACHE_KEYS.PATTERNS_PRODUCTS;
}

/**
 * Get the main products cache key
 */
export function getProductsCacheKey(): string {
  return CACHE_KEYS.PRODUCTS_ALL;
}

/**
 * Pattern option types for the UI
 */
export type CachePattern = 'cache-aside' | 'write-through' | 'write-behind';

export const PATTERN_DESCRIPTIONS: Record<CachePattern, string> = {
  'cache-aside': 'Check cache → Fetch from DB on miss → Store in cache',
  'write-through': 'Write to DB → Write to cache → Return success',
  'write-behind': 'Write to cache → Queue DB write → Return success quickly',
};

export const PATTERN_USE_CASES: Record<CachePattern, string> = {
  'cache-aside': 'Read-heavy, infrequent updates (e.g., product catalog)',
  'write-through': 'Data consistency critical (e.g., inventory, user profiles)',
  'write-behind': 'High write throughput (e.g., logs, analytics, IoT)',
};