/*
 * Database Migration Engine
 * 
 * Handles schema updates, validation changes, and data transformations
 */

const { MongoClient } = require('mongodb');
const schemas = require('./config/schemas');

class MigrationEngine {
  constructor(mongoUri, dbName) {
    this.mongoUri = mongoUri;
    this.dbName = dbName;
    this.client = null;
    this.db = null;
  }

  async connect() {
    console.log('🔌 Connecting to MongoDB...');
    this.client = await MongoClient.connect(this.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    this.db = this.client.db(this.dbName);
    console.log(`✅ Connected to database: ${this.dbName}`);
  }

  async close() {
    if (this.client) {
      await this.client.close();
      console.log('🔌 Database connection closed');
    }
  }

  async initializeMigrationTracking() {
    console.log('\n📋 Initializing migration tracking...');
    
    try {
      const collections = await this.db.listCollections({ name: 'migrations' }).toArray();
      
      if (collections.length === 0) {
        // Create collection with validator only (no indexes here)
        await this.db.createCollection('migrations', {
          validator: {
            $jsonSchema: {
              bsonType: 'object',
              required: ['version', 'collection', 'appliedAt', 'status'],
              properties: {
                version: {
                  bsonType: 'int',
                  description: 'Schema version number'
                },
                collection: {
                  bsonType: 'string',
                  description: 'Collection name'
                },
                appliedAt: {
                  bsonType: 'date',
                  description: 'When migration was applied'
                },
                status: {
                  enum: ['pending', 'applied', 'failed', 'rolled_back'],
                  description: 'Migration status'
                },
                error: {
                  bsonType: 'string',
                  description: 'Error message if failed'
                },
                executionTime: {
                  bsonType: 'int',
                  description: 'Execution time in milliseconds'
                }
              }
            }
          }
        });
        
        // Create indexes separately
        const migrationsCollection = this.db.collection('migrations');
        await migrationsCollection.createIndexes([
          { 
            key: { collection: 1, version: 1 }, 
            unique: true, 
            name: 'collection_version_unique' 
          },
          { 
            key: { appliedAt: -1 }, 
            name: 'appliedAt_desc' 
          },
          { 
            key: { status: 1 }, 
            name: 'status_index' 
          }
        ]);
        
        console.log('✅ Migration tracking collection created');
      } else {
        console.log('ℹ️  Migration tracking already exists');
      }
    } catch (error) {
      console.error('❌ Failed to initialize migration tracking:', error.message);
      throw error;
    }
  }

  async getCurrentVersion(collectionName) {
    const migration = await this.db.collection('migrations')
      .findOne(
        { collection: collectionName, status: 'applied' },
        { sort: { version: -1 } }
      );
    
    return migration ? migration.version : 0;
  }

  async recordMigration(collectionName, version, status, executionTime, error = null) {
    await this.db.collection('migrations').insertOne({
      collection: collectionName,
      version,
      appliedAt: new Date(),
      status,
      executionTime,
      ...(error && { error: error.message })
    });
  }

  async updateCollectionValidator(collectionName, validator) {
    console.log(`  📝 Updating validator for ${collectionName}...`);
    
    try {
      await this.db.command({
        collMod: collectionName,
        validator: validator,
        validationLevel: 'moderate',
        validationAction: 'warn'
      });
      console.log(`  ✅ Validator updated for ${collectionName}`);
    } catch (error) {
      if (error.code === 26) {
        console.log(`  ℹ️  Collection ${collectionName} doesn't exist, creating...`);
        // Create collection with validator only
        await this.db.createCollection(collectionName, { validator });
        console.log(`  ✅ Collection ${collectionName} created with validator`);
      } else {
        throw error;
      }
    }
  }

  async updateCollectionIndexes(collectionName, indexes) {
    console.log(`  📊 Updating indexes for ${collectionName}...`);
    
    const collection = this.db.collection(collectionName);
    
    try {
      // Get existing indexes
      const existingIndexes = await collection.indexes();
      const existingIndexNames = existingIndexes.map(idx => idx.name).filter(name => name !== '_id_');
      
      // Drop indexes that no longer exist in schema
      for (const indexName of existingIndexNames) {
        const stillExists = indexes.some(idx => idx.name === indexName);
        if (!stillExists) {
          try {
            console.log(`  🗑️  Dropping old index: ${indexName}`);
            await collection.dropIndex(indexName);
          } catch (err) {
            console.log(`  ⚠️  Could not drop index ${indexName}: ${err.message}`);
          }
        }
      }
      
      // Create new indexes
      for (const indexSpec of indexes) {
        try {
          const indexOptions = {
            name: indexSpec.name,
            unique: indexSpec.unique || false
          };
          
          // Add expireAfterSeconds if specified (for TTL indexes)
          if (indexSpec.expireAfterSeconds !== undefined) {
            indexOptions.expireAfterSeconds = indexSpec.expireAfterSeconds;
          }
          
          await collection.createIndex(indexSpec.key, indexOptions);
          console.log(`  ✅ Index created/updated: ${indexSpec.name}`);
        } catch (error) {
          if (error.code === 85 || error.code === 86) {
            // Index exists with different options
            console.log(`  ⚠️  Index ${indexSpec.name} exists with different options, recreating...`);
            try {
              await collection.dropIndex(indexSpec.name);
              
              const indexOptions = {
                name: indexSpec.name,
                unique: indexSpec.unique || false
              };
              
              if (indexSpec.expireAfterSeconds !== undefined) {
                indexOptions.expireAfterSeconds = indexSpec.expireAfterSeconds;
              }
              
              await collection.createIndex(indexSpec.key, indexOptions);
              console.log(`  ✅ Index recreated: ${indexSpec.name}`);
            } catch (recreateError) {
              console.log(`  ⚠️  Could not recreate index: ${recreateError.message}`);
            }
          } else if (error.code === 11000) {
            console.log(`  ℹ️  Index ${indexSpec.name} already exists`);
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error(`  ❌ Error updating indexes: ${error.message}`);
      throw error;
    }
  }

  async migrateCollection(collectionName, schema) {
    const currentVersion = await this.getCurrentVersion(collectionName);
    const targetVersion = schema.version;

    if (currentVersion >= targetVersion) {
      console.log(`\n✓ ${collectionName}: Already at version ${currentVersion} (target: ${targetVersion})`);
      return;
    }

    console.log(`\n🔄 Migrating ${collectionName}: v${currentVersion} → v${targetVersion}`);
    
    const startTime = Date.now();
    
    try {
      // Update validator
      await this.updateCollectionValidator(collectionName, schema.validator);
      
      // Update indexes
      if (schema.indexes && schema.indexes.length > 0) {
        await this.updateCollectionIndexes(collectionName, schema.indexes);
      }
      
      // Run custom data migration if exists
      const migrationScript = `./scripts/${collectionName}_v${targetVersion}.js`;
      try {
        const customMigration = require(migrationScript);
        console.log(`  🔧 Running custom migration script...`);
        await customMigration(this.db, collectionName);
        console.log(`  ✅ Custom migration completed`);
      } catch (error) {
        if (error.code !== 'MODULE_NOT_FOUND') {
          throw error;
        }
        // No custom migration script, that's okay
      }
      
      const executionTime = Date.now() - startTime;
      await this.recordMigration(collectionName, targetVersion, 'applied', executionTime);
      
      console.log(`✅ ${collectionName} migrated successfully (${executionTime}ms)`);
    } catch (error) {
      const executionTime = Date.now() - startTime;
      await this.recordMigration(collectionName, targetVersion, 'failed', executionTime, error);
      console.error(`❌ Migration failed for ${collectionName}:`, error.message);
      throw error;
    }
  }

  async migrateAll() {
    console.log('\n🚀 Starting database migration...\n');
    
    await this.initializeMigrationTracking();
    
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;
    
    for (const [collectionName, schema] of Object.entries(schemas)) {
      try {
        const currentVersion = await this.getCurrentVersion(collectionName);
        
        if (currentVersion >= schema.version) {
          skipCount++;
        } else {
          await this.migrateCollection(collectionName, schema);
          successCount++;
        }
      } catch (error) {
        failCount++;
        console.error(`\n❌ Failed to migrate ${collectionName}:`, error.message);
        
        if (process.env.MIGRATION_FAIL_FAST === 'true') {
          throw error;
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log('='.repeat(60));
    
    if (failCount > 0) {
      throw new Error(`Migration completed with ${failCount} failures`);
    }
  }

  async getMigrationStatus() {
    const migrations = await this.db.collection('migrations')
      .find({})
      .sort({ collection: 1, version: -1 })
      .toArray();
    
    const status = {};
    
    for (const [collectionName, schema] of Object.entries(schemas)) {
      const currentVersion = await this.getCurrentVersion(collectionName);
      status[collectionName] = {
        currentVersion,
        targetVersion: schema.version,
        upToDate: currentVersion >= schema.version,
        history: migrations.filter(m => m.collection === collectionName)
      };
    }
    
    return status;
  }

  async rollback(collectionName, toVersion) {
    console.log(`\n⏪ Rolling back ${collectionName} to version ${toVersion}...`);
    
    // This is a placeholder - implement rollback logic based on your needs
    console.log('⚠️  Rollback not implemented yet');
    throw new Error('Rollback functionality not implemented');
  }
}

module.exports = MigrationEngine;
