const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const client = new DynamoDBClient({ region });

const tables = [
  process.env.PARENTS_TABLE_NAME || 'parents',
  process.env.CHILDREN_TABLE_NAME || 'children',
  process.env.COURSES_TABLE_NAME || 'courses',
  process.env.COURSE_PROGRESS_TABLE_NAME || 'course_progress',
  process.env.INSTRUCTORS_TABLE_NAME || 'instructors',
  process.env.QUESTIONS_TABLE_NAME || 'questions',
  process.env.OTPS_TABLE_NAME || 'otps',
  process.env.CHILD_EDUCATION_TABLE_NAME || 'child_education',
  process.env.CHILD_NUTRITION_TABLE_NAME || 'child_nutrition'
];

const createTableParams = (TableName) => ({
  TableName,
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' }
  ],
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' }
  ],
  BillingMode: 'PAY_PER_REQUEST'
});

const createTables = async () => {
  for (const tableName of tables) {
    try {
      await client.send(new CreateTableCommand(createTableParams(tableName)));
      console.log(`Created table ${tableName}`);
    } catch (error) {
      if (error.name === 'ResourceInUseException') {
        console.log(`Table ${tableName} already exists, skipping`);
      } else {
        console.error(`Failed to create table ${tableName}:`, error.message);
      }
    }
  }
};

createTables().catch((err) => {
  console.error('Error creating tables:', err);
  process.exit(1);
});
