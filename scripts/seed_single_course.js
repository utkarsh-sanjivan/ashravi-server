/**
 * Seed a single course into DynamoDB.
 *
 * Usage:
 *   node scripts/seed_single_course.js
 *   node scripts/seed_single_course.js --table=asharvi-dynamo-staging --region=us-east-1 --title="Custom Title"
 *
 * Requirements:
 *   - AWS credentials with write access to the target table
 *   - AWS_REGION (or AWS_DEFAULT_REGION) set, or pass --region
 *   - DYNAMO_TABLE_NAME set, or pass --table (defaults to staging)
 */
require('dotenv').config();

const { DynamoDBClient, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const { buildCourseKeys } = require('../src/repositories/keyFactory');
const { DEFAULT_TABLE_NAME } = require('../src/config/dynamoConfig');

const args = process.argv.slice(2).reduce((acc, arg) => {
  if (!arg.startsWith('--')) return acc;
  const [key, value] = arg.replace(/^--/, '').split('=');
  acc[key] = value ?? true;
  return acc;
}, {});

if (args.profile) {
  process.env.AWS_PROFILE = args.profile;
}

const region = args.region || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const tableName = args.table || process.env.DYNAMO_TABLE_NAME || DEFAULT_TABLE_NAME;
const endpoint = process.env.DYNAMODB_ENDPOINT; // allows local override if provided
const profile = process.env.AWS_PROFILE;

const baseClient = new DynamoDBClient({ region, endpoint });
const docClient = DynamoDBDocumentClient.from(baseClient);

const ensureTableExists = async (name) => {
  try {
    await baseClient.send(new DescribeTableCommand({ TableName: name }));
    console.log(`Verified table exists: ${name}`);
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.error(`Table "${name}" not found in region "${region}". Set DYNAMO_TABLE_NAME or use --table to point to the correct table.`);
      process.exit(1);
    }
    console.error('Failed to verify table:', error);
    process.exit(1);
  }
};

const slugify = (text) =>
  text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const buildCoursePayload = () => {
  const id = uuidv4();
  const now = new Date().toISOString();
  const title = args.title || 'Calm Discipline: Parenting Foundations';
  const slug = args.slug || `${slugify(title) || 'course'}-${Date.now()}`;
  const keys = buildCourseKeys(id);

  return {
    ...keys,
    id,
    title,
    slug,
    headline: 'A quick-start guide to setting boundaries with empathy',
    description:
      'Learn a simple, repeatable framework for calm discipline. This course covers emotional regulation, consistent routines, and positive reinforcement so you can guide your child without power struggles.',
    shortDescription: 'Calm, consistent parenting tools you can apply today.',
    thumbnail: 'https://picsum.photos/seed/calm-discipline-thumb/640/360',
    coverImage: 'https://picsum.photos/seed/calm-discipline-cover/1200/600',
    category: 'Parenting',
    subCategory: 'Discipline',
    level: 'beginner',
    language: 'English',
    price: {
      amount: 29,
      currency: 'USD',
      discountedPrice: 19
    },
    sections: [
      {
        title: 'Start Here',
        description: 'Ground yourself, set expectations, and map your routine.',
        order: 0,
        videos: [
          {
            title: 'Welcome and Course Overview',
            description: 'What to expect and how to get the most from this course.',
            videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            duration: 8 * 60,
            order: 0,
            isFree: true,
            thumbnail: 'https://picsum.photos/seed/calm-discipline-welcome/640/360'
          }
        ],
        pdfs: [
          {
            filename: 'calm-discipline-checklist.pdf',
            url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            size: 125000
          }
        ],
        isLocked: false
      }
    ],
    tags: ['parenting', 'discipline', 'calm'],
    prerequisites: ['Willingness to practice daily for 10 minutes'],
    learningOutcomes: [
      'Create a calm response plan for tough moments',
      'Set clear, consistent boundaries with empathy',
      'Use positive reinforcement to encourage cooperation'
    ],
    targetAudience: ['Parents of toddlers and young children', 'Caregivers looking for calm discipline tools'],
    isPublished: true,
    enrollmentCount: 0,
    createdAt: now,
    updatedAt: now
  };
};

const run = async () => {
  console.log(`Using table: ${tableName}`);
  console.log(`Region: ${region}`);
  if (endpoint) console.log(`Endpoint override: ${endpoint}`);
  if (profile) console.log(`AWS profile: ${profile}`);

  await ensureTableExists(tableName);
  const item = buildCoursePayload();

  try {
    await docClient.send(new PutCommand({ TableName: tableName, Item: item }));
    const fetched = await docClient.send(
      new GetCommand({ TableName: tableName, Key: { pk: item.pk, sk: item.sk } })
    );
    console.log('Seeded course:', {
      id: item.id,
      slug: item.slug,
      pk: item.pk,
      sk: item.sk,
      table: tableName,
      exists: Boolean(fetched?.Item)
    });
    if (!fetched?.Item) {
      console.warn('Item not immediately visible via GetCommand. Check region/profile/table name and DynamoDB Streams/replication delays if applicable.');
    }
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed course:', error);
    process.exit(1);
  }
};

run();
