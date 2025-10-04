const parentService = require('../services/parentService');
const logger = require('../utils/logger');
const { sanitizeInput } = require('../validations/commonValidation');

/**
 * Create a new parent
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Created parent data
 */
const createParent = async (req, res, next) => {
  try {
    const sanitizedData = sanitizeInput(req.body);
    const parent = await parentService.createParent(sanitizedData);

    res.status(201).json({
      success: true,
      message: 'Parent created successfully',
      data: parent
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get parent by ID
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Parent data
 */
const getParent = async (req, res, next) => {
  try {
    const parent = await parentService.getParentWithValidation(req.params.id);

    res.json({
      success: true,
      data: parent
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get parent by email
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Parent data
 */
const getParentByEmail = async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const parent = await parentService.getParentByEmail(email);

    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }

    res.json({
      success: true,
      data: parent
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get parents by city
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns List of parents
 */
const getParentsByCity = async (req, res, next) => {
  try {
    const { city } = req.query;
    const limit = parseInt(req.query.limit) || 100;
    const skip = parseInt(req.query.skip) || 0;

    if (!city) {
      return res.status(400).json({
        success: false,
        error: 'City is required'
      });
    }

    const parents = await parentService.getParentsByCity(city, limit, skip);

    res.json({
      success: true,
      data: parents
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update parent information
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Updated parent data
 */
const updateParent = async (req, res, next) => {
  try {
    const sanitizedData = sanitizeInput(req.body);
    const parent = await parentService.updateParent(req.params.id, sanitizedData);

    res.json({
      success: true,
      message: 'Parent updated successfully',
      data: parent
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a parent
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Success message
 */
const deleteParent = async (req, res, next) => {
  try {
    const cascadeDelete = req.query.cascade === 'true';
    const deleted = await parentService.deleteParent(req.params.id, cascadeDelete);

    res.json({
      success: true,
      message: 'Parent deleted successfully',
      data: { deleted }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all children across all parents
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns List of all children
 */
const getAllChildren = async (req, res, next) => {
  try {
    const children = await parentService.getAllChildren();

    res.json({
      success: true,
      data: children
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get children for a specific parent
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns List of children
 */
const getChildrenForParent = async (req, res, next) => {
  try {
    const children = await parentService.getChildrenForParent(req.params.id);

    res.json({
      success: true,
      data: children
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add child to parent
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Updated parent data
 */
const addChild = async (req, res, next) => {
  try {
    const { childId } = req.body;
    const parent = await parentService.addChildToParent(req.params.id, childId);

    res.json({
      success: true,
      message: 'Child added to parent successfully',
      data: parent
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove child from parent
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Updated parent data
 */
const removeChild = async (req, res, next) => {
  try {
    const { childId } = req.body;
    const parent = await parentService.removeChildFromParent(req.params.id, childId);

    res.json({
      success: true,
      message: 'Child removed from parent successfully',
      data: parent
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Count total parents
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Count of parents
 */
const countParents = async (req, res, next) => {
  try {
    const count = await parentService.countParents();

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createParent,
  getParent,
  getParentByEmail,
  getParentsByCity,
  updateParent,
  deleteParent,
  getAllChildren,
  getChildrenForParent,
  addChild,
  removeChild,
  countParents
};
