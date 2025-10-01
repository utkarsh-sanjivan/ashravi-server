const logger = require('../utils/logger');

class ErrorHandler {
  /**
   * Global error handling middleware
   * @param {Error} err - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  handle(err, req, res, next) {
    let error = { ...err };
    error.message = err.message;

    // Log error details with context
    logger.error('Error caught by global handler:', {
      message: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      body: req.body,
      query: req.query,
      params: req.params,
      statusCode: error.statusCode || 500
    });

    // Handle different types of errors
    if (err.name === 'CastError') {
      const message = 'Invalid resource ID format';
      error = { message, statusCode: 400, code: 'INVALID_ID' };
    }

    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];
      const message = `Duplicate value for ${field}: ${value}`;
      error = { message, statusCode: 400, code: 'DUPLICATE_FIELD' };
    }

    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      const message = messages.join(', ');
      error = { message, statusCode: 400, code: 'VALIDATION_ERROR' };
    }

    if (err.name === 'JsonWebTokenError') {
      const message = 'Invalid authentication token';
      error = { message, statusCode: 401, code: 'INVALID_TOKEN' };
    }

    if (err.name === 'TokenExpiredError') {
      const message = 'Authentication token has expired';
      error = { message, statusCode: 401, code: 'TOKEN_EXPIRED' };
    }

    if (err.type === 'entity.too.large') {
      const message = 'Request payload too large';
      error = { message, statusCode: 413, code: 'PAYLOAD_TOO_LARGE' };
    }

    // Handle async errors
    if (err.name === 'MongoError' || err.name === 'MongoServerError') {
      let message = 'Database operation failed';
      let statusCode = 500;
      let code = 'DATABASE_ERROR';

      if (err.code === 11000) {
        message = 'Duplicate entry found';
        statusCode = 400;
        code = 'DUPLICATE_ENTRY';
      }

      error = { message, statusCode, code };
    }

    // Handle Redis errors
    if (err.message && err.message.includes('Redis')) {
      const message = 'Cache service temporarily unavailable';
      error = { message, statusCode: 503, code: 'CACHE_ERROR' };
    }

    // Handle rate limiting errors
    if (err.name === 'RateLimitError') {
      const message = 'Too many requests, please try again later';
      error = { message, statusCode: 429, code: 'RATE_LIMIT_EXCEEDED' };
    }

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    const code = error.code || 'INTERNAL_ERROR';

    // Prepare response
    const response = {
      success: false,
      error: message,
      code,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        originalError: err.message
      })
    };

    // Add request ID if available (from request tracking middleware)
    if (req.requestId) {
      response.requestId = req.requestId;
    }

    res.status(statusCode).json(response);
  }

  /**
   * Handle 404 errors
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  notFound(req, res, next) {
    logger.warn('Route not found:', {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });

    const error = new Error(`Route ${req.originalUrl} not found`);
    error.statusCode = 404;
    error.code = 'ROUTE_NOT_FOUND';

    next(error);
  }

  /**
   * Handle async errors in route handlers
   * @param {Function} fn - Async function to wrap
   * @returns {Function} Express middleware function
   */
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Custom error class for application errors
   */
  static AppError = class extends Error {
    constructor(message, statusCode = 500, code = 'APP_ERROR', isOperational = true) {
      super(message);

      this.statusCode = statusCode;
      this.code = code;
      this.isOperational = isOperational;
      this.timestamp = new Date().toISOString();

      Error.captureStackTrace(this, this.constructor);
    }
  };

  /**
   * Validation error helper
   * @param {string} message - Error message
   * @param {Array} details - Validation error details
   * @returns {AppError} Application error instance
   */
  static validationError(message, details = []) {
    const error = new this.AppError(message, 400, 'VALIDATION_ERROR');
    error.details = details;
    return error;
  }

  /**
   * Authorization error helper
   * @param {string} message - Error message
   * @returns {AppError} Application error instance
   */
  static authorizationError(message = 'Access denied') {
    return new this.AppError(message, 403, 'AUTHORIZATION_ERROR');
  }

  /**
   * Not found error helper
   * @param {string} resource - Resource name
   * @returns {AppError} Application error instance
   */
  static notFoundError(resource = 'Resource') {
    return new this.AppError(`${resource} not found`, 404, 'NOT_FOUND');
  }

  /**
   * Conflict error helper
   * @param {string} message - Error message
   * @returns {AppError} Application error instance
   */
  static conflictError(message) {
    return new this.AppError(message, 409, 'CONFLICT');
  }

  /**
   * Internal server error helper
   * @param {string} message - Error message
   * @returns {AppError} Application error instance
   */
  static internalError(message = 'Internal server error') {
    return new this.AppError(message, 500, 'INTERNAL_ERROR');
  }
}

module.exports = new ErrorHandler();
