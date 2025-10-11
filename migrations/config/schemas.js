/*
 * Database Schema Definitions
 * 
 * Define all collection schemas here.
 * Each schema has a version number that increments with changes.
 */

const schemas = {
  parents: {
    version: 2,
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
  },

  courses: {
    version: 2,
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['title', 'headline', 'description', 'shortDescription', 'thumbnail', 'category', 'price', 'sections', 'instructor'],
        properties: {
          title: {
            bsonType: 'string',
            minLength: 5,
            maxLength: 200,
            description: 'Course title is required'
          },
          slug: {
            bsonType: 'string',
            description: 'URL-friendly slug'
          },
          headline: {
            bsonType: 'string',
            maxLength: 500,
            description: 'Course headline is required'
          },
          description: {
            bsonType: 'string',
            minLength: 50,
            description: 'Course description is required'
          },
          shortDescription: {
            bsonType: 'string',
            maxLength: 300,
            description: 'Short description is required'
          },
          thumbnail: {
            bsonType: 'string',
            description: 'Thumbnail URL is required'
          },
          coverImage: {
            bsonType: 'string'
          },
          category: {
            bsonType: 'string',
            description: 'Category is required'
          },
          subCategory: {
            bsonType: 'string'
          },
          level: {
            enum: ['beginner', 'intermediate', 'advanced'],
            description: 'Course level'
          },
          language: {
            bsonType: 'string'
          },
          price: {
            bsonType: 'object',
            required: ['amount', 'currency'],
            properties: {
              amount: { bsonType: 'double', minimum: 0 },
              currency: { bsonType: 'string' },
              discountedPrice: { bsonType: 'double', minimum: 0 }
            }
          },
          sections: {
            bsonType: 'array',
            minItems: 1,
            items: {
              bsonType: 'object',
              required: ['title', 'order'],
              properties: {
                title: { bsonType: 'string' },
                description: { bsonType: 'string' },
                order: { bsonType: 'int', minimum: 0 },
                videos: {
                  bsonType: 'array',
                  items: {
                    bsonType: 'object',
                    required: ['title', 'videoUrl', 'duration', 'order'],
                    properties: {
                      title: { bsonType: 'string' },
                      description: { bsonType: 'string' },
                      videoUrl: { bsonType: 'string' },
                      duration: { bsonType: 'double', minimum: 0 },
                      order: { bsonType: 'int', minimum: 0 },
                      isFree: { bsonType: 'bool' },
                      thumbnail: { bsonType: 'string' }
                    }
                  }
                },
                test: {
                  bsonType: 'object',
                  required: ['title', 'order'],
                  properties: {
                    title: { bsonType: 'string' },
                    description: { bsonType: 'string' },
                    questions: {
                      bsonType: 'array',
                      items: { bsonType: 'objectId' }
                    },
                    passingScore: { bsonType: 'int', minimum: 0, maximum: 100 },
                    duration: { bsonType: 'int', minimum: 0 },
                    order: { bsonType: 'int', minimum: 0 }
                  }
                },
                pdfs: {
                  bsonType: 'array',
                  maxItems: 3,
                  items: {
                    bsonType: 'object',
                    required: ['filename', 'url', 'size', 'uploadedBy'],
                    properties: {
                      filename: { bsonType: 'string' },
                      url: { bsonType: 'string' },
                      size: { bsonType: 'int', minimum: 0 },
                      uploadedBy: { bsonType: 'objectId' },
                      uploadedAt: { bsonType: 'date' }
                    }
                  }
                },
                isLocked: { bsonType: 'bool' }
              }
            }
          },
          instructor: {
            bsonType: 'objectId',
            description: 'Instructor reference is required'
          },
          tags: {
            bsonType: 'array',
            items: { bsonType: 'string' }
          },
          prerequisites: {
            bsonType: 'array',
            items: { bsonType: 'string' }
          },
          learningOutcomes: {
            bsonType: 'array',
            items: { bsonType: 'string' }
          },
          targetAudience: {
            bsonType: 'array',
            items: { bsonType: 'string' }
          },
          isPurchased: {
            bsonType: 'bool'
          },
          isPublished: {
            bsonType: 'bool'
          },
          publishedAt: {
            bsonType: 'date'
          },
          enrollmentCount: {
            bsonType: 'int',
            minimum: 0
          },
          rating: {
            bsonType: 'object',
            properties: {
              average: { bsonType: 'double', minimum: 0, maximum: 5 },
              count: { bsonType: 'int', minimum: 0 }
            }
          },
          metadata: {
            bsonType: 'object',
            properties: {
              totalDuration: { bsonType: 'int', minimum: 0 },
              totalVideos: { bsonType: 'int', minimum: 0 },
              totalTests: { bsonType: 'int', minimum: 0 },
              lastUpdated: { bsonType: 'date' }
            }
          }
        }
      }
    },
    indexes: [
      { key: { title: 'text', description: 'text', tags: 'text' }, name: 'text_search' },
      { key: { slug: 1 }, unique: true, name: 'slug_unique' },
      { key: { category: 1, isPublished: 1, createdAt: -1 }, name: 'category_published_date' },
      { key: { 'price.amount': 1, isPublished: 1 }, name: 'price_published' },
      { key: { instructor: 1 }, name: 'instructor_index' },
      { key: { isPublished: 1 }, name: 'isPublished_index' },
      { key: { createdAt: -1 }, name: 'createdAt_desc' }
    ]
  }
};

module.exports = schemas;
