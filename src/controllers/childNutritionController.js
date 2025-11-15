const childNutritionService = require('../services/childNutritionService');
const { sanitizeInput } = require('../validations/commonValidation');

/**
 * Create new nutrition record
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Created nutrition record
 */
const createNutritionRecord = async (req, res, next) => {
  try {
    const sanitizedData = sanitizeInput(req.body);
    const record = await childNutritionService.createNutritionRecord(sanitizedData);

    res.status(201).json({
      success: true,
      message: 'Nutrition record created successfully',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get nutrition record by ID
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Nutrition record
 */
const getNutritionRecord = async (req, res, next) => {
  try {
    const record = await childNutritionService.getNutritionRecordWithValidation(req.params.id);

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get nutrition record by child ID
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Nutrition record
 */
const getByChildId = async (req, res, next) => {
  try {
    const { childId } = req.query;

    if (!childId) {
      return res.status(400).json({
        success: false,
        error: 'Child ID is required'
      });
    }

    const record = await childNutritionService.getByChildId(childId);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Nutrition record not found for this child'
      });
    }

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update nutrition record
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Updated nutrition record
 */
const updateNutritionRecord = async (req, res, next) => {
  try {
    const sanitizedData = sanitizeInput(req.body);
    const record = await childNutritionService.updateNutritionRecord(req.params.id, sanitizedData);

    res.json({
      success: true,
      message: 'Nutrition record updated successfully',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete nutrition record
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Success message
 */
const deleteNutritionRecord = async (req, res, next) => {
  try {
    const deleted = await childNutritionService.deleteNutritionRecord(req.params.id);

    res.json({
      success: true,
      message: 'Nutrition record deleted successfully',
      data: { deleted }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add nutrition entry to record
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Updated nutrition record
 */
const addNutritionEntry = async (req, res, next) => {
  try {
    const { childId } = req.query;

    if (!childId) {
      return res.status(400).json({
        success: false,
        error: 'Child ID is required'
      });
    }

    const nutritionEntry = sanitizeInput(req.body);
    const record = await childNutritionService.addNutritionEntry(childId, nutritionEntry);

    res.json({
      success: true,
      message: 'Nutrition entry added successfully',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get nutrition analysis for a child
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Nutrition analysis
 */
const getNutritionAnalysis = async (req, res, next) => {
  try {
    const { childId } = req.query;

    if (!childId) {
      return res.status(400).json({
        success: false,
        error: 'Child ID is required'
      });
    }

    const analysis = await childNutritionService.getNutritionAnalysis(childId);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Regenerate recommendations for a child
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Updated nutrition record with new recommendations
 */
const regenerateRecommendations = async (req, res, next) => {
  try {
    const { childId } = req.query;

    if (!childId) {
      return res.status(400).json({
        success: false,
        error: 'Child ID is required'
      });
    }

    const record = await childNutritionService.regenerateRecommendations(childId);

    res.json({
      success: true,
      message: 'Recommendations regenerated successfully',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNutritionRecord,
  getNutritionRecord,
  getByChildId,
  updateNutritionRecord,
  deleteNutritionRecord,
  addNutritionEntry,
  getNutritionAnalysis,
  regenerateRecommendations
};
