const mongoose = require('mongoose');
const logger = require('../utils/logger');

class DatabaseConfig {
  constructor() {
    this.isConnected = false;
    this.retryAttempts = 0;
    this.maxRetries = 5;
  }

  async connect() {
    try {
      if (this.isConnected) {
        logger.info('Database already connected');
        return;
      }

      const options = {
        // Connection options
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        bufferCommands: false, // Disable mongoose buffering

        // Replica set options
        retryWrites: true,
        retryReads: true,

        // Compression
        compressors: ['zlib'],

        // Authentication (if needed)
        authSource: 'admin',

        // TLS options (for production)
        ...(process.env.NODE_ENV === 'production' && {
          tls: true,
          tlsAllowInvalidCertificates: false,
          tlsAllowInvalidHostnames: false
        })
      };

      await mongoose.connect(process.env.MONGO_URI, options);

      this.isConnected = true;
      this.retryAttempts = 0;

      logger.info(`MongoDB connected: ${mongoose.connection.host}`, {
        database: mongoose.connection.name,
        readyState: mongoose.connection.readyState
      });

      // Setup event listeners
      this.setupEventListeners();

    } catch (error) {
      this.isConnected = false;
      this.retryAttempts++;

      logger.error('Database connection failed:', {
        error: error.message,
        retryAttempt: this.retryAttempts,
        maxRetries: this.maxRetries
      });

      if (this.retryAttempts < this.maxRetries) {
        const delay = Math.pow(2, this.retryAttempts) * 1000; // Exponential backoff
        logger.info(`Retrying database connection in ${delay}ms...`);

        setTimeout(() => {
          this.connect();
        }, delay);
      } else {
        logger.error('Maximum database connection retry attempts exceeded');
        process.exit(1);
      }
    }
  }

  setupEventListeners() {
    const connection = mongoose.connection;

    connection.on('error', (error) => {
      logger.error('MongoDB connection error:', {
        error: error.message,
        stack: error.stack
      });
      this.isConnected = false;
    });

    connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      this.isConnected = false;

      // Attempt to reconnect
      if (this.retryAttempts < this.maxRetries) {
        setTimeout(() => {
          this.connect();
        }, 5000);
      }
    });

    connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      this.isConnected = true;
      this.retryAttempts = 0;
    });

    connection.on('close', () => {
      logger.info('MongoDB connection closed');
      this.isConnected = false;
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
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
      }
    } catch (error) {
      logger.error('Error during database disconnection:', error);
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    };
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        throw new Error('Database not connected');
      }

      // Simple ping to database
      await mongoose.connection.db.admin().ping();

      return {
        status: 'healthy',
        connection: this.getConnectionStatus(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        connection: this.getConnectionStatus(),
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new DatabaseConfig();
