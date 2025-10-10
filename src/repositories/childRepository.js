const Child = require('../models/Child');
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
 * Create a new child record
 * 
 * @params {childData}: object - Child data
 * @returns Created child document
 */
const createChild = async (childData) => {
  try {
    const child = new Child(childData);
    const saved = await child.save();
    logger.info('Child created successfully', { childId: saved._id });
    return formatDocument(saved);
  } catch (error) {
    logger.error('Error creating child', { error: error.message, childData });
    throw error;
  }
};

/**
 * Get child by ID
 * 
 * @params {childId}: string - Child ID
 * @returns Child document or null
 */
const getChild = async (childId) => {
  try {
    const objectId = validateObjectId(childId);
    if (!objectId) return null;

    const child = await Child.findById(objectId).lean();
    return child ? formatDocument(child) : null;
  } catch (error) {
    logger.error('Error fetching child', { childId, error: error.message });
    throw error;
  }
};

/**
 * Get children by parent ID with pagination
 * 
 * @params {parentId}: string - Parent ID
 * @params {limit}: number - Max results
 * @params {skip}: number - Skip count
 * @returns Array of children
 */
const getChildrenByParent = async (parentId, limit = 100, skip = 0) => {
  try {
    const objectId = validateObjectId(parentId);
    if (!objectId) return [];

    const children = await Child.find({ parentId: objectId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return children.map(formatDocument);
  } catch (error) {
    logger.error('Error fetching children by parent', { parentId, error: error.message });
    throw error;
  }
};

/**
 * Update child by ID
 * 
 * @params {childId}: string - Child ID
 * @params {updateData}: object - Update data
 * @returns Updated child document
 */
const updateChild = async (childId, updateData) => {
  try {
    const objectId = validateObjectId(childId);
    if (!objectId) return null;

    if (!updateData || Object.keys(updateData).length === 0) {
      return await getChild(childId);
    }

    const sanitizedData = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (!IMMUTABLE_FIELDS.has(key)) {
        sanitizedData[key] = value;
      }
    }

    if (Object.keys(sanitizedData).length === 0) {
      return await getChild(childId);
    }

    const updated = await Child.findByIdAndUpdate(
      objectId,
      { $set: sanitizedData },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      logger.warn('Child not found for update', { childId });
      return null;
    }

    logger.info('Child updated successfully', { childId });
    return formatDocument(updated);
  } catch (error) {
    logger.error('Error updating child', { childId, error: error.message });
    throw error;
  }
};

/**
 * Delete child by ID
 * 
 * @params {childId}: string - Child ID
 * @returns Boolean indicating success
 */
const deleteChild = async (childId) => {
  try {
    const objectId = validateObjectId(childId);
    if (!objectId) return false;

    const result = await Child.findByIdAndDelete(objectId);
    
    if (result) {
      logger.info('Child deleted successfully', { childId });
      return true;
    }
    
    logger.warn('Child not found for deletion', { childId });
    return false;
  } catch (error) {
    logger.error('Error deleting child', { childId, error: error.message });
    throw error;
  }
};

/**
 * Count children by parent ID
 * 
 * @params {parentId}: string - Parent ID
 * @returns Count of children
 */
const countChildrenByParent = async (parentId) => {
  try {
    const objectId = validateObjectId(parentId);
    if (!objectId) return 0;

    return await Child.countDocuments({ parentId: objectId });
  } catch (error) {
    logger.error('Error counting children', { parentId, error: error.message });
    throw error;
  }
};

/**
 * Add course IDs to child
 * 
 * @params {childId}: string - Child ID
 * @params {courseIds}: array - Array of course IDs
 * @returns Updated child document
 */
const addCoursesToChild = async (childId, courseIds) => {
  try {
    const objectId = validateObjectId(childId);
    if (!objectId) return null;

    const updated = await Child.findByIdAndUpdate(
      objectId,
      { $addToSet: { courseIds: { $each: courseIds } } },
      { new: true, runValidators: true }
    ).lean();

    if (updated) {
      logger.info('Courses added to child', { childId, courseIds });
      return formatDocument(updated);
    }

    return null;
  } catch (error) {
    logger.error('Error adding courses to child', { childId, error: error.message });
    throw error;
  }
};

module.exports = {
  createChild,
  getChild,
  getChildrenByParent,
  updateChild,
  deleteChild,
  countChildrenByParent,
  addCoursesToChild
};
