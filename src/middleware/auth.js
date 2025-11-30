const jwt = require('jsonwebtoken');
const parentRepository = require('../repositories/parentRepository');
const logger = require('../utils/logger');
const { JWT_SECRET } = require('../config/jwtConfig');

/*
 * Verify JWT token and authenticate parent
 * 
 * @params {req}: object - Express request object
 * @params {res}: object - Express response object
 * @params {next}: function - Express next middleware
 * @returns Calls next() or sends error response
 */
const auth = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    let token = req.header('Authorization');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied',
        message: 'No authentication token provided',
        code: 'NO_TOKEN'
      });
    }

    // Remove "Bearer " prefix if present
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find parent by ID from token
    const parent = await parentRepository.getParent(decoded.id);

    if (!parent) {
      logger.warn('Authentication failed - parent not found', {
        tokenId: decoded.id,
        ip: req.ip
      });

      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'Parent not found',
        code: 'PARENT_NOT_FOUND'
      });
    }

    if (!parent.isActive) {
      logger.warn('Authentication failed - parent inactive', {
        parentId: parent._id,
        ip: req.ip
      });

      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'Account is inactive',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Attach parent to request object
    req.user = {
      id: parent._id,
      email: parent.email,
      role: decoded.role || 'parent',
      name: parent.name
    };

    logger.info('Parent authenticated successfully', {
      parentId: parent._id,
      email: parent.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    next();
  } catch (error) {
    logger.error('Authentication error', {
      error: error.message,
      name: error.name,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Generic authentication error
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: error.message || 'Invalid or expired token',
      code: 'AUTH_FAILED'
    });
  }
};

/*
 * Optional authentication - doesn't fail if no token
 * 
 * @params {req}: object - Express request object
 * @params {res}: object - Express response object
 * @params {next}: function - Express next middleware
 * @returns Always calls next()
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token = req.header('Authorization');

    if (!token) {
      return next();
    }

    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const parent = await parentRepository.getParent(decoded.id);

    if (parent && parent.isActive) {
      req.user = {
        id: parent._id,
        email: parent.email,
        role: decoded.role || 'parent',
        name: parent.name
      };

      logger.debug('Optional authentication successful', {
        parentId: parent._id
      });
    }
  } catch (error) {
    // Silently fail for optional auth
    logger.debug('Optional authentication failed', {
      error: error.message
    });
  }

  next();
};

/*
 * Role-based authorization middleware
 * 
 * @params {...allowedRoles}: string - Allowed roles (admin, parent, instructor, etc.)
 * @returns Express middleware function
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        logger.warn('Authorization failed - no user in request', {
          ip: req.ip,
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
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          ip: req.ip
        });

        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      logger.info('User authorized successfully', {
        userId: req.user.id,
        userRole: req.user.role,
        resource: req.originalUrl,
        method: req.method
      });

      next();
    } catch (error) {
      logger.error('Authorization error', {
        error: error.message,
        stack: error.stack
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

/*
 * Check if user owns the resource or has admin privileges
 * 
 * @params {resourceIdExtractor}: function - Function to extract resource owner ID
 * @returns Express middleware function
 */
const authorizeOwnerOrAdmin = (resourceIdExtractor = (req) => req.params.id) => {
  return async (req, res, next) => {
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
      const isOwner = req.user.id.toString() === resourceOwnerId.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        logger.warn('Resource access denied', {
          userId: req.user.id,
          userRole: req.user.role,
          resourceOwnerId,
          resource: req.originalUrl,
          ip: req.ip
        });

        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You can only access your own resources or need admin privileges',
          code: 'RESOURCE_ACCESS_DENIED'
        });
      }

      logger.info('Resource access granted', {
        userId: req.user.id,
        accessType: isOwner ? 'owner' : 'admin',
        resource: req.originalUrl
      });

      next();
    } catch (error) {
      logger.error('Resource authorization error', {
        error: error.message,
        stack: error.stack
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

/*
 * Rate limiting for sensitive operations
 * 
 * @params {options}: object - Rate limiting options
 * @returns Express rate-limit middleware
 */
const sensitiveOperationLimiter = (options = {}) => {
  const rateLimit = require('express-rate-limit');

  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 3, // 3 attempts per window
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
      return req.user ? req.user.id.toString() : req.ip;
    },
    handler: (req, res) => {
      logger.warn('Sensitive operation rate limit exceeded', {
        userId: req.user?.id,
        ip: req.ip,
        resource: req.originalUrl
      });

      res.status(429).json({
        success: false,
        error: 'Too many attempts',
        message: 'Too many attempts. Please try again later.',
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
