// Added addPdfsToSection and removePdfFromSection controllers

const courseService = require('../services/courseService');
const logger = require('../utils/logger');
const { sanitizeInput } = require('../validations/commonValidation');

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
  issueCertificate,
  addPdfsToSection,
  removePdfFromSection
};
