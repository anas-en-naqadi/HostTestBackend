// src/config/redis.ts
import Redis from 'ioredis';
import './env';

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    db: 1,
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    connectTimeout: 5000,
    enableReadyCheck: true,
    enableOfflineQueue: true
  });


export default redis;