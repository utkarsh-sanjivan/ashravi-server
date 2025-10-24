const parentService = require('../services/parentService');
const logger = require('../utils/logger');
const { sanitizeInput } = require('../validations/commonValidation');

/*
 * Get parent by ID
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Parent data
 */
const getParent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parent = await parentService.getParentById(id);

    res.json({
      success: true,
      data: parent.getPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Get parents by city
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Array of parents
 */
const getParentsByCity = async (req, res, next) => {
  try {
    const { city } = req.params;
    const { limit = 100, skip = 0 } = req.query;

    const parents = await parentService.getParentsByCity(
      city,
      parseInt(limit),
      parseInt(skip)
    );

    res.json({
      success: true,
      data: parents,
      count: parents.length
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Get children for parent
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Array of children
 */
const getChildren = async (req, res, next) => {
  try {
    const { id } = req.params;
    const children = await parentService.getChildrenForParent(id);

    res.json({
      success: true,
      data: children,
      count: children.length
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Add child to parent
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Updated parent data
 */
const addChild = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { childId } = sanitizeInput(req.body);

    const parent = await parentService.addChildToParent(id, childId);

    res.json({
      success: true,
      message: 'Child added to parent successfully',
      data: parent
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Remove child from parent
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Updated parent data
 */
const removeChild = async (req, res, next) => {
  try {
    const { id, childId } = req.params;

    const parent = await parentService.removeChildFromParent(id, childId);

    res.json({
      success: true,
      message: 'Child removed from parent successfully',
      data: parent
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Get wishlist for parent
 *
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Array of wishlist courses
 */
const getWishlist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const wishlist = await parentService.getWishlistForParent(id);

    res.json({
      success: true,
      data: wishlist,
      count: wishlist.length
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Add course to parent wishlist
 *
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Updated wishlist
 */
const addWishlistCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { courseId } = sanitizeInput(req.body);

    const wishlist = await parentService.addCourseToWishlist(id, courseId);

    res.status(201).json({
      success: true,
      message: 'Course added to wishlist successfully',
      data: wishlist,
      count: wishlist.length
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Remove course from parent wishlist
 *
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Updated wishlist
 */
const removeWishlistCourse = async (req, res, next) => {
  try {
    const { id, courseId } = req.params;

    const wishlist = await parentService.removeCourseFromWishlist(id, courseId);

    res.json({
      success: true,
      message: 'Course removed from wishlist successfully',
      data: wishlist,
      count: wishlist.length
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Delete parent
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Success message
 */
const deleteParent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cascadeDelete = false } = req.query;

    await parentService.deleteParent(id, cascadeDelete === 'true');

    res.json({
      success: true,
      message: 'Parent deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Get parent statistics
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Parent statistics
 */
const getStats = async (req, res, next) => {
  try {
    const totalParents = await parentService.countParents();

    res.json({
      success: true,
      data: {
        totalParents
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getParent,
  getParentsByCity,
  getChildren,
  addChild,
  removeChild,
  getWishlist,
  addWishlistCourse,
  removeWishlistCourse,
  deleteParent,
  getStats
};
