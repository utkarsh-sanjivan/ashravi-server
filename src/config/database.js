const { ListTablesCommand } = require('@aws-sdk/client-dynamodb');
const { dynamoDocClient } = require('../db/dynamodbClient');
const logger = require('../utils/logger');

class DatabaseConfig {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    try {
      if (this.isConnected) {
        logger.info('DynamoDB already initialized');
        return;
      }

      await dynamoDocClient.send(new ListTablesCommand({ Limit: 1 }));
      this.isConnected = true;
      logger.info('DynamoDB client initialized');
    } catch (error) {
      this.isConnected = false;
      logger.error('DynamoDB initialization failed', { error: error.message });
      throw error;
    }
  }

  async disconnect() {
    this.isConnected = false;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected
    };
  }

  async healthCheck() {
    try {
      await dynamoDocClient.send(new ListTablesCommand({ Limit: 1 }));
      this.isConnected = true;
      return {
        status: 'healthy',
        connection: this.getConnectionStatus(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.isConnected = false;
      return {
        status: 'unhealthy',
        error: error.message,
        connection: this.getConnectionStatus(),
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new DatabaseConfig();
