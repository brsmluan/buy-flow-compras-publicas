// =============================================================================
// BUY-FLOW BACKEND - Redis Client (Cache + BullMQ)
// =============================================================================

import { createClient, RedisClientType } from 'redis';
import { env } from '../config/index';

let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient?.isOpen) return redisClient;

  redisClient = createClient({
    url: env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries: number) => Math.min(retries * 100, 3000),
    },
  });

  redisClient.on('error', (err: Error) => {
    console.error('❌ Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis connected');
  });

  redisClient.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
  });

  await redisClient.connect();
  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient?.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
}

// Helpers de cache
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const client = await getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  },

  async set(key: string, value: unknown, ttlSeconds: number = 300): Promise<void> {
    const client = await getRedisClient();
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
  },

  async del(key: string): Promise<void> {
    const client = await getRedisClient();
    await client.del(key);
  },

  async delPattern(pattern: string): Promise<void> {
    const client = await getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  },

  async exists(key: string): Promise<boolean> {
    const client = await getRedisClient();
    return (await client.exists(key)) === 1;
  },
};

export default getRedisClient;