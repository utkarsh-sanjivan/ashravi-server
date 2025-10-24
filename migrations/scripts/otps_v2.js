/*
 * Custom migration script for OTPs v2
 *
 * Changes:
 * - Consolidates email/phone fields into contact/contactType
 * - Maps legacy purpose values to new enum (signup | login)
 * - Ensures attempts and verified defaults are set
 * - Removes obsolete fields (type, email, phoneNumber)
 */

const PURPOSE_MAP = {
  registration: 'signup',
  verification: 'signup',
  'password-reset': 'login'
};

const normalizeEmail = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }
  return value.trim().toLowerCase();
};

const normalizePhone = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }
  return value.trim();
};

const detectContactType = (doc) => {
  if (doc.contactType && ['email', 'phone'].includes(doc.contactType)) {
    return doc.contactType;
  }

  if (doc.type && ['email', 'phone'].includes(doc.type)) {
    return doc.type;
  }

  const contactValue = doc.contact || doc.email || doc.phoneNumber;

  if (typeof contactValue === 'string' && contactValue.includes('@')) {
    return 'email';
  }

  if (doc.phoneNumber || (typeof contactValue === 'string' && contactValue.replace(/\D/g, '').length >= 6)) {
    return 'phone';
  }

  return null;
};

const determineContact = (doc, contactType) => {
  if (contactType === 'email') {
    return normalizeEmail(doc.contact || doc.email);
  }

  if (contactType === 'phone') {
    return normalizePhone(doc.contact || doc.phoneNumber);
  }

  return null;
};

module.exports = async (db, collectionName) => {
  console.log(' 🔧 Running custom data migration for otps v2...');
  const collection = db.collection(collectionName);

  // Drop obsolete indexes to avoid conflicts before new ones are created
  const obsoleteIndexes = ['email_type_purpose', 'phone_type_purpose', 'ttl_index'];
  for (const indexName of obsoleteIndexes) {
    try {
      await collection.dropIndex(indexName);
      console.log(`   🗑️  Dropped obsolete index: ${indexName}`);
    } catch (error) {
      if (error.codeName !== 'IndexNotFound') {
        console.log(`   ℹ️  Unable to drop index ${indexName} (may not exist): ${error.message}`);
      } else {
        console.log(`   ℹ️  Index ${indexName} not found`);
      }
    }
  }

  const query = {
    $or: [
      { contact: { $exists: false } },
      { contactType: { $exists: false } },
      { purpose: { $in: ['registration', 'password-reset', 'verification'] } },
      { attempts: { $exists: false } },
      { type: { $exists: true } },
      { email: { $exists: true } },
      { phoneNumber: { $exists: true } }
    ]
  };

  const cursor = collection.find(query);

  const bulkOps = [];
  const batchSize = 500;
  let examined = 0;
  let updated = 0;
  let skipped = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    examined++;

    const contactType = detectContactType(doc);
    const contactValue = determineContact(doc, contactType);

    if (!contactType || !contactValue) {
      console.log(`   ⚠️  Skipping OTP ${doc._id} - unable to determine contact/contactType`);
      skipped++;
      continue;
    }

    let purpose = doc.purpose;
    if (!purpose) {
      purpose = 'login';
    } else {
      purpose = PURPOSE_MAP[purpose] || purpose;
    }
    if (!['signup', 'login'].includes(purpose)) {
      purpose = 'login';
    }

    const update = { $set: {}, $unset: {} };

    if (doc.contact !== contactValue) {
      update.$set.contact = contactValue;
    }

    if (doc.contactType !== contactType) {
      update.$set.contactType = contactType;
    }

    if (doc.purpose !== purpose) {
      update.$set.purpose = purpose;
    }

    if (doc.attempts == null || Number.isNaN(doc.attempts)) {
      update.$set.attempts = 0;
    }

    if (doc.verified == null) {
      update.$set.verified = false;
    }

    if (Object.prototype.hasOwnProperty.call(doc, 'type')) {
      update.$unset.type = '';
    }

    if (Object.prototype.hasOwnProperty.call(doc, 'email')) {
      update.$unset.email = '';
    }

    if (Object.prototype.hasOwnProperty.call(doc, 'phoneNumber')) {
      update.$unset.phoneNumber = '';
    }

    if (Object.keys(update.$set).length === 0) {
      delete update.$set;
    }

    if (Object.keys(update.$unset).length === 0) {
      delete update.$unset;
    }

    if (!update.$set && !update.$unset) {
      continue;
    }

    bulkOps.push({
      updateOne: {
        filter: { _id: doc._id },
        update
      }
    });
    updated++;

    if (bulkOps.length >= batchSize) {
      await collection.bulkWrite(bulkOps, { ordered: false });
      bulkOps.length = 0;
    }
  }

  if (bulkOps.length > 0) {
    await collection.bulkWrite(bulkOps, { ordered: false });
  }

  console.log(`   ℹ️  OTP documents examined: ${examined}`);
  console.log(`   ✅ OTP documents updated: ${updated}`);
  console.log(`   ⚠️  OTP documents skipped: ${skipped}`);

  return { acknowledged: true, modifiedCount: updated, matchedCount: examined };
};
