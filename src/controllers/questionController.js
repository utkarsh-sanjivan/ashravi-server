const questionService = require('../services/questionService');
const logger = require('../utils/logger');
const { sanitizeInput } = require('../validations/commonValidation');

/**
 * Create new question
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Created question
 */
const createQuestion = async (req, res, next) => {
  try {
    const sanitizedData = sanitizeInput(req.body);
    
    if (req.user && req.user.id) {
      sanitizedData.metadata = sanitizedData.metadata || {};
      sanitizedData.metadata.createdBy = req.user.id;
    }

    const question = await questionService.createQuestion(sanitizedData);

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: question
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get question by ID
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Question data
 */
const getQuestion = async (req, res, next) => {
  try {
    const question = await questionService.getQuestionWithValidation(req.params.id);

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get questions with pagination and filters
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Paginated questions
 */
const getQuestions = async (req, res, next) => {
  try {
    const filters = {
      category: req.query.category,
      questionType: req.query.questionType,
      isActive: req.query.isActive,
      difficultyLevel: req.query.difficultyLevel,
      issueId: req.query.issueId,
      tags: req.query.tags,
      ageMin: req.query.ageMin,
      ageMax: req.query.ageMax,
      search: req.query.search
    };

    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';

    const result = await questionService.getQuestions(filters, page, limit, sortBy, sortOrder);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update question
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Updated question
 */
const updateQuestion = async (req, res, next) => {
  try {
    const sanitizedData = sanitizeInput(req.body);
    
    if (req.user && req.user.id) {
      sanitizedData.metadata = sanitizedData.metadata || {};
      sanitizedData.metadata.lastModifiedBy = req.user.id;
    }

    const question = await questionService.updateQuestion(req.params.id, sanitizedData);

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: question
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete question
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Success message
 */
const deleteQuestion = async (req, res, next) => {
  try {
    const deleted = await questionService.deleteQuestion(req.params.id);

    res.json({
      success: true,
      message: 'Question deleted successfully',
      data: { deleted }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get questions by category
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Questions in category
 */
const getQuestionsByCategory = async (req, res, next) => {
  try {
    const { category } = req.query;
    const limit = parseInt(req.query.limit) || 100;
    const activeOnly = req.query.activeOnly !== 'false';

    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'Category is required'
      });
    }

    const questions = await questionService.getQuestionsByCategory(category, limit, activeOnly);

    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get questions by issue ID
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Questions for issue
 */
const getQuestionsByIssue = async (req, res, next) => {
  try {
    const { issueId } = req.query;
    const limit = parseInt(req.query.limit) || 100;

    if (!issueId) {
      return res.status(400).json({
        success: false,
        error: 'Issue ID is required'
      });
    }

    const questions = await questionService.getQuestionsByIssue(issueId, limit);

    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle question active status
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Updated question
 */
const toggleActiveStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    const question = await questionService.toggleActiveStatus(req.params.id, isActive);

    res.json({
      success: true,
      message: `Question ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: question
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get questions statistics
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Statistics data
 */
const getQuestionsStats = async (req, res, next) => {
  try {
    const stats = await questionService.getQuestionsStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get random questions for assessment
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Random questions
 */
const getRandomQuestions = async (req, res, next) => {
  try {
    const category = req.query.category || null;
    const count = parseInt(req.query.count) || 10;
    const difficultyLevel = req.query.difficultyLevel || null;

    const questions = await questionService.getRandomQuestions(category, count, difficultyLevel);

    res.json({
      success: true,
      data: questions,
      count: questions.length
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuestion,
  getQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
  getQuestionsByCategory,
  getQuestionsByIssue,
  toggleActiveStatus,
  getQuestionsStats,
  getRandomQuestions
};
