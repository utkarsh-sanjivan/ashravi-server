/*
 * Custom migration script for Parents v3
 * 
 * Changes:
 * - Makes city and occupation optional
 * - Makes email and phoneNumber optional (but at least one required - enforced at app level)
 * - Adds sparse indexes for email and phoneNumber
 * - Drops old indexes: isActive, city, createdAt
 */

module.exports = async (db, collectionName) => {
  console.log(' 🔧 Running custom data migration for parents v3...');
  const collection = db.collection(collectionName);
  
  console.log('   ⚙️  Dropping old indexes: isActive_index, city_index, createdAt_desc');
  try {
    await collection.dropIndex('isActive_index').catch(() => console.log('     (Index may not exist)'));
    await collection.dropIndex('city_index').catch(() => console.log('     (Index may not exist)'));
    await collection.dropIndex('createdAt_desc').catch(() => console.log('     (Index may not exist)'));
    console.log('   ✅ Old indexes dropped');
  } catch (error) {
    console.log('   ⚠️  Some indexes may not have existed:', error.message);
  }
  
  // city and occupation can remain as-is (nullable is fine)
  console.log('   ⚙️  No data transformation needed - fields already support null');
  
  const invalidDocs = await collection.countDocuments({
    $and: [
      { $or: [{ email: { $exists: false } }, { email: null }] },
      { $or: [{ phoneNumber: { $exists: false } }, { phoneNumber: null }] }
    ]
  });
  
  if (invalidDocs > 0) {
    console.log(`   ⚠️  WARNING: ${invalidDocs} documents have neither email nor phoneNumber!`);
    console.log('     These documents may cause validation errors.');
  } else {
    console.log('   ✅ All documents have at least one contact method');
  }
  
  return { acknowledged: true, modifiedCount: 0, matchedCount: 0 };
};
