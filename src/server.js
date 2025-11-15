require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

// Import configurations
const database = require('./config/database');

// Import utilities and middleware
const logger = require('./utils/logger');
const { handle, notFound } = require('./middleware/errorHandler');

// Import routes
const routes = require('./routes');

class Server {
  constructor() {
    this.app = express();
    this.PORT = process.env.PORT || 3000;
    this.HOST = process.env.HOST || '0.0.0.0';
    this.server = null;

    this.initialize();
  }

  async initialize() {
    try {
      // Connect to databases
      await this.connectDatabases();

      // Setup middleware
      this.setupMiddleware();

      // Setup routes
      this.setupRoutes();

      // Setup error handling
      this.setupErrorHandling();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      // Start server
      this.start();
    } catch (error) {
      logger.error('Server initialization failed:', {
        error: error.message,
        stack: error.stack
      });
      process.exit(1);
    }
  }

  async connectDatabases() {
    logger.info('Connecting to databases...');

    // Connect to MongoDB (required)
    await database.connect();
  }

  setupMiddleware() {
    logger.info('Setting up middleware...');

    // Trust proxy (important for rate limiting and logging)
    this.app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : 0);

    // Security middleware - should be first
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS configuration
    const corsOptions = {
      origin: (origin, callback) => {
        const allowedOrigins = process.env.CORS_ORIGIN
          ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
          : ['http://localhost:3000'];
        
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) {
          callback(null, true);
          return;
        }
        
        // Allow localhost and local network IPs
        const isLocalNetwork = origin.match(/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):\d+$/);
        
        if (allowedOrigins.includes(origin) || isLocalNetwork) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    };
    this.app.use(cors(corsOptions));

    // Compression middleware
    this.app.use(compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      }
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      message: {
        success: false,
        error: 'Too many requests',
        message: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        logger.security('Rate limit exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.originalUrl
        });

        res.status(429).json({
          success: false,
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        });
      }
    });
    this.app.use(limiter);

    // Body parsing middleware with size limits
    this.app.use(express.json({ 
      limit: process.env.MAX_JSON_SIZE || '10mb',
      verify: (req, res, buf, _encoding) => {
        req.rawBody = buf;
      }
    }));
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: process.env.MAX_FORM_SIZE || '10mb' 
    }));

    // Cookie parser for session handling
    this.app.use(cookieParser());

    // Request ID middleware for tracing
    this.app.use((req, res, next) => {
      req.requestId = require('crypto').randomUUID();
      res.setHeader('X-Request-ID', req.requestId);
      next();
    });

    // Request logging middleware
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined', { 
        stream: { 
          write: (message) => logger.http(message.trim()) 
        },
        skip: (req, _res) => req.url === '/health-check' // Skip health check logs
      }));
    }

    // Request timing middleware
    this.app.use((req, res, next) => {
      req.startTime = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        logger.info(req.method, req.originalUrl, res.statusCode, duration, {
          userId: req.user?.id,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.requestId
        });
      });

      next();
    });
  }

  setupRoutes() {
    logger.info('Setting up routes...');

    // Health check endpoint
    this.app.get('/health-check', async (req, res) => {
      const healthCheck = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: await database.healthCheck()
        },
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      };

      const allHealthy = Object.values(healthCheck.services)
        .every(service => service.status === 'healthy');

      res.status(allHealthy ? 200 : 503).json(healthCheck);
    });

    // Detailed health check for monitoring systems
    this.app.get('/health-check/detailed', async (req, res) => {
      const detailed = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: await database.healthCheck()
        },
        system: {
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          platform: process.platform,
          nodeVersion: process.version,
          pid: process.pid
        },
        config: {
          port: this.PORT,
          host: this.HOST,
          corsOrigin: process.env.CORS_ORIGIN,
          rateLimitWindow: process.env.RATE_LIMIT_WINDOW_MS,
          rateLimitMax: process.env.RATE_LIMIT_MAX_REQUESTS
        }
      };

      res.json(detailed);
    });

    // Ready check (Kubernetes readiness probe)
    this.app.get('/ready', async (req, res) => {
      const dbHealth = await database.healthCheck();

      if (dbHealth.status === 'healthy') {
        res.status(200).json({ status: 'ready' });
      } else {
        res.status(503).json({ status: 'not ready', reason: 'database unavailable' });
      }
    });

    // Live check (Kubernetes liveness probe)
    this.app.get('/live', (req, res) => {
      res.status(200).json({ status: 'alive' });
    });

    // API routes
    this.app.use('/api/v1', routes);

    // Serve static files (if any)
    this.app.use('/static', express.static('public', {
      maxAge: process.env.NODE_ENV === 'production' ? '1y' : 0
    }));

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Node.js Server - Layered Architecture',
        version: '1.0.0',
        message: 'Server is running successfully',
        documentation: process.env.NODE_ENV === 'development' ? '/api/v1/docs' : null,
        endpoints: {
          api: '/api/v1',
          health: '/health-check',
          ready: '/ready',
          live: '/live'
        },
        timestamp: new Date().toISOString()
      });
    });
  }

  setupErrorHandling() {
    logger.info('Setting up error handling...');

    // 404 handler - must be after all other routes
    this.app.use('*', notFound);

    // Global error handler - must be last
    this.app.use((err, req, res, next) => {
      handle(err, req, res, next);
    });

    // Uncaught exception handler
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception - shutting down:', {
        error: err.message,
        stack: err.stack
      });

      // Close server gracefully
      this.shutdown('UNCAUGHT_EXCEPTION');
    });

    // Unhandled rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection - shutting down:', {
        reason: reason,
        promise: promise,
        stack: reason?.stack
      });

      // Close server gracefully
      this.shutdown('UNHANDLED_REJECTION');
    });
  }

  setupGracefulShutdown() {
    // Graceful shutdown on SIGTERM
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received');
      this.shutdown('SIGTERM');
    });

    // Graceful shutdown on SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      logger.info('SIGINT received');
      this.shutdown('SIGINT');
    });
  }

  start() {
    this.server = this.app.listen(this.PORT, this.HOST, () => {
      logger.info(`🚀 Server started successfully`, {
        host: this.HOST,
        port: this.PORT,
        environment: process.env.NODE_ENV,
        processId: process.pid,
        nodeVersion: process.version,
        platform: process.platform
      });

      // Log available endpoints
      logger.info('📋 Available endpoints:', {
        api: `http://${this.HOST}:${this.PORT}/api/v1`,
        docs: process.env.NODE_ENV === 'development' ? 
          `http://${this.HOST}:${this.PORT}/api/v1/docs` : 'disabled',
        health: `http://${this.HOST}:${this.PORT}/health-check`
      });
    });

    // Handle server errors
    this.server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${this.PORT} is already in use`);
      } else {
        logger.error('Server error:', error);
      }
      process.exit(1);
    });
  }

  async shutdown(signal) {
    logger.info(`🛑 Graceful shutdown initiated (${signal})`);

    const gracefulShutdownTimeout = 30000; // 30 seconds
    const shutdownTimer = setTimeout(() => {
      logger.error('Graceful shutdown timeout, forcing exit');
      process.exit(1);
    }, gracefulShutdownTimeout);

    try {
      // Stop accepting new requests
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
        logger.info('HTTP server closed');
      }

      // Close database connections
      await database.disconnect();

      logger.info('✅ Graceful shutdown completed');

      clearTimeout(shutdownTimer);
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      clearTimeout(shutdownTimer);
      process.exit(1);
    }
  }
}

// Only start server if this file is executed directly
if (require.main === module) {
  new Server();
}

module.exports = { Server };
