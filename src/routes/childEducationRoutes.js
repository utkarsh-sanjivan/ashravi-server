const express = require('express');
const { validateRequest, validateParams, validateQuery } = require('../validations/commonValidation');
const childEducationValidation = require('../validations/childEducationValidation');
const childEducationController = require('../controllers/childEducationController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/',
  auth,
  validateRequest(childEducationValidation.create),
  childEducationController.createEducationRecord
);

router.get('/by-child',
  auth,
  validateQuery(childEducationValidation.childIdQuery),
  childEducationController.getByChildId
);

router.get('/analysis',
  auth,
  validateQuery(childEducationValidation.childIdQuery),
  childEducationController.getPerformanceAnalysis
);

router.post('/add-grade',
  auth,
  validateQuery(childEducationValidation.childIdQuery),
  validateRequest(childEducationValidation.addGradeRecord),
  childEducationController.addGradeRecord
);

router.post('/regenerate-suggestions',
  auth,
  validateQuery(childEducationValidation.childIdQuery),
  childEducationController.regenerateSuggestions
);

router.get('/:id',
  auth,
  validateParams(childEducationValidation.idParam),
  childEducationController.getEducationRecord
);

router.patch('/:id',
  auth,
  validateParams(childEducationValidation.idParam),
  validateRequest(childEducationValidation.update),
  childEducationController.updateEducationRecord
);

router.delete('/:id',
  auth,
  validateParams(childEducationValidation.idParam),
  childEducationController.deleteEducationRecord
);

module.exports = router;
