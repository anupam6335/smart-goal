import { CACHE_KEYS, CACHE_TTL, get, set } from './redis';

const WINDOW_MS = CACHE_TTL.rateLimit * 1000;
const DEFAULT_LIMIT = 60;

interface RateLimitRecord {
  count: number;
  windowStart: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export async function checkRateLimit(
  identifier: string,
  limit: number = DEFAULT_LIMIT
): Promise<RateLimitResult> {
  const key = CACHE_KEYS.rateLimit(identifier);
  const now = Date.now();
  const existing = await get<RateLimitRecord>(key);

  if (existing === null || now - existing.windowStart >= WINDOW_MS) {
    const record: RateLimitRecord = { count: 1, windowStart: now };
    const resetAt = now + WINDOW_MS;
    await set(key, record, Math.max(1, Math.ceil(WINDOW_MS / 1000)));
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  const resetAt = existing.windowStart + WINDOW_MS;
  const ttlSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));

  if (existing.count >= limit) {
    await set(key, existing, ttlSeconds);
    return { allowed: false, remaining: 0, resetAt };
  }

  const next: RateLimitRecord = {
    count: existing.count + 1,
    windowStart: existing.windowStart,
  };
  await set(key, next, ttlSeconds);
  return { allowed: true, remaining: limit - next.count, resetAt };
}

export function getClientIdentifier(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded !== null) {
    const first = forwarded.split(',')[0]?.trim();
    if (first !== undefined && first.length > 0) {
      return first;
    }
  }

  const realIp = headers.get('x-real-ip');
  if (realIp !== null && realIp.length > 0) {
    return realIp;
  }

  return 'unknown';
}