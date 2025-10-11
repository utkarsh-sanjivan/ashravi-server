/*
 * Database Schema Definitions
 * 
 * Define all collection schemas here.
 * Each schema has a version number that increments with changes.
 */

const schemas = {
  parents: {
    version: 2,  // Increment this when schema changes
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'email', 'password', 'phoneNumber', 'city', 'occupation'],
        properties: {
          name: {
            bsonType: 'string',
            maxLength: 100,
            description: 'Parent name is required'
          },
          email: {
            bsonType: 'string',
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
            description: 'Valid email is required'
          },
          password: {
            bsonType: 'string',
            minLength: 8,
            description: 'Password must be at least 8 characters'
          },
          phoneNumber: {
            bsonType: 'string',
            description: 'Phone number is required'
          },
          city: {
            bsonType: 'string',
            description: 'City is required'
          },
          economicStatus: {
            enum: ['Lower Income', 'Middle Income', 'Upper Income'],
            description: 'Economic status is optional'
          },
          occupation: {
            bsonType: 'string',
            description: 'Occupation is required'
          },
          childrenIds: {
            bsonType: 'array',
            items: { bsonType: 'objectId' }
          },
          isActive: {
            bsonType: 'bool'
          },
          lastLogin: {
            bsonType: 'date'
          },
          refreshTokens: {
            bsonType: 'array',
            items: {
              bsonType: 'object',
              required: ['token', 'expiresAt'],
              properties: {
                token: { bsonType: 'string' },
                createdAt: { bsonType: 'date' },
                expiresAt: { bsonType: 'date' }
              }
            }
          }
        }
      }
    },
    indexes: [
      { key: { email: 1 }, unique: true, name: 'email_unique' },
      { key: { phoneNumber: 1 }, name: 'phoneNumber_index' },
      { key: { isActive: 1 }, name: 'isActive_index' },
      { key: { city: 1 }, name: 'city_index' },
      { key: { createdAt: -1 }, name: 'createdAt_desc' }
    ]
  },

  children: {
    version: 1,
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'age', 'gender', 'grade', 'parentId'],
        properties: {
          name: { bsonType: 'string', maxLength: 100 },
          age: { bsonType: 'int', minimum: 0, maximum: 18 },
          gender: { bsonType: 'string' },
          grade: { bsonType: 'string' },
          parentId: { bsonType: 'objectId' },
          courseIds: {
            bsonType: 'array',
            items: { bsonType: 'objectId' }
          }
        }
      }
    },
    indexes: [
      { key: { parentId: 1, createdAt: -1 }, name: 'parentId_createdAt' },
      { key: { name: 'text' }, name: 'name_text' },
      { key: { age: 1 }, name: 'age_index' },
      { key: { grade: 1 }, name: 'grade_index' }
    ]
  },

  childeducations: {
    version: 1,
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['childId'],
        properties: {
          childId: { bsonType: 'objectId' },
          records: {
            bsonType: 'array',
            items: {
              bsonType: 'object',
              required: ['gradeYear', 'subjects'],
              properties: {
                gradeYear: { bsonType: 'string' },
                subjects: {
                  bsonType: 'array',
                  items: {
                    bsonType: 'object',
                    required: ['subject', 'marks'],
                    properties: {
                      subject: { bsonType: 'string' },
                      marks: { bsonType: 'double', minimum: 0, maximum: 100 }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    indexes: [
      { key: { childId: 1 }, unique: true, name: 'childId_unique' }
    ]
  },

  childnutritions: {
    version: 1,
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['childId'],
        properties: {
          childId: { bsonType: 'objectId' }
        }
      }
    },
    indexes: [
      { key: { childId: 1 }, unique: true, name: 'childId_unique' }
    ]
  },

  otps: {
    version: 1,
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['otp', 'type', 'purpose', 'expiresAt'],
        properties: {
          email: { bsonType: 'string' },
          phoneNumber: { bsonType: 'string' },
          otp: { bsonType: 'string' },
          type: { enum: ['email', 'phone'] },
          purpose: { enum: ['registration', 'password-reset', 'login', 'verification'] },
          verified: { bsonType: 'bool' },
          attempts: { bsonType: 'int' },
          expiresAt: { bsonType: 'date' }
        }
      }
    },
    indexes: [
      { key: { email: 1, type: 1, purpose: 1 }, name: 'email_type_purpose' },
      { key: { phoneNumber: 1, type: 1, purpose: 1 }, name: 'phone_type_purpose' },
      { key: { createdAt: 1 }, expireAfterSeconds: 600, name: 'ttl_index' }
    ]
  }
};

module.exports = schemas;
