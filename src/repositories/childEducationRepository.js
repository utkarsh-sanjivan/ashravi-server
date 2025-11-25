const { tables } = require('../config/dynamoConfig');
const dynamoRepository = require('./dynamoRepository');
const { v4: uuidv4 } = require('uuid');

const tableName = tables.childEducation;

const format = (doc) => (doc ? { ...doc, _id: doc.id } : null);

const createEducationRecord = async (data) => {
  const payload = {
    ...data,
    id: data.id || uuidv4(),
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString()
  };
  const created = await dynamoRepository.createItem(tableName, payload);
  return format(created);
};

const getByChildId = async (childId) => {
  const { items } = await dynamoRepository.scanByField(tableName, 'childId', childId);
  return format(items[0] || null);
};

const updateEducationRecord = async (id, data) => {
  const updated = await dynamoRepository.updateById(tableName, id, data);
  return format(updated);
};

const deleteEducationRecord = async (id) => {
  await dynamoRepository.deleteById(tableName, id);
  return true;
};

module.exports = {
  createEducationRecord,
  getByChildId,
  updateEducationRecord,
  deleteEducationRecord
};
