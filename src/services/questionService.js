const questionRepository = require('../repositories/questionRepository');
const logger = require('../utils/logger');

/**
 * Create a new question
 * 
 * @params {data}: object - Question data
 * @returns Created question object
 */
const createQuestion = async (data) => {
  try {
    validateQuestionData(data);

    logger.info('Creating question', { category: data.category, type: data.questionType });
    const created = await questionRepository.createQuestion(data);

    if (!created) {
      const error = new Error('Failed to create question');
      error.statusCode = 500;
      error.code = 'QUESTION_CREATION_FAILED';
      throw error;
    }

    return created;
  } catch (error) {
    logger.error('Error creating question', { error: error.message, data });
    throw error;
  }
};

/**
 * Get question by ID
 * 
 * @params {questionId}: string - Question ID
 * @returns Question object or null
 */
const getQuestion = async (questionId) => {
  try {
    if (!questionId) return null;
    return await questionRepository.getQuestion(questionId);
  } catch (error) {
    logger.error('Error retrieving question', { questionId, error: error.message });
    throw error;
  }
};

/**
 * Get question with validation
 * 
 * @params {questionId}: string - Question ID
 * @returns Question object
 */
const getQuestionWithValidation = async (questionId) => {
  const question = await getQuestion(questionId);
  if (!question) {
    const error = new Error(`Question with ID ${questionId} not found`);
    error.statusCode = 404;
    error.code = 'QUESTION_NOT_FOUND';
    throw error;
  }
  return question;
};

/**
 * Get questions with pagination and filters
 * 
 * @params {filters}: object - Filter criteria
 * @params {page}: number - Page number
 * @params {limit}: number - Results per page
 * @params {sortBy}: string - Sort field
 * @params {sortOrder}: string - Sort order (asc/desc)
 * @returns Paginated questions with metadata
 */
const getQuestions = async (filters = {}, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc') => {
  try {
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    if (typeof filters.tags === 'string') {
      filters.tags = filters.tags.split(',').map(tag => tag.trim());
    }

    logger.info('Fetching questions', { filters, page, limit });
    return await questionRepository.getQuestions(filters, page, limit, sort);
  } catch (error) {
    logger.error('Error fetching questions', { error: error.message, filters });
    throw error;
  }
};

/**
 * Update question
 * 
 * @params {questionId}: string - Question ID
 * @params {data}: object - Update data
 * @returns Updated question object
 */
const updateQuestion = async (questionId, data) => {
  try {
    if (!questionId) {
      const error = new Error('Question ID is required for update');
      error.statusCode = 400;
      error.code = 'QUESTION_ID_REQUIRED';
      throw error;
    }

    await getQuestionWithValidation(questionId);

    if (data.questionType || data.options) {
      validateQuestionData({ ...data, questionText: 'dummy' }, true);
    }

    logger.info('Updating question', { questionId });
    const updated = await questionRepository.updateQuestion(questionId, data);

    if (!updated) {
      const error = new Error('Failed to update question');
      error.statusCode = 500;
      error.code = 'QUESTION_UPDATE_FAILED';
      throw error;
    }

    return updated;
  } catch (error) {
    logger.error('Error updating question', { questionId, error: error.message });
    throw error;
  }
};

/**
 * Delete question
 * 
 * @params {questionId}: string - Question ID
 * @returns Boolean indicating success
 */
const deleteQuestion = async (questionId) => {
  try {
    if (!questionId) return false;

    await getQuestionWithValidation(questionId);

    logger.info('Deleting question', { questionId });
    const deleted = await questionRepository.deleteQuestion(questionId);

    if (!deleted) {
      logger.warn('Failed to delete question', { questionId });
      return false;
    }

    logger.info('Successfully deleted question', { questionId });
    return true;
  } catch (error) {
    logger.error('Error deleting question', { questionId, error: error.message });
    throw error;
  }
};

/**
 * Get questions by category
 * 
 * @params {category}: string - Category name
 * @params {limit}: number - Max results
 * @params {activeOnly}: boolean - Filter active questions only
 * @returns Array of questions
 */
const getQuestionsByCategory = async (category, limit = 100, activeOnly = true) => {
  try {
    if (!category) {
      const error = new Error('Category is required');
      error.statusCode = 400;
      error.code = 'CATEGORY_REQUIRED';
      throw error;
    }

    return await questionRepository.getQuestionsByCategory(category, limit, activeOnly);
  } catch (error) {
    logger.error('Error fetching questions by category', { category, error: error.message });
    throw error;
  }
};

/**
 * Get questions by issue ID
 * 
 * @params {issueId}: string - Issue ID
 * @params {limit}: number - Max results
 * @returns Array of questions
 */
const getQuestionsByIssue = async (issueId, limit = 100) => {
  try {
    if (!issueId) {
      const error = new Error('Issue ID is required');
      error.statusCode = 400;
      error.code = 'ISSUE_ID_REQUIRED';
      throw error;
    }

    return await questionRepository.getQuestionsByIssue(issueId, limit);
  } catch (error) {
    logger.error('Error fetching questions by issue', { issueId, error: error.message });
    throw error;
  }
};

/**
 * Increment question usage count
 * 
 * @params {questionId}: string - Question ID
 * @returns Updated question object
 */
const incrementUsageCount = async (questionId) => {
  try {
    if (!questionId) return null;

    logger.info('Incrementing usage count', { questionId });
    return await questionRepository.incrementUsageCount(questionId);
  } catch (error) {
    logger.error('Error incrementing usage count', { questionId, error: error.message });
    throw error;
  }
};

/**
 * Toggle question active status
 * 
 * @params {questionId}: string - Question ID
 * @params {isActive}: boolean - Active status
 * @returns Updated question object
 */
const toggleActiveStatus = async (questionId, isActive) => {
  try {
    if (!questionId) {
      const error = new Error('Question ID is required');
      error.statusCode = 400;
      error.code = 'QUESTION_ID_REQUIRED';
      throw error;
    }

    await getQuestionWithValidation(questionId);

    logger.info('Toggling question active status', { questionId, isActive });
    const updated = await questionRepository.toggleActiveStatus(questionId, isActive);

    if (!updated) {
      const error = new Error('Failed to toggle active status');
      error.statusCode = 500;
      error.code = 'TOGGLE_STATUS_FAILED';
      throw error;
    }

    return updated;
  } catch (error) {
    logger.error('Error toggling active status', { questionId, error: error.message });
    throw error;
  }
};

/**
 * Get questions statistics
 * 
 * @returns Statistics object
 */
const getQuestionsStats = async () => {
  try {
    logger.info('Fetching questions statistics');
    return await questionRepository.getQuestionsStats();
  } catch (error) {
    logger.error('Error fetching questions stats', { error: error.message });
    throw error;
  }
};

/**
 * Bulk increment usage counts for multiple questions
 * 
 * @params {questionIds}: array - Array of question IDs
 * @returns Number of updated questions
 */
const bulkIncrementUsage = async (questionIds) => {
  try {
    if (!questionIds || questionIds.length === 0) return 0;

    const updates = questionIds.map(id => incrementUsageCount(id));
    const results = await Promise.allSettled(updates);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    logger.info('Bulk incremented usage counts', { total: questionIds.length, successful });
    
    return successful;
  } catch (error) {
    logger.error('Error bulk incrementing usage', { error: error.message });
    throw error;
  }
};

/**
 * Get random questions for assessment
 * 
 * @params {category}: string - Category filter
 * @params {count}: number - Number of questions
 * @params {difficultyLevel}: string - Difficulty filter
 * @returns Array of random questions
 */
const getRandomQuestions = async (category = null, count = 10, difficultyLevel = null) => {
  try {
    const filters = { isActive: true };
    if (category) filters.category = category;
    if (difficultyLevel) filters.difficultyLevel = difficultyLevel;

    const result = await questionRepository.getQuestions(filters, 1, 1000);
    const allQuestions = result.data;

    if (allQuestions.length === 0) return [];

    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(count, allQuestions.length));

    logger.info('Generated random questions', { count: selected.length, category, difficultyLevel });
    return selected;
  } catch (error) {
    logger.error('Error getting random questions', { error: error.message });
    throw error;
  }
};

/**
 * Validate question data
 * 
 * @params {data}: object - Question data
 * @params {isUpdate}: boolean - Whether this is an update operation
 */
const validateQuestionData = (data, isUpdate = false) => {
  if (!isUpdate && (!data.questionText || data.questionText.trim().length < 10)) {
    const error = new Error('Question text must be at least 10 characters');
    error.statusCode = 400;
    error.code = 'INVALID_QUESTION_TEXT';
    throw error;
  }

  if (data.questionType && ['mcq', 'multiselect'].includes(data.questionType)) {
    if (!data.options || data.options.length < 2) {
      const error = new Error('MCQ and multiselect questions must have at least 2 options');
      error.statusCode = 400;
      error.code = 'INSUFFICIENT_OPTIONS';
      throw error;
    }
  }

  if (!isUpdate && (!data.issueWeightages || data.issueWeightages.length === 0)) {
    const error = new Error('At least one issue weightage is required');
    error.statusCode = 400;
    error.code = 'MISSING_ISSUE_WEIGHTAGES';
    throw error;
  }

  if (data.issueWeightages) {
    const totalWeightage = data.issueWeightages.reduce((sum, iw) => sum + iw.weightage, 0);
    if (totalWeightage > 100) {
      logger.warn('Total weightage exceeds 100', { totalWeightage });
    }

    const issueIds = data.issueWeightages.map(iw => iw.issueId);
    const uniqueIssueIds = new Set(issueIds);
    if (issueIds.length !== uniqueIssueIds.size) {
      const error = new Error('Duplicate issue IDs found in weightages');
      error.statusCode = 400;
      error.code = 'DUPLICATE_ISSUE_IDS';
      throw error;
    }
  }
};

module.exports = {
  createQuestion,
  getQuestion,
  getQuestionWithValidation,
  getQuestions,
  updateQuestion,
  deleteQuestion,
  getQuestionsByCategory,
  getQuestionsByIssue,
  incrementUsageCount,
  toggleActiveStatus,
  getQuestionsStats,
  bulkIncrementUsage,
  getRandomQuestions
};
