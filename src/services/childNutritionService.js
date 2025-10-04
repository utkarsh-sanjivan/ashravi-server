const childNutritionRepository = require('../repositories/childNutritionRepository');
const childRepository = require('../repositories/childRepository');
const logger = require('../utils/logger');
const { calculateBMI, getBMICategory, isHealthyBMI } = require('../utils/bmiUtils');
const { EATING_HABITS_KEYS, RECOMMENDATION_CATEGORIES } = require('../constants/childNutritionConstants');

/**
 * Calculate healthy habits score from eating habits
 * 
 * @params {eatingHabits}: object - Eating habits object
 * @returns Percentage score (0-100)
 */
const calculateHealthyHabitsScore = (eatingHabits) => {
  if (!eatingHabits) return 0;

  const positiveCount = EATING_HABITS_KEYS.filter(key => eatingHabits[key] === true).length;
  return Math.round((positiveCount / EATING_HABITS_KEYS.length) * 1000) / 10;
};

/**
 * Calculate overall health score
 * 
 * @params {physicalMeasurement}: object - Physical measurements
 * @params {eatingHabits}: object - Eating habits
 * @returns Overall health score (0-100)
 */
const calculateHealthScore = (physicalMeasurement, eatingHabits) => {
  const bmi = calculateBMI(physicalMeasurement.heightCm, physicalMeasurement.weightKg);
  const bmiHealthy = isHealthyBMI(bmi);
  const bmiScore = bmiHealthy ? 100 : 70;
  
  const habitsScore = calculateHealthyHabitsScore(eatingHabits);
  
  return Math.round((bmiScore * 0.5 + habitsScore * 0.5) * 10) / 10;
};

/**
 * Generate intelligent nutrition recommendations
 * 
 * @params {records}: array - Nutrition records
 * @returns Array of recommendations
 */
const generateRecommendations = (records) => {
  if (!records || records.length === 0) return [];

  const recommendations = [];
  const latestRecord = records[records.length - 1];
  const { physicalMeasurement, eatingHabits } = latestRecord;

  const bmi = calculateBMI(physicalMeasurement.heightCm, physicalMeasurement.weightKg);
  const bmiCategory = getBMICategory(bmi);

  if (bmiCategory === 'underweight') {
    recommendations.push({
      category: RECOMMENDATION_CATEGORIES.DIET,
      recommendation: 'Increase caloric intake with nutritious, energy-dense foods. Include more protein, healthy fats, and complex carbohydrates.',
      priority: 'high',
      targetArea: 'Weight Gain',
      createdAt: new Date()
    });
    recommendations.push({
      category: RECOMMENDATION_CATEGORIES.MEDICAL,
      recommendation: 'Consult with a pediatrician to rule out underlying health conditions affecting weight.',
      priority: 'critical',
      targetArea: 'Medical Consultation',
      createdAt: new Date()
    });
  }

  if (bmiCategory === 'overweight' || bmiCategory === 'obese') {
    const priority = bmiCategory === 'obese' ? 'critical' : 'high';
    recommendations.push({
      category: RECOMMENDATION_CATEGORIES.DIET,
      recommendation: 'Focus on balanced meals with controlled portions. Reduce sugary drinks and processed foods.',
      priority,
      targetArea: 'Weight Management',
      createdAt: new Date()
    });
    recommendations.push({
      category: RECOMMENDATION_CATEGORIES.EXERCISE,
      recommendation: 'Increase physical activity to at least 60 minutes daily. Include both aerobic and strength exercises.',
      priority,
      targetArea: 'Physical Activity',
      createdAt: new Date()
    });
  }

  if (!eatingHabits.eatsBreakfastRegularly) {
    recommendations.push({
      category: RECOMMENDATION_CATEGORIES.HABITS,
      recommendation: 'Establish a regular breakfast routine. A nutritious breakfast improves focus and energy throughout the day.',
      priority: 'medium',
      targetArea: 'Breakfast Habits',
      createdAt: new Date()
    });
  }

  if (!eatingHabits.drinksEnoughWater) {
    recommendations.push({
      category: RECOMMENDATION_CATEGORIES.HABITS,
      recommendation: 'Increase water intake to 6-8 glasses daily. Proper hydration supports overall health and cognitive function.',
      priority: 'medium',
      targetArea: 'Hydration',
      createdAt: new Date()
    });
  }

  if (!eatingHabits.eatsFruitsDaily || !eatingHabits.eatsVegetablesDaily) {
    recommendations.push({
      category: RECOMMENDATION_CATEGORIES.DIET,
      recommendation: 'Include at least 5 servings of fruits and vegetables daily for essential vitamins and minerals.',
      priority: 'high',
      targetArea: 'Fruits & Vegetables',
      createdAt: new Date()
    });
  }

  if (!eatingHabits.limitsJunkFood) {
    recommendations.push({
      category: RECOMMENDATION_CATEGORIES.HABITS,
      recommendation: 'Reduce junk food consumption. Replace with healthier snack alternatives like nuts, fruits, and yogurt.',
      priority: 'high',
      targetArea: 'Junk Food Reduction',
      createdAt: new Date()
    });
  }

  if (!eatingHabits.hasRegularMealTimes) {
    recommendations.push({
      category: RECOMMENDATION_CATEGORIES.HABITS,
      recommendation: 'Establish consistent meal times to regulate metabolism and improve digestion.',
      priority: 'medium',
      targetArea: 'Meal Timing',
      createdAt: new Date()
    });
  }

  if (!eatingHabits.enjoysVarietyOfFoods) {
    recommendations.push({
      category: RECOMMENDATION_CATEGORIES.DIET,
      recommendation: 'Introduce variety in meals to ensure diverse nutrient intake and develop healthy eating patterns.',
      priority: 'low',
      targetArea: 'Food Variety',
      createdAt: new Date()
    });
  }

  if (records.length >= 2) {
    const previousRecord = records[records.length - 2];
    const previousBMI = calculateBMI(
      previousRecord.physicalMeasurement.heightCm,
      previousRecord.physicalMeasurement.weightKg
    );
    const bmiChange = bmi - previousBMI;

    if (Math.abs(bmiChange) > 2) {
      const direction = bmiChange > 0 ? 'increased' : 'decreased';
      recommendations.push({
        category: RECOMMENDATION_CATEGORIES.MEDICAL,
        recommendation: `Significant BMI change detected (${direction} by ${Math.abs(bmiChange).toFixed(1)}). Monitor closely and consult healthcare provider if trend continues.`,
        priority: 'high',
        targetArea: 'BMI Monitoring',
        createdAt: new Date()
      });
    }
  }

  const healthyHabitsScore = calculateHealthyHabitsScore(eatingHabits);
  if (healthyHabitsScore >= 85) {
    recommendations.push({
      category: RECOMMENDATION_CATEGORIES.HABITS,
      recommendation: 'Excellent eating habits! Continue maintaining this healthy lifestyle.',
      priority: 'low',
      targetArea: 'Positive Reinforcement',
      createdAt: new Date()
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
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
      error.code = 'CHILD_ID_REQUIRED';
      throw error;
    }

    const child = await childRepository.getChild(data.childId);
    if (!child) {
      const error = new Error(`Child with ID ${data.childId} not found`);
      error.statusCode = 404;
      error.code = 'CHILD_NOT_FOUND';
      throw error;
    }

    const existing = await childNutritionRepository.getByChildId(data.childId);
    if (existing) {
      const error = new Error('Nutrition record already exists for this child');
      error.statusCode = 409;
      error.code = 'RECORD_EXISTS';
      throw error;
    }

    logger.info('Creating nutrition record', { childId: data.childId });
    const created = await childNutritionRepository.createNutritionRecord(data);

    if (!created) {
      const error = new Error('Failed to create nutrition record');
      error.statusCode = 500;
      error.code = 'CREATION_FAILED';
      throw error;
    }

    return created;
  } catch (error) {
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
    if (!recordId) return null;
    return await childNutritionRepository.getNutritionRecord(recordId);
  } catch (error) {
    logger.error('Error retrieving nutrition record', { recordId, error: error.message });
    throw error;
  }
};

/**
 * Get nutrition record with validation
 * 
 * @params {recordId}: string - Record ID
 * @returns Nutrition record
 */
const getNutritionRecordWithValidation = async (recordId) => {
  const record = await getNutritionRecord(recordId);
  if (!record) {
    const error = new Error(`Nutrition record with ID ${recordId} not found`);
    error.statusCode = 404;
    error.code = 'RECORD_NOT_FOUND';
    throw error;
  }
  return record;
};

/**
 * Get nutrition record by child ID
 * 
 * @params {childId}: string - Child ID
 * @returns Nutrition record or null
 */
const getByChildId = async (childId) => {
  try {
    if (!childId) return null;

    const child = await childRepository.getChild(childId);
    if (!child) {
      const error = new Error(`Child with ID ${childId} not found`);
      error.statusCode = 404;
      error.code = 'CHILD_NOT_FOUND';
      throw error;
    }

    return await childNutritionRepository.getByChildId(childId);
  } catch (error) {
    logger.error('Error retrieving record by child ID', { childId, error: error.message });
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
    if (!recordId) {
      const error = new Error('Record ID is required for update');
      error.statusCode = 400;
      error.code = 'RECORD_ID_REQUIRED';
      throw error;
    }

    await getNutritionRecordWithValidation(recordId);

    logger.info('Updating nutrition record', { recordId });
    const updated = await childNutritionRepository.updateNutritionRecord(recordId, data);

    if (!updated) {
      const error = new Error('Failed to update nutrition record');
      error.statusCode = 500;
      error.code = 'UPDATE_FAILED';
      throw error;
    }

    return updated;
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
    if (!recordId) return false;

    await getNutritionRecordWithValidation(recordId);

    logger.info('Deleting nutrition record', { recordId });
    const deleted = await childNutritionRepository.deleteNutritionRecord(recordId);

    if (!deleted) {
      logger.warn('Failed to delete nutrition record', { recordId });
      return false;
    }

    logger.info('Successfully deleted nutrition record', { recordId });
    return true;
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
    if (!childId || !nutritionEntry) {
      const error = new Error('childId and nutritionEntry are required');
      error.statusCode = 400;
      error.code = 'INVALID_INPUT';
      throw error;
    }

    const child = await childRepository.getChild(childId);
    if (!child) {
      const error = new Error(`Child with ID ${childId} not found`);
      error.statusCode = 404;
      error.code = 'CHILD_NOT_FOUND';
      throw error;
    }

    let nutritionRecord = await childNutritionRepository.getByChildId(childId);

    if (!nutritionRecord) {
      nutritionRecord = await childNutritionRepository.createNutritionRecord({
        childId,
        records: [],
        recommendations: []
      });
    }

    const updated = await childNutritionRepository.addNutritionEntry(childId, nutritionEntry);

    if (!updated) {
      const error = new Error('Failed to add nutrition entry');
      error.statusCode = 500;
      error.code = 'ADD_ENTRY_FAILED';
      throw error;
    }

    const recommendations = generateRecommendations(updated.records);
    await childNutritionRepository.updateRecommendations(childId, recommendations);

    const finalRecord = await childNutritionRepository.getByChildId(childId);
    logger.info('Added nutrition entry and updated recommendations', { childId });

    return finalRecord;
  } catch (error) {
    logger.error('Error adding nutrition entry', { childId, error: error.message });
    throw error;
  }
};

/**
 * Get nutrition analysis for a child
 * 
 * @params {childId}: string - Child ID
 * @returns Nutrition analysis object
 */
const getNutritionAnalysis = async (childId) => {
  try {
    const record = await getByChildId(childId);
    
    if (!record || !record.records || record.records.length === 0) {
      return {
        childId,
        hasData: false,
        message: 'No nutrition records found for analysis'
      };
    }

    const latestRecord = record.records[record.records.length - 1];
    const bmi = calculateBMI(
      latestRecord.physicalMeasurement.heightCm,
      latestRecord.physicalMeasurement.weightKg
    );
    const bmiCategory = getBMICategory(bmi);
    const healthScore = calculateHealthScore(
      latestRecord.physicalMeasurement,
      latestRecord.eatingHabits
    );
    const healthyHabitsScore = calculateHealthyHabitsScore(latestRecord.eatingHabits);

    return {
      childId,
      hasData: true,
      analysis: {
        currentBMI: bmi,
        bmiCategory,
        healthScore,
        healthyHabitsScore,
        isHealthyWeight: isHealthyBMI(bmi)
      },
      recordCount: record.records.length,
      latestMeasurement: latestRecord.physicalMeasurement,
      recommendations: record.recommendations || []
    };
  } catch (error) {
    logger.error('Error getting nutrition analysis', { childId, error: error.message });
    throw error;
  }
};

/**
 * Regenerate recommendations for a child
 * 
 * @params {childId}: string - Child ID
 * @returns Updated nutrition record with new recommendations
 */
const regenerateRecommendations = async (childId) => {
  try {
    const record = await getByChildId(childId);

    if (!record || !record.records || record.records.length === 0) {
      const error = new Error('No nutrition records found to generate recommendations');
      error.statusCode = 404;
      error.code = 'NO_RECORDS';
      throw error;
    }

    const recommendations = generateRecommendations(record.records);
    const updated = await childNutritionRepository.updateRecommendations(childId, recommendations);

    logger.info('Regenerated recommendations', { childId, count: recommendations.length });
    return updated;
  } catch (error) {
    logger.error('Error regenerating recommendations', { childId, error: error.message });
    throw error;
  }
};

module.exports = {
  createNutritionRecord,
  getNutritionRecord,
  getNutritionRecordWithValidation,
  getByChildId,
  updateNutritionRecord,
  deleteNutritionRecord,
  addNutritionEntry,
  getNutritionAnalysis,
  regenerateRecommendations,
  generateRecommendations,
  calculateHealthScore,
  calculateHealthyHabitsScore
};
