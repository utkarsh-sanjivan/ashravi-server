/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const logger = require('../src/utils/logger');

const TARGET_LANGUAGES = new Set(['English', 'Hindi']);
const TEXT_LANGUAGE_DEFAULT = 'english';
const TEXT_INDEX_FIELDS = { title: 'text', description: 'text', tags: 'text' };
const TEXT_INDEX_OPTIONS = {
  name: 'CourseTextSearch',
  default_language: 'english',
  language_override: 'textLanguage'
};

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

const normalizeLanguage = (language) => {
  if (!language || typeof language !== 'string') {
    return 'English';
  }

  const trimmed = language.trim();
  if (TARGET_LANGUAGES.has(trimmed)) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();
  if (lower.startsWith('en')) return 'English';
  if (lower.startsWith('hi')) return 'Hindi';

  return 'English';
};

const updateCourses = async () => {
  const collection = mongoose.connection.collection('courses');

  const cursor = collection.find(
    {
      $or: [
        { textLanguage: { $exists: false } },
        { textLanguage: { $ne: TEXT_LANGUAGE_DEFAULT } },
        { language: { $nin: Array.from(TARGET_LANGUAGES) } }
      ]
    },
    { projection: { language: 1 } }
  );

  let processed = 0;
  const bulkOps = [];

  while (await cursor.hasNext()) {
    const course = await cursor.next();
    const setPayload = {};

    if (!course.textLanguage || course.textLanguage !== TEXT_LANGUAGE_DEFAULT) {
      setPayload.textLanguage = TEXT_LANGUAGE_DEFAULT;
    }

    const normalizedLanguage = normalizeLanguage(course.language);
    if (course.language !== normalizedLanguage) {
      setPayload.language = normalizedLanguage;
    }

    if (Object.keys(setPayload).length === 0) {
      continue;
    }

    bulkOps.push({
      updateOne: {
        filter: { _id: course._id },
        update: { $set: setPayload }
      }
    });

    processed += 1;

    if (bulkOps.length === 500) {
      await collection.bulkWrite(bulkOps, { ordered: false });
      bulkOps.length = 0;
    }
  }

  if (bulkOps.length > 0) {
    await collection.bulkWrite(bulkOps, { ordered: false });
  }

  return processed;
};

const rebuildTextIndex = async () => {
  const collection = mongoose.connection.collection('courses');
  const existingIndexes = await collection.indexes();

  const textIndexes = existingIndexes.filter((index) =>
    Object.values(index.key).some((value) => value === 'text')
  );

  for (const index of textIndexes) {
    try {
      await collection.dropIndex(index.name);
      console.log(`✔️  Dropped existing text index: ${index.name}`);
    } catch (error) {
      if (error.codeName !== 'IndexNotFound') {
        throw error;
      }
    }
  }

  await collection.createIndex(TEXT_INDEX_FIELDS, TEXT_INDEX_OPTIONS);
  console.log(`✅ Created text index "${TEXT_INDEX_OPTIONS.name}" with language override`);
};

const run = async () => {
  console.log('🔄 Updating courses schema...');
  await connect();
  console.log('✅ Connected to MongoDB');

  try {
    const updatedCount = await updateCourses();
    console.log(`📝 Normalized ${updatedCount} course documents`);

    await rebuildTextIndex();
    console.log('🎉 Course schema update complete!');
  } catch (error) {
    logger.error('Course schema update failed', { error: error.message });
    console.error('❌ Course schema update failed:', error);
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
