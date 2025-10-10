const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRequest } = require('../validations/commonValidation');
const authValidation = require('../validations/authValidation');
const { auth } = require('../middleware/auth');

router.post(
  '/register',
  validateRequest(authValidation.register),
  authController.register
);

router.post(
  '/login',
  validateRequest(authValidation.login),
  authController.login
);

router.post(
  '/refresh',
  validateRequest(authValidation.refresh),
  authController.refreshToken
);

router.post(
  '/verify',
  validateRequest(authValidation.verify),
  authController.verifyToken
);

router.get(
  '/profile',
  auth,
  authController.getProfile
);

router.put(
  '/profile',
  auth,
  validateRequest(authValidation.updateProfile),
  authController.updateProfile
);

router.put(
  '/change-password',
  auth,
  validateRequest(authValidation.changePassword),
  authController.changePassword
);

router.post(
  '/logout',
  auth,
  authController.logout
);

module.exports = router;
