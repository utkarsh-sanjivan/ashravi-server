const redis = require('redis');
const logger = require('../utils/logger');

class RedisConfig {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.retryAttempts = 0;
    this.maxRetries = 5;
  }

  async connect() {
    try {
      if (this.client && this.isConnected) {
        logger.info('Redis already connected');
        return this.client;
      }

      const options = {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD || undefined,

        // Connection options
        connectTimeout: 10000,
        lazyConnect: true,
        keepAlive: 30000,

        // Retry strategy
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,

        // Enable offline queue
        enableOfflineQueue: false,

        // Connection name for identification
        connectionName: 'nodejs-server-layered'
      };

      this.client = redis.createClient(options);

      // Setup event listeners
      this.setupEventListeners();

      // Connect to Redis
      await this.client.connect();

      this.isConnected = true;
      this.retryAttempts = 0;

      logger.info('Redis client connected', {
        url: process.env.REDIS_URL,
        connectionName: options.connectionName
      });

      return this.client;
    } catch (error) {
      this.isConnected = false;
      this.retryAttempts++;

      logger.error('Redis connection failed:', {
        error: error.message,
        retryAttempt: this.retryAttempts,
        maxRetries: this.maxRetries
      });

      if (this.retryAttempts < this.maxRetries) {
        const delay = Math.pow(2, this.retryAttempts) * 1000; // Exponential backoff
        logger.info(`Retrying Redis connection in ${delay}ms...`);

        setTimeout(() => {
          this.connect();
        }, delay);
      } else {
        logger.warn('Maximum Redis connection retry attempts exceeded, continuing without Redis');
        return null;
      }
    }
  }

  setupEventListeners() {
    if (!this.client) return;

    this.client.on('error', (error) => {
      logger.error('Redis Client Error:', {
        error: error.message,
        stack: error.stack
      });
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
      this.isConnected = true;
      this.retryAttempts = 0;
    });

    this.client.on('end', () => {
      logger.warn('Redis client disconnected');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await this.disconnect();
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
    });
  }

  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        logger.info('Redis connection closed through app termination');
      }
    } catch (error) {
      logger.error('Error during Redis disconnection:', error);
    }
  }

  getClient() {
    return this.client;
  }

  isReady() {
    return this.client && this.isConnected;
  }

  async healthCheck() {
    try {
      if (!this.isReady()) {
        throw new Error('Redis client not ready');
      }

      // Simple ping to Redis
      const result = await this.client.ping();

      if (result !== 'PONG') {
        throw new Error('Redis ping failed');
      }

      return {
        status: 'healthy',
        isConnected: this.isConnected,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        isConnected: this.isConnected,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Utility methods for common Redis operations
  async set(key, value, ttl = 3600) {
    try {
      if (!this.isReady()) {
        logger.warn('Redis not available, skipping set operation');
        return false;
      }

      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }

      return true;
    } catch (error) {
      logger.error('Redis set operation failed:', {
        key,
        error: error.message
      });
      return false;
    }
  }

  async get(key) {
    try {
      if (!this.isReady()) {
        logger.warn('Redis not available, skipping get operation');
        return null;
      }

      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis get operation failed:', {
        key,
        error: error.message
      });
      return null;
    }
  }

  async del(key) {
    try {
      if (!this.isReady()) {
        logger.warn('Redis not available, skipping delete operation');
        return false;
      }

      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      logger.error('Redis delete operation failed:', {
        key,
        error: error.message
      });
      return false;
    }
  }

  async exists(key) {
    try {
      if (!this.isReady()) {
        return false;
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists operation failed:', {
        key,
        error: error.message
      });
      return false;
    }
  }

  async flushAll() {
    try {
      if (!this.isReady()) {
        logger.warn('Redis not available, skipping flush operation');
        return false;
      }

      await this.client.flushAll();
      logger.info('Redis cache cleared');
      return true;
    } catch (error) {
      logger.error('Redis flush operation failed:', error);
      return false;
    }
  }
}

module.exports = new RedisConfig();
