import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    lazyConnect: true,
  });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

export const CACHE_TTL = {
  CITY_SEARCH: 600,      // 10 min
  TRENDING: 300,         // 5 min
  UNDERRATED: 600,       // 10 min
  VIRAL: 120,            // 2 min
  PLACE_DETAIL: 180,     // 3 min
} as const;

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const val = await redis.get(key);
    return val ? (JSON.parse(val) as T) : null;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttl: number) {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
  } catch {
    // Redis errors shouldn't break the app
  }
}

export async function invalidateCache(...keys: string[]) {
  try {
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // Silent fail
  }
}
