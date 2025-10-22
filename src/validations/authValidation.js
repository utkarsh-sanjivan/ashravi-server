const Joi = require('joi');

const authValidation = {
  register: Joi.object({
    name: Joi.string().trim().max(100).required().messages({
      'string.empty': 'Name is required',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required'
    }),
    email: Joi.string().email().messages({
      'string.email': 'Please provide a valid email'
    }),
    password: Joi.string().min(8).required().messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters',
      'any.required': 'Password is required'
    }),
    phoneNumber: Joi.string().trim().messages({
      'string.empty': 'Phone number cannot be empty'
    }),
    city: Joi.string().trim(),
    economicStatus: Joi.string()
      .valid('Lower Income', 'Middle Income', 'Upper Income')
      .optional()
      .messages({
        'any.only': 'Economic status must be Lower Income, Middle Income, or Upper Income'
      }),
    occupation: Joi.string().trim()
  }).or('email', 'phoneNumber').messages({
    'object.missing': 'Either email or phone number is required'
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
  otpSend: Joi.object({
    email: Joi.string().email().messages({
      'string.email': 'Please provide a valid email'
    }),
    phoneNumber: Joi.string().trim().messages({
      'string.empty': 'Phone number cannot be empty'
    }),
    purpose: Joi.string()
      .valid('signup', 'login')
      .required()
      .messages({
        'any.only': 'Purpose must be either signup or login',
        'any.required': 'Purpose is required'
      })
  })
    .xor('email', 'phoneNumber')
    .messages({
      'object.missing': 'Either email or phone number is required',
      'object.xor': 'Provide either email or phone number, not both'
    }),
  otpVerify: Joi.object({
    email: Joi.string().email().messages({
      'string.email': 'Please provide a valid email'
    }),
    phoneNumber: Joi.string().trim().messages({
      'string.empty': 'Phone number cannot be empty'
    }),
    purpose: Joi.string()
      .valid('signup', 'login')
      .required()
      .messages({
        'any.only': 'Purpose must be either signup or login',
        'any.required': 'Purpose is required'
      }),
    otp: Joi.string()
      .pattern(/^\d{6}$/)
      .required()
      .messages({
        'string.empty': 'OTP is required',
        'any.required': 'OTP is required',
        'string.pattern.base': 'OTP must be a 6 digit code'
      })
  })
    .xor('email', 'phoneNumber')
    .messages({
      'object.missing': 'Either email or phone number is required',
      'object.xor': 'Provide either email or phone number, not both'
    }),
  updateProfile: Joi.object({
    name: Joi.string().trim().max(100).messages({
      'string.max': 'Name cannot exceed 100 characters'
    }),
    phoneNumber: Joi.string().trim(),
    city: Joi.string().trim(),
    economicStatus: Joi.string()
      .valid('Lower Income', 'Middle Income', 'Upper Income')
      .optional()
      .messages({
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
