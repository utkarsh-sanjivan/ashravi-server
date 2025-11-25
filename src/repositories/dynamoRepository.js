const { v4: uuidv4 } = require('uuid');
const { commands } = require('../db/dynamodbClient');
const logger = require('../utils/logger');

const now = () => new Date().toISOString();

const ensureId = (item = {}) => {
  if (item.id) return item;
  return { ...item, id: uuidv4() };
};

const createItem = async (tableName, item) => {
  const payload = ensureId({
    ...item,
    createdAt: item.createdAt || now(),
    updatedAt: item.updatedAt || now()
  });
  await commands.put({
    TableName: tableName,
    Item: payload
  });
  return payload;
};

const getById = async (tableName, id) => {
  const result = await commands.get({
    TableName: tableName,
    Key: { id }
  });
  return result.Item || null;
};

const deleteById = async (tableName, id) => {
  await commands.delete({
    TableName: tableName,
    Key: { id }
  });
  return true;
};

const updateById = async (tableName, id, data) => {
  const keys = Object.keys(data || {}).filter((k) => data[k] !== undefined);
  if (keys.length === 0) {
    return getById(tableName, id);
  }

  const expressionParts = [];
  const expressionValues = {};
  const expressionNames = {};

  keys.forEach((key, index) => {
    const nameKey = `#f${index}`;
    const valueKey = `:v${index}`;
    expressionNames[nameKey] = key;
    expressionValues[valueKey] = data[key];
    expressionParts.push(`${nameKey} = ${valueKey}`);
  });

  expressionNames['#updatedAt'] = 'updatedAt';
  expressionValues[':updatedAt'] = now();
  expressionParts.push('#updatedAt = :updatedAt');

  const result = await commands.update({
    TableName: tableName,
    Key: { id },
    UpdateExpression: `SET ${expressionParts.join(', ')}`,
    ExpressionAttributeNames: expressionNames,
    ExpressionAttributeValues: expressionValues,
    ReturnValues: 'ALL_NEW'
  });

  return result.Attributes || null;
};

const scanAll = async (tableName, limit) => {
  let items = [];
  let lastKey;
  do {
    try {
      const params = {
        TableName: tableName,
        Limit: limit ? Math.min(limit - items.length, limit) : undefined,
        ExclusiveStartKey: lastKey
      };
      const result = await commands.scan(params);
      items = items.concat(result.Items || []);
      lastKey = result.LastEvaluatedKey;
      if (limit && items.length >= limit) {
        break;
      }
    } catch (err) {
      logger.error('Dynamo scan failed', { tableName, error: err.message });
      throw err;
    }
  } while (lastKey);
  return items;
};

const scanByField = async (tableName, field, value, options = {}) => {
  const { limit, startKey } = options;
  const params = {
    TableName: tableName,
    FilterExpression: '#field = :value',
    ExpressionAttributeNames: {
      '#field': field
    },
    ExpressionAttributeValues: {
      ':value': value
    },
    ExclusiveStartKey: startKey,
    Limit: limit
  };

  const result = await commands.scan(params);
  return {
    items: result.Items || [],
    lastKey: result.LastEvaluatedKey
  };
};

module.exports = {
  createItem,
  getById,
  updateById,
  deleteById,
  scanAll,
  scanByField
};
