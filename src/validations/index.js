/**
 * Central export hub for all validation schemas
 * 
 * Validations use Joi schemas for request validation
 * This file provides a single import point for all validation modules
 */

const assessmentValidation = require('./assessmentValidation');
const authValidation = require('./authValidation');
const childValidation = require('./childValidation');
const childEducationValidation = require('./childEducationValidation');
const childNutritionValidation = require('./childNutritionValidation');
const { validateRequest, validateParams, validateQuery, sanitizeInput } = require('./commonValidation');
const courseValidation = require('./courseValidation');
const parentValidation = require('./parentValidation');
const questionValidation = require('./questionValidation');
const instructorValidation = require('./instructorValidation');

module.exports = {
  assessmentValidation,
  authValidation,
  childValidation,
  childEducationValidation,
  childNutritionValidation,
  
  validateRequest,
  validateParams,
  validateQuery,
  sanitizeInput,
  
  courseValidation,
  parentValidation,
  questionValidation,
  instructorValidation
};
