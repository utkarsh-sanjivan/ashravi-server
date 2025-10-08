/**
 * Central export hub for all repositories
 * 
 * Repositories handle direct database operations
 * This file provides a single import point for all data access layers
 */

const childRepository = require('./childRepository');
const childEducationRepository = require('./childEducationRepository');
const childNutritionRepository = require('./childNutritionRepository');
const courseRepository = require('./courseRepository');
const courseProgressRepository = require('./courseProgressRepository');
const parentRepository = require('./parentRepository');
const questionRepository = require('./questionRepository');

module.exports = {
  childRepository,
  childEducationRepository,
  childNutritionRepository,
  courseRepository,
  courseProgressRepository,
  parentRepository,
  questionRepository
};
