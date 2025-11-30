const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET) {
  logger.warn('JWT_SECRET is not set. Falling back to a default development secret. Configure JWT_SECRET for non-local environments.');
}

const resolvedJwtSecret = JWT_SECRET || 'development-jwt-secret';
const resolvedRefreshSecret = JWT_REFRESH_SECRET || resolvedJwtSecret;

module.exports = {
  JWT_SECRET: resolvedJwtSecret,
  JWT_REFRESH_SECRET: resolvedRefreshSecret
};
