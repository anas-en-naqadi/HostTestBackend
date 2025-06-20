// src/config/redis.ts
import Redis, { RedisOptions } from 'ioredis';
import './env';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is not defined in the environment variables.');
}

const isProduction = process.env.NODE_ENV === 'production';

const redisOptions: RedisOptions = {
  db:1,
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 100, 3000); // Exponential backoff with a cap
    return delay;
  },
  connectTimeout: 10000,
  enableReadyCheck: true,
  enableOfflineQueue: !isProduction,
  tls: isProduction ? {} : undefined,
};

const redis = new Redis(process.env.REDIS_URL, redisOptions);

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

redis.on('ready', () => {
  console.log('Redis is ready to accept commands');
});

redis.on('reconnecting', () => {
  console.log('Redis is reconnecting...');
});

redis.on('end', () => {
  console.log('Redis connection ended');
});

export default redis;