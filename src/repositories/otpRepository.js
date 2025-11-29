const { v4: uuidv4 } = require('uuid');
const { tableName } = require('../config/dynamoConfig');
const dynamoRepository = require('./dynamoRepository');
const { buildOtpKeys } = require('./keyFactory');

const format = (doc) => (doc ? { ...doc, _id: doc.id } : null);

const createOtp = async (data) => {
  const id = data.id || uuidv4();
  const payload = {
    ...data,
    ...buildOtpKeys(data.contact, id),
    id,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString()
  };
  const created = await dynamoRepository.createItem(tableName, payload);
  return format(created);
};

const deleteByContactAndPurpose = async (contact, purpose) => {
  const { items } = await dynamoRepository.queryByPk(tableName, `OTP#${contact}`, {
    beginsWith: 'OTP#'
  });
  const toDelete = (items || []).filter((o) => o.purpose === purpose);
  for (const record of toDelete) {
    await dynamoRepository.deleteItem(tableName, record.pk, record.sk);
  }
};

const getLatestByContactAndPurpose = async (contact, purpose) => {
  const { items } = await dynamoRepository.queryByPk(tableName, `OTP#${contact}`, {
    beginsWith: 'OTP#',
    scanForward: false
  });
  const filtered = (items || []).filter((o) => o.purpose === purpose);
  filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return format(filtered[0] || null);
};

const deleteById = async (id) => {
  const { items } = await dynamoRepository.queryByEntityType(tableName, 'otp', {
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
  createOtp,
  deleteByContactAndPurpose,
  getLatestByContactAndPurpose,
  deleteById
};
