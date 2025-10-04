const authService = require('../services/auth');
const logger = require('../utils/logger');
const { sanitizeInput } = require('../validations/commonValidation');

class AuthController {
  /**
   * Register a new user
   * @route POST /api/v1/auth/register
   * @access Public
   */
  async register(req, res, next) {
    try {
      const sanitizedData = sanitizeInput(req.body);

      const result = await authService.register(sanitizedData);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * @route POST /api/v1/auth/login
   * @access Public
   */
  async login(req, res, next) {
    try {
      const sanitizedData = sanitizeInput(req.body);

      const result = await authService.login(sanitizedData);

      // Set token in httpOnly cookie for additional security (optional)
      if (process.env.USE_HTTP_ONLY_COOKIES === 'true') {
        res.cookie('token', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }

      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   * @route GET /api/v1/auth/profile
   * @access Private
   */
  async getProfile(req, res, next) {
    try {
      const userProfile = await authService.getProfile(req.user.id);

      res.json({
        success: true,
        data: {
          user: userProfile
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   * @route PUT /api/v1/auth/profile
   * @access Private
   */
  async updateProfile(req, res, next) {
    try {
      const sanitizedData = sanitizeInput(req.body);

      const updatedUser = await authService.updateProfile(req.user.id, sanitizedData);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: updatedUser
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user password
   * @route PUT /api/v1/auth/change-password
   * @access Private
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = sanitizeInput(req.body);

      await authService.changePassword(req.user.id, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * @route POST /api/v1/auth/logout
   * @access Private
   */
  async logout(req, res, next) {
    try {
      await authService.logout(req.user.id);

      // Clear httpOnly cookie if used
      if (process.env.USE_HTTP_ONLY_COOKIES === 'true') {
        res.clearCookie('token');
      }

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh token
   * @route POST /api/v1/auth/refresh
   * @access Private
   */
  async refreshToken(req, res, next) {
    try {
      // Generate new token for the current user
      const newToken = authService.generateToken(req.user);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: newToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify token endpoint
   * @route GET /api/v1/auth/verify
   * @access Private
   */
  async verifyToken(req, res, next) {
    try {
      res.json({
        success: true,
        message: 'Token is valid',
        data: {
          user: req.user.getPublicProfile()
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
