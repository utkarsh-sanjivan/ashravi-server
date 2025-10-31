// Added addPdfsToSection and removePdfFromSection controllers

const courseService = require('../services/courseService');
const logger = require('../utils/logger');
const { sanitizeInput } = require('../validations/commonValidation');

const ensureAuthenticatedParentQuery = (req, res) => {
  const { parentId } = req.query || {};

  if (!parentId) {
    return true;
  }

  const authenticatedParentId = req.user?.id?.toString();

  if (!authenticatedParentId) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'Authorization token is required when parentId is provided',
      code: 'AUTH_TOKEN_REQUIRED'
    });
    return false;
  }

  if (authenticatedParentId !== parentId) {
    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'You are not authorized to access data for this parent',
      code: 'PARENT_MISMATCH'
    });
    return false;
  }

  return true;
};

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
    const { parentId } = req.query;

    if (!ensureAuthenticatedParentQuery(req, res)) {
      return;
    }

    const resolvedParentId = parentId ? req.user.id : null;
    const course = await courseService.getCourseWithValidation(req.params.id);

    const responseCourse = resolvedParentId
      ? await courseService.attachWishlistStatus(course, resolvedParentId)
      : course;

    res.json({
      success: true,
      data: responseCourse
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
    const { parentId } = req.query;

    if (!ensureAuthenticatedParentQuery(req, res)) {
      return;
    }

    const resolvedParentId = parentId ? req.user.id : null;
    const course = await courseService.getCourseBySlug(req.params.slug);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: `Course with slug ${req.params.slug} not found`
      });
    }

    const responseCourse = resolvedParentId
      ? await courseService.attachWishlistStatus(course, resolvedParentId)
      : course;

    res.json({
      success: true,
      data: responseCourse
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
    const { parentId } = req.query;

    if (!ensureAuthenticatedParentQuery(req, res)) {
      return;
    }

    const resolvedParentId = parentId ? req.user.id : null;

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

    const courses = resolvedParentId
      ? await courseService.attachWishlistStatus(result.data, resolvedParentId)
      : result.data;

    res.json({
      success: true,
      data: courses,
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
 * Update course notes
 *
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Updated progress with notes
 */
const updateCourseNotes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const courseId = req.params.id;
    const { notes } = req.body;

    const progress = await courseService.updateCourseNotes(userId, courseId, notes);

    res.json({
      success: true,
      message: 'Course notes updated successfully',
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

/**
 * Add PDFs to section
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns PDFs added to section
 */
const addPdfsToSection = async (req, res, next) => {
  try {
    const { courseId, sectionId } = req.params;
    const { pdfs } = req.body;
    const uploadedBy = req.user.id;

    if (!Array.isArray(pdfs) || pdfs.length === 0) {
      const error = new Error('PDFs array is required and must not be empty');
      error.statusCode = 400;
      error.code = 'INVALID_INPUT';
      throw error;
    }

    const section = await courseService.addPdfsToSection(
      courseId,
      sectionId,
      pdfs,
      uploadedBy
    );

    res.json({
      success: true,
      message: 'PDFs added to section successfully',
      data: section
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove PDF from section
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns PDFs removed from a section
 */
const removePdfFromSection = async (req, res, next) => {
  try {
    const { courseId, sectionId, pdfId } = req.params;

    const section = await courseService.removePdfFromSection(
      courseId,
      sectionId,
      pdfId
    );

    res.json({
      success: true,
      message: 'PDF removed from section successfully',
      data: section
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
  updateCourseNotes,
  issueCertificate,
  addPdfsToSection,
  removePdfFromSection
};
