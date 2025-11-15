const childEducationService = require('../services/childEducationService');
const { sanitizeInput } = require('../validations/commonValidation');

/**
 * Create new education record
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Created education record
 */
const createEducationRecord = async (req, res, next) => {
  try {
    const sanitizedData = sanitizeInput(req.body);
    const record = await childEducationService.createEducationRecord(sanitizedData);

    res.status(201).json({
      success: true,
      message: 'Education record created successfully',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get education record by ID
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Education record
 */
const getEducationRecord = async (req, res, next) => {
  try {
    const record = await childEducationService.getEducationRecordWithValidation(req.params.id);

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get education record by child ID
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Education record
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

    const record = await childEducationService.getByChildId(childId);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Education record not found for this child'
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
 * Update education record
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Updated education record
 */
const updateEducationRecord = async (req, res, next) => {
  try {
    const sanitizedData = sanitizeInput(req.body);
    const record = await childEducationService.updateEducationRecord(req.params.id, sanitizedData);

    res.json({
      success: true,
      message: 'Education record updated successfully',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete education record
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Success message
 */
const deleteEducationRecord = async (req, res, next) => {
  try {
    const deleted = await childEducationService.deleteEducationRecord(req.params.id);

    res.json({
      success: true,
      message: 'Education record deleted successfully',
      data: { deleted }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add grade record to education document
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Updated education record
 */
const addGradeRecord = async (req, res, next) => {
  try {
    const { childId } = req.query;

    if (!childId) {
      return res.status(400).json({
        success: false,
        error: 'Child ID is required'
      });
    }

    const gradeRecord = sanitizeInput(req.body);
    const record = await childEducationService.addGradeRecord(childId, gradeRecord);

    res.json({
      success: true,
      message: 'Grade record added successfully',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get performance analysis for a child
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Performance analysis
 */
const getPerformanceAnalysis = async (req, res, next) => {
  try {
    const { childId } = req.query;

    if (!childId) {
      return res.status(400).json({
        success: false,
        error: 'Child ID is required'
      });
    }

    const analysis = await childEducationService.getPerformanceAnalysis(childId);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Regenerate suggestions for a child
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Updated education record with new suggestions
 */
const regenerateSuggestions = async (req, res, next) => {
  try {
    const { childId } = req.query;

    if (!childId) {
      return res.status(400).json({
        success: false,
        error: 'Child ID is required'
      });
    }

    const record = await childEducationService.regenerateSuggestions(childId);

    res.json({
      success: true,
      message: 'Suggestions regenerated successfully',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEducationRecord,
  getEducationRecord,
  getByChildId,
  updateEducationRecord,
  deleteEducationRecord,
  addGradeRecord,
  getPerformanceAnalysis,
  regenerateSuggestions
};
