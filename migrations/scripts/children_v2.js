/*
 * Custom migration script for Children v2
 * 
 * Changes:
 * - Makes gender and grade optional
 * - Drops indexes: age, grade
 */

module.exports = async (db, collectionName) => {
  console.log(' 🔧 Running custom data migration for children v2...');
  const collection = db.collection(collectionName);
  
  console.log('   ⚙️  Dropping old indexes: age_index, grade_index');
  try {
    await collection.dropIndex('age_index').catch(() => console.log('     (Index may not exist)'));
    await collection.dropIndex('grade_index').catch(() => console.log('     (Index may not exist)'));
    console.log('   ✅ Old indexes dropped');
  } catch (error) {
    console.log('   ⚠️  Some indexes may not have existed:', error.message);
  }
  
  const statsGender = await collection.countDocuments({ 
    $or: [{ gender: { $exists: false } }, { gender: null }] 
  });
  const statsGrade = await collection.countDocuments({ 
    $or: [{ grade: { $exists: false } }, { grade: null }] 
  });
  
  console.log(`   ℹ️  Documents without gender: ${statsGender}`);
  console.log(`   ℹ️  Documents without grade: ${statsGrade}`);
  console.log('   ✅ No data transformation needed - fields now optional');
  
  return { acknowledged: true, modifiedCount: 0, matchedCount: 0 };
};
