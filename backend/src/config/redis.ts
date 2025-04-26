// src/config/redis.ts
import Redis from 'ioredis';


const redis = new Redis(process.env.REDIS_URL || "", {
    db: 1
  });


export default redis;