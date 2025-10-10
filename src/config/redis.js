const redis = require('redis');
const logger = require('../utils/logger');

let redisClient = null;
const USE_REDIS = process.env.USE_REDIS === 'true';

/*
 * Initialize Redis connection (optional)
 * 
 * @returns Redis client or null
 */
const connectRedis = async () => {
  if (!USE_REDIS) {
    logger.info('Redis is disabled');
    return null;
  }

  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000
      }
    });

    redisClient.on('error', (err) => {
      logger.warn('Redis connection error (continuing without cache):', err.message);
      redisClient = null;
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.warn('Failed to connect to Redis (continuing without cache):', error.message);
    return null;
  }
};

/*
 * Get Redis client
 * 
 * @returns Redis client or null
 */
const getRedisClient = () => {
  return redisClient;
};

/*
 * Check if Redis is available
 * 
 * @returns Boolean
 */
const isRedisAvailable = () => {
  return redisClient !== null && redisClient.isOpen;
};

/*
 * Close Redis connection
 */
const closeRedis = async () => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  isRedisAvailable,
  closeRedis
};
