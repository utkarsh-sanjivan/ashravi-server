const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { tableName } = require('../config/dynamoConfig');
const dynamoRepository = require('./dynamoRepository');
const { buildParentKeys } = require('./keyFactory');
const logger = require('../utils/logger');

const IMMUTABLE_FIELDS = new Set(['id', 'createdAt']);

const attachHelpers = (item) => {
  if (!item) return null;
  return {
    ...item,
    _id: item.id,
    comparePassword: async (candidate) => bcrypt.compare(candidate, item.password || ''),
    getSignedJwtToken: () =>
      jwt.sign({ id: item.id, email: item.email, role: 'parent' }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }),
    generateRefreshToken: () =>
      jwt.sign({ id: item.id, type: 'refresh' }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
        expiresIn: '30d'
      }),
    getPublicProfile: () => ({
      id: item.id,
      name: item.name,
      email: item.email,
      phoneNumber: item.phoneNumber,
      city: item.city,
      economicStatus: item.economicStatus,
      occupation: item.occupation,
      childrenIds: item.childrenIds || [],
      childrenCount: (item.childrenIds || []).length,
      wishlistCourseIds: item.wishlistCourseIds || [],
      wishlistCount: (item.wishlistCourseIds || []).length,
      createdAt: item.createdAt,
      lastLogin: item.lastLogin
    }),
    save: async () => {
      const toPersist = dynamoRepository.sanitizeForDynamo({
        ...item,
        ...buildParentKeys(item.id),
        id: item.id
      });

      const persisted = await dynamoRepository.putItem(tableName, toPersist);
      return attachHelpers(persisted);
    },
    markModified: () => {}
  };
};

const createParent = async (parentData) => {
  const email = parentData.email?.toLowerCase().trim();
  const existing = await getParentByEmail(email);
  if (existing) {
    const error = new Error('Parent with this email address already exists');
    error.code = 'DUPLICATE_EMAIL';
    throw error;
  }

  const passwordHash = await bcrypt.hash(parentData.password, 12);

  const id = parentData.id || uuidv4();
  const payload = {
    ...parentData,
    ...buildParentKeys(id),
    id,
    email,
    password: passwordHash,
    childrenIds: parentData.childrenIds || [],
    wishlistCourseIds: parentData.wishlistCourseIds || [],
    isActive: parentData.isActive !== undefined ? parentData.isActive : true,
    refreshTokens: parentData.refreshTokens || []
  };

  const created = await dynamoRepository.createItem(tableName, payload);
  logger.info('Parent created successfully', { parentId: created.id });
  return attachHelpers(created);
};

const getParent = async (parentId) => {
  try {
    const { pk, sk } = buildParentKeys(parentId);
    const item = await dynamoRepository.getItem(tableName, pk, sk);
    if (item) {
      return attachHelpers(item);
    }
  } catch (error) {
    // Fallback to scan if table schema differs
    const item = await dynamoRepository.findItemById(tableName, parentId);
    return attachHelpers(item);
  }
  const item = await dynamoRepository.findItemById(tableName, parentId);
  return attachHelpers(item);
};

const getParentByEmail = async (email) => {
  if (!email) return null;
  const normalized = email.toLowerCase().trim();
  const { items } = await dynamoRepository.queryByEmail(tableName, normalized, {
    filterExpression: '#et = :type',
    expressionNames: { '#et': 'entityType' },
    expressionValues: { ':type': 'parent' },
    limit: 1
  });
  return attachHelpers(items?.[0] || null);
};

const getParentsByCity = async (city, limit = 100, skip = 0) => {
  if (!city) return [];
  const normalized = city.toLowerCase();
  let lastKey;
  const collected = [];
  do {
    const { items, lastKey: nextKey } = await dynamoRepository.queryByEntityType(tableName, 'parent', {
      lastKey,
      filterExpression: 'begins_with(#city, :city)',
      expressionNames: { '#city': 'city' },
      expressionValues: { ':city': normalized }
    });
    collected.push(...(items || []).filter((p) => (p.city || '').toLowerCase() === normalized));
    lastKey = nextKey;
    if (collected.length >= skip + limit || !lastKey) {
      break;
    }
  } while (lastKey);

  const sliced = collected.slice(skip, skip + limit);
  return sliced.map(attachHelpers);
};

const updateParent = async (parentId, updateData) => {
  if (!updateData || Object.keys(updateData).length === 0) {
    return getParent(parentId);
  }

  const existing = await dynamoRepository.findItemById(tableName, parentId);
  if (!existing) {
    return null;
  }

  const sanitized = {};
  Object.entries(updateData).forEach(([key, value]) => {
    if (!IMMUTABLE_FIELDS.has(key) && value !== undefined) {
      sanitized[key] = value;
    }
  });

  if (sanitized.password) {
    sanitized.password = await bcrypt.hash(sanitized.password, 12);
  }

  const merged = {
    ...existing,
    ...sanitized,
    updatedAt: new Date().toISOString()
  };

  const persisted = await dynamoRepository.putItem(tableName, dynamoRepository.sanitizeForDynamo(merged));
  return attachHelpers(persisted);
};

const deleteParent = async (parentId) => {
  const { pk, sk } = buildParentKeys(parentId);
  await dynamoRepository.deleteItem(tableName, pk, sk);
  return true;
};

const countParents = async () => {
  let lastKey;
  let count = 0;
  do {
    const { items, lastKey: nextKey } = await dynamoRepository.queryByEntityType(tableName, 'parent', {
      lastKey
    });
    count += (items || []).length;
    lastKey = nextKey;
  } while (lastKey);
  return count;
};

module.exports = {
  createParent,
  getParent,
  getParentByEmail,
  getParentsByCity,
  updateParent,
  deleteParent,
  countParents
};
