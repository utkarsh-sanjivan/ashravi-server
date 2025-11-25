const childRepository = require('../repositories/childRepository');
const childEducationRepository = require('../repositories/childEducationRepository');
const childNutritionRepository = require('../repositories/childNutritionRepository');
const { calculateBMI } = require('../utils/bmiUtils');
const parentRepository = require('../repositories/parentRepository');
const logger = require('../utils/logger');

/**
 * Create a new child with optional initialization of related data
 * 
 * @params {childData}: object - Child creation data
 * @params {initializeRelated}: boolean - Whether to initialize education and nutrition records
 * @returns Created child object with related data
 */
const createChild = async (childData, initializeRelated = false) => {
  try {
    const { parentId } = childData;

    if (!parentId) {
      const error = new Error('Parent ID is required to create a child');
      error.statusCode = 400;
      error.code = 'PARENT_ID_REQUIRED';
      throw error;
    }

    const parent = await parentRepository.getParent(parentId);
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
    
    // Link child to parent
    if (childId) {
      await linkChildToParent(parentId, childId);
      logger.info('Successfully created and linked child to parent', { childId, parentId });
    }

    // Initialize related records if requested
    if (initializeRelated && childId) {
      try {
        await Promise.all([
          childEducationRepository.createEducationRecord({
            childId,
            records: [],
            suggestions: []
          }),
          childNutritionRepository.createNutritionRecord({
            childId,
            records: [],
            recommendations: []
          })
        ]);
        logger.info('Initialized related education and nutrition records', { childId });
      } catch (error) {
        logger.warn('Failed to initialize related records', { childId, error: error.message });
      }
    }

    return createdChild;
  } catch (error) {
    logger.error('Error creating child', { error: error.message, childData });
    throw error;
  }
};

/**
 * Get child by ID with optional population of related data
 * 
 * @params {childId}: string - Child ID
 * @params {includeRelated}: boolean - Whether to include education and nutrition data
 * @returns Child object with optional related data
 */
const getChild = async (childId, includeRelated = false) => {
  try {
    if (!childId) return null;
    
    const child = await childRepository.getChild(childId);
    
    if (!child || !includeRelated) {
      return child;
    }

    // Fetch related data in parallel
    const [educationData, nutritionData] = await Promise.all([
      childEducationRepository.getByChildId(childId),
      childNutritionRepository.getByChildId(childId)
    ]);

    return {
      ...child,
      educationData: educationData || null,
      nutritionData: nutritionData || null
    };
  } catch (error) {
    logger.error('Error retrieving child', { childId, error: error.message });
    throw error;
  }
};

/**
 * Get child with validation and optional related data
 * 
 * @params {childId}: string - Child ID
 * @params {includeRelated}: boolean - Whether to include related data
 * @returns Child object
 */
const getChildWithValidation = async (childId, includeRelated = false) => {
  const child = await getChild(childId, includeRelated);
  if (!child) {
    const error = new Error(`Child with ID ${childId} not found`);
    error.statusCode = 404;
    error.code = 'CHILD_NOT_FOUND';
    throw error;
  }
  return child;
};

/**
 * Get children by parent ID with optional related data
 * 
 * @params {parentId}: string - Parent ID
 * @params {limit}: number - Max results
 * @params {skip}: number - Skip count
 * @params {includeRelated}: boolean - Whether to include related data
 * @returns Array of children with optional related data
 */
const getChildrenByParent = async (parentId, limit = 100, skip = 0, includeRelated = false) => {
  try {
    if (!parentId) return [];

    const parent = await parentRepository.getParent(parentId);
    if (!parent) {
      const error = new Error(`Parent with ID ${parentId} not found`);
      error.statusCode = 404;
      error.code = 'PARENT_NOT_FOUND';
      throw error;
    }

    const children = await childRepository.getChildrenByParent(parentId, limit, skip);
    
    if (!includeRelated || children.length === 0) {
      return children;
    }

    // Fetch all related data in parallel
    const childIds = children.map(c => c._id || c.id);
    const [educationRecords, nutritionRecords] = await Promise.all([
      Promise.all(childIds.map(id => childEducationRepository.getByChildId(id))),
      Promise.all(childIds.map(id => childNutritionRepository.getByChildId(id)))
    ]);

    // Map related data to children
    return children.map((child, index) => ({
      ...child,
      educationData: educationRecords[index] || null,
      nutritionData: nutritionRecords[index] || null
    }));
  } catch (error) {
    logger.error('Error retrieving children for parent', { parentId, error: error.message });
    throw error;
  }
};

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
 * Delete a child and cascade delete related data
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

    logger.info('Deleting child and related data', { childId });

    // Delete related education and nutrition records
    try {
      await Promise.all([
        childEducationRepository.getByChildId(childId).then(record => {
          if (record) {
            return childEducationRepository.deleteEducationRecord(record._id || record.id);
          }
        }),
        childNutritionRepository.getByChildId(childId).then(record => {
          if (record) {
            return childNutritionRepository.deleteNutritionRecord(record._id || record.id);
          }
        })
      ]);
      logger.info('Deleted related education and nutrition records', { childId });
    } catch (error) {
      logger.warn('Error deleting related records', { childId, error: error.message });
    }

    // Delete the child
    const deleted = await childRepository.deleteChild(childId);

    if (!deleted) {
      logger.warn('Failed to delete child', { childId });
      return false;
    }

    // Unlink from parent
    if (parentId) {
      try {
        await unlinkChildFromParent(parentId, childId);
        logger.info('Successfully unlinked child from parent', { childId, parentId });
      } catch (error) {
        logger.warn('Failed to unlink child from parent', { error: error.message });
      }
    }

    logger.info('Successfully deleted child and all related data', { childId });
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

    const parent = await parentRepository.getParent(parentId);
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
 * Get child summary with education and nutrition insights
 * 
 * @params {childId}: string - Child ID
 * @returns Child summary with related data insights
 */
const getChildSummary = async (childId) => {
  const child = await getChildWithValidation(childId);
  
  // Fetch related data
  const [educationData, nutritionData] = await Promise.all([
    childEducationRepository.getByChildId(childId),
    childNutritionRepository.getByChildId(childId)
  ]);

  const summary = {
    id: child.id,
    name: child.name,
    age: child.age,
    gender: child.gender,
    grade: child.grade,
    parentId: child.parentId,
    courseCount: child.courseIds ? child.courseIds.length : 0,
    createdAt: child.createdAt,
    updatedAt: child.updatedAt,
    hasEducationData: !!educationData,
    hasNutritionData: !!nutritionData
  };

  // Add education insights
  if (educationData && educationData.records && educationData.records.length > 0) {
    const latestRecord = educationData.records[educationData.records.length - 1];
    const totalMarks = latestRecord.subjects.reduce((sum, s) => sum + s.marks, 0);
    const averageMarks = totalMarks / latestRecord.subjects.length;

    summary.education = {
      recordCount: educationData.records.length,
      latestGrade: latestRecord.gradeYear,
      currentAverage: Math.round(averageMarks * 10) / 10,
      suggestionCount: educationData.suggestions ? educationData.suggestions.length : 0,
      highPrioritySuggestions: educationData.suggestions 
        ? educationData.suggestions.filter(s => s.priority === 'high').length 
        : 0
    };
  }

  // Add nutrition insights
  if (nutritionData && nutritionData.records && nutritionData.records.length > 0) {
    const latestRecord = nutritionData.records[nutritionData.records.length - 1];
    
    summary.nutrition = {
      recordCount: nutritionData.records.length,
      currentBMI: latestRecord.physicalMeasurement ? 
        calculateBMI(latestRecord.physicalMeasurement.heightCm, latestRecord.physicalMeasurement.weightKg) : null,
      recommendationCount: nutritionData.recommendations ? nutritionData.recommendations.length : 0,
      criticalRecommendations: nutritionData.recommendations 
        ? nutritionData.recommendations.filter(r => r.priority === 'critical' || r.priority === 'high').length 
        : 0
    };
  }

  return summary;
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
    const parent = await parentRepository.getParent(parentId);
    const updated = Array.from(new Set([...(parent?.childrenIds || []), childId]));
    await parentRepository.updateParent(parentId, { childrenIds: updated });
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
    const parent = await parentRepository.getParent(parentId);
    const updated = (parent?.childrenIds || []).filter((id) => id !== childId);
    await parentRepository.updateParent(parentId, { childrenIds: updated });
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
  
  if ('parentId' in updateData) {
    const error = new Error('Parent ID cannot be changed after child creation');
    error.statusCode = 400;
    error.code = 'PARENT_ID_IMMUTABLE';
    throw error;
  }
};


/**
 * Get child with latest assessment
 * 
 * @params {childId}: string - Child ID
 * @returns Child with latest assessment
 */
const getChildWithLatestAssessment = async (childId) => {
  try {
    const child = await getChildWithValidation(childId, true);
    
    if (child.assessmentResults && child.assessmentResults.length > 0) {
      child.latestAssessment = child.assessmentResults[child.assessmentResults.length - 1];
    }

    return child;
  } catch (error) {
    logger.error('Error fetching child with assessment', { childId, error: error.message });
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
  getChildSummary,
  getChildWithLatestAssessment
};
