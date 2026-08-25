interface CacheEntry {
  data: any;
  expires: number;
}

const cache = new Map<string, CacheEntry>();


export function memoryCacheGet<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expires < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function memoryCacheSet(key: string, data: any, ttl: number): void {
  cache.set(key, {
    data,
    expires: Date.now() + ttl * 1000,
  });
}


export function memoryCacheDelete(key: string): void {
  cache.delete(key);
}

export function memoryCacheClear(): void {
  cache.clear();
}

export function memoryCacheSize(): number {
  return cache.size;
}