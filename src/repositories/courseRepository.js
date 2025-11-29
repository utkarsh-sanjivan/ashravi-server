const { v4: uuidv4 } = require('uuid');
const { tableName } = require('../config/dynamoConfig');
const dynamoRepository = require('./dynamoRepository');
const { buildCourseKeys } = require('./keyFactory');
const logger = require('../utils/logger');

const IMMUTABLE_FIELDS = new Set(['id', 'createdAt', 'slug', 'enrollmentCount']);

const format = (doc) => (doc ? { ...doc, _id: doc.id } : null);

const createCourse = async (data) => {
  const id = data.id || uuidv4();
  const payload = {
    ...data,
    id,
    ...buildCourseKeys(id),
    enrollmentCount: data.enrollmentCount || 0,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString()
  };
  const created = await dynamoRepository.createItem(tableName, payload);
  logger.info('Created course', { id: created.id, title: data.title });
  return format(created);
};

const getCourse = async (courseId) => {
  const { pk, sk } = buildCourseKeys(courseId);
  const course = await dynamoRepository.getItem(tableName, pk, sk);
  return format(course);
};

const getCourseBySlug = async (slug) => {
  const { items } = await dynamoRepository.queryBySlug(tableName, slug, {
    filterExpression: '#et = :type',
    expressionNames: { '#et': 'entityType' },
    expressionValues: { ':type': 'course' },
    limit: 1
  });
  return format(items?.[0] || null);
};

const getCoursesByIds = async (ids = [], onlyPublished = false) => {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const { items } = await dynamoRepository.queryByEntityType(tableName, 'course');
  const map = new Map((items || []).map((i) => [i.id, i]));
  const filtered = ids.map((id) => map.get(id)).filter(Boolean);
  return (onlyPublished ? filtered.filter((c) => c.isPublished) : filtered).map(format);
};

const getCourses = async (filters = {}, page = 1, limit = 20, sort = { createdAt: -1 }) => {
  const { items } = await dynamoRepository.queryByEntityType(tableName, 'course');
  let list = items || [];

  if (filters.category) list = list.filter((c) => c.category === filters.category);
  if (filters.level) list = list.filter((c) => c.level === filters.level);
  if (filters.isPublished !== undefined) list = list.filter((c) => c.isPublished === filters.isPublished);
  if (filters.instructor) list = list.filter((c) => c.instructor === filters.instructor);
  if (filters.tags && filters.tags.length > 0) {
    list = list.filter((c) => (c.tags || []).some((t) => filters.tags.includes(t)));
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    list = list.filter((c) => {
      const amount = c?.price?.amount ?? 0;
      if (filters.minPrice !== undefined && amount < filters.minPrice) return false;
      if (filters.maxPrice !== undefined && amount > filters.maxPrice) return false;
      return true;
    });
  }
  if (filters.search) {
    const s = filters.search.toLowerCase();
    list = list.filter((c) => (c.title || '').toLowerCase().includes(s) || (c.description || '').toLowerCase().includes(s));
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
  const data = list.slice(start, start + limit).map(format);

  return {
    data,
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

const updateCourse = async (courseId, data) => {
  const sanitized = {};
  Object.entries(data || {}).forEach(([key, value]) => {
    if (!IMMUTABLE_FIELDS.has(key)) {
      sanitized[key] = value;
    }
  });
  const { pk, sk } = buildCourseKeys(courseId);
  const updated = await dynamoRepository.updateItem(tableName, pk, sk, sanitized);
  return format(updated);
};

const deleteCourse = async (courseId) => {
  const { pk, sk } = buildCourseKeys(courseId);
  await dynamoRepository.deleteItem(tableName, pk, sk);
  return true;
};

const incrementEnrollment = async (courseId) => {
  const { pk, sk } = buildCourseKeys(courseId);
  const course = await dynamoRepository.getItem(tableName, pk, sk);
  if (!course) return null;
  const updated = await dynamoRepository.updateItem(tableName, pk, sk, {
    enrollmentCount: (course.enrollmentCount || 0) + 1
  });
  return format(updated);
};

module.exports = {
  createCourse,
  getCourse,
  getCourseBySlug,
  getCourses,
  updateCourse,
  deleteCourse,
  incrementEnrollment,
  getCoursesByIds
};
