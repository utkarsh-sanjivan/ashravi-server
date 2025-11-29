const { v4: uuidv4 } = require('uuid');
const { tableName } = require('../config/dynamoConfig');
const dynamoRepository = require('./dynamoRepository');
const { buildInstructorKeys } = require('./keyFactory');
const logger = require('../utils/logger');

const IMMUTABLE_FIELDS = new Set(['id', 'createdAt', 'updatedAt', 'email']);

const format = (doc) => (doc ? { ...doc, _id: doc.id } : null);

const createInstructor = async (data) => {
  try {
    const id = data.id || uuidv4();
    const payload = {
      ...data,
      ...buildInstructorKeys(id),
      id,
      email: data.email?.toLowerCase().trim(),
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString()
    };
    const created = await dynamoRepository.createItem(tableName, payload);
    logger.info('Instructor created', { instructorId: created.id });
    return format(created);
  } catch (error) {
    logger.error('Failed to create instructor', { error: error.message, data });
    throw error;
  }
};

const getInstructorById = async (id) => {
  const { pk, sk } = buildInstructorKeys(id);
  const instructor = await dynamoRepository.getItem(tableName, pk, sk);
  return format(instructor);
};

const getInstructorByEmail = async (email) => {
  if (!email) return null;
  const normalized = email.toLowerCase().trim();
  const { items } = await dynamoRepository.queryByEmail(tableName, normalized, {
    filterExpression: '#et = :type',
    expressionNames: { '#et': 'entityType' },
    expressionValues: { ':type': 'instructor' },
    limit: 1
  });
  return format(items?.[0] || null);
};

const getInstructors = async (filters = {}, page = 1, limit = 20, sort = { createdAt: -1 }) => {
  const { items } = await dynamoRepository.queryByEntityType(tableName, 'instructor');
  let list = items || [];

  if (filters.isActive !== undefined) list = list.filter((i) => i.isActive === filters.isActive);
  if (filters.expertise) {
    const exp = Array.isArray(filters.expertise) ? filters.expertise : [filters.expertise];
    list = list.filter((i) => (i.expertiseAreas || []).some((area) => exp.includes(area)));
  }
  if (filters.search) {
    const s = filters.search.toLowerCase();
    list = list.filter(
      (i) =>
        (i.firstName || '').toLowerCase().includes(s) ||
        (i.lastName || '').toLowerCase().includes(s) ||
        (i.email || '').toLowerCase().includes(s)
    );
  }

  if (sort.createdAt) {
    list.sort((a, b) =>
      sort.createdAt < 0
        ? new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        : new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    );
  }

  const total = list.length;
  const start = (page - 1) * limit;
  const paged = list.slice(start, start + limit);

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

const updateInstructor = async (id, data) => {
  Object.keys(data || {}).forEach((key) => {
    if (IMMUTABLE_FIELDS.has(key)) {
      delete data[key];
    }
  });
  const { pk, sk } = buildInstructorKeys(id);
  const updated = await dynamoRepository.updateItem(tableName, pk, sk, data);
  return format(updated);
};

const deleteInstructor = async (id) => {
  const { pk, sk } = buildInstructorKeys(id);
  const updated = await dynamoRepository.updateItem(tableName, pk, sk, { isActive: false });
  return !!updated;
};

module.exports = {
  createInstructor,
  getInstructorById,
  getInstructorByEmail,
  getInstructors,
  updateInstructor,
  deleteInstructor
};
