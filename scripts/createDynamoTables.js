const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const client = new DynamoDBClient({ region });

const tableName = process.env.DYNAMO_TABLE_NAME || 'asharvi-dynamo-staging';

const createTableParams = {
  TableName: tableName,
  AttributeDefinitions: [
    { AttributeName: 'pk', AttributeType: 'S' },
    { AttributeName: 'sk', AttributeType: 'S' },
    { AttributeName: 'entityType', AttributeType: 'S' },
    { AttributeName: 'email', AttributeType: 'S' },
    { AttributeName: 'slug', AttributeType: 'S' }
  ],
  KeySchema: [
    { AttributeName: 'pk', KeyType: 'HASH' },
    { AttributeName: 'sk', KeyType: 'RANGE' }
  ],
  BillingMode: 'PAY_PER_REQUEST',
  GlobalSecondaryIndexes: [
    {
      IndexName: 'entityType-index',
      KeySchema: [
        { AttributeName: 'entityType', KeyType: 'HASH' },
        { AttributeName: 'sk', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' },
      BillingMode: 'PAY_PER_REQUEST'
    },
    {
      IndexName: 'email-index',
      KeySchema: [
        { AttributeName: 'email', KeyType: 'HASH' },
        { AttributeName: 'sk', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' },
      BillingMode: 'PAY_PER_REQUEST'
    },
    {
      IndexName: 'slug-index',
      KeySchema: [
        { AttributeName: 'slug', KeyType: 'HASH' },
        { AttributeName: 'sk', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' },
      BillingMode: 'PAY_PER_REQUEST'
    }
  ]
};

const createTable = async () => {
  try {
    await client.send(new CreateTableCommand(createTableParams));
    console.log(`Created table ${tableName}`);
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log(`Table ${tableName} already exists, skipping`);
    } else {
      console.error(`Failed to create table ${tableName}:`, error.message);
      throw error;
    }
  }
};

createTable().catch((err) => {
  console.error('Error creating table:', err);
  process.exit(1);
});
