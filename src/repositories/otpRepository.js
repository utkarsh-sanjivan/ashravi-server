const { v4: uuidv4 } = require('uuid');
const { tables } = require('../config/dynamoConfig');
const dynamoRepository = require('./dynamoRepository');

const tableName = tables.otps;

const format = (doc) => (doc ? { ...doc, _id: doc.id } : null);

const createOtp = async (data) => {
  const payload = {
    ...data,
    id: data.id || uuidv4(),
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString()
  };
  const created = await dynamoRepository.createItem(tableName, payload);
  return format(created);
};

const deleteByContactAndPurpose = async (contact, purpose) => {
  const { items } = await dynamoRepository.scanAll(tableName);
  const toDelete = (items || []).filter((o) => o.contact === contact && o.purpose === purpose);
  for (const record of toDelete) {
    await dynamoRepository.deleteById(tableName, record.id);
  }
};

const getLatestByContactAndPurpose = async (contact, purpose) => {
  const { items } = await dynamoRepository.scanAll(tableName);
  const filtered = (items || []).filter((o) => o.contact === contact && o.purpose === purpose);
  filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return format(filtered[0] || null);
};

const deleteById = async (id) => {
  await dynamoRepository.deleteById(tableName, id);
  return true;
};

module.exports = {
  createOtp,
  deleteByContactAndPurpose,
  getLatestByContactAndPurpose,
  deleteById
};
