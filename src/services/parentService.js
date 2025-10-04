const parentRepository = require('../repositories/parentRepository');
const childRepository = require('../repositories/childRepository');
const logger = require('../utils/logger');

/**
 * Create a new parent
 * 
 * @params {parentData}: object - Parent creation data
 * @returns Created parent object
 */
const createParent = async (parentData) => {
  try {
    logger.info('Creating parent', { email: parentData.emailAddress });
    
    const createdParent = await parentRepository.createParent(parentData);

    if (!createdParent) {
      const error = new Error('Failed to create parent record');
      error.statusCode = 500;
      error.code = 'PARENT_CREATION_FAILED';
      throw error;
    }

    logger.info('Successfully created parent', { parentId: createdParent.id });
    return createdParent;
  } catch (error) {
    if (error.code === 'DUPLICATE_EMAIL') {
      error.statusCode = 409;
    }
    logger.error('Error creating parent', { error: error.message, parentData });
    throw error;
  }
};

/**
 * Get parent by ID
 * 
 * @params {parentId}: string - Parent ID
 * @returns Parent object or null
 */
const getParent = async (parentId) => {
  try {
    if (!parentId) return null;
    return await parentRepository.getParent(parentId);
  } catch (error) {
    logger.error('Error retrieving parent', { parentId, error: error.message });
    throw error;
  }
};

/**
 * Get parent with validation (throws if not found)
 * 
 * @params {parentId}: string - Parent ID
 * @returns Parent object
 */
const getParentWithValidation = async (parentId) => {
  const parent = await getParent(parentId);
  if (!parent) {
    const error = new Error(`Parent with ID ${parentId} not found`);
    error.statusCode = 404;
    error.code = 'PARENT_NOT_FOUND';
    throw error;
  }
  return parent;
};

/**
 * Get parent by email address
 * 
 * @params {email}: string - Email address
 * @returns Parent object or null
 */
const getParentByEmail = async (email) => {
  try {
    if (!email) return null;
    return await parentRepository.getParentByEmail(email);
  } catch (error) {
    logger.error('Error retrieving parent by email', { email, error: error.message });
    throw error;
  }
};

/**
 * Get parents by city
 * 
 * @params {city}: string - City name
 * @params {limit}: number - Max results
 * @params {skip}: number - Skip count
 * @returns Array of parents
 */
const getParentsByCity = async (city, limit = 100, skip = 0) => {
  try {
    if (!city) return [];
    return await parentRepository.getParentsByCity(city, limit, skip);
  } catch (error) {
    logger.error('Error retrieving parents by city', { city, error: error.message });
    throw error;
  }
};

/**
 * Update parent information
 * 
 * @params {parentId}: string - Parent ID
 * @params {updateData}: object - Update data
 * @returns Updated parent object
 */
const updateParent = async (parentId, updateData) => {
  try {
    if (!parentId) {
      const error = new Error('Parent ID is required for update');
      error.statusCode = 400;
      error.code = 'PARENT_ID_REQUIRED';
      throw error;
    }

    await getParentWithValidation(parentId);

    logger.info('Updating parent', { parentId });
    const updatedParent = await parentRepository.updateParent(parentId, updateData);

    if (!updatedParent) {
      const error = new Error('Failed to update parent record');
      error.statusCode = 500;
      error.code = 'PARENT_UPDATE_FAILED';
      throw error;
    }

    logger.info('Successfully updated parent', { parentId });
    return updatedParent;
  } catch (error) {
    if (error.code === 'DUPLICATE_EMAIL') {
      error.statusCode = 409;
    }
    logger.error('Error updating parent', { parentId, error: error.message });
    throw error;
  }
};

/**
 * Delete a parent
 * 
 * @params {parentId}: string - Parent ID
 * @params {cascadeDelete}: boolean - Whether to delete children
 * @returns Boolean indicating success
 */
const deleteParent = async (parentId, cascadeDelete = false) => {
  try {
    if (!parentId) return false;

    const parent = await getParentWithValidation(parentId);
    
    const children = parent.childrenIds || [];
    
    if (children.length > 0 && !cascadeDelete) {
      const error = new Error(
        `Parent has ${children.length} children. Enable cascade delete to remove all.`
      );
      error.statusCode = 400;
      error.code = 'PARENT_HAS_CHILDREN';
      throw error;
    }

    if (children.length > 0 && cascadeDelete) {
      logger.info('Cascade deleting children', { parentId, childCount: children.length });
      
      for (const childId of children) {
        try {
          await childRepository.deleteChild(childId.toString());
        } catch (error) {
          logger.warn('Failed to delete child during cascade', { 
            childId, 
            error: error.message 
          });
        }
      }
    }

    logger.info('Deleting parent', { parentId });
    const deleted = await parentRepository.deleteParent(parentId);

    if (!deleted) {
      logger.warn('Failed to delete parent', { parentId });
      return false;
    }

    logger.info('Successfully deleted parent', { parentId });
    return true;
  } catch (error) {
    logger.error('Error deleting parent', { parentId, error: error.message });
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
    return await parentRepository.getAllChildren();
  } catch (error) {
    logger.error('Error retrieving all children', { error: error.message });
    throw error;
  }
};

/**
 * Get children for a specific parent
 * 
 * @params {parentId}: string - Parent ID
 * @returns Array of children
 */
const getChildrenForParent = async (parentId) => {
  try {
    if (!parentId) return [];
    
    await getParentWithValidation(parentId);
    return await parentRepository.getChildrenForParent(parentId);
  } catch (error) {
    logger.error('Error retrieving children for parent', { parentId, error: error.message });
    throw error;
  }
};

/**
 * Add child to parent
 * 
 * @params {parentId}: string - Parent ID
 * @params {childId}: string - Child ID
 * @returns Updated parent object
 */
const addChildToParent = async (parentId, childId) => {
  try {
    await getParentWithValidation(parentId);
    
    const child = await childRepository.getChild(childId);
    if (!child) {
      const error = new Error(`Child with ID ${childId} not found`);
      error.statusCode = 404;
      error.code = 'CHILD_NOT_FOUND';
      throw error;
    }

    const parent = await getParent(parentId);
    const childIds = (parent.childrenIds || []).map(id => id.toString());
    
    if (childIds.includes(childId)) {
      return parent;
    }

    return await parentRepository.addChildToParent(parentId, childId);
  } catch (error) {
    logger.error('Error adding child to parent', { parentId, childId, error: error.message });
    throw error;
  }
};

/**
 * Remove child from parent
 * 
 * @params {parentId}: string - Parent ID
 * @params {childId}: string - Child ID
 * @returns Updated parent object
 */
const removeChildFromParent = async (parentId, childId) => {
  try {
    await getParentWithValidation(parentId);
    return await parentRepository.removeChildFromParent(parentId, childId);
  } catch (error) {
    logger.error('Error removing child from parent', { parentId, childId, error: error.message });
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
    return await parentRepository.countParents();
  } catch (error) {
    logger.error('Error counting parents', { error: error.message });
    throw error;
  }
};

module.exports = {
  createParent,
  getParent,
  getParentWithValidation,
  getParentByEmail,
  getParentsByCity,
  updateParent,
  deleteParent,
  getAllChildren,
  getChildrenForParent,
  addChildToParent,
  removeChildFromParent,
  countParents
};
