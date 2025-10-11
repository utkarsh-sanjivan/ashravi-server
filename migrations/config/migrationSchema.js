/*
 * Migration tracking collection schema
 * 
 * Tracks which migrations have been applied to the database
 */

const migrationSchema = {
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
  },
  indexes: [
    { key: { collection: 1, version: 1 }, unique: true, name: 'collection_version_unique' },
    { key: { appliedAt: -1 }, name: 'appliedAt_desc' },
    { key: { status: 1 }, name: 'status_index' }
  ]
};

module.exports = migrationSchema;
