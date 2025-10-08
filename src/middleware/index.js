/**
 * Central export hub for all middleware
 */

const { auth, authorize } = require('./auth');
const errorHandler = require('./errorHandler');

module.exports = {
  auth,
  authorize,
  errorHandler
};
