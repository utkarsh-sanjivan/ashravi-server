/**
 * MongoDB Database Initialization Script
 * 
 * This script initializes the Ashravi system database with:
 * - All required collections
 * - Schema validation rules
 * - Indexes for performance
 * - Initial seed data (optional)
 * 
 * Usage:
 *   node scripts/initMongoDB.js
 * 
 * Environment Variables Required:
 *   MONGO_URI - MongoDB connection string
 *   DB_NAME - Database name (default: ashravi-dev)
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'ashravi-dev';

class MongoDBInitializer {
  constructor() {
    this.client = null;
    this.db = null;
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    console.log('🔌 Connecting to MongoDB...');
    this.client = await MongoClient.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    this.db = this.client.db(DB_NAME);
    console.log(`✅ Connected to database: ${DB_NAME}`);
  }

  /**
   * Initialize Parents collection
   */
  async initParentsCollection() {
    console.log('\n📋 Initializing Parents collection...');
    
    const collectionName = 'parents';
    
    try {
      await this.db.createCollection(collectionName, {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'email', 'password', 'phoneNumber', 'city', 'economicStatus', 'occupation'],
            properties: {
              name: {
                bsonType: 'string',
                maxLength: 100,
                description: 'Parent name is required and must be a string'
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
                description: 'Economic status must be one of the enum values'
              },
              occupation: {
                bsonType: 'string',
                description: 'Occupation is required'
              },
              childrenIds: {
                bsonType: 'array',
                items: {
                  bsonType: 'objectId'
                },
                description: 'Array of child ObjectIds'
              },
              isActive: {
                bsonType: 'bool',
                description: 'Account active status'
              },
              lastLogin: {
                bsonType: 'date',
                description: 'Last login timestamp'
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
        }
      });

      // Create indexes
      await this.db.collection(collectionName).createIndexes([
        { key: { email: 1 }, unique: true, name: 'email_unique' },
        { key: { phoneNumber: 1 }, name: 'phoneNumber_index' },
        { key: { isActive: 1 }, name: 'isActive_index' },
        { key: { city: 1 }, name: 'city_index' },
        { key: { createdAt: -1 }, name: 'createdAt_desc' }
      ]);

      console.log('✅ Parents collection initialized with validation and indexes');
    } catch (error) {
      if (error.code === 48) {
        console.log('ℹ️  Parents collection already exists');
      } else {
        throw error;
      }
    }
  }

  /**
   * Initialize Children collection
   */
  async initChildrenCollection() {
    console.log('\n📋 Initializing Children collection...');
    
    const collectionName = 'children';
    
    try {
      await this.db.createCollection(collectionName, {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'age', 'gender', 'grade', 'parentId'],
            properties: {
              name: {
                bsonType: 'string',
                maxLength: 100,
                description: 'Child name is required'
              },
              age: {
                bsonType: 'int',
                minimum: 0,
                maximum: 18,
                description: 'Age must be between 0 and 18'
              },
              gender: {
                bsonType: 'string',
                description: 'Gender is required'
              },
              grade: {
                bsonType: 'string',
                description: 'Grade is required'
              },
              parentId: {
                bsonType: 'objectId',
                description: 'Parent reference is required'
              },
              courseIds: {
                bsonType: 'array',
                items: {
                  bsonType: 'objectId'
                },
                description: 'Array of enrolled course IDs'
              },
              assessmentResults: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  required: ['assessmentId', 'method', 'assessmentDate'],
                  properties: {
                    assessmentId: { bsonType: 'string' },
                    method: { 
                      enum: ['weighted_average', 't_score_non_weighted', 't_score_weighted']
                    },
                    assessmentDate: { bsonType: 'date' },
                    conductedBy: { bsonType: 'objectId' },
                    issues: { bsonType: 'array' },
                    primaryConcerns: { bsonType: 'array' },
                    overallSummary: { bsonType: 'string' },
                    recommendations: { bsonType: 'array' },
                    metadata: { bsonType: 'object' }
                  }
                }
              }
            }
          }
        }
      });

      // Create indexes
      await this.db.collection(collectionName).createIndexes([
        { key: { parentId: 1, createdAt: -1 }, name: 'parentId_createdAt' },
        { key: { name: 'text' }, name: 'name_text' },
        { key: { age: 1 }, name: 'age_index' },
        { key: { grade: 1 }, name: 'grade_index' }
      ]);

      console.log('✅ Children collection initialized with validation and indexes');
    } catch (error) {
      if (error.code === 48) {
        console.log('ℹ️  Children collection already exists');
      } else {
        throw error;
      }
    }
  }

  /**
   * Initialize Child Education collection
   */
  async initChildEducationCollection() {
    console.log('\n📋 Initializing Child Education collection...');
    
    const collectionName = 'childeducations';
    
    try {
      await this.db.createCollection(collectionName, {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['childId'],
            properties: {
              childId: {
                bsonType: 'objectId',
                description: 'Child reference is required'
              },
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
                          marks: { 
                            bsonType: 'double',
                            minimum: 0,
                            maximum: 100
                          }
                        }
                      }
                    },
                    recordedAt: { bsonType: 'date' }
                  }
                }
              },
              suggestions: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  required: ['subject', 'suggestion', 'priority'],
                  properties: {
                    subject: { bsonType: 'string' },
                    suggestion: { bsonType: 'string' },
                    priority: {
                      enum: ['low', 'medium', 'high']
                    },
                    createdAt: { bsonType: 'date' }
                  }
                }
              }
            }
          }
        }
      });

      // Create indexes
      await this.db.collection(collectionName).createIndexes([
        { key: { childId: 1 }, unique: true, name: 'childId_unique' },
        { key: { 'records.gradeYear': 1 }, name: 'gradeYear_index' },
        { key: { createdAt: -1 }, name: 'createdAt_desc' }
      ]);

      console.log('✅ Child Education collection initialized with validation and indexes');
    } catch (error) {
      if (error.code === 48) {
        console.log('ℹ️  Child Education collection already exists');
      } else {
        throw error;
      }
    }
  }

  /**
   * Initialize Child Nutrition collection
   */
  async initChildNutritionCollection() {
    console.log('\n📋 Initializing Child Nutrition collection...');
    
    const collectionName = 'childnutritions';
    
    try {
      await this.db.createCollection(collectionName, {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['childId'],
            properties: {
              childId: {
                bsonType: 'objectId',
                description: 'Child reference is required'
              },
              records: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  required: ['physicalMeasurement', 'eatingHabits'],
                  properties: {
                    physicalMeasurement: {
                      bsonType: 'object',
                      required: ['heightCm', 'weightKg'],
                      properties: {
                        heightCm: {
                          bsonType: 'double',
                          minimum: 0,
                          maximum: 250
                        },
                        weightKg: {
                          bsonType: 'double',
                          minimum: 0,
                          maximum: 200
                        },
                        measurementDate: { bsonType: 'date' }
                      }
                    },
                    eatingHabits: {
                      bsonType: 'object',
                      required: [
                        'eatsBreakfastRegularly',
                        'drinksEnoughWater',
                        'eatsFruitsDaily',
                        'eatsVegetablesDaily',
                        'limitsJunkFood',
                        'hasRegularMealTimes',
                        'enjoysVarietyOfFoods',
                        'eatsAppropriatePortions'
                      ],
                      properties: {
                        eatsBreakfastRegularly: { bsonType: 'bool' },
                        drinksEnoughWater: { bsonType: 'bool' },
                        eatsFruitsDaily: { bsonType: 'bool' },
                        eatsVegetablesDaily: { bsonType: 'bool' },
                        limitsJunkFood: { bsonType: 'bool' },
                        hasRegularMealTimes: { bsonType: 'bool' },
                        enjoysVarietyOfFoods: { bsonType: 'bool' },
                        eatsAppropriatePortions: { bsonType: 'bool' }
                      }
                    },
                    recordedAt: { bsonType: 'date' },
                    notes: { bsonType: 'string', maxLength: 500 }
                  }
                }
              },
              recommendations: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  required: ['category', 'recommendation', 'priority', 'targetArea'],
                  properties: {
                    category: { bsonType: 'string' },
                    recommendation: { bsonType: 'string', maxLength: 500 },
                    priority: {
                      enum: ['low', 'medium', 'high', 'critical']
                    },
                    targetArea: { bsonType: 'string' },
                    createdAt: { bsonType: 'date' }
                  }
                }
              }
            }
          }
        }
      });

      // Create indexes
      await this.db.collection(collectionName).createIndexes([
        { key: { childId: 1 }, unique: true, name: 'childId_unique' },
        { key: { 'records.recordedAt': -1 }, name: 'recordedAt_desc' },
        { key: { createdAt: -1 }, name: 'createdAt_desc' }
      ]);

      console.log('✅ Child Nutrition collection initialized with validation and indexes');
    } catch (error) {
      if (error.code === 48) {
        console.log('ℹ️  Child Nutrition collection already exists');
      } else {
        throw error;
      }
    }
  }

  /**
   * Initialize Courses collection
   */
  async initCoursesCollection() {
    console.log('\n📋 Initializing Courses collection...');
    
    const collectionName = 'courses';
    
    try {
      await this.db.createCollection(collectionName, {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['title', 'description', 'category', 'difficulty', 'duration'],
            properties: {
              title: {
                bsonType: 'string',
                minLength: 3,
                maxLength: 200,
                description: 'Course title is required'
              },
              description: {
                bsonType: 'string',
                minLength: 10,
                maxLength: 2000,
                description: 'Course description is required'
              },
              category: {
                bsonType: 'string',
                description: 'Course category is required'
              },
              difficulty: {
                enum: ['beginner', 'intermediate', 'advanced'],
                description: 'Difficulty level is required'
              },
              duration: {
                bsonType: 'int',
                minimum: 1,
                description: 'Duration in minutes is required'
              },
              targetAgeMin: {
                bsonType: 'int',
                minimum: 0,
                maximum: 18
              },
              targetAgeMax: {
                bsonType: 'int',
                minimum: 0,
                maximum: 18
              },
              tags: {
                bsonType: 'array',
                items: { bsonType: 'string' }
              },
              isActive: {
                bsonType: 'bool'
              },
              modules: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  properties: {
                    title: { bsonType: 'string' },
                    description: { bsonType: 'string' },
                    order: { bsonType: 'int' },
                    duration: { bsonType: 'int' },
                    contentUrl: { bsonType: 'string' }
                  }
                }
              }
            }
          }
        }
      });

      // Create indexes
      await this.db.collection(collectionName).createIndexes([
        { key: { title: 'text', description: 'text' }, name: 'text_search' },
        { key: { category: 1 }, name: 'category_index' },
        { key: { difficulty: 1 }, name: 'difficulty_index' },
        { key: { isActive: 1 }, name: 'isActive_index' },
        { key: { tags: 1 }, name: 'tags_index' },
        { key: { createdAt: -1 }, name: 'createdAt_desc' }
      ]);

      console.log('✅ Courses collection initialized with validation and indexes');
    } catch (error) {
      if (error.code === 48) {
        console.log('ℹ️  Courses collection already exists');
      } else {
        throw error;
      }
    }
  }

  /**
   * Initialize Course Progress collection
   */
  async initCourseProgressCollection() {
    console.log('\n📋 Initializing Course Progress collection...');
    
    const collectionName = 'courseprogresses';
    
    try {
      await this.db.createCollection(collectionName, {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['childId', 'courseId', 'enrollmentDate'],
            properties: {
              childId: {
                bsonType: 'objectId',
                description: 'Child reference is required'
              },
              courseId: {
                bsonType: 'objectId',
                description: 'Course reference is required'
              },
              enrollmentDate: {
                bsonType: 'date',
                description: 'Enrollment date is required'
              },
              completionPercentage: {
                bsonType: 'double',
                minimum: 0,
                maximum: 100
              },
              completedModules: {
                bsonType: 'array',
                items: { bsonType: 'string' }
              },
              lastAccessedDate: {
                bsonType: 'date'
              },
              isCompleted: {
                bsonType: 'bool'
              },
              completionDate: {
                bsonType: 'date'
              }
            }
          }
        }
      });

      // Create indexes
      await this.db.collection(collectionName).createIndexes([
        { key: { childId: 1, courseId: 1 }, unique: true, name: 'child_course_unique' },
        { key: { childId: 1 }, name: 'childId_index' },
        { key: { courseId: 1 }, name: 'courseId_index' },
        { key: { isCompleted: 1 }, name: 'isCompleted_index' },
        { key: { enrollmentDate: -1 }, name: 'enrollmentDate_desc' }
      ]);

      console.log('✅ Course Progress collection initialized with validation and indexes');
    } catch (error) {
      if (error.code === 48) {
        console.log('ℹ️  Course Progress collection already exists');
      } else {
        throw error;
      }
    }
  }

  /**
   * Initialize Questions collection
   */
  async initQuestionsCollection() {
    console.log('\n📋 Initializing Questions collection...');
    
    const collectionName = 'questions';
    
    try {
      await this.db.createCollection(collectionName, {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['questionText', 'questionType', 'category', 'issueWeightages'],
            properties: {
              questionText: {
                bsonType: 'string',
                minLength: 5,
                maxLength: 500,
                description: 'Question text is required'
              },
              questionType: {
                enum: ['rating', 'yes_no', 'multiple_choice'],
                description: 'Question type is required'
              },
              category: {
                bsonType: 'string',
                description: 'Category is required'
              },
              ratingScale: {
                bsonType: 'object',
                properties: {
                  min: { bsonType: 'int' },
                  max: { bsonType: 'int' },
                  labels: { bsonType: 'object' }
                }
              },
              options: {
                bsonType: 'array',
                items: { bsonType: 'string' }
              },
              issueWeightages: {
                bsonType: 'array',
                minItems: 1,
                items: {
                  bsonType: 'object',
                  required: ['issueId', 'issueName', 'weightage'],
                  properties: {
                    issueId: { bsonType: 'string' },
                    issueName: { bsonType: 'string' },
                    weightage: {
                      bsonType: 'int',
                      minimum: 0,
                      maximum: 100
                    }
                  }
                }
              },
              isActive: {
                bsonType: 'bool'
              }
            }
          }
        }
      });

      // Create indexes
      await this.db.collection(collectionName).createIndexes([
        { key: { questionType: 1 }, name: 'questionType_index' },
        { key: { category: 1 }, name: 'category_index' },
        { key: { isActive: 1 }, name: 'isActive_index' },
        { key: { 'issueWeightages.issueId': 1 }, name: 'issueId_index' },
        { key: { createdAt: -1 }, name: 'createdAt_desc' }
      ]);

      console.log('✅ Questions collection initialized with validation and indexes');
    } catch (error) {
      if (error.code === 48) {
        console.log('ℹ️  Questions collection already exists');
      } else {
        throw error;
      }
    }
  }

  /**
   * Create initial seed data (optional)
   */
  async seedInitialData() {
    console.log('\n🌱 Seeding initial data...');
    
    // Check if data already exists
    const parentCount = await this.db.collection('parents').countDocuments();
    
    if (parentCount > 0) {
      console.log('ℹ️  Database already contains data. Skipping seed.');
      return;
    }

    console.log('✅ No seed data created (implement as needed)');
  }

  /**
   * Run all initialization tasks
   */
  async initialize() {
    try {
      await this.connect();

      // Initialize all collections
      await this.initParentsCollection();
      await this.initChildrenCollection();
      await this.initChildEducationCollection();
      await this.initChildNutritionCollection();
      await this.initCoursesCollection();
      await this.initCourseProgressCollection();
      await this.initQuestionsCollection();

      // Seed initial data (optional)
      await this.seedInitialData();

      console.log('\n✨ MongoDB initialization completed successfully!');
      console.log(`📊 Database: ${DB_NAME}`);
      console.log('📦 Collections created with validation and indexes');
      
    } catch (error) {
      console.error('\n❌ Initialization failed:', error.message);
      throw error;
    } finally {
      await this.close();
    }
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.client) {
      await this.client.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run initialization
(async () => {
  const initializer = new MongoDBInitializer();
  
  try {
    await initializer.initialize();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();

module.exports = MongoDBInitializer;
