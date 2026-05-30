/**
 * @fileoverview Redis Configuration & Connections
 * Sets up multiple Redis clients for different infrastructural needs:
 * 1. Socket.io Adapter (pubClient/subClient) for horizontal scaling
 * 2. General caching/presence tracking (redisClient)
 * 3. BullMQ asynchronous task queue (ioRedisClient)
 */

const { createClient } = require('redis');
const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// ─── Socket.io Redis Adapter Clients ──────────────────────────────
// Used exclusively by @socket.io/redis-adapter to broadcast events across multiple Node.js instances
const pubClient = createClient({ url: redisUrl });
const subClient = pubClient.duplicate();

// ─── General Purpose Client ───────────────────────────────────────
// Used for maintaining state like `users:online` sets and caching structure
const redisClient = pubClient.duplicate();

// ─── BullMQ Client ────────────────────────────────────────────────
// BullMQ specifically requires the `ioredis` library instead of `redis`.
// maxRetriesPerRequest must be null for BullMQ to function correctly.
const ioRedisClient = new Redis(redisUrl, { maxRetriesPerRequest: null });

const redisReady = Promise.all([
  pubClient.connect(),
  subClient.connect(),
  redisClient.connect()
]).then(() => {
  console.log('✅ Redis clients connected');
}).catch(err => {
  console.error('❌ Redis connection error:', err);
  process.exit(1);
});

module.exports = {
  pubClient,
  subClient,
  redisClient,
  ioRedisClient,
  redisReady
};
