// src/config/redis.ts
import Redis from 'ioredis';
import './env';

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    db: 1
  });


export default redis;