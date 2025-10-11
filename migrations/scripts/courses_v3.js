/*
 * Custom migration script for Courses v3
 * 
 * Changes:
 * - Makes instructor optional
 * - Makes headline optional
 * - Drops index: instructor
 */

module.exports = async (db, collectionName) => {
  console.log(' 🔧 Running custom data migration for courses v3...');
  const collection = db.collection(collectionName);
  
  console.log('   ⚙️  Dropping old index: instructor_index');
  try {
    await collection.dropIndex('instructor_index').catch(() => console.log('     (Index may not exist)'));
    console.log('   ✅ instructor_index dropped');
  } catch (error) {
    console.log('   ⚠️  Index may not have existed:', error.message);
  }
  
  const statsInstructor = await collection.countDocuments({ 
    $or: [{ instructor: { $exists: false } }, { instructor: null }] 
  });
  const statsHeadline = await collection.countDocuments({ 
    $or: [{ headline: { $exists: false } }, { headline: null }] 
  });
  
  console.log(`   ℹ️  Courses without instructor: ${statsInstructor}`);
  console.log(`   ℹ️  Courses without headline: ${statsHeadline}`);
  console.log('   ✅ No data transformation needed - fields now optional');
  
  return { acknowledged: true, modifiedCount: 0, matchedCount: 0 };
};
