const express = require('express');
const rateLimit = require('express-rate-limit');
const authValidation = require('../validations/authValidation');
const { validateRequest } = require('../validations/commonValidation');
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

const authLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});
const loginLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.post( '/register',        authLimiter,        validateRequest(authValidation.register), authController.register);
router.post( '/login',           loginLimiter,       validateRequest(authValidation.login), authController.login);
router.get(  '/profile',         auth,               authController.getProfile);
router.put(  '/profile',         auth,               validateRequest(authValidation.updateProfile), authController.updateProfile);
router.put(  '/change-password', auth,               validateRequest(authValidation.changePassword), authController.changePassword);
router.post( '/logout',          auth,               authController.logout);
router.post( '/refresh',         auth,               authController.refreshToken);
router.get(  '/verify',          auth,               authController.verifyToken);

module.exports = router;
