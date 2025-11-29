require('dotenv').config();

const logger = require('./utils/logger');
const { loadSecretsFromManager } = require('./config/secretsManager');

const bootstrap = async () => {
  try {
    await loadSecretsFromManager();

    // Require server after secrets are loaded so env-driven configs see the injected values.
    // eslint-disable-next-line global-require
    const { Server } = require('./server');

    return new Server();
  } catch (error) {
    logger.error('Server bootstrap failed', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

if (require.main === module) {
  bootstrap();
}

module.exports = { bootstrap };
