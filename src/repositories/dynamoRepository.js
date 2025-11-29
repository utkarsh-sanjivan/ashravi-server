const { commands } = require('../db/dynamodbClient');

const now = () => new Date().toISOString();

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

const buildUpdateExpressions = (data = {}) => {
  const keys = Object.keys(data).filter((k) => data[k] !== undefined);
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

const queryByIndex = async (
  tableName,
  indexName,
  partitionKey,
  { beginsWith, limit, lastKey, filterExpression, expressionValues, expressionNames } = {}
) => {
  const params = {
    TableName: tableName,
    IndexName: indexName,
    KeyConditionExpression: beginsWith ? '#pk = :pk AND begins_with(#sk, :skPrefix)' : '#pk = :pk',
    ExpressionAttributeNames: {
      '#pk': indexName === 'entityType-index' ? 'entityType' : indexName === 'email-index' ? 'email' : 'slug',
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

  const result = await commands.query(params);
  return {
    items: result.Items || [],
    lastKey: result.LastEvaluatedKey
  };
};

const queryByEntityType = async (tableName, entityType, options) =>
  queryByIndex(tableName, 'entityType-index', entityType, options);

const queryByEmail = async (tableName, email, options) =>
  queryByIndex(tableName, 'email-index', email, options);

const queryBySlug = async (tableName, slug, options) => queryByIndex(tableName, 'slug-index', slug, options);

module.exports = {
  createItem,
  getItem,
  updateItem,
  deleteItem,
  queryByPk,
  queryByEntityType,
  queryByEmail,
  queryBySlug
};
