const courseRepository = require('../repositories/courseRepository');
const courseProgressRepository = require('../repositories/courseProgressRepository');
const Parent = require('../models/Parent');
const Course = require('../models/Course');
const logger = require('../utils/logger');

const MAX_PDFS_PER_SECTION = 3;

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

const getCourse = async (courseId, populate = true) => {
  try {
    if (!courseId) return null;
    return await courseRepository.getCourse(courseId, populate);
  } catch (error) {
    logger.error('Error retrieving course', { courseId, error: error.message });
    throw error;
  }
};

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

const getCourseBySlug = async (slug, populate = true) => {
  try {
    if (!slug) return null;
    return await courseRepository.getCourseBySlug(slug, populate);
  } catch (error) {
    logger.error('Error retrieving course by slug', { slug, error: error.message });
    throw error;
  }
};

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

const getUserProgress = async (userId, limit = 100) => {
  try {
    return await courseProgressRepository.getUserProgress(userId, limit);
  } catch (error) {
    logger.error('Error getting user progress', { userId, error: error.message });
    throw error;
  }
};

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

const hasAccessToCourse = async (userId, courseId) => {
  try {
    const progress = await courseProgressRepository.getUserCourseProgress(userId, courseId);
    return !!progress;
  } catch (error) {
    logger.error('Error checking course access', { userId, courseId, error: error.message });
    return false;
  }
};

const addPdfsToSection = async (courseId, sectionId, pdfs, uploadedBy) => {
  try {
    const course = await Course.findById(courseId);

    if (!course) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      error.code = 'COURSE_NOT_FOUND';
      throw error;
    }

    const section = course.sections.id(sectionId);

    if (!section) {
      const error = new Error('Section not found');
      error.statusCode = 404;
      error.code = 'SECTION_NOT_FOUND';
      throw error;
    }

    const currentPdfCount = section.pdfs.length;
    const newPdfCount = pdfs.length;

    if (currentPdfCount + newPdfCount > MAX_PDFS_PER_SECTION) {
      const error = new Error(
        `Section already has ${currentPdfCount} PDF(s). Cannot add ${newPdfCount} more. Maximum ${MAX_PDFS_PER_SECTION} PDFs per section.`
      );
      error.statusCode = 400;
      error.code = 'PDF_LIMIT_EXCEEDED';
      throw error;
    }

    const pdfMetadata = pdfs.map(pdf => ({
      filename: pdf.filename,
      url: pdf.url,
      size: pdf.size,
      uploadedBy,
      uploadedAt: new Date()
    }));

    const result = await Course.findOneAndUpdate(
      { _id: courseId, 'sections._id': sectionId },
      { $push: { 'sections.$.pdfs': { $each: pdfMetadata } } },
      { new: true, runValidators: true }
    );

    if (!result) {
      const error = new Error('Failed to add PDFs to section');
      error.statusCode = 500;
      error.code = 'PDF_ADD_FAILED';
      throw error;
    }

    const updatedSection = result.sections.id(sectionId);

    logger.info('PDFs added to section', {
      courseId,
      sectionId,
      pdfCount: newPdfCount,
      uploadedBy
    });

    return updatedSection;
  } catch (error) {
    logger.error('Add PDFs to section failed', {
      courseId,
      sectionId,
      error: error.message
    });
    throw error;
  }
};

const removePdfFromSection = async (courseId, sectionId, pdfId) => {
  try {
    const course = await Course.findById(courseId);

    if (!course) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      error.code = 'COURSE_NOT_FOUND';
      throw error;
    }

    const section = course.sections.id(sectionId);

    if (!section) {
      const error = new Error('Section not found');
      error.statusCode = 404;
      error.code = 'SECTION_NOT_FOUND';
      throw error;
    }

    const pdfExists = section.pdfs.some(pdf => 
      pdf._id && pdf._id.toString() === pdfId
    );

    if (!pdfExists) {
      const error = new Error('PDF not found in section');
      error.statusCode = 404;
      error.code = 'PDF_NOT_FOUND';
      throw error;
    }

    const result = await Course.findOneAndUpdate(
      { _id: courseId, 'sections._id': sectionId },
      { $pull: { 'sections.$.pdfs': { _id: pdfId } } },
      { new: true }
    );

    if (!result) {
      const error = new Error('Failed to remove PDF from section');
      error.statusCode = 500;
      error.code = 'PDF_REMOVE_FAILED';
      throw error;
    }

    const updatedSection = result.sections.id(sectionId);

    logger.info('PDF removed from section', {
      courseId,
      sectionId,
      pdfId
    });

    return updatedSection;
  } catch (error) {
    logger.error('Remove PDF from section failed', {
      courseId,
      sectionId,
      pdfId,
      error: error.message
    });
    throw error;
  }
};

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
  hasAccessToCourse,
  addPdfsToSection,
  removePdfFromSection
};
