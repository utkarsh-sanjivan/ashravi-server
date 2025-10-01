const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Object} User and token
   */
  async register(userData) {
    const { name, email, password } = userData;

    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        const error = new Error('User already exists with this email address');
        error.statusCode = 400;
        error.code = 'USER_EXISTS';
        throw error;
      }

      // Create new user
      const user = await User.create({
        name,
        email,
        password
      });

      // Generate JWT token
      const token = this.generateToken(user);

      logger.info(`New user registered: ${email}`, {
        userId: user._id,
        action: 'user_registration'
      });

      return {
        user: user.getPublicProfile(),
        token
      };
    } catch (error) {
      logger.error('Registration failed:', {
        email,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Login user with credentials
   * @param {Object} credentials - Login credentials
   * @returns {Object} User and token
   */
  async login(credentials) {
    const { email, password } = credentials;

    try {
      // Find user by credentials
      const user = await User.findByCredentials(email, password);

      // Update last login time
      await this.updateLastLogin(user._id);

      // Generate JWT token
      const token = this.generateToken(user);

      logger.info(`User logged in: ${email}`, {
        userId: user._id,
        action: 'user_login'
      });

      return {
        user: user.getPublicProfile(),
        token
      };
    } catch (error) {
      logger.warn(`Login attempt failed: ${email}`, {
        error: error.message,
        action: 'login_failed'
      });

      const authError = new Error('Invalid email or password');
      authError.statusCode = 401;
      authError.code = 'INVALID_CREDENTIALS';
      throw authError;
    }
  }

  /**
   * Get user profile by ID
   * @param {String} userId - User ID
   * @returns {Object} User profile
   */
  async getProfile(userId) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        error.code = 'USER_NOT_FOUND';
        throw error;
      }

      return user.getPublicProfile();
    } catch (error) {
      logger.error('Get profile failed:', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {String} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated user profile
   */
  async updateProfile(userId, updateData) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        error.code = 'USER_NOT_FOUND';
        throw error;
      }

      logger.info(`Profile updated: ${user.email}`, {
        userId,
        action: 'profile_update',
        updatedFields: Object.keys(updateData)
      });

      return user.getPublicProfile();
    } catch (error) {
      logger.error('Profile update failed:', {
        userId,
        updateData,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Change user password
   * @param {String} userId - User ID
   * @param {String} currentPassword - Current password
   * @param {String} newPassword - New password
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get user with password
      const user = await User.findById(userId).select('+password');

      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        error.code = 'USER_NOT_FOUND';
        throw error;
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        const error = new Error('Current password is incorrect');
        error.statusCode = 400;
        error.code = 'INVALID_PASSWORD';
        throw error;
      }

      // Update password
      user.password = newPassword;
      await user.save();

      logger.info(`Password changed: ${user.email}`, {
        userId,
        action: 'password_change'
      });

      return { message: 'Password changed successfully' };
    } catch (error) {
      logger.error('Password change failed:', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate JWT token for user
   * @param {Object} user - User object
   * @returns {String} JWT token
   */
  generateToken(user) {
    return jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: 'nodejs-server',
        audience: 'nodejs-client'
      }
    );
  }

  /**
   * Verify JWT token
   * @param {String} token - JWT token
   * @returns {Object} Decoded token payload
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user still exists
      const user = await User.findById(decoded.id).select('-password');
      if (!user || !user.isActive) {
        const error = new Error('User not found or inactive');
        error.statusCode = 401;
        error.code = 'USER_INACTIVE';
        throw error;
      }

      return user;
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        const authError = new Error('Invalid token');
        authError.statusCode = 401;
        authError.code = 'INVALID_TOKEN';
        throw authError;
      }

      if (error.name === 'TokenExpiredError') {
        const authError = new Error('Token expired');
        authError.statusCode = 401;
        authError.code = 'TOKEN_EXPIRED';
        throw authError;
      }

      throw error;
    }
  }

  /**
   * Update user's last login time
   * @param {String} userId - User ID
   * @private
   */
  async updateLastLogin(userId) {
    try {
      await User.findByIdAndUpdate(userId, { lastLogin: new Date() });
    } catch (error) {
      // Log error but don't throw - this is not critical
      logger.warn('Failed to update last login:', {
        userId,
        error: error.message
      });
    }
  }

  /**
   * Logout user (in stateless JWT, this is mainly for logging)
   * @param {String} userId - User ID
   */
  async logout(userId) {
    try {
      logger.info(`User logged out`, {
        userId,
        action: 'user_logout'
      });

      // In a stateless JWT system, logout is typically handled client-side
      // For additional security, you could maintain a token blacklist here

      return { message: 'Logout successful' };
    } catch (error) {
      logger.error('Logout failed:', {
        userId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new AuthService();
