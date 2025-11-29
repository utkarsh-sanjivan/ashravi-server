const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const logger = require('../utils/logger');

const DEFAULT_PREFIX = 'asharvi/backend';

const normalizeBool = (value) => {
  if (value === undefined) return undefined;
  return String(value).toLowerCase() === 'true';
};

const getEnvironmentName = () => (
  process.env.APP_ENV
    || process.env.ENVIRONMENT
    || process.env.STAGE
    || process.env.NODE_ENV
    || 'development'
).toLowerCase();

const shouldLoadSecrets = (environment) => {
  const enabledFlag = normalizeBool(process.env.AWS_SECRETS_MANAGER_ENABLED);

  if (enabledFlag === false) {
    return false;
  }

  if (process.env.NODE_ENV === 'test' && normalizeBool(process.env.AWS_SECRETS_MANAGER_ALLOW_TESTS) !== true) {
    return false;
  }

  if (enabledFlag === true) {
    return true;
  }

  // Default: only auto-load for non-local environments unless explicitly disabled.
  return !['development', 'dev', 'local', 'test'].includes(environment);
};

const resolveSecretId = (environment) => {
  const perEnvKey = `AWS_SECRETS_MANAGER_SECRET_ID_${environment.toUpperCase()}`;
  const prefix = process.env.AWS_SECRETS_MANAGER_PREFIX || DEFAULT_PREFIX;

  return process.env.AWS_SECRETS_MANAGER_SECRET_ID
    || process.env.AWS_SECRET_ID
    || process.env[perEnvKey]
    || `${prefix}/${environment}`;
};

const applySecretsToEnv = (secrets) => {
  Object.entries(secrets).forEach(([key, value]) => {
    if (process.env[key] === undefined && value !== undefined && value !== null) {
      process.env[key] = value;
    }
  });
};

const parseSecretString = (secretString, secretId) => {
  try {
    return JSON.parse(secretString);
  } catch (error) {
    throw new Error(`Unable to parse secret ${secretId} as JSON: ${error.message}`);
  }
};

const loadSecretsFromManager = async () => {
  const environment = getEnvironmentName();

  if (!shouldLoadSecrets(environment)) {
    logger.info('Skipping AWS Secrets Manager load (disabled or not applicable).');
    return;
  }

  const secretId = resolveSecretId(environment);

  if (!secretId) {
    logger.warn('AWS_SECRETS_MANAGER_SECRET_ID not configured; skipping Secrets Manager lookup.');
    return;
  }

  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';

  try {
    const client = new SecretsManagerClient({ region });
    const response = await client.send(new GetSecretValueCommand({ SecretId: secretId }));

    const secretString = response.SecretString
      || (response.SecretBinary
        ? Buffer.from(response.SecretBinary, 'base64').toString('utf-8')
        : null);

    if (!secretString) {
      logger.warn('Secrets Manager returned empty secret; skipping load.', { secretId, environment });
      return;
    }

    const secrets = parseSecretString(secretString, secretId);
    applySecretsToEnv(secrets);

    logger.info('Loaded environment config from AWS Secrets Manager', {
      secretId,
      environment,
      keys: Object.keys(secrets)
    });
  } catch (error) {
    logger.error('Failed to load secrets from AWS Secrets Manager', {
      secretId,
      environment,
      error: error.message
    });

    if (normalizeBool(process.env.AWS_SECRETS_MANAGER_REQUIRED)) {
      throw error;
    }
  }
};

module.exports = {
  loadSecretsFromManager,
  getEnvironmentName
};
