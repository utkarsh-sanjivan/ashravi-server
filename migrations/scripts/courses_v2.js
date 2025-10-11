// Adds empty pdfs array to existing sections that don't have it

module.exports = async (db, collectionName) => {
  console.log('  🔧 Adding pdfs field to existing course sections...');
  
  const collection = db.collection(collectionName);
  
  const result = await collection.updateMany(
    { 'sections.pdfs': { $exists: false } },
    { $set: { 'sections.$[].pdfs': [] } }
  );
  
  console.log(`  ✅ Updated ${result.modifiedCount} course document(s)`);
  
  return result;
};
