const { tableName } = require('../config/dynamoConfig');
const dynamoRepository = require('./dynamoRepository');
const { buildChildEducationKeys } = require('./keyFactory');
const { v4: uuidv4 } = require('uuid');

const format = (doc) => (doc ? { ...doc, _id: doc.id } : null);

const createEducationRecord = async (data) => {
  const id = data.id || uuidv4();
  const payload = {
    ...data,
    ...buildChildEducationKeys(data.childId, id),
    id,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString()
  };
  const created = await dynamoRepository.createItem(tableName, payload);
  return format(created);
};

const getByChildId = async (childId) => {
  const { items } = await dynamoRepository.queryByPk(tableName, `CHILD#${childId}`, {
    beginsWith: 'EDU#',
    limit: 1
  });
  return format(items?.[0] || null);
};

const updateEducationRecord = async (id, data) => {
  const { items } = await dynamoRepository.queryByEntityType(tableName, 'child_education', {
    filterExpression: '#id = :id',
    expressionNames: { '#id': 'id' },
    expressionValues: { ':id': id },
    limit: 1
  });
  const record = items?.[0];
  if (!record) return null;
  const updated = await dynamoRepository.updateItem(tableName, record.pk, record.sk, data);
  return format(updated);
};

const deleteEducationRecord = async (id) => {
  const { items } = await dynamoRepository.queryByEntityType(tableName, 'child_education', {
    filterExpression: '#id = :id',
    expressionNames: { '#id': 'id' },
    expressionValues: { ':id': id },
    limit: 1
  });
  const record = items?.[0];
  if (!record) return true;
  await dynamoRepository.deleteItem(tableName, record.pk, record.sk);
  return true;
};

module.exports = {
  createEducationRecord,
  getByChildId,
  updateEducationRecord,
  deleteEducationRecord
};
