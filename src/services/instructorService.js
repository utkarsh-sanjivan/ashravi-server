const instructorRepository = require('../repositories/instructorRepository');
const logger = require('../utils/logger');

const createInstructor = async (data) => {
  try {
    if (data.email) {
      const existing = await instructorRepository.getInstructorByEmail(data.email);
      if (existing) {
        const error = new Error('Instructor with this email already exists');
        error.statusCode = 409;
        error.code = 'INSTRUCTOR_DUPLICATE_EMAIL';
        throw error;
      }
    }

    const created = await instructorRepository.createInstructor(data);
    logger.info('Instructor service created instructor', { instructorId: created.id });
    return created;
  } catch (error) {
    logger.error('Instructor service failed to create instructor', {
      error: error.message,
      data
    });
    throw error;
  }
};

const getInstructor = async (id) => {
  const instructor = await instructorRepository.getInstructorById(id);
  if (!instructor) {
    const error = new Error(`Instructor with ID ${id} not found`);
    error.statusCode = 404;
    error.code = 'INSTRUCTOR_NOT_FOUND';
    throw error;
  }
  return instructor;
};

const listInstructors = async (filters, page, limit, sortBy, sortOrder) => {
  try {
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    return await instructorRepository.getInstructors(filters, page, limit, sort);
  } catch (error) {
    logger.error('Instructor service failed to list instructors', {
      error: error.message,
      filters
    });
    throw error;
  }
};

const updateInstructor = async (id, data) => {
  try {
    const instructor = await instructorRepository.updateInstructor(id, data);
    if (!instructor) {
      const error = new Error(`Instructor with ID ${id} not found`);
      error.statusCode = 404;
      error.code = 'INSTRUCTOR_NOT_FOUND';
      throw error;
    }
    return instructor;
  } catch (error) {
    logger.error('Instructor service failed to update instructor', {
      instructorId: id,
      error: error.message,
      data
    });
    throw error;
  }
};

const removeInstructor = async (id) => {
  try {
    const deleted = await instructorRepository.deleteInstructor(id);
    if (!deleted) {
      const error = new Error(`Instructor with ID ${id} not found`);
      error.statusCode = 404;
      error.code = 'INSTRUCTOR_NOT_FOUND';
      throw error;
    }
    return deleted;
  } catch (error) {
    logger.error('Instructor service failed to delete instructor', {
      instructorId: id,
      error: error.message
    });
    throw error;
  }
};

module.exports = {
  createInstructor,
  getInstructor,
  listInstructors,
  updateInstructor,
  removeInstructor
};
