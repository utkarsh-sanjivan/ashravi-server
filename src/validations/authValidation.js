const Joi = require('joi');

const authValidation = {
  register: Joi.object({
    name: Joi.string().trim().max(100).required().messages({
      'string.empty': 'Name is required',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required'
    }),
    email: Joi.string().email().required().messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).required().messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters',
      'any.required': 'Password is required'
    }),
    phoneNumber: Joi.string().trim().required().messages({
      'string.empty': 'Phone number is required',
      'any.required': 'Phone number is required'
    }),
    city: Joi.string().trim().required().messages({
      'string.empty': 'City is required',
      'any.required': 'City is required'
    }),
    economicStatus: Joi.string()
      .valid('Lower Income', 'Middle Income', 'Upper Income')
      .required()
      .messages({
        'any.only': 'Economic status must be Lower Income, Middle Income, or Upper Income',
        'any.required': 'Economic status is required'
      }),
    occupation: Joi.string().trim().required().messages({
      'string.empty': 'Occupation is required',
      'any.required': 'Occupation is required'
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    })
  }),

  updateProfile: Joi.object({
    name: Joi.string().trim().max(100).messages({
      'string.max': 'Name cannot exceed 100 characters'
    }),
    phoneNumber: Joi.string().trim(),
    city: Joi.string().trim(),
    economicStatus: Joi.string().valid('Lower Income', 'Middle Income', 'Upper Income').messages({
      'any.only': 'Economic status must be Lower Income, Middle Income, or Upper Income'
    }),
    occupation: Joi.string().trim()
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'string.empty': 'Current password is required',
      'any.required': 'Current password is required'
    }),
    newPassword: Joi.string().min(8).required().messages({
      'string.empty': 'New password is required',
      'string.min': 'New password must be at least 8 characters',
      'any.required': 'New password is required'
    })
  }),

  refresh: Joi.object({
    refreshToken: Joi.string().required().messages({
      'string.empty': 'Refresh token is required',
      'any.required': 'Refresh token is required'
    })
  }),

  verify: Joi.object({
    token: Joi.string().required().messages({
      'string.empty': 'Token is required',
      'any.required': 'Token is required'
    })
  })
};

module.exports = authValidation;
