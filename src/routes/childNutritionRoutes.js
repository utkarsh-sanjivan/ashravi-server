const express = require('express');
const { validateRequest, validateParams, validateQuery } = require('../validations/commonValidation');
const childNutritionValidation = require('../validations/childNutritionValidation');
const childNutritionController = require('../controllers/childNutritionController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/',
  auth,
  validateRequest(childNutritionValidation.create),
  childNutritionController.createNutritionRecord
);

router.get('/by-child',
  auth,
  validateQuery(childNutritionValidation.childIdQuery),
  childNutritionController.getByChildId
);

router.get('/analysis',
  auth,
  validateQuery(childNutritionValidation.childIdQuery),
  childNutritionController.getNutritionAnalysis
);

router.post('/add-entry',
  auth,
  validateQuery(childNutritionValidation.childIdQuery),
  validateRequest(childNutritionValidation.addEntry),
  childNutritionController.addNutritionEntry
);

router.post('/regenerate-recommendations',
  auth,
  validateQuery(childNutritionValidation.childIdQuery),
  childNutritionController.regenerateRecommendations
);

router.get('/:id',
  auth,
  validateParams(childNutritionValidation.idParam),
  childNutritionController.getNutritionRecord
);

router.patch('/:id',
  auth,
  validateParams(childNutritionValidation.idParam),
  validateRequest(childNutritionValidation.update),
  childNutritionController.updateNutritionRecord
);

router.delete('/:id',
  auth,
  validateParams(childNutritionValidation.idParam),
  childNutritionController.deleteNutritionRecord
);

module.exports = router;
