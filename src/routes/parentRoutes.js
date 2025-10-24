const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');
const { auth, authorize } = require('../middleware/auth');
const { validateParams, validateQuery, validateRequest } = require('../validations/commonValidation');
const parentValidation = require('../validations/parentValidation');

// Get parent by ID
router.get(
  '/:id',
  auth,
  validateParams(parentValidation.idParam),
  parentController.getParent
);

// Get parents by city
router.get(
  '/city/:city',
  auth,
  validateParams(parentValidation.cityParam),
  validateQuery(parentValidation.paginationQuery),
  parentController.getParentsByCity
);

// Get children for parent
router.get(
  '/:id/children',
  auth,
  validateParams(parentValidation.idParam),
  parentController.getChildren
);

// Add child to parent
router.post(
  '/:id/children',
  auth,
  validateParams(parentValidation.idParam),
  parentController.addChild
);

// Remove child from parent
router.delete(
  '/:id/children/:childId',
  auth,
  validateParams(parentValidation.removeChildParams),
  parentController.removeChild
);

// Get wishlist for parent
router.get(
  '/:id/wishlist',
  auth,
  validateParams(parentValidation.idParam),
  parentController.getWishlist
);

// Add course to wishlist
router.post(
  '/:id/wishlist',
  auth,
  validateParams(parentValidation.idParam),
  validateRequest(parentValidation.wishlistBody),
  parentController.addWishlistCourse
);

// Remove course from wishlist
router.delete(
  '/:id/wishlist/:courseId',
  auth,
  validateParams(parentValidation.wishlistParams),
  parentController.removeWishlistCourse
);

// Delete parent
router.delete(
  '/:id',
  auth,
  authorize('admin'),
  validateParams(parentValidation.idParam),
  parentController.deleteParent
);

// Get parent statistics
router.get(
  '/stats/summary',
  auth,
  authorize('admin'),
  parentController.getStats
);

module.exports = router;
