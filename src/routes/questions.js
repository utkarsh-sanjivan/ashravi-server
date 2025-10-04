const express = require('express');
const { validateRequest, validateParams, validateQuery } = require('../validations/commonValidation');
const questionValidation = require('../validations/questionValidation');
const questionController = require('../controllers/questionController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/',
  auth,
  authorize('admin', 'moderator'),
  validateRequest(questionValidation.create),
  questionController.createQuestion
);

router.get('/',
  auth,
  validateQuery(questionValidation.query),
  questionController.getQuestions
);

router.get('/by-category',
  auth,
  validateQuery(questionValidation.categoryQuery),
  questionController.getQuestionsByCategory
);

router.get('/by-issue',
  auth,
  validateQuery(questionValidation.issueQuery),
  questionController.getQuestionsByIssue
);

router.get('/random',
  auth,
  questionController.getRandomQuestions
);

router.get('/stats',
  auth,
  authorize('admin', 'moderator'),
  questionController.getQuestionsStats
);

router.get('/:id',
  auth,
  validateParams(questionValidation.idParam),
  questionController.getQuestion
);

router.patch('/:id',
  auth,
  authorize('admin', 'moderator'),
  validateParams(questionValidation.idParam),
  validateRequest(questionValidation.update),
  questionController.updateQuestion
);

router.delete('/:id',
  auth,
  authorize('admin'),
  validateParams(questionValidation.idParam),
  questionController.deleteQuestion
);

router.patch('/:id/toggle-active',
  auth,
  authorize('admin', 'moderator'),
  validateParams(questionValidation.idParam),
  validateRequest(questionValidation.toggleActive),
  questionController.toggleActiveStatus
);

module.exports = router;
