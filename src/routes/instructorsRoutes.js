const express = require('express');
const { validateRequest, validateParams, validateQuery } = require('../validations/commonValidation');
const instructorValidation = require('../validations/instructorValidation');
const instructorController = require('../controllers/instructorController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/',
  auth,
  authorize('admin'),
  validateRequest(instructorValidation.create),
  instructorController.createInstructor
);

router.get('/',
  validateQuery(instructorValidation.query),
  instructorController.getInstructors
);

router.get('/:id',
  validateParams(instructorValidation.idParam),
  instructorController.getInstructor
);

router.patch('/:id',
  auth,
  authorize('admin'),
  validateParams(instructorValidation.idParam),
  validateRequest(instructorValidation.update),
  instructorController.updateInstructor
);

router.delete('/:id',
  auth,
  authorize('admin'),
  validateParams(instructorValidation.idParam),
  instructorController.deleteInstructor
);

module.exports = router;
