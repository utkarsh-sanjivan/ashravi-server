const Parent = require('../models/Parent');
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
 * Create a new parent record
 * 
 * @params {parentData}: object - Parent data
 * @returns Created parent document
 */
const createParent = async (parentData) => {
  try {
    const existing = await Parent.findOne({ 
      emailAddress: parentData.emailAddress.toLowerCase().trim() 
    });
    
    if (existing) {
      const error = new Error('Parent with this email address already exists');
      error.code = 'DUPLICATE_EMAIL';
      throw error;
    }

    const parent = new Parent(parentData);
    const saved = await parent.save();
    logger.info('Parent created successfully', { parentId: saved._id });
    return formatDocument(saved);
  } catch (error) {
    if (error.code === 11000) {
      logger.error('Duplicate email address', { email: parentData.emailAddress });
      const dupError = new Error('Parent with this email address already exists');
      dupError.code = 'DUPLICATE_EMAIL';
      throw dupError;
    }
    logger.error('Error creating parent', { error: error.message, parentData });
    throw error;
  }
};

/**
 * Get parent by ID
 * 
 * @params {parentId}: string - Parent ID
 * @returns Parent document or null
 */
const getParent = async (parentId) => {
  try {
    const objectId = validateObjectId(parentId);
    if (!objectId) return null;

    const parent = await Parent.findById(objectId).lean();
    return parent ? formatDocument(parent) : null;
  } catch (error) {
    logger.error('Error fetching parent', { parentId, error: error.message });
    throw error;
  }
};

/**
 * Get parent by email address
 * 
 * @params {email}: string - Email address
 * @returns Parent document or null
 */
const getParentByEmail = async (email) => {
  try {
    if (!email) return null;

    const parent = await Parent.findOne({ 
      emailAddress: email.toLowerCase().trim() 
    }).lean();
    
    return parent ? formatDocument(parent) : null;
  } catch (error) {
    logger.error('Error fetching parent by email', { email, error: error.message });
    throw error;
  }
};

/**
 * Get parents by city with pagination
 * 
 * @params {city}: string - City name
 * @params {limit}: number - Max results
 * @params {skip}: number - Skip count
 * @returns Array of parents
 */
const getParentsByCity = async (city, limit = 100, skip = 0) => {
  try {
    if (!city) return [];

    const parents = await Parent.find({ 
      city: new RegExp(`^${city}$`, 'i') 
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return parents.map(formatDocument);
  } catch (error) {
    logger.error('Error fetching parents by city', { city, error: error.message });
    throw error;
  }
};

/**
 * Update parent by ID
 * 
 * @params {parentId}: string - Parent ID
 * @params {updateData}: object - Update data
 * @returns Updated parent document
 */
const updateParent = async (parentId, updateData) => {
  try {
    const objectId = validateObjectId(parentId);
    if (!objectId) return null;

    if (!updateData || Object.keys(updateData).length === 0) {
      return await getParent(parentId);
    }

    const sanitizedData = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (!IMMUTABLE_FIELDS.has(key) && key !== 'childrenIds') {
        sanitizedData[key] = value;
      }
    }

    if (Object.keys(sanitizedData).length === 0) {
      return await getParent(parentId);
    }

    if (sanitizedData.emailAddress) {
      const existing = await Parent.findOne({
        emailAddress: sanitizedData.emailAddress.toLowerCase().trim(),
        _id: { $ne: objectId }
      });
      
      if (existing) {
        const error = new Error('Parent with this email address already exists');
        error.code = 'DUPLICATE_EMAIL';
        throw error;
      }
    }

    const updated = await Parent.findByIdAndUpdate(
      objectId,
      { $set: sanitizedData },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      logger.warn('Parent not found for update', { parentId });
      return null;
    }

    logger.info('Parent updated successfully', { parentId });
    return formatDocument(updated);
  } catch (error) {
    logger.error('Error updating parent', { parentId, error: error.message });
    throw error;
  }
};

/**
 * Delete parent by ID
 * 
 * @params {parentId}: string - Parent ID
 * @returns Boolean indicating success
 */
const deleteParent = async (parentId) => {
  try {
    const objectId = validateObjectId(parentId);
    if (!objectId) return false;

    const result = await Parent.findByIdAndDelete(objectId);
    
    if (result) {
      logger.info('Parent deleted successfully', { parentId });
      return true;
    }
    
    logger.warn('Parent not found for deletion', { parentId });
    return false;
  } catch (error) {
    logger.error('Error deleting parent', { parentId, error: error.message });
    throw error;
  }
};

/**
 * Count total parents
 * 
 * @returns Count of parents
 */
const countParents = async () => {
  try {
    return await Parent.countDocuments({});
  } catch (error) {
    logger.error('Error counting parents', { error: error.message });
    throw error;
  }
};

/**
 * Add child ID to parent
 * 
 * @params {parentId}: string - Parent ID
 * @params {childId}: string - Child ID
 * @returns Updated parent document
 */
const addChildToParent = async (parentId, childId) => {
  try {
    const objectId = validateObjectId(parentId);
    if (!objectId) return null;

    const updated = await Parent.findByIdAndUpdate(
      objectId,
      { $addToSet: { childrenIds: childId } },
      { new: true, runValidators: true }
    ).lean();

    if (updated) {
      logger.info('Child added to parent', { parentId, childId });
      return formatDocument(updated);
    }

    return null;
  } catch (error) {
    logger.error('Error adding child to parent', { parentId, childId, error: error.message });
    throw error;
  }
};

/**
 * Remove child ID from parent
 * 
 * @params {parentId}: string - Parent ID
 * @params {childId}: string - Child ID
 * @returns Updated parent document
 */
const removeChildFromParent = async (parentId, childId) => {
  try {
    const objectId = validateObjectId(parentId);
    if (!objectId) return null;

    const updated = await Parent.findByIdAndUpdate(
      objectId,
      { $pull: { childrenIds: childId } },
      { new: true, runValidators: true }
    ).lean();

    if (updated) {
      logger.info('Child removed from parent', { parentId, childId });
      return formatDocument(updated);
    }

    return null;
  } catch (error) {
    logger.error('Error removing child from parent', { parentId, childId, error: error.message });
    throw error;
  }
};

/**
 * Get all children for a parent
 * 
 * @params {parentId}: string - Parent ID
 * @returns Array of children
 */
const getChildrenForParent = async (parentId) => {
  try {
    const parent = await getParent(parentId);
    if (!parent || !parent.childrenIds || parent.childrenIds.length === 0) {
      return [];
    }

    const children = await Child.find({ 
      _id: { $in: parent.childrenIds } 
    }).lean();

    return children.map(formatDocument);
  } catch (error) {
    logger.error('Error fetching children for parent', { parentId, error: error.message });
    throw error;
  }
};

/**
 * Get all children across all parents
 * 
 * @returns Array of all children
 */
const getAllChildren = async () => {
  try {
    const parents = await Parent.find({}, { childrenIds: 1 }).lean();
    
    const childIdSet = new Set();
    parents.forEach(parent => {
      if (parent.childrenIds) {
        parent.childrenIds.forEach(id => childIdSet.add(id.toString()));
      }
    });

    if (childIdSet.size === 0) {
      return [];
    }

    const childIds = Array.from(childIdSet);
    const children = await Child.find({ _id: { $in: childIds } }).lean();

    return children.map(formatDocument);
  } catch (error) {
    logger.error('Error fetching all children', { error: error.message });
    throw error;
  }
};

module.exports = {
  createParent,
  getParent,
  getParentByEmail,
  getParentsByCity,
  updateParent,
  deleteParent,
  countParents,
  addChildToParent,
  removeChildFromParent,
  getChildrenForParent,
  getAllChildren
};
