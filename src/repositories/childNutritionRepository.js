const { v4: uuidv4 } = require('uuid');
const { tables } = require('../config/dynamoConfig');
const dynamoRepository = require('./dynamoRepository');
const logger = require('../utils/logger');

const tableName = tables.childNutrition;
const format = (doc) => (doc ? { ...doc, _id: doc.id } : null);

const createNutritionRecord = async (data) => {
  if (!data.childId) {
    const error = new Error('childId is required');
    error.statusCode = 400;
    throw error;
  }

  const payload = {
    ...data,
    id: data.id || uuidv4(),
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
  const record = await dynamoRepository.getById(tableName, recordId);
  return format(record);
};

const getByChildId = async (childId) => {
  const { items } = await dynamoRepository.scanByField(tableName, 'childId', childId);
  const sorted = (items || []).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  return format(sorted[0] || null);
};

const updateNutritionRecord = async (recordId, data) => {
  const updated = await dynamoRepository.updateById(tableName, recordId, data);
  if (!updated) {
    logger.warn('Nutrition record not found for update', { recordId });
    return null;
  }
  return format(updated);
};

const deleteNutritionRecord = async (recordId) => {
  await dynamoRepository.deleteById(tableName, recordId);
  return true;
};

const addNutritionEntry = async (childId, nutritionEntry) => {
  const record = await getByChildId(childId);
  if (!record) return null;

  const updatedRecords = [...(record.records || []), { ...nutritionEntry, recordedAt: new Date().toISOString() }];
  const updated = await dynamoRepository.updateById(tableName, record.id, {
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
