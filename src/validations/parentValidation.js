const Joi = require('joi');

const parentIdSchema = Joi.string()
  .custom((value, helpers) => {
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(value);
    const isUuid = Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1', 'uuidv3'] }).validate(value).error === undefined;
    if (isObjectId || isUuid) return value;
    return helpers.error('any.invalid');
  })
  .messages({
    'any.invalid': 'Invalid parent ID format',
    'any.required': 'Parent ID is required'
  })
  .required();

const courseIdSchema = Joi.string()
  .custom((value, helpers) => {
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(value);
    const isUuid = Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1', 'uuidv3'] }).validate(value).error === undefined;
    if (isObjectId || isUuid) return value;
    return helpers.error('any.invalid');
  })
  .messages({
    'any.invalid': 'Invalid course ID format',
    'any.required': 'Course ID is required'
  })
  .required();

const parentValidation = {
  idParam: Joi.object({
    id: parentIdSchema
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
    id: parentIdSchema,
    childId: Joi.string().length(24).required()
  }),

  wishlistBody: Joi.object({
    courseId: courseIdSchema
  }),

  wishlistParams: Joi.object({
    id: parentIdSchema,
    courseId: courseIdSchema
  })
};

module.exports = parentValidation;
