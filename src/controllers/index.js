/**
 * Central export hub for all controllers
 */

const authController = require('./authController');
const assessmentController = require('./assessmentController');
const childController = require('./childController');
const childEducationController = require('./childEducationController');
const childNutritionController = require('./childNutritionController');
const courseController = require('./courseController');
const instructorController = require('./instructorController');
const parentController = require('./parentController');
const questionController = require('./questionController');

module.exports = {
  authController,
  assessmentController,
  childController,
  childEducationController,
  childNutritionController,
  courseController,
  instructorController,
  parentController,
  questionController
};
