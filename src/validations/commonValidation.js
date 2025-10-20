const Joi = require('joi');
const validator = require('validator');

// Common validation schemas that can be reused
const commonValidation = {
  // MongoDB ObjectId validation
  objectId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid ID format',
      'any.required': 'ID is required'
    }),

  // Email validation
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),

  // Password validation with complexity requirements
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),

  // Pagination validation
  pagination: {
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
      }),

    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      })
  },

  // URL validation
  url: Joi.string()
    .uri()
    .messages({
      'string.uri': 'Must be a valid URL'
    })
};

// Validation middleware factory
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        error: 'Validation error',
        message: 'Request body validation failed',
        details: errorDetails
      });
    }

    req.body = value; // Use validated and sanitized values
    next();
  };
};

// Query validation middleware factory
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        error: 'Query validation error',
        message: 'Query parameters validation failed',
        details: errorDetails
      });
    }

    req.query = value; // Use validated/transformed values
    next();
  };
};

// Params validation middleware factory
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        error: 'Parameters validation error',
        message: 'URL parameters validation failed',
        details: errorDetails
      });
    }

    req.params = value;
    next();
  };
};

const SAFE_FIELDS = new Set([
  'videoUrl', 'thumbnail', 'coverImage', 'url', 'imageUrl', 
  'videoThumbnail', 'pdfUrl', 'fileUrl', 'avatarUrl', 'profilePicture'
]);

const shouldEscapeField = (key) => {
  return !SAFE_FIELDS.has(key) && !key.toLowerCase().includes('url') && !key.toLowerCase().includes('image');
};

const sanitizeInput = (obj, parentKey = '') => {
  if (typeof obj === 'string') {
    if (shouldEscapeField(parentKey)) {
      return validator.escape(obj);
    }
    return obj;
  } else if (Array.isArray(obj)) {
    return obj.map((item, index) => sanitizeInput(item, parentKey));
  } else if (typeof obj === 'object' && obj !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeInput(value, key);
    }
    return sanitized;
  }
  return obj;
};

module.exports = {
  commonValidation,
  validateRequest,
  validateQuery,
  validateParams,
  sanitizeInput
};
