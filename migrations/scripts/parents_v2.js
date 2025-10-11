/*
 * Custom migration script for Parents v2
 * 
 * This removes economicStatus requirement from existing documents
 */

module.exports = async (db, collectionName) => {
  console.log('  🔧 Running custom data migration for parents v2...');
  
  const collection = db.collection(collectionName);
  
  // Example: Set default value for economicStatus if null
  const result = await collection.updateMany(
    { economicStatus: { $exists: false } },
    { $set: { economicStatus: null } }
  );
  
  console.log(`  ✅ Updated ${result.modifiedCount} documents`);
  
  // Add any other data transformations here
  
  return result;
};
