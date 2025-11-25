const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';

const baseClient = new DynamoDBClient({ region });
const dynamoDocClient = DynamoDBDocumentClient.from(baseClient);

const commands = {
  get: (params) => dynamoDocClient.send(new GetCommand(params)),
  put: (params) => dynamoDocClient.send(new PutCommand(params)),
  update: (params) => dynamoDocClient.send(new UpdateCommand(params)),
  delete: (params) => dynamoDocClient.send(new DeleteCommand(params)),
  query: (params) => dynamoDocClient.send(new QueryCommand(params)),
  scan: (params) => dynamoDocClient.send(new ScanCommand(params))
};

module.exports = {
  dynamoDocClient,
  commands,
  QueryCommand,
  ScanCommand
};
