const winston = require('winston');
const path = require('path');

class Logger {
  constructor() {
    this.logger = this.createLogger();
  }

  createLogger() {
    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        const logObject = {
          timestamp,
          level: level.toUpperCase(),
          message,
          ...(stack && { stack }),
          ...(Object.keys(meta).length > 0 && { meta })
        };
        return JSON.stringify(logObject);
      })
    );

    // Create logger instance
    const logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      defaultMeta: { 
        service: 'nodejs-server-layered',
        environment: process.env.NODE_ENV || 'development'
      },
      transports: [
        // Console transport
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'HH:mm:ss' }),
            winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
              const metaString = Object.keys(meta).length > 0 ? 
                `\n${JSON.stringify(meta, null, 2)}` : '';
              return `${timestamp} [${level}]: ${message}${stack ? `\n${stack}` : ''}${metaString}`;
            })
          )
        }),

        // File transport for all logs
        new winston.transports.File({
          filename: path.join(__dirname, '../../logs/combined.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5,
          tailable: true
        }),

        // File transport for error logs only
        new winston.transports.File({
          filename: path.join(__dirname, '../../logs/error.log'),
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
          tailable: true
        }),

        // File transport for audit logs
        new winston.transports.File({
          filename: path.join(__dirname, '../../logs/audit.log'),
          level: 'info',
          maxsize: 5242880, // 5MB
          maxFiles: 10,
          tailable: true,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      ],

      // Handle exceptions and rejections
      exceptionHandlers: [
        new winston.transports.File({ 
          filename: path.join(__dirname, '../../logs/exceptions.log') 
        })
      ],
      rejectionHandlers: [
        new winston.transports.File({ 
          filename: path.join(__dirname, '../../logs/rejections.log') 
        })
      ]
    });

    return logger;
  }

  // Logging methods with context support
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  verbose(message, meta = {}) {
    this.logger.verbose(message, meta);
  }

  // HTTP request logging
  http(message, meta = {}) {
    this.logger.http(message, meta);
  }

  // Security-related logging
  security(message, meta = {}) {
    this.logger.warn(`[SECURITY] ${message}`, meta);
  }

  // Audit logging for important actions
  audit(action, meta = {}) {
    this.logger.info(`[AUDIT] ${action}`, {
      ...meta,
      timestamp: new Date().toISOString(),
      type: 'audit'
    });
  }

  // Performance logging
  performance(message, duration, meta = {}) {
    this.logger.info(`[PERFORMANCE] ${message}`, {
      ...meta,
      duration: `${duration}ms`,
      type: 'performance'
    });
  }

  // Database operation logging
  database(operation, meta = {}) {
    this.logger.debug(`[DATABASE] ${operation}`, {
      ...meta,
      type: 'database'
    });
  }

  // API logging
  api(method, endpoint, statusCode, responseTime, meta = {}) {
    const level = statusCode >= 400 ? 'warn' : 'info';
    this.logger[level](`[API] ${method} ${endpoint} ${statusCode}`, {
      ...meta,
      method,
      endpoint,
      statusCode,
      responseTime: `${responseTime}ms`,
      type: 'api'
    });
  }

  // Create child logger with additional context
  child(meta = {}) {
    return {
      info: (message, additionalMeta = {}) => this.info(message, { ...meta, ...additionalMeta }),
      warn: (message, additionalMeta = {}) => this.warn(message, { ...meta, ...additionalMeta }),
      error: (message, additionalMeta = {}) => this.error(message, { ...meta, ...additionalMeta }),
      debug: (message, additionalMeta = {}) => this.debug(message, { ...meta, ...additionalMeta }),
      verbose: (message, additionalMeta = {}) => this.verbose(message, { ...meta, ...additionalMeta }),
      http: (message, additionalMeta = {}) => this.http(message, { ...meta, ...additionalMeta }),
      security: (message, additionalMeta = {}) => this.security(message, { ...meta, ...additionalMeta }),
      audit: (action, additionalMeta = {}) => this.audit(action, { ...meta, ...additionalMeta }),
      performance: (message, duration, additionalMeta = {}) => this.performance(message, duration, { ...meta, ...additionalMeta }),
      database: (operation, additionalMeta = {}) => this.database(operation, { ...meta, ...additionalMeta }),
      api: (method, endpoint, statusCode, responseTime, additionalMeta = {}) => 
        this.api(method, endpoint, statusCode, responseTime, { ...meta, ...additionalMeta })
    };
  }
}

module.exports = new Logger();
