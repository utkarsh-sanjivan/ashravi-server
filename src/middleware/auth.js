const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT token and authenticate user
 * 
 * @params {req}: Object - Express request object
 * @params {res}: Object - Express response object
 * @params {next}: Function - Express next function
 * @returns Calls next() or sends error response
 */
const auth = async (req, res, next) => {
  try {
    let token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token && process.env.USE_HTTP_ONLY_COOKIES === 'true') {
      token = req.cookies?.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied',
        message: 'No authentication token provided',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    req.user = user;

    logger.info('User authenticated', {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    next();
  } catch (error) {
    logger.error('Authentication failed', {
      error: error.message,
      code: error.code,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      token: req.header('Authorization') ? 'present' : 'missing'
    });

    const statusCode = error.name === 'TokenExpiredError' ? 401 : 
                       error.name === 'JsonWebTokenError' ? 401 : 500;
    const errorCode = error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' :
                      error.name === 'JsonWebTokenError' ? 'INVALID_TOKEN' : 'AUTH_FAILED';

    res.status(statusCode).json({
      success: false,
      error: 'Authentication failed',
      message: error.message || 'Invalid or expired token',
      code: errorCode
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * 
 * @params {req}: Object - Express request object
 * @params {res}: Object - Express response object
 * @params {next}: Function - Express next function
 * @returns Calls next() regardless of authentication status
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token && process.env.USE_HTTP_ONLY_COOKIES === 'true') {
      token = req.cookies?.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user) {
          req.user = user;
          logger.debug('Optional authentication successful', {
            userId: user._id,
            email: user.email
          });
        }
      } catch (error) {
        logger.debug('Optional authentication failed', {
          error: error.message,
          ip: req.ip
        });
      }
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Role-based authorization middleware factory
 * 
 * @params {...allowedRoles}: string - Allowed roles (admin, user, instructor, etc.)
 * @returns Express middleware function
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        logger.warn('Authorization failed - no user', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          requiredRoles: allowedRoles
        });

        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to access this resource',
          code: 'NO_AUTH'
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn('Authorization failed - insufficient permissions', {
          userId: req.user._id,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      logger.info('User authorized', {
        userId: req.user._id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        resource: req.originalUrl,
        method: req.method
      });

      next();
    } catch (error) {
      logger.error('Authorization middleware error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?._id
      });

      res.status(500).json({
        success: false,
        error: 'Authorization error',
        message: 'An error occurred during authorization',
        code: 'AUTH_ERROR'
      });
    }
  };
};

/**
 * Check if user owns the resource or has admin privileges
 * 
 * @params {resourceIdExtractor}: Function - Function to extract resource owner ID from request
 * @returns Express middleware function
 */
const authorizeOwnerOrAdmin = (resourceIdExtractor = (req) => req.params.id) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to access this resource',
          code: 'NO_AUTH'
        });
      }

      const resourceOwnerId = resourceIdExtractor(req);
      const isOwner = req.user._id.toString() === resourceOwnerId;
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        logger.warn('Resource access denied', {
          userId: req.user._id,
          userRole: req.user.role,
          resourceOwnerId,
          resource: req.originalUrl,
          method: req.method,
          ip: req.ip
        });

        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You can only access your own resources or you need admin privileges',
          code: 'RESOURCE_ACCESS_DENIED'
        });
      }

      logger.info('Resource access granted', {
        userId: req.user._id,
        userRole: req.user.role,
        resourceOwnerId,
        accessType: isOwner ? 'owner' : 'admin',
        resource: req.originalUrl,
        method: req.method
      });

      next();
    } catch (error) {
      logger.error('Resource authorization error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?._id
      });

      res.status(500).json({
        success: false,
        error: 'Authorization error',
        message: 'An error occurred during resource authorization',
        code: 'RESOURCE_AUTH_ERROR'
      });
    }
  };
};

/**
 * Rate limiting for sensitive operations
 * 
 * @params {options}: Object - Rate limiting options
 * @returns Express rate limiting middleware
 */
const sensitiveOperationLimiter = (options = {}) => {
  const rateLimit = require('express-rate-limit');

  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 3,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
      return req.user ? req.user._id.toString() : req.ip;
    },
    handler: (req, res) => {
      logger.warn('Sensitive operation rate limit exceeded', {
        userId: req.user?._id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        resource: req.originalUrl
      });

      res.status(429).json({
        success: false,
        error: 'Too many attempts',
        message: 'You have made too many sensitive operation attempts. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

module.exports = {
  auth,
  optionalAuth,
  authorize,
  authorizeOwnerOrAdmin,
  sensitiveOperationLimiter
};
