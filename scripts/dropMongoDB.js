/**
 * Drop MongoDB Database Script (Use with CAUTION!)
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'ashravi-dev';

(async () => {
  console.log('⚠️  WARNING: This will delete the entire database!');
  console.log(`Database: ${DB_NAME}`);
  console.log('Waiting 3 seconds...\n');

  await new Promise(resolve => setTimeout(resolve, 3000));

  const client = await MongoClient.connect(MONGO_URI);
  const db = client.db(DB_NAME);

  await db.dropDatabase();
  console.log(`✅ Database "${DB_NAME}" dropped successfully`);

  await client.close();
  process.exit(0);
})();
