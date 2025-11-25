const { v4: uuidv4 } = require('uuid');
const { tables } = require('../config/dynamoConfig');
const dynamoRepository = require('./dynamoRepository');
const logger = require('../utils/logger');

const tableName = tables.questions;
const IMMUTABLE_FIELDS = new Set(['id', 'createdAt', 'usageCount']);

const format = (doc) => (doc ? { ...doc, _id: doc.id } : null);

const createQuestion = async (data) => {
  const payload = {
    ...data,
    id: data.id || uuidv4(),
    usageCount: data.usageCount || 0,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString()
  };
  const created = await dynamoRepository.createItem(tableName, payload);
  logger.info('Created question', { id: created.id, category: data.category });
  return format(created);
};

const getQuestion = async (questionId) => {
  const question = await dynamoRepository.getById(tableName, questionId);
  return format(question);
};

const getQuestionsByIds = async (ids = []) => {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const set = new Set(ids.map((id) => id.toString()));
  const { items } = await dynamoRepository.scanAll(tableName);
  const filtered = (items || []).filter((q) => set.has((q.id || '').toString()));
  return filtered.map(format);
};

const getQuestionsByCategory = async (category, limit = 100, activeOnly = true) => {
  const { items } = await dynamoRepository.scanAll(tableName);
  const filtered = (items || []).filter(
    (q) =>
      q.category === category &&
      (activeOnly ? q.isActive !== false : true)
  );
  return filtered.slice(0, limit).map(format);
};

const getQuestionsByIssue = async (issueId, limit = 100) => {
  const { items } = await dynamoRepository.scanAll(tableName);
  const filtered = (items || []).filter((q) =>
    (q.issueWeightages || []).some((iw) => iw.issueId === issueId)
  );
  return filtered.slice(0, limit).map(format);
};

const incrementUsageCount = async (questionId) => {
  const question = await dynamoRepository.getById(tableName, questionId);
  if (!question) return null;
  const updated = await dynamoRepository.updateById(tableName, questionId, {
    usageCount: (question.usageCount || 0) + 1
  });
  return format(updated);
};

const getQuestions = async (filters = {}, page = 1, limit = 20, sort = { createdAt: -1 }) => {
  const { items } = await dynamoRepository.scanAll(tableName);

  let filtered = items || [];

  if (filters.category) filtered = filtered.filter((q) => q.category === filters.category);
  if (filters.questionType) filtered = filtered.filter((q) => q.questionType === filters.questionType);
  if (filters.isActive !== undefined) filtered = filtered.filter((q) => q.isActive === filters.isActive);
  if (filters.difficultyLevel) filtered = filtered.filter((q) => q.difficultyLevel === filters.difficultyLevel);
  if (filters.issueId) {
    filtered = filtered.filter((q) =>
      (q.issueWeightages || []).some((i) => i.issueId === filters.issueId)
    );
  }
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter((q) => (q.tags || []).some((t) => filters.tags.includes(t)));
  }
  if (filters.ageMin !== undefined || filters.ageMax !== undefined) {
    filtered = filtered.filter((q) => {
      const min = filters.ageMin !== undefined ? filters.ageMin : Number.NEGATIVE_INFINITY;
      const max = filters.ageMax !== undefined ? filters.ageMax : Number.POSITIVE_INFINITY;
      const range = q.ageRange || {};
      return (range.min ?? min) <= max && (range.max ?? max) >= min;
    });
  }

  filtered.sort((a, b) => {
    if (sort.createdAt) {
      return sort.createdAt < 0
        ? new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        : new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    }
    return 0;
  });

  const total = filtered.length;
  const start = (page - 1) * limit;
  const paged = filtered.slice(start, start + limit);

  return {
    data: paged.map(format),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
};

const updateQuestion = async (questionId, data) => {
  if (!data || Object.keys(data).length === 0) {
    return getQuestion(questionId);
  }

  const sanitized = {};
  Object.entries(data).forEach(([key, value]) => {
    if (!IMMUTABLE_FIELDS.has(key)) sanitized[key] = value;
  });

  const updated = await dynamoRepository.updateById(tableName, questionId, sanitized);
  return format(updated);
};

const deleteQuestion = async (questionId) => {
  await dynamoRepository.deleteById(tableName, questionId);
  return true;
};

const toggleActiveStatus = async (questionId, isActive) => {
  const updated = await dynamoRepository.updateById(tableName, questionId, { isActive });
  return format(updated);
};

const getQuestionsStats = async () => {
  const { items } = await dynamoRepository.scanAll(tableName);
  const total = (items || []).length;
  const active = (items || []).filter((q) => q.isActive !== false).length;
  const categories = {};
  (items || []).forEach((q) => {
    const cat = q.category || 'uncategorized';
    categories[cat] = (categories[cat] || 0) + 1;
  });
  return { total, active, categories };
};

module.exports = {
  createQuestion,
  getQuestion,
  getQuestionsByIds,
  getQuestionsByCategory,
  getQuestionsByIssue,
  getQuestions,
  updateQuestion,
  deleteQuestion,
  incrementUsageCount,
  toggleActiveStatus,
  getQuestionsStats
};
