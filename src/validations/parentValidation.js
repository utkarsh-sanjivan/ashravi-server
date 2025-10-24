const Joi = require('joi');

const parentValidation = {
  idParam: Joi.object({
    id: Joi.string().length(24).required().messages({
      'string.length': 'Invalid parent ID format',
      'any.required': 'Parent ID is required'
    })
  }),

  cityParam: Joi.object({
    city: Joi.string().trim().required().messages({
      'string.empty': 'City is required',
      'any.required': 'City is required'
    })
  }),

  paginationQuery: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(100),
    skip: Joi.number().integer().min(0).default(0)
  }),

  removeChildParams: Joi.object({
    id: Joi.string().length(24).required(),
    childId: Joi.string().length(24).required()
  }),

  wishlistBody: Joi.object({
    courseId: Joi.string().length(24).required().messages({
      'string.length': 'Invalid course ID format',
      'any.required': 'Course ID is required'
    })
  }),

  wishlistParams: Joi.object({
    id: Joi.string().length(24).required().messages({
      'string.length': 'Invalid parent ID format',
      'any.required': 'Parent ID is required'
    }),
    courseId: Joi.string().length(24).required().messages({
      'string.length': 'Invalid course ID format',
      'any.required': 'Course ID is required'
    })
  })
};

module.exports = parentValidation;
