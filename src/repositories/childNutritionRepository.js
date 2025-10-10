const ChildNutrition = require('../models/ChildNutrition');
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
 * Create new nutrition record
 * 
 * @params {data}: object - Nutrition record data
 * @returns Created nutrition record
 */
const createNutritionRecord = async (data) => {
  try {
    if (!data.childId) {
      const error = new Error('childId is required');
      error.statusCode = 400;
      throw error;
    }

    const nutritionRecord = new ChildNutrition(data);
    const saved = await nutritionRecord.save();
    logger.info('Created nutrition record', { id: saved._id, childId: data.childId });
    return formatDocument(saved);
  } catch (error) {
    if (error.code === 11000) {
      logger.warn('Duplicate nutrition record for child', { childId: data.childId });
      const duplicateError = new Error('Nutrition record already exists for this child');
      duplicateError.statusCode = 409;
      duplicateError.code = 'DUPLICATE_RECORD';
      throw duplicateError;
    }
    logger.error('Error creating nutrition record', { error: error.message, data });
    throw error;
  }
};

/**
 * Get nutrition record by ID
 * 
 * @params {recordId}: string - Record ID
 * @returns Nutrition record or null
 */
const getNutritionRecord = async (recordId) => {
  try {
    const objectId = validateObjectId(recordId);
    if (!objectId) return null;

    const record = await ChildNutrition.findById(objectId).lean();
    return record ? formatDocument(record) : null;
  } catch (error) {
    logger.error('Error fetching nutrition record', { recordId, error: error.message });
    throw error;
  }
};

/**
 * Get nutrition record by child ID
 * 
 * @params {childId}: string - Child ID
 * @returns Nutrition record or null
 */
const getByChildId = async (childId) => {
  try {
    const objectId = validateObjectId(childId);
    if (!objectId) return null;

    const record = await ChildNutrition.findOne({ childId: objectId })
      .sort({ updatedAt: -1 })
      .lean();

    return record ? formatDocument(record) : null;
  } catch (error) {
    logger.error('Error fetching record by child ID', { childId, error: error.message });
    throw error;
  }
};

/**
 * Update nutrition record
 * 
 * @params {recordId}: string - Record ID
 * @params {data}: object - Update data
 * @returns Updated nutrition record
 */
const updateNutritionRecord = async (recordId, data) => {
  try {
    const objectId = validateObjectId(recordId);
    if (!objectId) return null;

    if (!data || Object.keys(data).length === 0) {
      return await getNutritionRecord(recordId);
    }

    const sanitizedData = {};
    for (const [key, value] of Object.entries(data)) {
      if (!IMMUTABLE_FIELDS.has(key)) {
        sanitizedData[key] = value;
      }
    }

    const updated = await ChildNutrition.findByIdAndUpdate(
      objectId,
      { $set: sanitizedData },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      logger.warn('Nutrition record not found for update', { recordId });
      return null;
    }

    logger.info('Nutrition record updated', { recordId });
    return formatDocument(updated);
  } catch (error) {
    logger.error('Error updating nutrition record', { recordId, error: error.message });
    throw error;
  }
};

/**
 * Delete nutrition record
 * 
 * @params {recordId}: string - Record ID
 * @returns Boolean indicating success
 */
const deleteNutritionRecord = async (recordId) => {
  try {
    const objectId = validateObjectId(recordId);
    if (!objectId) return false;

    const result = await ChildNutrition.findByIdAndDelete(objectId);
    
    if (result) {
      logger.info('Nutrition record deleted', { recordId });
      return true;
    }
    
    logger.warn('Nutrition record not found for deletion', { recordId });
    return false;
  } catch (error) {
    logger.error('Error deleting nutrition record', { recordId, error: error.message });
    throw error;
  }
};

/**
 * Add nutrition entry to existing record
 * 
 * @params {childId}: string - Child ID
 * @params {nutritionEntry}: object - Nutrition entry to add
 * @returns Updated nutrition record
 */
const addNutritionEntry = async (childId, nutritionEntry) => {
  try {
    const objectId = validateObjectId(childId);
    if (!objectId) return null;

    const entryWithTimestamp = {
      ...nutritionEntry,
      recordedAt: new Date()
    };

    const updated = await ChildNutrition.findOneAndUpdate(
      { childId: objectId },
      { 
        $push: { records: entryWithTimestamp },
        $set: { updatedAt: new Date() }
      },
      { new: true, runValidators: true }
    ).lean();

    if (updated) {
      logger.info('Added nutrition entry', { childId });
      return formatDocument(updated);
    }

    return null;
  } catch (error) {
    logger.error('Error adding nutrition entry', { childId, error: error.message });
    throw error;
  }
};

/**
 * Update recommendations for child's nutrition record
 * 
 * @params {childId}: string - Child ID
 * @params {recommendations}: array - Array of recommendations
 * @returns Updated nutrition record
 */
const updateRecommendations = async (childId, recommendations) => {
  try {
    const objectId = validateObjectId(childId);
    if (!objectId) return null;

    const processedRecommendations = (recommendations || []).map(rec => ({
      ...rec,
      createdAt: rec.createdAt || new Date()
    }));

    const updated = await ChildNutrition.findOneAndUpdate(
      { childId: objectId },
      {
        $set: {
          recommendations: processedRecommendations,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    ).lean();

    if (updated) {
      logger.info('Updated recommendations', { childId, count: processedRecommendations.length });
      return formatDocument(updated);
    }

    return null;
  } catch (error) {
    logger.error('Error updating recommendations', { childId, error: error.message });
    throw error;
  }
};

module.exports = {
  createNutritionRecord,
  getNutritionRecord,
  getByChildId,
  updateNutritionRecord,
  deleteNutritionRecord,
  addNutritionEntry,
  updateRecommendations
};
