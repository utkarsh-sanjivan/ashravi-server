const { v4: uuidv4 } = require('uuid');
const { tableName } = require('../config/dynamoConfig');
const dynamoRepository = require('./dynamoRepository');
const { buildChildNutritionKeys } = require('./keyFactory');
const logger = require('../utils/logger');
const format = (doc) => (doc ? { ...doc, _id: doc.id } : null);

const createNutritionRecord = async (data) => {
  if (!data.childId) {
    const error = new Error('childId is required');
    error.statusCode = 400;
    throw error;
  }

  const id = data.id || uuidv4();
  const payload = {
    ...data,
    ...buildChildNutritionKeys(data.childId, id),
    id,
    records: data.records || [],
    recommendations: data.recommendations || [],
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString()
  };

  const created = await dynamoRepository.createItem(tableName, payload);
  logger.info('Created nutrition record', { id: created.id, childId: data.childId });
  return format(created);
};

const getNutritionRecord = async (recordId) => {
  const { items } = await dynamoRepository.queryByEntityType(tableName, 'child_nutrition', {
    filterExpression: '#id = :id',
    expressionNames: { '#id': 'id' },
    expressionValues: { ':id': recordId },
    limit: 1
  });
  const record = items?.[0];
  return format(record);
};

const getByChildId = async (childId) => {
  const { items } = await dynamoRepository.queryByPk(tableName, `CHILD#${childId}`, {
    beginsWith: 'NUT#',
    scanForward: false
  });
  const sorted = (items || []).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  return format(sorted[0] || null);
};

const updateNutritionRecord = async (recordId, data) => {
  const { items } = await dynamoRepository.queryByEntityType(tableName, 'child_nutrition', {
    filterExpression: '#id = :id',
    expressionNames: { '#id': 'id' },
    expressionValues: { ':id': recordId },
    limit: 1
  });
  const record = items?.[0];
  if (!record) {
    logger.warn('Nutrition record not found for update', { recordId });
    return null;
  }
  const updated = await dynamoRepository.updateItem(tableName, record.pk, record.sk, data);
  if (!updated) {
    logger.warn('Nutrition record not found for update', { recordId });
    return null;
  }
  return format(updated);
};

const deleteNutritionRecord = async (recordId) => {
  const { items } = await dynamoRepository.queryByEntityType(tableName, 'child_nutrition', {
    filterExpression: '#id = :id',
    expressionNames: { '#id': 'id' },
    expressionValues: { ':id': recordId },
    limit: 1
  });
  const record = items?.[0];
  if (record) {
    await dynamoRepository.deleteItem(tableName, record.pk, record.sk);
  }
  return true;
};

const addNutritionEntry = async (childId, nutritionEntry) => {
  const record = await getByChildId(childId);
  if (!record) return null;

  const updatedRecords = [...(record.records || []), { ...nutritionEntry, recordedAt: new Date().toISOString() }];
  const updated = await dynamoRepository.updateItem(tableName, record.pk, record.sk, {
    records: updatedRecords,
    updatedAt: new Date().toISOString()
  });

  return format(updated);
};

module.exports = {
  createNutritionRecord,
  getNutritionRecord,
  getByChildId,
  updateNutritionRecord,
  deleteNutritionRecord,
  addNutritionEntry
};
