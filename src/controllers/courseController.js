const courseService = require('../services/courseService');
const logger = require('../utils/logger');
const { sanitizeInput } = require('../validations/commonValidation');

/**
 * Create new course
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Created course
 */
const createCourse = async (req, res, next) => {
  try {
    const sanitizedData = sanitizeInput(req.body);
    
    if (!sanitizedData.instructor && req.user && req.user.id) {
      sanitizedData.instructor = req.user.id;
    }

    const course = await courseService.createCourse(sanitizedData);

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get course by ID
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Course data
 */
const getCourse = async (req, res, next) => {
  try {
    const course = await courseService.getCourseWithValidation(req.params.id);

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get course by slug
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Course data
 */
const getCourseBySlug = async (req, res, next) => {
  try {
    const course = await courseService.getCourseBySlug(req.params.slug);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: `Course with slug ${req.params.slug} not found`
      });
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get courses with pagination and filters
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Paginated courses
 */
const getCourses = async (req, res, next) => {
  try {
    const filters = {
      category: req.query.category,
      level: req.query.level,
      isPublished: req.query.isPublished,
      instructor: req.query.instructor,
      tags: req.query.tags,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      search: req.query.search
    };

    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';

    const result = await courseService.getCourses(filters, page, limit, sortBy, sortOrder);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update course
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Updated course
 */
const updateCourse = async (req, res, next) => {
  try {
    const sanitizedData = sanitizeInput(req.body);
    const course = await courseService.updateCourse(req.params.id, sanitizedData);

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete course
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Success message
 */
const deleteCourse = async (req, res, next) => {
  try {
    const deleted = await courseService.deleteCourse(req.params.id);

    res.json({
      success: true,
      message: 'Course deleted successfully',
      data: { deleted }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Enroll in course
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Enrollment data
 */
const enrollInCourse = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const courseId = req.params.id;

    const progress = await courseService.enrollInCourse(userId, courseId);

    res.json({
      success: true,
      message: 'Successfully enrolled in course',
      data: progress
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's course progress
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Progress data
 */
const getUserCourseProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const courseId = req.params.id;

    const result = await courseService.getUserCourseProgress(userId, courseId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all user's progress
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Array of progress records
 */
const getUserProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 100;

    const progress = await courseService.getUserProgress(userId, limit);

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update video progress
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Updated progress
 */
const updateVideoProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const courseId = req.params.id;
    const { sectionId, videoId, watchedDuration, totalDuration } = req.body;

    const progress = await courseService.updateVideoProgress(
      userId,
      courseId,
      sectionId,
      videoId,
      watchedDuration,
      totalDuration
    );

    res.json({
      success: true,
      message: 'Video progress updated successfully',
      data: progress
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update test progress
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Updated progress
 */
const updateTestProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const courseId = req.params.id;
    const { sectionId, testId, score, passingScore } = req.body;

    const progress = await courseService.updateTestProgress(
      userId,
      courseId,
      sectionId,
      testId,
      score,
      passingScore
    );

    res.json({
      success: true,
      message: 'Test progress updated successfully',
      data: progress
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Issue certificate
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Updated progress with certificate
 */
const issueCertificate = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const courseId = req.params.id;

    const progress = await courseService.issueCertificate(userId, courseId);

    res.json({
      success: true,
      message: 'Certificate issued successfully',
      data: progress
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCourse,
  getCourse,
  getCourseBySlug,
  getCourses,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  getUserCourseProgress,
  getUserProgress,
  updateVideoProgress,
  updateTestProgress,
  issueCertificate
};
