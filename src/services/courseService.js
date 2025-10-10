const courseRepository = require('../repositories/courseRepository');
const courseProgressRepository = require('../repositories/courseProgressRepository');
const Parent = require('../models/Parent');
const logger = require('../utils/logger');

/**
 * Create a new course
 * 
 * @params {data}: object - Course data
 * @returns Created course object
 */
const createCourse = async (data) => {
  try {
    const instructor = await Parent.findById(data.instructor);
    if (!instructor) {
      const error = new Error(`Instructor with ID ${data.instructor} not found`);
      error.statusCode = 404;
      error.code = 'INSTRUCTOR_NOT_FOUND';
      throw error;
    }

    validateCourseStructure(data.sections);

    logger.info('Creating course', { title: data.title, instructor: data.instructor });
    const created = await courseRepository.createCourse(data);

    if (!created) {
      const error = new Error('Failed to create course');
      error.statusCode = 500;
      error.code = 'COURSE_CREATION_FAILED';
      throw error;
    }

    return created;
  } catch (error) {
    logger.error('Error creating course', { error: error.message, data });
    throw error;
  }
};

/**
 * Get course by ID
 * 
 * @params {courseId}: string - Course ID
 * @params {populate}: boolean - Whether to populate instructor
 * @returns Course object or null
 */
const getCourse = async (courseId, populate = true) => {
  try {
    if (!courseId) return null;
    return await courseRepository.getCourse(courseId, populate);
  } catch (error) {
    logger.error('Error retrieving course', { courseId, error: error.message });
    throw error;
  }
};

/**
 * Get course with validation
 * 
 * @params {courseId}: string - Course ID
 * @params {populate}: boolean - Whether to populate instructor
 * @returns Course object
 */
const getCourseWithValidation = async (courseId, populate = true) => {
  const course = await getCourse(courseId, populate);
  if (!course) {
    const error = new Error(`Course with ID ${courseId} not found`);
    error.statusCode = 404;
    error.code = 'COURSE_NOT_FOUND';
    throw error;
  }
  return course;
};

/**
 * Get course by slug
 * 
 * @params {slug}: string - Course slug
 * @params {populate}: boolean - Whether to populate instructor
 * @returns Course object or null
 */
const getCourseBySlug = async (slug, populate = true) => {
  try {
    if (!slug) return null;
    return await courseRepository.getCourseBySlug(slug, populate);
  } catch (error) {
    logger.error('Error retrieving course by slug', { slug, error: error.message });
    throw error;
  }
};

/**
 * Get courses with pagination and filters
 * 
 * @params {filters}: object - Filter criteria
 * @params {page}: number - Page number
 * @params {limit}: number - Results per page
 * @params {sortBy}: string - Sort field
 * @params {sortOrder}: string - Sort order (asc/desc)
 * @returns Paginated courses with metadata
 */
const getCourses = async (filters = {}, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc') => {
  try {
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    if (typeof filters.tags === 'string') {
      filters.tags = filters.tags.split(',').map(tag => tag.trim());
    }

    logger.info('Fetching courses', { filters, page, limit });
    return await courseRepository.getCourses(filters, page, limit, sort);
  } catch (error) {
    logger.error('Error fetching courses', { error: error.message, filters });
    throw error;
  }
};

/**
 * Update course
 * 
 * @params {courseId}: string - Course ID
 * @params {data}: object - Update data
 * @returns Updated course object
 */
const updateCourse = async (courseId, data) => {
  try {
    if (!courseId) {
      const error = new Error('Course ID is required for update');
      error.statusCode = 400;
      error.code = 'COURSE_ID_REQUIRED';
      throw error;
    }

    await getCourseWithValidation(courseId);

    if (data.sections) {
      validateCourseStructure(data.sections);
    }

    logger.info('Updating course', { courseId });
    const updated = await courseRepository.updateCourse(courseId, data);

    if (!updated) {
      const error = new Error('Failed to update course');
      error.statusCode = 500;
      error.code = 'COURSE_UPDATE_FAILED';
      throw error;
    }

    return updated;
  } catch (error) {
    logger.error('Error updating course', { courseId, error: error.message });
    throw error;
  }
};

/**
 * Delete course
 * 
 * @params {courseId}: string - Course ID
 * @returns Boolean indicating success
 */
const deleteCourse = async (courseId) => {
  try {
    if (!courseId) return false;

    await getCourseWithValidation(courseId);

    logger.info('Deleting course', { courseId });
    const deleted = await courseRepository.deleteCourse(courseId);

    if (!deleted) {
      logger.warn('Failed to delete course', { courseId });
      return false;
    }

    logger.info('Successfully deleted course', { courseId });
    return true;
  } catch (error) {
    logger.error('Error deleting course', { courseId, error: error.message });
    throw error;
  }
};

/**
 * Enroll user in course
 * 
 * @params {userId}: string - User ID
 * @params {courseId}: string - Course ID
 * @returns Course progress object
 */
const enrollInCourse = async (userId, courseId) => {
  try {
    const course = await getCourseWithValidation(courseId);

    const user = await Parent.findById(userId);
    if (!user) {
      const error = new Error(`User with ID ${userId} not found`);
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const existingProgress = await courseProgressRepository.getUserCourseProgress(userId, courseId);
    if (existingProgress) {
      logger.info('User already enrolled', { userId, courseId });
      return existingProgress;
    }

    await courseRepository.incrementEnrollment(courseId);

    const progress = await courseProgressRepository.getOrCreateProgress(userId, courseId);
    
    logger.info('User enrolled in course', { userId, courseId });
    return progress;
  } catch (error) {
    logger.error('Error enrolling in course', { userId, courseId, error: error.message });
    throw error;
  }
};

/**
 * Get user's course progress
 * 
 * @params {userId}: string - User ID
 * @params {courseId}: string - Course ID
 * @returns Progress object with course details
 */
const getUserCourseProgress = async (userId, courseId) => {
  try {
    const [course, progress] = await Promise.all([
      getCourseWithValidation(courseId),
      courseProgressRepository.getUserCourseProgress(userId, courseId)
    ]);

    if (!progress) {
      return {
        course,
        progress: null,
        isEnrolled: false
      };
    }

    return {
      course,
      progress,
      isEnrolled: true
    };
  } catch (error) {
    logger.error('Error getting user course progress', { userId, courseId, error: error.message });
    throw error;
  }
};

/**
 * Get all user's progress
 * 
 * @params {userId}: string - User ID
 * @params {limit}: number - Max results
 * @returns Array of progress records
 */
const getUserProgress = async (userId, limit = 100) => {
  try {
    return await courseProgressRepository.getUserProgress(userId, limit);
  } catch (error) {
    logger.error('Error getting user progress', { userId, error: error.message });
    throw error;
  }
};

/**
 * Update video progress
 * 
 * @params {userId}: string - User ID
 * @params {courseId}: string - Course ID
 * @params {sectionId}: string - Section ID
 * @params {videoId}: string - Video ID
 * @params {watchedDuration}: number - Watched duration
 * @params {totalDuration}: number - Total duration
 * @returns Updated progress with recalculated overall progress
 */
const updateVideoProgress = async (userId, courseId, sectionId, videoId, watchedDuration, totalDuration) => {
  try {
    const course = await getCourseWithValidation(courseId);

    const updated = await courseProgressRepository.updateVideoProgress(
      userId,
      courseId,
      sectionId,
      videoId,
      watchedDuration,
      totalDuration
    );

    if (!updated) {
      const error = new Error('Failed to update video progress');
      error.statusCode = 500;
      error.code = 'UPDATE_PROGRESS_FAILED';
      throw error;
    }

    const recalculated = await courseProgressRepository.calculateOverallProgress(
      userId,
      courseId,
      course.metadata.totalVideos,
      course.metadata.totalTests
    );

    logger.info('Updated video progress', { userId, courseId, videoId, progress: recalculated.overallProgress });
    return recalculated;
  } catch (error) {
    logger.error('Error updating video progress', { error: error.message });
    throw error;
  }
};

/**
 * Update test progress
 * 
 * @params {userId}: string - User ID
 * @params {courseId}: string - Course ID
 * @params {sectionId}: string - Section ID
 * @params {testId}: string - Test ID
 * @params {score}: number - Test score
 * @params {passingScore}: number - Passing score
 * @returns Updated progress with recalculated overall progress
 */
const updateTestProgress = async (userId, courseId, sectionId, testId, score, passingScore = 70) => {
  try {
    const course = await getCourseWithValidation(courseId);

    const updated = await courseProgressRepository.updateTestProgress(
      userId,
      courseId,
      sectionId,
      testId,
      score,
      passingScore
    );

    if (!updated) {
      const error = new Error('Failed to update test progress');
      error.statusCode = 500;
      error.code = 'UPDATE_PROGRESS_FAILED';
      throw error;
    }

    const recalculated = await courseProgressRepository.calculateOverallProgress(
      userId,
      courseId,
      course.metadata.totalVideos,
      course.metadata.totalTests
    );

    if (recalculated.isCompleted && !recalculated.certificateIssued) {
      await courseProgressRepository.issueCertificate(userId, courseId);
      logger.info('Certificate issued automatically', { userId, courseId });
    }

    logger.info('Updated test progress', { userId, courseId, testId, score });
    return recalculated;
  } catch (error) {
    logger.error('Error updating test progress', { error: error.message });
    throw error;
  }
};

/**
 * Issue certificate manually
 * 
 * @params {userId}: string - User ID
 * @params {courseId}: string - Course ID
 * @returns Updated progress
 */
const issueCertificate = async (userId, courseId) => {
  try {
    const progress = await courseProgressRepository.getUserCourseProgress(userId, courseId);

    if (!progress) {
      const error = new Error('Progress not found for this user and course');
      error.statusCode = 404;
      error.code = 'PROGRESS_NOT_FOUND';
      throw error;
    }

    if (!progress.isCompleted) {
      const error = new Error('Course must be completed before issuing certificate');
      error.statusCode = 400;
      error.code = 'COURSE_NOT_COMPLETED';
      throw error;
    }

    if (progress.certificateIssued) {
      logger.info('Certificate already issued', { userId, courseId });
      return progress;
    }

    const updated = await courseProgressRepository.issueCertificate(userId, courseId);
    logger.info('Certificate issued', { userId, courseId });
    return updated;
  } catch (error) {
    logger.error('Error issuing certificate', { error: error.message });
    throw error;
  }
};

/**
 * Check if user has access to course
 * 
 * @params {userId}: string - User ID
 * @params {courseId}: string - Course ID
 * @returns Boolean indicating access
 */
const hasAccessToCourse = async (userId, courseId) => {
  try {
    const progress = await courseProgressRepository.getUserCourseProgress(userId, courseId);
    return !!progress;
  } catch (error) {
    logger.error('Error checking course access', { userId, courseId, error: error.message });
    return false;
  }
};

/**
 * Validate course structure
 * 
 * @params {sections}: array - Course sections
 */
const validateCourseStructure = (sections) => {
  if (!sections || sections.length === 0) {
    const error = new Error('Course must have at least one section');
    error.statusCode = 400;
    error.code = 'INVALID_COURSE_STRUCTURE';
    throw error;
  }

  sections.forEach((section, sIndex) => {
    if (!section.title || section.title.trim().length === 0) {
      const error = new Error(`Section ${sIndex + 1} must have a title`);
      error.statusCode = 400;
      error.code = 'INVALID_SECTION';
      throw error;
    }

    if (section.videos && section.videos.length > 0) {
      section.videos.forEach((video, vIndex) => {
        if (!video.title || !video.videoUrl) {
          const error = new Error(`Video ${vIndex + 1} in section ${sIndex + 1} is invalid`);
          error.statusCode = 400;
          error.code = 'INVALID_VIDEO';
          throw error;
        }
      });
    }
  });
};

module.exports = {
  createCourse,
  getCourse,
  getCourseWithValidation,
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
  hasAccessToCourse
};
