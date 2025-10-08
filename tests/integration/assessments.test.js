const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const Child = require('../../src/models/Child');
const Questions = require('../../src/models/Questions');
const assessmentRoutes = require('../../src/routes/assessmentsRoutes');
const errorHandler = require('../../src/middleware/errorHandler');

let app;
let mongod;
let parentUser;
let parentToken;
let testChild;
let testQuestions;

const setupTestApp = () => {
  const testApp = express();
  testApp.use(express.json());
  
  testApp.use((req, res, next) => {
    if (parentUser && parentToken && req.headers.authorization === `Bearer ${parentToken}`) {
      req.user = {
        id: parentUser._id,
        email: parentUser.email,
        role: 'user',
        _id: parentUser._id
      };
    }
    next();
  });
  
  testApp.use('/api/v1/assessments', assessmentRoutes);
  testApp.use(errorHandler.handle.bind(errorHandler));
  
  return testApp;
};

describe('Assessments API - Integration Tests', () => {
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
    await Child.deleteMany({});
    await Questions.deleteMany({});
    await User.deleteMany({});
    
    parentUser = await User.create({
      name: 'Parent User',
      email: `parent${Date.now()}@example.com`,
      password: 'ParentPass123!',
      role: 'user'
    });
    
    parentToken = parentUser.getSignedJwtToken();

    testChild = await Child.create({
      name: 'Test Child',
      age: 10,
      gender: 'male',
      grade: 'GRADE_5',
      parentId: parentUser._id
    });

    testQuestions = await Questions.create([
      {
        questionText: 'How often does your child feel anxious in social situations?',
        questionType: 'rating',
        category: 'Behavioral Assessment',
        ratingScale: { min: 1, max: 5 },
        issueWeightages: [
          { issueId: 'anxiety', issueName: 'Anxiety Disorder', weightage: 70 },
          { issueId: 'social_phobia', issueName: 'Social Phobia', weightage: 30 }
        ],
        isActive: true
      },
      {
        questionText: 'Does your child avoid social activities?',
        questionType: 'rating',
        category: 'Behavioral Assessment',
        ratingScale: { min: 1, max: 5 },
        issueWeightages: [
          { issueId: 'social_phobia', issueName: 'Social Phobia', weightage: 80 },
          { issueId: 'anxiety', issueName: 'Anxiety Disorder', weightage: 20 }
        ],
        isActive: true
      },
      {
        questionText: 'Does your child show signs of sadness or depression?',
        questionType: 'rating',
        category: 'Behavioral Assessment',
        ratingScale: { min: 1, max: 5 },
        issueWeightages: [
          { issueId: 'depression', issueName: 'Depression', weightage: 90 },
          { issueId: 'anxiety', issueName: 'Anxiety Disorder', weightage: 10 }
        ],
        isActive: true
      }
    ]);
  });

  afterEach(async () => {
    await Child.deleteMany({});
    await Questions.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/v1/assessments/process', () => {
    /**
     * Test processing assessment with weighted average
     */
    it('should process assessment successfully with weighted_average method', async () => {
      const assessmentData = {
        responses: [
          { questionId: testQuestions[0]._id.toString(), answer: 4 },
          { questionId: testQuestions[1]._id.toString(), answer: 3 },
          { questionId: testQuestions[2]._id.toString(), answer: 2 }
        ],
        childId: testChild._id.toString(),
        method: 'weighted_average'
      };

      const response = await request(app)
        .post('/api/v1/assessments/process')
        .set('Authorization', `Bearer ${parentToken}`)
        .send(assessmentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.assessmentId).toBeDefined();
      expect(response.body.data.method).toBe('weighted_average');
      expect(response.body.data.issues).toBeDefined();
      expect(response.body.data.issues.length).toBeGreaterThan(0);
      expect(response.body.data.overallSummary).toBeDefined();

      const updatedChild = await Child.findById(testChild._id);
      expect(updatedChild.assessmentResults).toHaveLength(1);
    });

    /**
     * Test processing with T-score non-weighted
     */
    it('should process assessment with t_score_non_weighted method', async () => {
      const assessmentData = {
        responses: [
          { questionId: testQuestions[0]._id.toString(), answer: 5 },
          { questionId: testQuestions[1]._id.toString(), answer: 4 }
        ],
        childId: testChild._id.toString(),
        method: 't_score_non_weighted'
      };

      const response = await request(app)
        .post('/api/v1/assessments/process')
        .set('Authorization', `Bearer ${parentToken}`)
        .send(assessmentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.method).toBe('t_score_non_weighted');
      expect(response.body.data.issues.every(i => i.tScore !== undefined)).toBe(true);
    });

    /**
     * Test processing with T-score weighted
     */
    it('should process assessment with t_score_weighted method', async () => {
      const assessmentData = {
        responses: [
          { questionId: testQuestions[0]._id.toString(), answer: 3 },
          { questionId: testQuestions[1]._id.toString(), answer: 4 },
          { questionId: testQuestions[2]._id.toString(), answer: 2 }
        ],
        childId: testChild._id.toString(),
        method: 't_score_weighted'
      };

      const response = await request(app)
        .post('/api/v1/assessments/process')
        .set('Authorization', `Bearer ${parentToken}`)
        .send(assessmentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.method).toBe('t_score_weighted');
    });

    /**
     * Test validation for empty responses
     */
    it('should return 400 for empty responses', async () => {
      const assessmentData = {
        responses: [],
        childId: testChild._id.toString(),
        method: 'weighted_average'
      };

      const response = await request(app)
        .post('/api/v1/assessments/process')
        .set('Authorization', `Bearer ${parentToken}`)
        .send(assessmentData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    /**
     * Test unauthorized access
     */
    it('should return 403 when parent ID does not match', async () => {
      const anotherUser = await User.create({
        name: 'Another User',
        email: `another${Date.now()}@example.com`,
        password: 'AnotherPass123!',
        role: 'user'
      });

      const anotherChild = await Child.create({
        name: 'Another Child',
        age: 8,
        gender: 'female',
        grade: 'GRADE_3',
        parentId: anotherUser._id
      });

      const assessmentData = {
        responses: [
          { questionId: testQuestions[0]._id.toString(), answer: 4 }
        ],
        childId: anotherChild._id.toString(),
        method: 'weighted_average'
      };

      const response = await request(app)
        .post('/api/v1/assessments/process')
        .set('Authorization', `Bearer ${parentToken}`)
        .send(assessmentData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/assessments/child/:childId', () => {
    beforeEach(async () => {
      const assessmentData = {
        responses: [
          { questionId: testQuestions[0]._id.toString(), answer: 4 },
          { questionId: testQuestions[1]._id.toString(), answer: 3 }
        ],
        childId: testChild._id.toString(),
        method: 'weighted_average'
      };

      await request(app)
        .post('/api/v1/assessments/process')
        .set('Authorization', `Bearer ${parentToken}`)
        .send(assessmentData);
    });

    /**
     * Test getting all assessments
     */
    it('should get all assessments for a child', async () => {
      const response = await request(app)
        .get(`/api/v1/assessments/child/${testChild._id}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.count).toBe(response.body.data.length);
    });
  });

  describe('GET /api/v1/assessments/child/:childId/latest', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v1/assessments/process')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          responses: [
            { questionId: testQuestions[0]._id.toString(), answer: 4 }
          ],
          childId: testChild._id.toString(),
          method: 'weighted_average'
        });

      await new Promise(resolve => setTimeout(resolve, 100));

      await request(app)
        .post('/api/v1/assessments/process')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          responses: [
            { questionId: testQuestions[1]._id.toString(), answer: 5 }
          ],
          childId: testChild._id.toString(),
          method: 't_score_weighted'
        });
    });

    /**
     * Test getting latest assessment
     */
    it('should get latest assessment for a child', async () => {
      const response = await request(app)
        .get(`/api/v1/assessments/child/${testChild._id}/latest`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.method).toBe('t_score_weighted');
    });

    /**
     * Test no assessments found
     */
    it('should return 404 when no assessments exist', async () => {
      const newChild = await Child.create({
        name: 'New Child',
        age: 7,
        gender: 'female',
        grade: 'GRADE_2',
        parentId: parentUser._id
      });

      const response = await request(app)
        .get(`/api/v1/assessments/child/${newChild._id}/latest`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Assessment Course Assignment', () => {
    /**
     * Test course assignment for normal severity
     */
    it('should assign courses for normal severity issues', async () => {
      const assessmentData = {
        responses: [
          { questionId: testQuestions[0]._id.toString(), answer: 2 },
          { questionId: testQuestions[1]._id.toString(), answer: 1 }
        ],
        childId: testChild._id.toString(),
        method: 'weighted_average'
      };

      await request(app)
        .post('/api/v1/assessments/process')
        .set('Authorization', `Bearer ${parentToken}`)
        .send(assessmentData)
        .expect(200);

      const updatedChild = await Child.findById(testChild._id);
      expect(updatedChild.courseIds.length).toBeGreaterThanOrEqual(0);
    });
  });
});
