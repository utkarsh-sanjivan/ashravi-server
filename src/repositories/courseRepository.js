const Course = require('../models/Course');
const CourseProgress = require('../models/CourseProgress');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const { decodeUrls } = require('../utils/urlUtils');

const IMMUTABLE_FIELDS = new Set(['_id', 'id', 'createdAt', 'enrollmentCount', 'slug']);

/**
 * Validate MongoDB ObjectId
 * 
 * @params {idString}: string - ID to validate
 * @returns Valid ObjectId or null
 */
const validateObjectId = (idString) => {
  try {
    return mongoose.Types.ObjectId.isValid(idString) ? idString : null;
  } catch (error) {
    logger.warn('Invalid ObjectId format', { idString, error: error.message });
    return null;
  }
};

/**
 * Format document for response
 * 
 * @params {document}: object - MongoDB document
 * @returns Formatted document with id field
 */
const formatDocument = (document) => {
  if (!document) return document;
  const formatted = document.toObject ? document.toObject() : { ...document };
  formatted.id = formatted._id.toString();
  return decodeUrls(formatted);
};

/**
 * Create new course
 * 
 * @params {data}: object - Course data
 * @returns Created course
 */
const createCourse = async (data) => {
  try {
    const course = new Course(data);
    const saved = await course.save();
    logger.info('Created course', { id: saved._id, title: data.title });
    return formatDocument(saved);
  } catch (error) {
    if (error.code === 11000) {
      logger.warn('Duplicate course slug', { data });
      const duplicateError = new Error('Course with this slug already exists');
      duplicateError.statusCode = 409;
      duplicateError.code = 'DUPLICATE_SLUG';
      throw duplicateError;
    }
    logger.error('Error creating course', { error: error.message, data });
    throw error;
  }
};

/**
 * Get course by ID
 * 
 * @params {courseId}: string - Course ID
 * @params {populate}: boolean - Whether to populate instructor
 * @returns Course or null
 */
const getCourse = async (courseId, populate = false) => {
  try {
    const objectId = validateObjectId(courseId);
    if (!objectId) return null;

    let query = Course.findById(objectId);
    if (populate) {
      query = query.populate('instructor', 'firstName lastName email profileImage expertiseAreas yearsOfExperience isActive');
    }

    const course = await query.lean();
    return course ? formatDocument(course) : null;
  } catch (error) {
    logger.error('Error fetching course', { courseId, error: error.message });
    throw error;
  }
};

/**
 * Get course by slug
 * 
 * @params {slug}: string - Course slug
 * @params {populate}: boolean - Whether to populate instructor
 * @returns Course or null
 */
const getCourseBySlug = async (slug, populate = false) => {
  try {
    let query = Course.findOne({ slug });
    if (populate) {
      query = query.populate('instructor', 'firstName lastName email profileImage expertiseAreas yearsOfExperience isActive');
    }

    const course = await query.lean();
    return course ? formatDocument(course) : null;
  } catch (error) {
    logger.error('Error fetching course by slug', { slug, error: error.message });
    throw error;
  }
};

/**
 * Get courses with pagination and filters
 * 
 * @params {filters}: object - Filter criteria
 * @params {page}: number - Page number
 * @params {limit}: number - Results per page
 * @params {sort}: object - Sort criteria
 * @returns Paginated courses with metadata
 */
const getCourses = async (filters = {}, page = 1, limit = 20, sort = { createdAt: -1 }) => {
  try {
    const skip = (page - 1) * limit;
    
    const query = {};
    
    if (filters.category) {
      query.category = filters.category;
    }
    
    if (filters.level) {
      query.level = filters.level;
    }
    
    if (filters.isPublished !== undefined) {
      query.isPublished = filters.isPublished;
    }
    
    if (filters.instructor) {
      query.instructor = filters.instructor;
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }
    
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query['price.amount'] = {};
      if (filters.minPrice !== undefined) {
        query['price.amount'].$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        query['price.amount'].$lte = filters.maxPrice;
      }
    }
    
    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate('instructor', 'firstName lastName email profileImage expertiseAreas yearsOfExperience isActive')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments(query)
    ]);

    const formattedCourses = courses.map(formatDocument);

    return {
      data: formattedCourses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  } catch (error) {
    logger.error('Error fetching courses', { filters, error: error.message });
    throw error;
  }
};

/**
 * Update course
 * 
 * @params {courseId}: string - Course ID
 * @params {data}: object - Update data
 * @returns Updated course
 */
const updateCourse = async (courseId, data) => {
  try {
    const objectId = validateObjectId(courseId);
    if (!objectId) return null;

    if (!data || Object.keys(data).length === 0) {
      return await getCourse(courseId);
    }

    const sanitizedData = {};
    for (const [key, value] of Object.entries(data)) {
      if (!IMMUTABLE_FIELDS.has(key)) {
        sanitizedData[key] = value;
      }
    }

    const updated = await Course.findByIdAndUpdate(
      objectId,
      { $set: sanitizedData },
      { new: true, runValidators: true }
    ).populate('instructor', 'firstName lastName email profileImage expertiseAreas yearsOfExperience isActive').lean();

    if (!updated) {
      logger.warn('Course not found for update', { courseId });
      return null;
    }

    logger.info('Course updated', { courseId });
    return formatDocument(updated);
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
    const objectId = validateObjectId(courseId);
    if (!objectId) return false;

    const result = await Course.findByIdAndDelete(objectId);
    
    if (result) {
      await CourseProgress.deleteMany({ courseId: objectId });
      logger.info('Course and progress deleted', { courseId });
      return true;
    }
    
    logger.warn('Course not found for deletion', { courseId });
    return false;
  } catch (error) {
    logger.error('Error deleting course', { courseId, error: error.message });
    throw error;
  }
};

/**
 * Increment enrollment count
 * 
 * @params {courseId}: string - Course ID
 * @returns Updated course
 */
const incrementEnrollment = async (courseId) => {
  try {
    const objectId = validateObjectId(courseId);
    if (!objectId) return null;

    const updated = await Course.findByIdAndUpdate(
      objectId,
      { $inc: { enrollmentCount: 1 } },
      { new: true }
    ).lean();

    return updated ? formatDocument(updated) : null;
  } catch (error) {
    logger.error('Error incrementing enrollment', { courseId, error: error.message });
    throw error;
  }
};

module.exports = {
  createCourse,
  getCourse,
  getCourseBySlug,
  getCourses,
  updateCourse,
  deleteCourse,
  incrementEnrollment
};
