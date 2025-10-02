const childService = require('../services/childService');
const logger = require('../utils/logger');
const { sanitizeInput } = require('../validations/commonValidation');

/**
 * Create a new child
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Created child data
 */
const createChild = async (req, res, next) => {
  try {
    const sanitizedData = sanitizeInput(req.body);
    const child = await childService.createChild(sanitizedData);

    res.status(201).json({
      success: true,
      message: 'Child created successfully',
      data: child
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get child by ID
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Child data
 */
const getChild = async (req, res, next) => {
  try {
    const child = await childService.getChildWithValidation(req.params.id);

    res.json({
      success: true,
      data: child
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get children by parent ID
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns List of children
 */
const getChildrenByParent = async (req, res, next) => {
  try {
    const { parentId } = req.query;
    const limit = parseInt(req.query.limit) || 100;
    const skip = parseInt(req.query.skip) || 0;

    if (!parentId) {
      return res.status(400).json({
        success: false,
        error: 'Parent ID is required'
      });
    }

    const children = await childService.getChildrenByParent(parentId, limit, skip);

    res.json({
      success: true,
      data: children
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update child information
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Updated child data
 */
const updateChild = async (req, res, next) => {
  try {
    const sanitizedData = sanitizeInput(req.body);
    const child = await childService.updateChild(req.params.id, sanitizedData);

    res.json({
      success: true,
      message: 'Child updated successfully',
      data: child
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a child
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Success message
 */
const deleteChild = async (req, res, next) => {
  try {
    const parentId = req.query.parentId || null;
    const deleted = await childService.deleteChild(req.params.id, parentId);

    res.json({
      success: true,
      message: 'Child deleted successfully',
      data: { deleted }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Count children by parent
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Count of children
 */
const countChildrenByParent = async (req, res, next) => {
  try {
    const { parentId } = req.query;

    if (!parentId) {
      return res.status(400).json({
        success: false,
        error: 'Parent ID is required'
      });
    }

    const count = await childService.countChildrenByParent(parentId);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add courses to a child
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Updated child data
 */
const addCourses = async (req, res, next) => {
  try {
    const { courseIds } = sanitizeInput(req.body);
    const child = await childService.addCoursesToChild(req.params.id, courseIds);

    res.json({
      success: true,
      message: 'Courses added successfully',
      data: child
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get child summary
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Child summary data
 */
const getChildSummary = async (req, res, next) => {
  try {
    const summary = await childService.getChildSummary(req.params.id);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createChild,
  getChild,
  getChildrenByParent,
  updateChild,
  deleteChild,
  countChildrenByParent,
  addCourses,
  getChildSummary
};
