const Question = require('../models/Question');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

const IMMUTABLE_FIELDS = new Set(['_id', 'id', 'createdAt', 'usageCount']);

/**
 * Validate MongoDB ObjectId
 * 
 * @params {idString}: string - ID to validate
 * @returns Valid ObjectId or null
 */
const validateObjectId = (idString) => {
  try {
    return mongoose.Types.ObjectId.isValid(idString) ? idString : null;
  } catch (error) {
    logger.warn('Invalid ObjectId format', { idString, error: error.message });
    return null;
  }
};

/**
 * Format document for response
 * 
 * @params {document}: object - MongoDB document
 * @returns Formatted document with id field
 */
const formatDocument = (document) => {
  if (!document) return document;
  const formatted = document.toObject ? document.toObject() : { ...document };
  formatted.id = formatted._id.toString();
  return formatted;
};

/**
 * Create new question
 * 
 * @params {data}: object - Question data
 * @returns Created question
 */
const createQuestion = async (data) => {
  try {
    const question = new Question(data);
    const saved = await question.save();
    logger.info('Created question', { id: saved._id, category: data.category });
    return formatDocument(saved);
  } catch (error) {
    if (error.code === 11000) {
      logger.warn('Duplicate question', { data });
      const duplicateError = new Error('Question already exists');
      duplicateError.statusCode = 409;
      duplicateError.code = 'DUPLICATE_QUESTION';
      throw duplicateError;
    }
    logger.error('Error creating question', { error: error.message, data });
    throw error;
  }
};

/**
 * Get question by ID
 * 
 * @params {questionId}: string - Question ID
 * @returns Question or null
 */
const getQuestion = async (questionId) => {
  try {
    const objectId = validateObjectId(questionId);
    if (!objectId) return null;

    const question = await Question.findById(objectId).lean();
    return question ? formatDocument(question) : null;
  } catch (error) {
    logger.error('Error fetching question', { questionId, error: error.message });
    throw error;
  }
};

/**
 * Get questions with pagination and filters
 * 
 * @params {filters}: object - Filter criteria
 * @params {page}: number - Page number
 * @params {limit}: number - Results per page
 * @params {sort}: object - Sort criteria
 * @returns Paginated questions with metadata
 */
const getQuestions = async (filters = {}, page = 1, limit = 20, sort = { createdAt: -1 }) => {
  try {
    const skip = (page - 1) * limit;
    
    const query = {};
    
    if (filters.category) {
      query.category = filters.category;
    }
    
    if (filters.questionType) {
      query.questionType = filters.questionType;
    }
    
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }
    
    if (filters.difficultyLevel) {
      query.difficultyLevel = filters.difficultyLevel;
    }
    
    if (filters.issueId) {
      query['issueWeightages.issueId'] = filters.issueId;
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }
    
    if (filters.ageMin !== undefined || filters.ageMax !== undefined) {
      query.$and = [];
      if (filters.ageMin !== undefined) {
        query.$and.push({ 'ageGroup.min': { $lte: filters.ageMin } });
      }
      if (filters.ageMax !== undefined) {
        query.$and.push({ 'ageGroup.max': { $gte: filters.ageMax } });
      }
    }
    
    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    const [questions, total] = await Promise.all([
      Question.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Question.countDocuments(query)
    ]);

    const formattedQuestions = questions.map(formatDocument);

    return {
      data: formattedQuestions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  } catch (error) {
    logger.error('Error fetching questions', { filters, error: error.message });
    throw error;
  }
};

/**
 * Update question
 * 
 * @params {questionId}: string - Question ID
 * @params {data}: object - Update data
 * @returns Updated question
 */
const updateQuestion = async (questionId, data) => {
  try {
    const objectId = validateObjectId(questionId);
    if (!objectId) return null;

    if (!data || Object.keys(data).length === 0) {
      return await getQuestion(questionId);
    }

    const sanitizedData = {};
    for (const [key, value] of Object.entries(data)) {
      if (!IMMUTABLE_FIELDS.has(key)) {
        sanitizedData[key] = value;
      }
    }

    if (Object.keys(sanitizedData).length > 0) {
      sanitizedData.version = { $inc: 1 };
    }

    const updated = await Question.findByIdAndUpdate(
      objectId,
      { $set: sanitizedData, $inc: { version: 1 } },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      logger.warn('Question not found for update', { questionId });
      return null;
    }

    logger.info('Question updated', { questionId, version: updated.version });
    return formatDocument(updated);
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
    const objectId = validateObjectId(questionId);
    if (!objectId) return false;

    const result = await Question.findByIdAndDelete(objectId);
    
    if (result) {
      logger.info('Question deleted', { questionId });
      return true;
    }
    
    logger.warn('Question not found for deletion', { questionId });
    return false;
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
    const query = { category };
    if (activeOnly) {
      query.isActive = true;
    }

    const questions = await Question.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return questions.map(formatDocument);
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
    const questions = await Question.find({
      'issueWeightages.issueId': issueId,
      isActive: true
    })
      .sort({ 'issueWeightages.weightage': -1 })
      .limit(limit)
      .lean();

    return questions.map(formatDocument);
  } catch (error) {
    logger.error('Error fetching questions by issue', { issueId, error: error.message });
    throw error;
  }
};

/**
 * Increment question usage count
 * 
 * @params {questionId}: string - Question ID
 * @returns Updated question
 */
const incrementUsageCount = async (questionId) => {
  try {
    const objectId = validateObjectId(questionId);
    if (!objectId) return null;

    const updated = await Question.findByIdAndUpdate(
      objectId,
      { $inc: { usageCount: 1 } },
      { new: true }
    ).lean();

    return updated ? formatDocument(updated) : null;
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
 * @returns Updated question
 */
const toggleActiveStatus = async (questionId, isActive) => {
  try {
    const objectId = validateObjectId(questionId);
    if (!objectId) return null;

    const updated = await Question.findByIdAndUpdate(
      objectId,
      { $set: { isActive } },
      { new: true }
    ).lean();

    if (updated) {
      logger.info('Question active status toggled', { questionId, isActive });
      return formatDocument(updated);
    }

    return null;
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
    const [total, active, byCategory, byType] = await Promise.all([
      Question.countDocuments(),
      Question.countDocuments({ isActive: true }),
      Question.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Question.aggregate([
        { $group: { _id: '$questionType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    return {
      total,
      active,
      inactive: total - active,
      byCategory: byCategory.map(c => ({ category: c._id, count: c.count })),
      byType: byType.map(t => ({ type: t._id, count: t.count }))
    };
  } catch (error) {
    logger.error('Error fetching questions stats', { error: error.message });
    throw error;
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
  incrementUsageCount,
  toggleActiveStatus,
  getQuestionsStats
};
