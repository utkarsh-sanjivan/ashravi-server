const authService = require('../services/authService');
const { sanitizeInput } = require('../validations/commonValidation');
const otpService = require('../services/otpService');

/*
 * Register a new parent account
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Created parent data
 */
const register = async (req, res, next) => {
  try {
    const sanitizedData = sanitizeInput(req.body);
    const result = await authService.register(sanitizedData);

    res.status(201).json({
      success: true,
      message: 'Parent registered successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Parent login
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Parent data with token
 */
const login = async (req, res, next) => {
  try {
    const sanitizedData = sanitizeInput(req.body);
    const result = await authService.login(sanitizedData);

    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Send OTP for parent signup/login verification
 */
const sendOtp = async (req, res, next) => {
  try {
    const sanitizedData = sanitizeInput(req.body);
    const result = await otpService.sendOtp(sanitizedData);
    const { message, ...data } = result;

    res.json({
      success: true,
      message: message || 'OTP sent successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Verify OTP for parent signup/login
 */
const verifyOtp = async (req, res, next) => {
  try {
    const sanitizedData = sanitizeInput(req.body);
    const result = await otpService.verifyOtp(sanitizedData);
    const { message, ...data } = result;

    res.json({
      success: true,
      message: message || 'OTP verified successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Get parent profile (authenticated)
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Parent profile data
 */
const getProfile = async (req, res, next) => {
  try {
    const result = await authService.getProfile(req.user.id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Update parent profile
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Updated parent profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const sanitizedData = sanitizeInput(req.body);
    const result = await authService.updateProfile(req.user.id, sanitizedData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Change parent password
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Success message
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = sanitizeInput(req.body);
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Refresh JWT token
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns New tokens
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      const error = new Error('Refresh token is required');
      error.statusCode = 400;
      error.code = 'MISSING_REFRESH_TOKEN';
      throw error;
    }

    const result = await authService.refresh(refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Verify JWT token
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Token validity and parent info
 */
const verifyToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      const error = new Error('Token is required');
      error.statusCode = 400;
      error.code = 'MISSING_TOKEN';
      throw error;
    }

    const result = await authService.verify(token);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Logout parent
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Success message
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.logout(req.user.id, refreshToken);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  sendOtp,
  verifyOtp,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  verifyToken,
  logout
};
