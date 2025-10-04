const childRepository = require('../repositories/childRepository');
const User = require('../models/User');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * Create a new child
 * 
 * @params {childData}: object - Child creation data
 * @returns Created child object
 */
const createChild = async (childData) => {
  try {
    const { parentId } = childData;

    if (!parentId) {
      const error = new Error('Parent ID is required to create a child');
      error.statusCode = 400;
      error.code = 'PARENT_ID_REQUIRED';
      throw error;
    }

    const parent = await User.findById(parentId);
    if (!parent) {
      const error = new Error(`Parent with ID ${parentId} not found`);
      error.statusCode = 404;
      error.code = 'PARENT_NOT_FOUND';
      throw error;
    }

    logger.info('Creating child for parent', { parentId });
    const createdChild = await childRepository.createChild(childData);

    if (!createdChild) {
      const error = new Error('Failed to create child record');
      error.statusCode = 500;
      error.code = 'CHILD_CREATION_FAILED';
      throw error;
    }

    const childId = createdChild.id || createdChild._id;
    if (childId) {
      await linkChildToParent(parentId, childId);
      logger.info('Successfully created and linked child to parent', { childId, parentId });
    }

    return createdChild;
  } catch (error) {
    logger.error('Error creating child', { error: error.message, childData });
    throw error;
  }
};

/**
 * Get child by ID
 * 
 * @params {childId}: string - Child ID
 * @returns Child object or null
 */
const getChild = async (childId) => {
  try {
    if (!childId) return null;
    return await childRepository.getChild(childId);
  } catch (error) {
    logger.error('Error retrieving child', { childId, error: error.message });
    throw error;
  }
};

/**
 * Get child with validation (throws if not found)
 * 
 * @params {childId}: string - Child ID
 * @returns Child object
 */
const getChildWithValidation = async (childId) => {
  const child = await getChild(childId);
  if (!child) {
    const error = new Error(`Child with ID ${childId} not found`);
    error.statusCode = 404;
    error.code = 'CHILD_NOT_FOUND';
    throw error;
  }
  return child;
};

/**
 * Get children by parent ID
 * 
 * @params {parentId}: string - Parent ID
 * @params {limit}: number - Max results
 * @params {skip}: number - Skip count
 * @returns Array of children
 */
const getChildrenByParent = async (parentId, limit = 100, skip = 0) => {
  try {
    if (!parentId) return [];

    const parent = await User.findById(parentId);
    if (!parent) {
      const error = new Error(`Parent with ID ${parentId} not found`);
      error.statusCode = 404;
      error.code = 'PARENT_NOT_FOUND';
      throw error;
    }

    return await childRepository.getChildrenByParent(parentId, limit, skip);
  } catch (error) {
    logger.error('Error retrieving children for parent', { parentId, error: error.message });
    throw error;
  }
};

/**
 * Update child information
 * 
 * @params {childId}: string - Child ID
 * @params {updateData}: object - Update data
 * @returns Updated child object
 */
const updateChild = async (childId, updateData) => {
  try {
    if (!childId) {
      const error = new Error('Child ID is required for update');
      error.statusCode = 400;
      error.code = 'CHILD_ID_REQUIRED';
      throw error;
    }

    await getChildWithValidation(childId);
    validateUpdateData(updateData);

    logger.info('Updating child', { childId });
    const updatedChild = await childRepository.updateChild(childId, updateData);

    if (!updatedChild) {
      const error = new Error('Failed to update child record');
      error.statusCode = 500;
      error.code = 'CHILD_UPDATE_FAILED';
      throw error;
    }

    logger.info('Successfully updated child', { childId });
    return updatedChild;
  } catch (error) {
    logger.error('Error updating child', { childId, error: error.message });
    throw error;
  }
};

/**
 * Delete a child
 * 
 * @params {childId}: string - Child ID
 * @params {parentId}: string - Optional parent ID
 * @returns Boolean indicating success
 */
const deleteChild = async (childId, parentId = null) => {
  try {
    if (!childId) return false;

    const child = await getChildWithValidation(childId);
    
    if (!parentId) {
      parentId = child.parentId;
    }

    logger.info('Deleting child', { childId });
    const deleted = await childRepository.deleteChild(childId);

    if (!deleted) {
      logger.warn('Failed to delete child', { childId });
      return false;
    }

    if (parentId) {
      try {
        await unlinkChildFromParent(parentId, childId);
        logger.info('Successfully unlinked child from parent', { childId, parentId });
      } catch (error) {
        logger.warn('Failed to unlink child from parent', { error: error.message });
      }
    }

    logger.info('Successfully deleted child', { childId });
    return true;
  } catch (error) {
    logger.error('Error deleting child', { childId, error: error.message });
    throw error;
  }
};

/**
 * Count children for a parent
 * 
 * @params {parentId}: string - Parent ID
 * @returns Count of children
 */
const countChildrenByParent = async (parentId) => {
  try {
    if (!parentId) return 0;

    const parent = await User.findById(parentId);
    if (!parent) {
      const error = new Error(`Parent with ID ${parentId} not found`);
      error.statusCode = 404;
      error.code = 'PARENT_NOT_FOUND';
      throw error;
    }

    return await childRepository.countChildrenByParent(parentId);
  } catch (error) {
    logger.error('Error counting children for parent', { parentId, error: error.message });
    throw error;
  }
};

/**
 * Add courses to a child
 * 
 * @params {childId}: string - Child ID
 * @params {courseIds}: array - Array of course IDs
 * @returns Updated child object
 */
const addCoursesToChild = async (childId, courseIds) => {
  try {
    if (!childId || !courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      const error = new Error('Child ID and course IDs are required');
      error.statusCode = 400;
      error.code = 'INVALID_INPUT';
      throw error;
    }

    await getChildWithValidation(childId);
    return await childRepository.addCoursesToChild(childId, courseIds);
  } catch (error) {
    logger.error('Error adding courses to child', { childId, error: error.message });
    throw error;
  }
};

/**
 * Get child summary
 * 
 * @params {childId}: string - Child ID
 * @returns Child summary object
 */
const getChildSummary = async (childId) => {
  const child = await getChildWithValidation(childId);
  
  return {
    id: child.id,
    name: child.name,
    age: child.age,
    gender: child.gender,
    grade: child.grade,
    parentId: child.parentId,
    courseCount: child.courseIds ? child.courseIds.length : 0,
    createdAt: child.createdAt,
    updatedAt: child.updatedAt
  };
};

/**
 * Link child to parent (internal helper)
 * 
 * @params {parentId}: string - Parent ID
 * @params {childId}: string - Child ID
 * @returns void
 */
const linkChildToParent = async (parentId, childId) => {
  try {
    await User.findByIdAndUpdate(
      parentId,
      { $addToSet: { childrenIds: childId } }
    );
  } catch (error) {
    logger.error('Failed to link child to parent', { parentId, childId, error: error.message });
    throw error;
  }
};

/**
 * Unlink child from parent (internal helper)
 * 
 * @params {parentId}: string - Parent ID
 * @params {childId}: string - Child ID
 * @returns void
 */
const unlinkChildFromParent = async (parentId, childId) => {
  try {
    await User.findByIdAndUpdate(
      parentId,
      { $pull: { childrenIds: childId } }
    );
  } catch (error) {
    logger.error('Failed to unlink child from parent', { parentId, childId, error: error.message });
    throw error;
  }
};

/**
 * Validate update data (internal helper)
 * 
 * @params {updateData}: object - Data to validate
 * @returns void (throws on validation error)
 */
const validateUpdateData = (updateData) => {
  if (!updateData || Object.keys(updateData).length === 0) {
    const error = new Error('Update data cannot be empty');
    error.statusCode = 400;
    error.code = 'EMPTY_UPDATE_DATA';
    throw error;
  }

  if ('age' in updateData) {
    const age = updateData.age;
    if (typeof age !== 'number' || age < 0 || age > 18) {
      const error = new Error('Age must be between 0 and 18 years');
      error.statusCode = 400;
      error.code = 'INVALID_AGE';
      throw error;
    }
  }

  if ('name' in updateData) {
    const name = updateData.name;
    if (!name || !name.trim()) {
      const error = new Error('Name cannot be empty');
      error.statusCode = 400;
      error.code = 'INVALID_NAME';
      throw error;
    }
    if (name.trim().length > 100) {
      const error = new Error('Name cannot exceed 100 characters');
      error.statusCode = 400;
      error.code = 'NAME_TOO_LONG';
      throw error;
    }
  }

  if ('grade' in updateData) {
    const grade = updateData.grade;
    if (!grade || !grade.trim()) {
      const error = new Error('Grade cannot be empty');
      error.statusCode = 400;
      error.code = 'INVALID_GRADE';
      throw error;
    }
  }

  if ('gender' in updateData) {
    const gender = updateData.gender;
    if (!gender || !gender.trim()) {
      const error = new Error('Gender cannot be empty');
      error.statusCode = 400;
      error.code = 'INVALID_GENDER';
      throw error;
    }
  }

  if ('parentId' in updateData) {
    const error = new Error('Parent ID cannot be changed after child creation');
    error.statusCode = 400;
    error.code = 'PARENT_ID_IMMUTABLE';
    throw error;
  }
};

module.exports = {
  createChild,
  getChild,
  getChildWithValidation,
  getChildrenByParent,
  updateChild,
  deleteChild,
  countChildrenByParent,
  addCoursesToChild,
  getChildSummary
};
