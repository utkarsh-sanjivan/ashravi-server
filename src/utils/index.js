/**
 * Central export hub for all utility functions
 * 
 * Utilities are helper functions used across the application
 * This file provides a single import point for all utility modules
 */

const logger = require('./logger');
const { calculateBMI, getBMICategory, validateBMI } = require('./bmiUtils');

module.exports = {
  logger,
  
  calculateBMI,
  getBMICategory,
  validateBMI
};
