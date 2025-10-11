#!/usr/bin/env node

/*
 * Database Migration CLI
 * 
 * Usage:
 *   npm run migrate              - Run all pending migrations
 *   npm run migrate:status       - Check migration status
 *   npm run migrate:rollback     - Rollback last migration
 */

require('dotenv').config();
const MigrationEngine = require('../migrations/migrationEngine');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'ashravi-dev';

const command = process.argv[2] || 'migrate';

(async () => {
  const engine = new MigrationEngine(MONGO_URI, DB_NAME);
  
  try {
    await engine.connect();
    
    switch (command) {
      case 'migrate':
        await engine.migrateAll();
        break;
        
      case 'status':
        const status = await engine.getMigrationStatus();
        console.log('\n📊 Migration Status:\n');
        console.log(JSON.stringify(status, null, 2));
        break;
        
      case 'rollback':
        const collection = process.argv[3];
        const version = parseInt(process.argv[4]);
        
        if (!collection || !version) {
          console.error('Usage: npm run migrate:rollback <collection> <version>');
          process.exit(1);
        }
        
        await engine.rollback(collection, version);
        break;
        
      default:
        console.error(`Unknown command: ${command}`);
        console.log('Available commands: migrate, status, rollback');
        process.exit(1);
    }
    
    await engine.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    await engine.close();
    process.exit(1);
  }
})();
