const ChildEducation = require('../models/ChildEducation');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

const IMMUTABLE_FIELDS = new Set(['_id', 'id', 'createdAt']);

/**
 * Validate MongoDB ObjectId
 * 
 * @params {idString}: string - ID to validate
 * @returns Valid ObjectId or null
 */
const validateObjectId = (idString) => {
  try {
    return mongoose.Types.ObjectId.isValid(idString) ? idString : null;
  } catch (error) {
    logger.warn('Invalid ObjectId format', { idString, error: error.message });
    return null;
  }
};

/**
 * Format document for response
 * 
 * @params {document}: object - MongoDB document
 * @returns Formatted document with id field
 */
const formatDocument = (document) => {
  if (!document) return document;
  const formatted = document.toObject ? document.toObject() : { ...document };
  formatted.id = formatted._id.toString();
  return formatted;
};

/**
 * Create new education record
 * 
 * @params {data}: object - Education record data
 * @returns Created education record
 */
const createEducationRecord = async (data) => {
  try {
    if (!data.childId) {
      const error = new Error('childId is required');
      error.statusCode = 400;
      throw error;
    }

    const educationRecord = new ChildEducation(data);
    const saved = await educationRecord.save();
    logger.info('Created education record', { id: saved._id, childId: data.childId });
    return formatDocument(saved);
  } catch (error) {
    logger.error('Error creating education record', { error: error.message, data });
    throw error;
  }
};

/**
 * Get education record by ID
 * 
 * @params {recordId}: string - Record ID
 * @returns Education record or null
 */
const getEducationRecord = async (recordId) => {
  try {
    const objectId = validateObjectId(recordId);
    if (!objectId) return null;

    const record = await ChildEducation.findById(objectId).lean();
    return record ? formatDocument(record) : null;
  } catch (error) {
    logger.error('Error fetching education record', { recordId, error: error.message });
    throw error;
  }
};

/**
 * Get education record by child ID
 * 
 * @params {childId}: string - Child ID
 * @returns Education record or null
 */
const getByChildId = async (childId) => {
  try {
    const objectId = validateObjectId(childId);
    if (!objectId) return null;

    const record = await ChildEducation.findOne({ childId: objectId })
      .sort({ updatedAt: -1 })
      .lean();

    return record ? formatDocument(record) : null;
  } catch (error) {
    logger.error('Error fetching record by child ID', { childId, error: error.message });
    throw error;
  }
};

/**
 * Update education record
 * 
 * @params {recordId}: string - Record ID
 * @params {data}: object - Update data
 * @returns Updated education record
 */
const updateEducationRecord = async (recordId, data) => {
  try {
    const objectId = validateObjectId(recordId);
    if (!objectId) return null;

    if (!data || Object.keys(data).length === 0) {
      return await getEducationRecord(recordId);
    }

    const sanitizedData = {};
    for (const [key, value] of Object.entries(data)) {
      if (!IMMUTABLE_FIELDS.has(key)) {
        sanitizedData[key] = value;
      }
    }

    const updated = await ChildEducation.findByIdAndUpdate(
      objectId,
      { $set: sanitizedData },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      logger.warn('Education record not found for update', { recordId });
      return null;
    }

    logger.info('Education record updated', { recordId });
    return formatDocument(updated);
  } catch (error) {
    logger.error('Error updating education record', { recordId, error: error.message });
    throw error;
  }
};

/**
 * Delete education record
 * 
 * @params {recordId}: string - Record ID
 * @returns Boolean indicating success
 */
const deleteEducationRecord = async (recordId) => {
  try {
    const objectId = validateObjectId(recordId);
    if (!objectId) return false;

    const result = await ChildEducation.findByIdAndDelete(objectId);
    
    if (result) {
      logger.info('Education record deleted', { recordId });
      return true;
    }
    
    logger.warn('Education record not found for deletion', { recordId });
    return false;
  } catch (error) {
    logger.error('Error deleting education record', { recordId, error: error.message });
    throw error;
  }
};

/**
 * Add grade record to education document
 * 
 * @params {childId}: string - Child ID
 * @params {gradeRecord}: object - Grade record to add
 * @returns Updated education record
 */
const addGradeRecord = async (childId, gradeRecord) => {
  try {
    const objectId = validateObjectId(childId);
    if (!objectId) return null;

    const recordWithTimestamp = {
      ...gradeRecord,
      recordedAt: new Date()
    };

    const updated = await ChildEducation.findOneAndUpdate(
      { childId: objectId },
      { 
        $push: { records: recordWithTimestamp },
        $set: { updatedAt: new Date() }
      },
      { new: true, runValidators: true }
    ).lean();

    if (updated) {
      logger.info('Added grade record', { childId });
      return formatDocument(updated);
    }

    return null;
  } catch (error) {
    logger.error('Error adding grade record', { childId, error: error.message });
    throw error;
  }
};

/**
 * Update suggestions for child's education record
 * 
 * @params {childId}: string - Child ID
 * @params {suggestions}: array - Array of suggestions
 * @returns Updated education record
 */
const updateSuggestions = async (childId, suggestions) => {
  try {
    const objectId = validateObjectId(childId);
    if (!objectId) return null;

    const processedSuggestions = (suggestions || []).map(suggestion => ({
      ...suggestion,
      createdAt: suggestion.createdAt || new Date()
    }));

    const updated = await ChildEducation.findOneAndUpdate(
      { childId: objectId },
      {
        $set: {
          suggestions: processedSuggestions,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    ).lean();

    if (updated) {
      logger.info('Updated suggestions', { childId, count: processedSuggestions.length });
      return formatDocument(updated);
    }

    return null;
  } catch (error) {
    logger.error('Error updating suggestions', { childId, error: error.message });
    throw error;
  }
};

module.exports = {
  createEducationRecord,
  getEducationRecord,
  getByChildId,
  updateEducationRecord,
  deleteEducationRecord,
  addGradeRecord,
  updateSuggestions
};
