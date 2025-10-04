const express = require('express');
const { validateRequest, validateParams } = require('../validations/commonValidation');
const assessmentValidation = require('../validations/assessmentValidation');
const assessmentController = require('../controllers/assessmentController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/process',
  auth,
  validateRequest(assessmentValidation.processAssessment),
  assessmentController.processAssessment
);

router.get('/child/:childId',
  auth,
  validateParams(assessmentValidation.childIdParam),
  assessmentController.getChildAssessments
);

router.get('/child/:childId/latest',
  auth,
  validateParams(assessmentValidation.childIdParam),
  assessmentController.getLatestAssessment
);

router.get('/child/:childId/assessment/:assessmentId',
  auth,
  assessmentController.getAssessment
);

module.exports = router;
