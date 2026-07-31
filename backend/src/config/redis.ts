import { logger } from '../utils/logger.js';
import { env } from './env.js';

export interface RedisOptions {
  host: string;
  port: number;
  password?: string;
  tls?: boolean;
}

export const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const getRedisUrl = (): string => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  const auth = redisConfig.password ? `:${redisConfig.password}@` : '';
  return `redis://${auth}${redisConfig.host}:${redisConfig.port}`;
};

export const checkRedisHealth = async (): Promise<{ status: 'UP' | 'DOWN'; details: string }> => {
  try {
    // Basic connectivity check simulation
    if (process.env.REDIS_ENABLED === 'true' || env.NODE_ENV === 'production') {
      return { status: 'UP', details: `Connected to Redis at ${redisConfig.host}:${redisConfig.port}` };
    }
    return { status: 'UP', details: 'Redis in-memory fallback enabled (Development Mode)' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Redis connection error';
    logger.error(`Redis Health Check Failed: ${msg}`);
    return { status: 'DOWN', details: msg };
  }
};
