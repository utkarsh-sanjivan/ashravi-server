const { commands } = require('../db/dynamodbClient');
const logger = require('../utils/logger');

const now = () => new Date().toISOString();

const sanitizeForDynamo = (value) => {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(sanitizeForDynamo);
  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((acc, [key, val]) => {
      if (val === undefined || typeof val === 'function') {
        return acc;
      }
      const sanitized = sanitizeForDynamo(val);
      if (sanitized !== undefined) {
        acc[key] = sanitized;
      }
      return acc;
    }, {});
  }
  if (typeof value === 'function') return undefined;
  return value;
};

const createItem = async (tableName, item) => {
  const payload = {
    ...item,
    createdAt: item.createdAt || now(),
    updatedAt: item.updatedAt || now()
  };
  await commands.put({
    TableName: tableName,
    Item: payload
  });
  return payload;
};

const putItem = async (tableName, item) => {
  const payload = {
    ...item,
    createdAt: item.createdAt || now(),
    updatedAt: item.updatedAt || now()
  };

  await commands.put({
    TableName: tableName,
    Item: payload
  });

  return payload;
};

const getItem = async (tableName, pk, sk) => {
  const result = await commands.get({
    TableName: tableName,
    Key: { pk, sk }
  });
  return result.Item || null;
};

const deleteItem = async (tableName, pk, sk) => {
  await commands.delete({
    TableName: tableName,
    Key: { pk, sk }
  });
  return true;
};

const findItemById = async (tableName, id) => {
  let lastKey;
  do {
    const result = await commands.scan({
      TableName: tableName,
      FilterExpression: '#id = :id',
      ExpressionAttributeNames: { '#id': 'id' },
      ExpressionAttributeValues: { ':id': id },
      ExclusiveStartKey: lastKey
    });

    const found = (result.Items || [])[0];
    if (found) return found;

    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return null;
};

const updateById = async (tableName, id, data) => {
  const target = await findItemById(tableName, id);
  if (!target) {
    const error = new Error(`Item with id ${id} not found`);
    error.code = 'ITEM_NOT_FOUND';
    throw error;
  }

  const sanitized = sanitizeForDynamo({ ...(data || {}) });
  delete sanitized.pk;
  delete sanitized.sk;
  delete sanitized.createdAt;

  if (!target.pk || !target.sk) {
    const error = new Error(`Item with id ${id} is missing keys`);
    error.code = 'ITEM_MISSING_KEYS';
    throw error;
  }

  return updateItem(tableName, target.pk, target.sk, sanitized);
};

const buildUpdateExpressions = (data = {}) => {
  const keys = Object.keys(data).filter((k) => data[k] !== undefined && k !== 'updatedAt');
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

  return { expressionParts, expressionValues, expressionNames };
};

const updateItem = async (tableName, pk, sk, data) => {
  const { expressionParts, expressionValues, expressionNames } = buildUpdateExpressions(data);
  if (expressionParts.length === 1) {
    return getItem(tableName, pk, sk);
  }

  const result = await commands.update({
    TableName: tableName,
    Key: { pk, sk },
    UpdateExpression: `SET ${expressionParts.join(', ')}`,
    ExpressionAttributeNames: expressionNames,
    ExpressionAttributeValues: expressionValues,
    ReturnValues: 'ALL_NEW'
  });

  return result.Attributes || null;
};

const queryByPk = async (
  tableName,
  pk,
  { beginsWith, limit, lastKey, filterExpression, expressionValues, expressionNames, scanForward } = {}
) => {
  const params = {
    TableName: tableName,
    KeyConditionExpression: beginsWith ? 'pk = :pk AND begins_with(sk, :skPrefix)' : 'pk = :pk',
    ExpressionAttributeValues: beginsWith
      ? { ':pk': pk, ':skPrefix': beginsWith, ...(expressionValues || {}) }
      : { ':pk': pk, ...(expressionValues || {}) },
    ExpressionAttributeNames: expressionNames,
    Limit: limit,
    ExclusiveStartKey: lastKey,
    ScanIndexForward: scanForward
  };

  if (filterExpression) {
    params.FilterExpression = filterExpression;
  }

  const result = await commands.query(params);
  return {
    items: result.Items || [],
    lastKey: result.LastEvaluatedKey
  };
};

const scanByAttribute = async (
  tableName,
  attributeName,
  partitionKey,
  { beginsWith, limit, lastKey, filterExpression, expressionValues, expressionNames } = {}
) => {
  const names = {
    '#pk': attributeName,
    ...(beginsWith ? { '#sk': 'sk' } : {}),
    ...(expressionNames || {})
  };

  const values = {
    ':pk': partitionKey,
    ...(beginsWith ? { ':skPrefix': beginsWith } : {}),
    ...(expressionValues || {})
  };

  const filters = ['#pk = :pk'];
  if (beginsWith) {
    filters.push('begins_with(#sk, :skPrefix)');
  }
  if (filterExpression) {
    filters.push(filterExpression);
  }

  const collected = [];
  let nextKey = lastKey;

  do {
    const scanParams = {
      TableName: tableName,
      FilterExpression: filters.join(' AND '),
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      Limit: limit,
      ExclusiveStartKey: nextKey
    };

    const result = await commands.scan(scanParams);
    collected.push(...(result.Items || []));
    nextKey = result.LastEvaluatedKey;

    if (limit && collected.length >= limit) {
      break;
    }
  } while (nextKey);

  return {
    items: limit ? collected.slice(0, limit) : collected,
    lastKey: nextKey
  };
};

const queryByIndex = async (
  tableName,
  indexName,
  partitionKey,
  { beginsWith, limit, lastKey, filterExpression, expressionValues, expressionNames } = {}
) => {
  const attributeName = indexName === 'entityType-index' ? 'entityType' : indexName === 'email-index' ? 'email' : 'slug';

  const params = {
    TableName: tableName,
    IndexName: indexName,
    KeyConditionExpression: beginsWith ? '#pk = :pk AND begins_with(#sk, :skPrefix)' : '#pk = :pk',
    ExpressionAttributeNames: {
      '#pk': attributeName,
      ...(beginsWith ? { '#sk': 'sk' } : {}),
      ...(expressionNames || {})
    },
    ExpressionAttributeValues: beginsWith
      ? { ':pk': partitionKey, ':skPrefix': beginsWith, ...(expressionValues || {}) }
      : { ':pk': partitionKey, ...(expressionValues || {}) },
    Limit: limit,
    ExclusiveStartKey: lastKey
  };

  if (filterExpression) {
    params.FilterExpression = filterExpression;
  }

  try {
    const result = await commands.query(params);
    return {
      items: result.Items || [],
      lastKey: result.LastEvaluatedKey
    };
  } catch (error) {
    const missingIndex =
      error?.name === 'ResourceNotFoundException' ||
      (error?.name === 'ValidationException' && error?.message?.includes('index'));

    if (!missingIndex) {
      throw error;
    }

    logger.warn('GSI missing, falling back to scan', { tableName, indexName });
    return scanByAttribute(tableName, attributeName, partitionKey, {
      beginsWith,
      limit,
      lastKey,
      filterExpression,
      expressionValues,
      expressionNames
    });
  }
};

const queryByEntityType = async (tableName, entityType, options) =>
  queryByIndex(tableName, 'entityType-index', entityType, options);

const queryByEmail = async (tableName, email, options) =>
  queryByIndex(tableName, 'email-index', email, options);

const queryBySlug = async (tableName, slug, options) => queryByIndex(tableName, 'slug-index', slug, options);

module.exports = {
  createItem,
  putItem,
  getItem,
  updateItem,
  deleteItem,
  updateById,
  sanitizeForDynamo,
  findItemById,
  queryByPk,
  queryByEntityType,
  queryByEmail,
  queryBySlug
};
