const express = require('express');
const { validateRequest, validateParams, validateQuery } = require('../validations/commonValidation');
const childValidation = require('../validations/childValidation');
const childController = require('../controllers/childController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/',
  auth,
  validateRequest(childValidation.create),
  childController.createChild
);

router.get(
  '/by-parent',
  auth,
  childController.getChildrenByParent
);

router.get(
  '/count',
  auth,
  childController.countChildrenByParent
);

router.get(
  '/:id',
  auth,
  validateParams(childValidation.idParam),
  childController.getChild
);

router.get(
  '/:id/summary',
  auth,
  validateParams(childValidation.idParam),
  childController.getChildSummary
);

router.patch(
  '/:id',
  auth,
  validateParams(childValidation.idParam),
  validateRequest(childValidation.update),
  childController.updateChild
);

router.delete(
  '/:id',
  auth,
  validateParams(childValidation.idParam),
  childController.deleteChild
);

router.post(
  '/:id/courses',
  auth,
  validateParams(childValidation.idParam),
  validateRequest(childValidation.addCourses),
  childController.addCourses
);

module.exports = router;
