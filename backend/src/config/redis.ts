// src/config/redis.ts
import Redis from 'ioredis';


const redis = new Redis({
  host: "switchyard.proxy.rlwy.net",
  port: 20226,
  username: "default",
  password: "NvKslbpDoXkbfbTaWcEbiMfeCFSrCSjh",
  db: 1,
  retryStrategy: (times) => {
    console.log(`Redis connection attempt ${times} failed, retrying...`);
    return Math.min(times * 500, 5000);
  }
});



export default redis;