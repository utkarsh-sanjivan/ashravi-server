const instructorService = require('../services/instructorService');
const { sanitizeInput } = require('../validations/commonValidation');

const createInstructor = async (req, res, next) => {
  try {
    const sanitizedData = sanitizeInput(req.body);
    const instructor = await instructorService.createInstructor(sanitizedData);

    res.status(201).json({
      success: true,
      message: 'Instructor created successfully',
      data: instructor
    });
  } catch (error) {
    next(error);
  }
};

const getInstructor = async (req, res, next) => {
  try {
    const instructor = await instructorService.getInstructor(req.params.id);
    res.json({
      success: true,
      data: instructor
    });
  } catch (error) {
    next(error);
  }
};

const getInstructors = async (req, res, next) => {
  try {
    const filters = {
      isActive: req.query.isActive,
      expertise: req.query.expertise,
      search: req.query.search
    };

    if (filters.isActive !== undefined) {
      filters.isActive = filters.isActive === true || filters.isActive === 'true';
    } else {
      delete filters.isActive;
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';

    const result = await instructorService.listInstructors(filters, page, limit, sortBy, sortOrder);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

const updateInstructor = async (req, res, next) => {
  try {
    const sanitizedData = sanitizeInput(req.body);
    const instructor = await instructorService.updateInstructor(req.params.id, sanitizedData);
    res.json({
      success: true,
      message: 'Instructor updated successfully',
      data: instructor
    });
  } catch (error) {
    next(error);
  }
};

const deleteInstructor = async (req, res, next) => {
  try {
    await instructorService.removeInstructor(req.params.id);
    res.json({
      success: true,
      message: 'Instructor deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInstructor,
  getInstructor,
  getInstructors,
  updateInstructor,
  deleteInstructor
};
