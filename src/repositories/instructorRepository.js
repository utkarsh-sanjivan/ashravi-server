const mongoose = require('mongoose');
const Instructor = require('../models/Instructor');
const logger = require('../utils/logger');

const IMMUTABLE_FIELDS = new Set(['_id', 'createdAt', 'updatedAt', 'email']);

const formatDocument = (document) => {
  if (!document) {
    return null;
  }
  const formatted = document.toObject ? document.toObject() : { ...document };
  formatted.id = formatted._id.toString();
  return formatted;
};

const validateObjectId = (id) => {
  try {
    return mongoose.Types.ObjectId.isValid(id) ? id : null;
  } catch (error) {
    logger.warn('Invalid ObjectId provided for instructor repository', { id, error: error.message });
    return null;
  }
};

const createInstructor = async (data) => {
  try {
    const instructor = new Instructor(data);
    const saved = await instructor.save();
    logger.info('Instructor created', { instructorId: saved._id });
    return formatDocument(saved);
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      const duplicateError = new Error('Instructor with this email already exists');
      duplicateError.statusCode = 409;
      duplicateError.code = 'INSTRUCTOR_DUPLICATE_EMAIL';
      throw duplicateError;
    }
    logger.error('Failed to create instructor', { error: error.message, data });
    throw error;
  }
};

const getInstructorById = async (id) => {
  try {
    const objectId = validateObjectId(id);
    if (!objectId) {
      return null;
    }
    const instructor = await Instructor.findById(objectId).lean();
    return formatDocument(instructor);
  } catch (error) {
    logger.error('Failed to get instructor by id', { id, error: error.message });
    throw error;
  }
};

const getInstructorByEmail = async (email) => {
  try {
    if (!email) {
      return null;
    }
    const instructor = await Instructor.findOne({ email: email.toLowerCase().trim() }).lean();
    return formatDocument(instructor);
  } catch (error) {
    logger.error('Failed to get instructor by email', { email, error: error.message });
    throw error;
  }
};

const getInstructors = async (filters = {}, page = 1, limit = 20, sort = { createdAt: -1 }) => {
  try {
    const query = {};

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters.expertise) {
      query.expertiseAreas = { $in: Array.isArray(filters.expertise) ? filters.expertise : [filters.expertise] };
    }

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ];
    }

    const skip = (page - 1) * limit;

    const [instructors, total] = await Promise.all([
      Instructor.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Instructor.countDocuments(query)
    ]);

    return {
      data: instructors.map(formatDocument),
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
    logger.error('Failed to list instructors', { filters, error: error.message });
    throw error;
  }
};

const updateInstructor = async (id, data) => {
  try {
    const objectId = validateObjectId(id);
    if (!objectId) {
      return null;
    }

    Object.keys(data).forEach((key) => {
      if (IMMUTABLE_FIELDS.has(key)) {
        delete data[key];
      }
    });

    const updated = await Instructor.findByIdAndUpdate(
      objectId,
      { $set: data },
      { new: true, runValidators: true }
    ).lean();

    return formatDocument(updated);
  } catch (error) {
    logger.error('Failed to update instructor', { id, error: error.message, data });
    throw error;
  }
};

const deleteInstructor = async (id) => {
  try {
    const objectId = validateObjectId(id);
    if (!objectId) {
      return false;
    }

    const updated = await Instructor.findByIdAndUpdate(
      objectId,
      { $set: { isActive: false } },
      { new: true }
    ).lean();

    if (!updated) {
      return false;
    }

    logger.info('Instructor marked inactive', { instructorId: id });
    return true;
  } catch (error) {
    logger.error('Failed to delete instructor', { id, error: error.message });
    throw error;
  }
};

module.exports = {
  createInstructor,
  getInstructorById,
  getInstructorByEmail,
  getInstructors,
  updateInstructor,
  deleteInstructor
};
