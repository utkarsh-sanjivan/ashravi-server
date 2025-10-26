/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const logger = require('../src/utils/logger');

const connect = async () => {
  const { MONGO_URI } = process.env;

  if (!MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not defined.');
  }

  await mongoose.connect(MONGO_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000
  });
};

const addNotesField = async () => {
  const collection = mongoose.connection.collection('courseprogresses');
  const result = await collection.updateMany(
    { notes: { $exists: false } },
    { $set: { notes: '' } }
  );

  return {
    matched: result.matchedCount ?? 0,
    modified: result.modifiedCount ?? 0
  };
};

const run = async () => {
  console.log('🔄 Updating course progress notes field...');
  await connect();
  console.log('✅ Connected to MongoDB');

  try {
    const { matched, modified } = await addNotesField();
    console.log(`📄 Processed ${matched} course progress records`);
    console.log(`📝 Added notes field to ${modified} records`);
  } catch (error) {
    logger.error('Failed to update course progress notes', { error: error.message });
    console.error('❌ Failed to update course progress notes:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

if (require.main === module) {
  run()
    .then(() => {
      process.exit();
    })
    .catch(() => {
      process.exit(1);
    });
}

module.exports = { run };
