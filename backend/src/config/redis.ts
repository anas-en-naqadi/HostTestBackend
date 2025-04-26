// src/config/redis.ts
import Redis from 'ioredis';


const redis = new Redis(process.env.REDIS_URL || "redis://default:NvKslbpDoXkbfbTaWcEbiMfeCFSrCSjh@switchyard.proxy.rlwy.net:20226", {
    db: 1
  });


export default redis;