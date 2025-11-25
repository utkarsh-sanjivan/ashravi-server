const { v4: uuidv4 } = require('uuid');
const { tables } = require('../config/dynamoConfig');
const dynamoRepository = require('./dynamoRepository');
const logger = require('../utils/logger');

const tableName = tables.children;
const IMMUTABLE_FIELDS = new Set(['id', 'createdAt']);

const formatDocument = (doc) => {
  if (!doc) return null;
  return { ...doc, _id: doc.id };
};

const createChild = async (childData) => {
  try {
    const payload = {
      ...childData,
      id: childData.id || uuidv4(),
      courseIds: childData.courseIds || [],
      createdAt: childData.createdAt || new Date().toISOString(),
      updatedAt: childData.updatedAt || new Date().toISOString()
    };
    const created = await dynamoRepository.createItem(tableName, payload);
    logger.info('Child created successfully', { childId: created.id });
    return formatDocument(created);
  } catch (error) {
    logger.error('Error creating child', { error: error.message, childData });
    throw error;
  }
};

const getChild = async (childId) => {
  try {
    const child = await dynamoRepository.getById(tableName, childId);
    return formatDocument(child);
  } catch (error) {
    logger.error('Error fetching child', { childId, error: error.message });
    throw error;
  }
};

const getChildrenByParent = async (parentId, limit = 100, skip = 0) => {
  try {
    const { items } = await dynamoRepository.scanByField(tableName, 'parentId', parentId, {
      limit: undefined
    });
    const sorted = (items || []).sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
    const sliced = sorted.slice(skip, skip + limit);
    return sliced.map(formatDocument);
  } catch (error) {
    logger.error('Error fetching children by parent', { parentId, error: error.message });
    throw error;
  }
};

const updateChild = async (childId, updateData) => {
  try {
    if (!updateData || Object.keys(updateData).length === 0) {
      return await getChild(childId);
    }

    const sanitizedData = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (!IMMUTABLE_FIELDS.has(key)) {
        sanitizedData[key] = value;
      }
    }

    if (Object.keys(sanitizedData).length === 0) {
      return await getChild(childId);
    }

    const updated = await dynamoRepository.updateById(tableName, childId, sanitizedData);
    if (!updated) {
      logger.warn('Child not found for update', { childId });
      return null;
    }

    logger.info('Child updated successfully', { childId });
    return formatDocument(updated);
  } catch (error) {
    logger.error('Error updating child', { childId, error: error.message });
    throw error;
  }
};

const deleteChild = async (childId) => {
  try {
    await dynamoRepository.deleteById(tableName, childId);
    logger.info('Child deleted successfully', { childId });
    return true;
  } catch (error) {
    logger.error('Error deleting child', { childId, error: error.message });
    throw error;
  }
};

const countChildrenByParent = async (parentId) => {
  try {
    const { items } = await dynamoRepository.scanByField(tableName, 'parentId', parentId);
    return (items || []).length;
  } catch (error) {
    logger.error('Error counting children', { parentId, error: error.message });
    throw error;
  }
};

const addCoursesToChild = async (childId, courseIds) => {
  try {
    const child = await getChild(childId);
    if (!child) return null;

    const existing = new Set(child.courseIds || []);
    courseIds.forEach((id) => existing.add(id));

    const updated = await dynamoRepository.updateById(tableName, childId, {
      courseIds: Array.from(existing)
    });

    logger.info('Courses added to child', { childId, courseIds });
    return formatDocument(updated);
  } catch (error) {
    logger.error('Error adding courses to child', { childId, error: error.message });
    throw error;
  }
};

module.exports = {
  createChild,
  getChild,
  getChildrenByParent,
  updateChild,
  deleteChild,
  countChildrenByParent,
  addCoursesToChild
};
