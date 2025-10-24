/*
 * Custom migration script for Parents v4
 *
 * Changes:
 * - Adds wishlistCourseIds array with default empty array
 * - Normalizes wishlistCourseIds values to unique ObjectIds
 */

const { ObjectId } = require('mongodb');

const toObjectIdString = (value) => {
  if (!value && value !== 0) {
    return null;
  }

  if (value instanceof ObjectId) {
    return value.toString();
  }

  if (typeof value === 'string' && value.trim().length === 24) {
    return value.trim();
  }

  return null;
};

const arraysEqual = (a = [], b = []) => {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((val, idx) => val === b[idx]);
};

module.exports = async (db, collectionName) => {
  console.log(' 🔧 Running custom data migration for parents v4...');
  const collection = db.collection(collectionName);

  const cursor = collection.find({}, { projection: { wishlistCourseIds: 1 } });

  let processed = 0;
  let updated = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    processed++;

    const hasField = Object.prototype.hasOwnProperty.call(doc, 'wishlistCourseIds');
    const rawWishlist = Array.isArray(doc.wishlistCourseIds)
      ? doc.wishlistCourseIds
      : (doc.wishlistCourseIds === undefined || doc.wishlistCourseIds === null)
        ? []
        : [doc.wishlistCourseIds];

    const normalizedStrings = Array.from(new Set(rawWishlist
      .map(item => toObjectIdString(item))
      .filter(Boolean)));

    const normalizedObjectIds = normalizedStrings.map(str => new ObjectId(str));
    const existingStrings = Array.isArray(doc.wishlistCourseIds)
      ? doc.wishlistCourseIds.map(item => toObjectIdString(item)).filter(Boolean)
      : [];

    if (!hasField || !arraysEqual(existingStrings, normalizedStrings)) {
      await collection.updateOne(
        { _id: doc._id },
        { $set: { wishlistCourseIds: normalizedObjectIds } }
      );
      updated++;
    }
  }

  console.log(`   ℹ️  Parents scanned: ${processed}`);
  console.log(`   ✅ Parents updated: ${updated}`);

  return { acknowledged: true, modifiedCount: updated, matchedCount: processed };
};
