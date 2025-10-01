const authService = require('../services/auth');
const logger = require('../utils/logger');

class AuthMiddleware {
  /**
   * Verify JWT token and authenticate user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async auth(req, res, next) {
    try {
      // Get token from different sources
      let token = req.header('Authorization')?.replace('Bearer ', '');

      // Fallback to cookie if HTTP-only cookies are enabled
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

      // Verify token and get user
      const user = await authService.verifyToken(token);

      // Attach user to request object
      req.user = user;

      // Log successful authentication
      logger.audit('User authenticated', {
        userId: user._id,
        email: user.email,
        role: user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      next();
    } catch (error) {
      logger.security('Authentication failed', {
        error: error.message,
        code: error.code,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        token: req.header('Authorization') ? 'present' : 'missing'
      });

      const statusCode = error.statusCode || 401;
      const errorCode = error.code || 'AUTH_FAILED';

      res.status(statusCode).json({
        success: false,
        error: 'Authentication failed',
        message: error.message || 'Invalid or expired token',
        code: errorCode
      });
    }
  }

  /**
   * Optional authentication - doesn't fail if no token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async optionalAuth(req, res, next) {
    try {
      let token = req.header('Authorization')?.replace('Bearer ', '');

      // Fallback to cookie if HTTP-only cookies are enabled
      if (!token && process.env.USE_HTTP_ONLY_COOKIES === 'true') {
        token = req.cookies?.token;
      }

      if (token) {
        try {
          const user = await authService.verifyToken(token);
          req.user = user;

          logger.debug('Optional authentication successful', {
            userId: user._id,
            email: user.email
          });
        } catch (error) {
          // Silently fail for optional auth
          logger.debug('Optional authentication failed', {
            error: error.message,
            ip: req.ip
          });
        }
      }

      next();
    } catch (error) {
      // Continue without authentication for optional auth
      next();
    }
  }

  /**
   * Role-based authorization middleware factory
   * @param {...string} allowedRoles - Allowed roles
   * @returns {Function} Express middleware function
   */
  authorize(...allowedRoles) {
    return (req, res, next) => {
      try {
        if (!req.user) {
          logger.security('Authorization failed - no user', {
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
          logger.security('Authorization failed - insufficient permissions', {
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

        // Log successful authorization
        logger.audit('User authorized', {
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
  }

  /**
   * Check if user owns the resource or has admin privileges
   * @param {Function} resourceIdExtractor - Function to extract resource owner ID from request
   * @returns {Function} Express middleware function
   */
  authorizeOwnerOrAdmin(resourceIdExtractor = (req) => req.params.id) {
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
          logger.security('Resource access denied', {
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

        logger.audit('Resource access granted', {
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
  }

  /**
   * Rate limiting for sensitive operations
   * @param {Object} options - Rate limiting options
   * @returns {Function} Express middleware function
   */
  sensitiveOperationLimiter(options = {}) {
    const rateLimit = require('express-rate-limit');

    return rateLimit({
      windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
      max: options.max || 3, // 3 attempts per window
      skipSuccessfulRequests: true,
      keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise IP
        return req.user ? req.user._id.toString() : req.ip;
      },
      handler: (req, res) => {
        logger.security('Sensitive operation rate limit exceeded', {
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
      legacyHeaders: false,
    });
  }
}

module.exports = new AuthMiddleware();
