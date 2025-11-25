const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const parentRepository = require('../repositories/parentRepository');

/*
 * Register a new parent
 * 
 * @params {parentData}: object - Parent registration data
 * @returns Object with parent profile, access token, and refresh token
 */
const register = async (parentData) => {
  const { name, email, password, phoneNumber, city, economicStatus, occupation } = parentData;

  try {
    const existingParent = await parentRepository.getParentByEmail(email);
    if (existingParent) {
      const error = new Error('Parent already exists with this email address');
      error.statusCode = 400;
      error.code = 'PARENT_EXISTS';
      throw error;
    }

    const parent = await parentRepository.createParent({
      name,
      email,
      password,
      phoneNumber,
      city,
      economicStatus,
      occupation
    });

    // Generate BOTH tokens
    const accessToken = parent.getSignedJwtToken();
    const refreshToken = parent.generateRefreshToken();

    // Store refresh token in database
    parent.refreshTokens = parent.refreshTokens || [];
    parent.refreshTokens.push({
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
    await parent.save();

    logger.info('Parent registered successfully', {
      parentId: parent._id,
      email: parent.email,
      action: 'parent_registration'
    });

    return {
      parent: parent.getPublicProfile(),
      accessToken,      // ✅ MUST return this
      refreshToken      // ✅ MUST return this
    };
  } catch (error) {
    logger.error('Parent registration failed', {
      email,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/*
 * Login parent with credentials
 * 
 * @params {credentials}: object - Login credentials (email, password)
 * @returns Object with parent profile, access token, and refresh token
 */
const login = async (credentials) => {
  const { email, password } = credentials;

  try {
    const parent = await parentRepository.getParentByEmail(email);

    if (!parent) {
      logger.warn('Login attempt with non-existent email', { email });
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const isPasswordMatch = await parent.comparePassword(password);

    if (!isPasswordMatch) {
      logger.warn('Login attempt with incorrect password', { email });
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Update last login
    parent.lastLogin = new Date();

    // Generate BOTH tokens
    const accessToken = parent.getSignedJwtToken();
    const refreshToken = parent.generateRefreshToken();

    // Store refresh token in database
    parent.refreshTokens = parent.refreshTokens || [];
    parent.refreshTokens.push({
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    if (parent.refreshTokens.length > 5) {
      parent.refreshTokens = parent.refreshTokens.slice(-5);
    }

    await parent.save();

    logger.info('Parent logged in successfully', {
      parentId: parent._id,
      email: parent.email,
      action: 'parent_login'
    });

    return {
      parent: parent.getPublicProfile(),
      accessToken,      // ✅ MUST return this
      refreshToken      // ✅ MUST return this
    };
  } catch (error) {
    logger.error('Parent login failed', {
      email,
      error: error.message
    });
    throw error;
  }
};

/*
 * Get parent profile by ID
 * 
 * @params {parentId}: string - Parent ID
 * @returns Parent profile object
 */
const getProfile = async (parentId) => {
  try {
    const parent = await parentRepository.getParent(parentId);

    if (!parent || !parent.isActive) {
      const error = new Error('Parent not found');
      error.statusCode = 404;
      error.code = 'PARENT_NOT_FOUND';
      throw error;
    }

    const profile = parent.getPublicProfile();
    profile.children = parent.children;

    return profile;
  } catch (error) {
    logger.error('Get parent profile failed', {
      parentId,
      error: error.message
    });
    throw error;
  }
};

/*
 * Update parent profile
 * 
 * @params {parentId}: string - Parent ID
 * @params {updateData}: object - Data to update
 * @returns Updated parent profile
 */
const updateProfile = async (parentId, updateData) => {
  const allowedUpdates = ['name', 'phoneNumber', 'city', 'economicStatus', 'occupation'];
  const updates = {};

  Object.keys(updateData).forEach(key => {
    if (allowedUpdates.includes(key) && updateData[key] !== undefined) {
      updates[key] = updateData[key];
    }
  });

  if (Object.keys(updates).length === 0) {
    const error = new Error('No valid fields to update');
    error.statusCode = 400;
    error.code = 'NO_VALID_UPDATES';
    throw error;
  }

  try {
    const parent = await parentRepository.updateParent(parentId, updates);

    if (!parent) {
      const error = new Error('Parent not found');
      error.statusCode = 404;
      error.code = 'PARENT_NOT_FOUND';
      throw error;
    }

    logger.info('Parent profile updated successfully', {
      parentId,
      email: parent.email,
      action: 'profile_update',
      updatedFields: Object.keys(updates)
    });

    return parent.getPublicProfile();
  } catch (error) {
    logger.error('Parent profile update failed', {
      parentId,
      error: error.message
    });
    throw error;
  }
};

/*
 * Change parent password
 * 
 * @params {parentId}: string - Parent ID
 * @params {currentPassword}: string - Current password
 * @params {newPassword}: string - New password
 * @returns Success message
 */
const changePassword = async (parentId, currentPassword, newPassword) => {
  try {
    const parent = await parentRepository.getParent(parentId);

    if (!parent) {
      const error = new Error('Parent not found');
      error.statusCode = 404;
      error.code = 'PARENT_NOT_FOUND';
      throw error;
    }

    const isCurrentPasswordValid = await parent.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      logger.warn('Password change attempt with incorrect current password', {
        parentId
      });
      const error = new Error('Current password is incorrect');
      error.statusCode = 400;
      error.code = 'INVALID_CURRENT_PASSWORD';
      throw error;
    }

    parent.password = newPassword;
    parent.refreshTokens = []; // Invalidate all refresh tokens
    await parent.save();

    logger.info('Parent password changed successfully', {
      parentId,
      email: parent.email,
      action: 'password_change'
    });

    return { message: 'Password changed successfully' };
  } catch (error) {
    logger.error('Parent password change failed', {
      parentId,
      error: error.message
    });
    throw error;
  }
};

/*
 * Refresh JWT token
 * 
 * @params {refreshToken}: string - Refresh token
 * @returns New access token and refresh token
 */
const refresh = async (refreshToken) => {
  try {
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    const parent = await parentRepository.getParent(decoded.id);

    if (!parent || !parent.isActive) {
      const error = new Error('Parent not found or inactive');
      error.statusCode = 401;
      error.code = 'PARENT_NOT_FOUND';
      throw error;
    }

    const tokenExists = parent.refreshTokens.some(t => t.token === refreshToken);

    if (!tokenExists) {
      logger.warn('Refresh token not found in parent record', {
        parentId: parent._id
      });
      const error = new Error('Invalid refresh token');
      error.statusCode = 401;
      error.code = 'INVALID_REFRESH_TOKEN';
      throw error;
    }

    // Remove old refresh token
    parent.refreshTokens = parent.refreshTokens.filter(t => t.token !== refreshToken);

    // Generate new tokens
    const newAccessToken = parent.getSignedJwtToken();
    const newRefreshToken = parent.generateRefreshToken();

    // Store new refresh token
    parent.refreshTokens = parent.refreshTokens || [];
    parent.refreshTokens.push({
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    await parent.save();

    logger.info('Token refreshed successfully', {
      parentId: parent._id,
      action: 'token_refresh'
    });

    return {
      accessToken: newAccessToken,      // ✅ Return new access token
      refreshToken: newRefreshToken     // ✅ Return new refresh token
    };
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      const authError = new Error('Invalid or expired refresh token');
      authError.statusCode = 401;
      authError.code = 'INVALID_REFRESH_TOKEN';
      throw authError;
    }
    throw error;
  }
};

/*
 * Verify JWT token and return parent
 * 
 * @params {token}: string - JWT token
 * @returns Parent object
 */
const verify = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const parent = await parentRepository.getParent(decoded.id);

    if (!parent || !parent.isActive) {
      const error = new Error('Parent not authorized');
      error.statusCode = 401;
      error.code = 'NOT_AUTHORIZED';
      throw error;
    }

    return {
      valid: true,
      parent: parent.getPublicProfile()
    };
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
};

/*
 * Logout parent
 * 
 * @params {parentId}: string - Parent ID
 * @params {refreshToken}: string - Refresh token to invalidate
 * @returns Success message
 */
const logout = async (parentId, refreshToken) => {
  try {
    const parent = await parentRepository.getParent(parentId);

    if (!parent) {
      const error = new Error('Parent not found');
      error.statusCode = 404;
      error.code = 'PARENT_NOT_FOUND';
      throw error;
    }

    if (refreshToken) {
    parent.refreshTokens = (parent.refreshTokens || []).filter(t => t.token !== refreshToken);
      await parent.save();
    }

    logger.info('Parent logged out successfully', {
      parentId,
      action: 'parent_logout'
    });

    return { message: 'Logout successful' };
  } catch (error) {
    logger.error('Parent logout failed', {
      parentId,
      error: error.message
    });
    throw error;
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refresh,
  verify,
  logout
};
