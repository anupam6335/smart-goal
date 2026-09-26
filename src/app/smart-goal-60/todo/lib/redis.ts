import Redis from 'ioredis';

const LOG_PREFIX = '[sg60:redis]';

const GLOBAL_KEY = Symbol.for('sg60.todo.redis.client');

type GlobalWithRedis = typeof globalThis & {
  [GLOBAL_KEY]?: Redis | null;
};

function createClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn(`${LOG_PREFIX} REDIS_URL is not set; caching disabled.`);
    return null;
  }

  const client = new Redis(url, {
    lazyConnect: true,
    enableReadyCheck: true,
    maxRetriesPerRequest: 2,
    retryStrategy: (times) => Math.min(times * 200, 2000),
  });

  client.on('error', (err) => {
    console.error(`${LOG_PREFIX} connection error:`, err.message);
  });

  return client;
}

function getClient(): Redis | null {
  const g = globalThis as GlobalWithRedis;
  if (g[GLOBAL_KEY] === undefined) {
    g[GLOBAL_KEY] = createClient();
  }
  return g[GLOBAL_KEY] ?? null;
}

async function ensureConnected(client: Redis): Promise<boolean> {
  if (client.status === 'ready') return true;
  try {
    if (client.status === 'wait') {
      await client.connect();
    }
    const status: string = client.status;
    return status === 'ready' || status === 'connecting';
  } catch (err) {
    console.error(
      `${LOG_PREFIX} connect failed:`,
      err instanceof Error ? err.message : String(err)
    );
    return false;
  }
}

export async function get<T>(key: string): Promise<T | null> {
  const client = getClient();
  if (!client) return null;

  try {
    if (!(await ensureConnected(client))) return null;
    const raw = await client.get(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(
      `${LOG_PREFIX} GET ${key} failed:`,
      err instanceof Error ? err.message : String(err)
    );
    return null;
  }
}

export async function set<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
    console.error(`${LOG_PREFIX} SET ${key} rejected: invalid TTL ${ttlSeconds}`);
    return false;
  }

  try {
    if (!(await ensureConnected(client))) return false;
    const payload = JSON.stringify(value);
    await client.set(key, payload, 'EX', Math.floor(ttlSeconds));
    return true;
  } catch (err) {
    console.error(
      `${LOG_PREFIX} SET ${key} failed:`,
      err instanceof Error ? err.message : String(err)
    );
    return false;
  }
}

export async function del(key: string): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  try {
    if (!(await ensureConnected(client))) return false;
    await client.del(key);
    return true;
  } catch (err) {
    console.error(
      `${LOG_PREFIX} DEL ${key} failed:`,
      err instanceof Error ? err.message : String(err)
    );
    return false;
  }
}

export async function deletePrefix(prefix: string): Promise<number> {
  const client = getClient();
  if (!client) return 0;

  try {
    if (!(await ensureConnected(client))) return 0;

    let cursor = '0';
    let deleted = 0;

    do {
      const [nextCursor, keys] = await client.scan(
        cursor,
        'MATCH',
        `${prefix}*`,
        'COUNT',
        100
      );
      cursor = nextCursor;

      if (keys.length > 0) {
        deleted += await client.del(...keys);
      }
    } while (cursor !== '0');

    return deleted;
  } catch (err) {
    console.error(
      `${LOG_PREFIX} deletePrefix ${prefix}* failed:`,
      err instanceof Error ? err.message : String(err)
    );
    return 0;
  }
}

export async function ping(): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  try {
    if (!(await ensureConnected(client))) return false;
    const reply = await client.ping();
    return reply === 'PONG';
  } catch (err) {
    console.error(
      `${LOG_PREFIX} PING failed:`,
      err instanceof Error ? err.message : String(err)
    );
    return false;
  }
}

export const CACHE_KEYS = {
  todoList: 'sg60:todos:list',
  todoById: (id: string) => `sg60:todo:${id}`,
  session: (token: string) => `sg60:session:${token}`,
  rateLimit: (ip: string) => `sg60:ratelimit:${ip}`,
  authPassword: 'sg60:auth:password',
  todosPrefix: 'sg60:todo',
} as const;

export const CACHE_TTL = {
  todoList: 60,
  todoById: 60,
  session: 3600,
  rateLimit: 60,
  authPassword: 60 * 60 * 24 * 365,
} as const;