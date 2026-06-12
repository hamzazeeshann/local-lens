import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

function createRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url || url === "redis://localhost:6379") {
    // No Redis configured — app works without it
    return null;
  }
  try {
    return new Redis(url, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: true,
      connectTimeout: 3000,
    });
  } catch {
    return null;
  }
}

export const redis: Redis | null =
  globalForRedis.redis !== undefined ? globalForRedis.redis : createRedis();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis ?? undefined;

export const CACHE_TTL = {
  CITY_SEARCH: 600,
  TRENDING: 300,
  UNDERRATED: 600,
  VIRAL: 120,
  PLACE_DETAIL: 180,
} as const;

export async function getCached<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const val = await redis.get(key);
    return val ? (JSON.parse(val) as T) : null;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttl: number) {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
  } catch { /* silent */ }
}

export async function invalidateCache(...keys: string[]) {
  if (!redis || keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch { /* silent */ }
}
