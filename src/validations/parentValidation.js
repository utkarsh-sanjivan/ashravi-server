const Joi = require('joi');

const parentValidation = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).trim().required(),
    phoneNumber: Joi.string().trim().required()
      .custom((value, helpers) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length < 10) {
          return helpers.error('any.invalid');
        }
        return value;
      }, 'Phone number validation')
      .messages({
        'any.invalid': 'Phone number must contain at least 10 digits'
      }),
    emailAddress: Joi.string().email().trim().lowercase().required(),
    city: Joi.string().min(2).max(100).trim().required(),
    economicStatus: Joi.string().min(2).max(50).trim().required(),
    occupation: Joi.string().min(2).max(100).trim().required()
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(100).trim(),
    phoneNumber: Joi.string().trim()
      .custom((value, helpers) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length < 10) {
          return helpers.error('any.invalid');
        }
        return value;
      }, 'Phone number validation')
      .messages({
        'any.invalid': 'Phone number must contain at least 10 digits'
      }),
    emailAddress: Joi.string().email().trim().lowercase(),
    city: Joi.string().min(2).max(100).trim(),
    economicStatus: Joi.string().min(2).max(50).trim(),
    occupation: Joi.string().min(2).max(100).trim()
  }).min(1),

  childOperation: Joi.object({
    childId: Joi.string().length(24).required()
  }),

  idParam: Joi.object({
    id: Joi.string().length(24).required()
  }),

  cityQuery: Joi.object({
    city: Joi.string().min(2).max(100).trim().required(),
    limit: Joi.number().integer().min(1).max(100).default(100),
    skip: Joi.number().integer().min(0).default(0)
  }),

  emailQuery: Joi.object({
    email: Joi.string().email().trim().lowercase().required()
  })
};

module.exports = parentValidation;
