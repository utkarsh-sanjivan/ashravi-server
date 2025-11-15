const logger = require('../utils/logger');

/**
 * Global error handling middleware
 * 
 * @params {err}: Error - Error object
 * @params {req}: Object - Express request object
 * @params {res}: Object - Express response object
 * @params {next}: Function - Express next function
 * @returns Error response
 */
const handle = (err, req, res, _next) => {
  let error = { ...err };
  error.message = err.message;

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

  if (err.name === 'RateLimitError') {
    const message = 'Too many requests, please try again later';
    error = { message, statusCode: 429, code: 'RATE_LIMIT_EXCEEDED' };
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const code = error.code || 'INTERNAL_ERROR';

  const response = {
    success: false,
    error: message,
    code,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      originalError: err.message
    })
  };

  if (req.requestId) {
    response.requestId = req.requestId;
  }

  res.status(statusCode).json(response);
};

/**
 * Handle 404 errors
 * 
 * @params {req}: Object - Express request object
 * @params {res}: Object - Express response object
 * @params {next}: Function - Express next function
 * @returns Passes error to next middleware
 */
const notFound = (req, res, next) => {
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
};

/**
 * Handle async errors in route handlers
 * 
 * @params {fn}: Function - Async function to wrap
 * @returns Express middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'APP_ERROR', isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error helper
 * 
 * @params {message}: string - Error message
 * @params {details}: Array - Validation error details
 * @returns AppError instance
 */
const validationError = (message, details = []) => {
  const error = new AppError(message, 400, 'VALIDATION_ERROR');
  error.details = details;
  return error;
};

/**
 * Authorization error helper
 * 
 * @params {message}: string - Error message
 * @returns AppError instance
 */
const authorizationError = (message = 'Access denied') => {
  return new AppError(message, 403, 'AUTHORIZATION_ERROR');
};

/**
 * Not found error helper
 * 
 * @params {resource}: string - Resource name
 * @returns AppError instance
 */
const notFoundError = (resource = 'Resource') => {
  return new AppError(`${resource} not found`, 404, 'NOT_FOUND');
};

/**
 * Conflict error helper
 * 
 * @params {message}: string - Error message
 * @returns AppError instance
 */
const conflictError = (message) => {
  return new AppError(message, 409, 'CONFLICT');
};

/**
 * Internal server error helper
 * 
 * @params {message}: string - Error message
 * @returns AppError instance
 */
const internalError = (message = 'Internal server error') => {
  return new AppError(message, 500, 'INTERNAL_ERROR');
};

module.exports = {
  handle,
  notFound,
  asyncHandler,
  AppError,
  validationError,
  authorizationError,
  notFoundError,
  conflictError,
  internalError
};
