const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const Question = require('../../src/models/Question');
const questionRoutes = require('../../src/routes/questions');
const errorHandler = require('../../src/middleware/errorHandler');

let app;
let mongod;
let adminUser;
let adminToken;
let regularUser;
let regularToken;

const setupTestApp = () => {
  const testApp = express();
  testApp.use(express.json());
  
  testApp.use((req, res, next) => {
    if (adminUser && adminToken && req.headers.authorization === `Bearer ${adminToken}`) {
      req.user = {
        id: adminUser._id,
        email: adminUser.email,
        role: 'admin',
        _id: adminUser._id
      };
    } else if (regularUser && regularToken && req.headers.authorization === `Bearer ${regularToken}`) {
      req.user = {
        id: regularUser._id,
        email: regularUser.email,
        role: 'user',
        _id: regularUser._id
      };
    }
    next();
  });
  
  testApp.use('/api/v1/questions', questionRoutes);
  testApp.use(errorHandler.handle.bind(errorHandler));
  
  return testApp;
};

describe('Questions API - Integration Tests', () => {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    
    app = setupTestApp();
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  }, 30000);

  beforeEach(async () => {
    await Question.deleteMany({});
    await User.deleteMany({});
    
    adminUser = await User.create({
      name: 'Admin User',
      email: `admin${Date.now()}@example.com`,
      password: 'AdminPass123!',
      role: 'admin'
    });
    
    adminToken = adminUser.getSignedJwtToken();

    regularUser = await User.create({
      name: 'Regular User',
      email: `user${Date.now()}@example.com`,
      password: 'UserPass123!',
      role: 'user'
    });
    
    regularToken = regularUser.getSignedJwtToken();
  });

  afterEach(async () => {
    await Question.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/v1/questions', () => {
    /**
     * Test creating question as admin
     */
    it('should create question successfully as admin', async () => {
      const questionData = {
        questionText: 'How often does your child feel anxious in social situations?',
        questionType: 'rating',
        category: 'Behavioral Assessment',
        ratingScale: { min: 1, max: 5 },
        issueWeightages: [
          { issueId: 'anxiety', issueName: 'Anxiety Disorder', weightage: 75 },
          { issueId: 'social_phobia', issueName: 'Social Phobia', weightage: 25 }
        ],
        ageGroup: { min: 6, max: 12 },
        difficultyLevel: 'medium',
        tags: ['anxiety', 'social']
      };

      const response = await request(app)
        .post('/api/v1/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(questionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.questionText).toBe(questionData.questionText);
      expect(response.body.data.issueWeightages).toHaveLength(2);
    });

    /**
     * Test MCQ validation
     */
    it('should validate MCQ options', async () => {
      const invalidData = {
        questionText: 'Does your child enjoy social activities?',
        questionType: 'mcq',
        category: 'Test',
        options: [{ optionText: 'Only one option', optionValue: 1 }],
        issueWeightages: [{ issueId: 'test', issueName: 'Test', weightage: 100 }]
      };

      const response = await request(app)
        .post('/api/v1/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    /**
     * Test authorization for regular user
     */
    it('should deny access to regular user', async () => {
      const questionData = {
        questionText: 'Test question for authorization check?',
        questionType: 'boolean',
        category: 'Test',
        issueWeightages: [{ issueId: 'test', issueName: 'Test', weightage: 100 }]
      };

      const response = await request(app)
        .post('/api/v1/questions')
        .set('Authorization', `Bearer ${regularToken}`)
        .send(questionData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/questions', () => {
    beforeEach(async () => {
      await Question.create([
        {
          questionText: 'Question 1 about anxiety and social behavior?',
          questionType: 'rating',
          category: 'Behavioral Assessment',
          issueWeightages: [{ issueId: 'anxiety', issueName: 'Anxiety', weightage: 100 }],
          isActive: true
        },
        {
          questionText: 'Question 2 about depression symptoms in children?',
          questionType: 'mcq',
          category: 'Mental Health',
          options: [
            { optionText: 'Never', optionValue: 1 },
            { optionText: 'Always', optionValue: 5 }
          ],
          issueWeightages: [{ issueId: 'depression', issueName: 'Depression', weightage: 100 }],
          isActive: true
        },
        {
          questionText: 'Inactive question for testing purposes?',
          questionType: 'boolean',
          category: 'Test',
          issueWeightages: [{ issueId: 'test', issueName: 'Test', weightage: 100 }],
          isActive: false
        }
      ]);
    });

    /**
     * Test paginated retrieval
     */
    it('should get paginated questions', async () => {
      const response = await request(app)
        .get('/api/v1/questions')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
    });

    /**
     * Test filtering by category
     */
    it('should filter questions by category', async () => {
      const response = await request(app)
        .get('/api/v1/questions')
        .query({ category: 'Behavioral Assessment' })
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(q => q.category === 'Behavioral Assessment')).toBe(true);
    });

    /**
     * Test filtering by active status
     */
    it('should filter active questions only', async () => {
      const response = await request(app)
        .get('/api/v1/questions')
        .query({ isActive: true })
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);

      expect(response.body.data.every(q => q.isActive === true)).toBe(true);
    });
  });

  describe('GET /api/v1/questions/by-category', () => {
    beforeEach(async () => {
      await Question.create({
        questionText: 'Category specific question here?',
        questionType: 'rating',
        category: 'Behavioral Assessment',
        issueWeightages: [{ issueId: 'test', issueName: 'Test', weightage: 100 }],
        isActive: true
      });
    });

    /**
     * Test getting questions by category
     */
    it('should get questions by category', async () => {
      const response = await request(app)
        .get('/api/v1/questions/by-category')
        .query({ category: 'Behavioral Assessment' })
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    /**
     * Test missing category parameter
     */
    it('should return 400 when category is missing', async () => {
      const response = await request(app)
        .get('/api/v1/questions/by-category')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/questions/random', () => {
    beforeEach(async () => {
      const questions = Array.from({ length: 15 }, (_, i) => ({
        questionText: `Random question ${i + 1} for assessment testing?`,
        questionType: 'rating',
        category: 'Behavioral Assessment',
        issueWeightages: [{ issueId: 'test', issueName: 'Test', weightage: 100 }],
        isActive: true
      }));
      await Question.create(questions);
    });

    /**
     * Test getting random questions
     */
    it('should get random questions', async () => {
      const response = await request(app)
        .get('/api/v1/questions/random')
        .query({ count: 5 })
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
      expect(response.body.count).toBeDefined();
    });
  });

  describe('PATCH /api/v1/questions/:id', () => {
    let testQuestion;

    beforeEach(async () => {
      testQuestion = await Question.create({
        questionText: 'Original question text for updating?',
        questionType: 'rating',
        category: 'Test',
        issueWeightages: [{ issueId: 'test', issueName: 'Test', weightage: 100 }],
        isActive: true
      });
    });

    /**
     * Test updating question as admin
     */
    it('should update question successfully', async () => {
      const updateData = {
        questionText: 'Updated question text goes here?',
        tags: ['updated', 'test']
      };

      const response = await request(app)
        .patch(`/api/v1/questions/${testQuestion._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.questionText).toBe(updateData.questionText);
      expect(response.body.data.version).toBe(2);
    });
  });

  describe('DELETE /api/v1/questions/:id', () => {
    let testQuestion;

    beforeEach(async () => {
      testQuestion = await Question.create({
        questionText: 'Question to be deleted for testing?',
        questionType: 'boolean',
        category: 'Test',
        issueWeightages: [{ issueId: 'test', issueName: 'Test', weightage: 100 }],
        isActive: true
      });
    });

    /**
     * Test deleting question
     */
    it('should delete question successfully as admin', async () => {
      const response = await request(app)
        .delete(`/api/v1/questions/${testQuestion._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(true);

      const deleted = await Question.findById(testQuestion._id);
      expect(deleted).toBeNull();
    });

    /**
     * Test authorization for deletion
     */
    it('should deny deletion to regular user', async () => {
      const response = await request(app)
        .delete(`/api/v1/questions/${testQuestion._id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/questions/stats', () => {
    beforeEach(async () => {
      await Question.create([
        {
          questionText: 'Stats question 1?',
          questionType: 'rating',
          category: 'Category A',
          issueWeightages: [{ issueId: 'test', issueName: 'Test', weightage: 100 }],
          isActive: true
        },
        {
          questionText: 'Stats question 2?',
          questionType: 'mcq',
          category: 'Category B',
          options: [
            { optionText: 'Yes', optionValue: 1 },
            { optionText: 'No', optionValue: 0 }
          ],
          issueWeightages: [{ issueId: 'test', issueName: 'Test', weightage: 100 }],
          isActive: false
        }
      ]);
    });

    /**
     * Test getting statistics
     */
    it('should get questions statistics as admin', async () => {
      const response = await request(app)
        .get('/api/v1/questions/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.active).toBe(1);
      expect(response.body.data.inactive).toBe(1);
      expect(response.body.data.byCategory).toBeDefined();
      expect(response.body.data.byType).toBeDefined();
    });
  });
});
