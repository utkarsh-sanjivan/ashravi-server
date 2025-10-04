const express = require('express');
const { validateRequest, validateParams, validateQuery } = require('../validations/commonValidation');
const parentValidation = require('../validations/parentValidation');
const parentController = require('../controllers/parentController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/',
  auth,
  validateRequest(parentValidation.create),
  parentController.createParent
);

router.get('/by-email',
  auth,
  validateQuery(parentValidation.emailQuery),
  parentController.getParentByEmail
);

router.get('/by-city',
  auth,
  validateQuery(parentValidation.cityQuery),
  parentController.getParentsByCity
);

router.get('/all-children',
  auth,
  authorize('admin', 'moderator'),
  parentController.getAllChildren
);

router.get('/count',
  auth,
  authorize('admin', 'moderator'),
  parentController.countParents
);

router.get('/:id',
  auth,
  validateParams(parentValidation.idParam),
  parentController.getParent
);

router.get('/:id/children',
  auth,
  validateParams(parentValidation.idParam),
  parentController.getChildrenForParent
);

router.patch('/:id',
  auth,
  validateParams(parentValidation.idParam),
  validateRequest(parentValidation.update),
  parentController.updateParent
);

router.delete('/:id',
  auth,
  validateParams(parentValidation.idParam),
  parentController.deleteParent
);

router.post('/:id/children',
  auth,
  validateParams(parentValidation.idParam),
  validateRequest(parentValidation.childOperation),
  parentController.addChild
);

router.delete('/:id/children',
  auth,
  validateParams(parentValidation.idParam),
  validateRequest(parentValidation.childOperation),
  parentController.removeChild
);

module.exports = router;
