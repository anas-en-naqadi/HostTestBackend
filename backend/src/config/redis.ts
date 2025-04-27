import Redis from 'ioredis';

// Log the connection attempt
console.log("Connecting to Redis at: switchyard.proxy.rlwy.net:20226");

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

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('Successfully connected to Redis at switchyard.proxy.rlwy.net:20226');
});

export default redis;