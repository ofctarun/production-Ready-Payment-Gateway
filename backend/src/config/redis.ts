import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const workerConnection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
});

console.log(`Redis connected to ${redisUrl}`);
