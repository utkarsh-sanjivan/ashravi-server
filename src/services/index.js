/**
 * Central export hub for all services
 * 
 * Services contain business logic and orchestrate operations
 * This file provides a single import point for all service layers
 */

const authService = require('./authService');
const assessmentService = require('./assessmentService');
const childService = require('./childService');
const childEducationService = require('./childEducationService');
const childNutritionService = require('./childNutritionService');
const courseService = require('./courseService');
const parentService = require('./parentService');
const questionService = require('./questionService');
const otpService = require('./otpService');

module.exports = {
  authService,
  assessmentService,
  childService,
  childEducationService,
  childNutritionService,
  courseService,
  parentService,
  questionService,
  otpService
};
