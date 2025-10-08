const express = require('express');
const { validateRequest, validateParams, validateQuery } = require('../validations/commonValidation');
const childValidation = require('../validations/childValidation');
const childController = require('../controllers/childController');
const { auth } = require('../middleware/auth');

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
  validateQuery(childValidation.parentIdQuery),
  childController.getChildrenByParent
);

router.get(
  '/count',
  auth,
  validateQuery(childValidation.parentIdQuery),
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
  validateRequest(childValidation.courseOperation),
  childController.addCourses
);

router.get('/:id/latest-assessment',
  auth,
  validateParams(childValidation.idParam),
  childController.getChildWithLatestAssessment
);

module.exports = router;
