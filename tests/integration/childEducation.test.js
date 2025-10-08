const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const ChildEducation = require('../../src/models/ChildEducation');
const Child = require('../../src/models/Child');
const childEducationRoutes = require('../../src/routes/childEducationRoutes');
const errorHandler = require('../../src/middleware/errorHandler');

let app;
let mongod;
let testUser;
let testToken;
let testChild;

/**
 * Setup test application with routes and middleware
 */
const setupTestApp = () => {
  const testApp = express();
  testApp.use(express.json());
  
  testApp.use((req, res, next) => {
    if (testUser && testToken) {
      req.user = {
        id: testUser._id,
        email: testUser.email,
        role: testUser.role,
        _id: testUser._id
      };
    }
    next();
  });
  
  testApp.use('/api/v1/child-education', childEducationRoutes);
  testApp.use(errorHandler.handle.bind(errorHandler));
  
  return testApp;
};

describe('Child Education API - Integration Tests', () => {
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
    await ChildEducation.deleteMany({});
    await Child.deleteMany({});
    await User.deleteMany({});
    
    testUser = await User.create({
      name: 'Test User',
      email: `user${Date.now()}@example.com`,
      password: 'TestPass123!',
      role: 'user'
    });
    
    testToken = testUser.getSignedJwtToken();

    testChild = await Child.create({
      name: 'Test Child',
      age: 10,
      gender: 'male',
      grade: '5TH',
      parentId: testUser._id
    });
  });

  afterEach(async () => {
    await ChildEducation.deleteMany({});
    await Child.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/v1/child-education', () => {
    /**
     * Test creating an education record successfully
     */
    it('should create a new education record successfully', async () => {
      const educationData = {
        childId: testChild._id.toString(),
        records: [],
        suggestions: []
      };

      const response = await request(app)
        .post('/api/v1/child-education')
        .set('Authorization', `Bearer ${testToken}`)
        .send(educationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.childId).toBe(testChild._id.toString());
    });

    /**
     * Test validation errors
     */
    it('should return 400 for validation errors', async () => {
      const invalidData = {
        childId: 'invalid-id',
        records: []
      };

      const response = await request(app)
        .post('/api/v1/child-education')
        .set('Authorization', `Bearer ${testToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    /**
     * Test duplicate record creation
     */
    it('should return 409 for duplicate education record', async () => {
      await ChildEducation.create({
        childId: testChild._id,
        records: [],
        suggestions: []
      });

      const educationData = {
        childId: testChild._id.toString(),
        records: []
      };

      const response = await request(app)
        .post('/api/v1/child-education')
        .set('Authorization', `Bearer ${testToken}`)
        .send(educationData)
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/child-education/:id', () => {
    let testEducationRecord;

    beforeEach(async () => {
      testEducationRecord = await ChildEducation.create({
        childId: testChild._id,
        records: [
          {
            gradeYear: 'Grade 5',
            subjects: [
              { subject: 'Math', marks: 85 },
              { subject: 'Science', marks: 78 },
              { subject: 'English', marks: 92 }
            ]
          }
        ],
        suggestions: []
      });
    });

    /**
     * Test getting education record by ID
     */
    it('should get education record by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/child-education/${testEducationRecord._id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.childId).toBe(testChild._id.toString());
      expect(response.body.data.records).toHaveLength(1);
    });

    /**
     * Test getting non-existent record
     */
    it('should return 404 for non-existent record', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/v1/child-education/${fakeId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/child-education/by-child', () => {
    beforeEach(async () => {
      await ChildEducation.create({
        childId: testChild._id,
        records: [
          {
            gradeYear: 'Grade 5',
            subjects: [
              { subject: 'Math', marks: 85 }
            ]
          }
        ],
        suggestions: []
      });
    });

    /**
     * Test getting education record by child ID
     */
    it('should get education record by child ID successfully', async () => {
      const response = await request(app)
        .get('/api/v1/child-education/by-child')
        .query({ childId: testChild._id.toString() })
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.childId).toBe(testChild._id.toString());
    });

    /**
     * Test without child ID
     */
    it('should return 400 when child ID is missing', async () => {
      const response = await request(app)
        .get('/api/v1/child-education/by-child')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/child-education/add-grade', () => {
    beforeEach(async () => {
      await ChildEducation.create({
        childId: testChild._id,
        records: [],
        suggestions: []
      });
    });

    /**
     * Test adding grade record successfully
     */
    it('should add grade record successfully', async () => {
      const gradeRecord = {
        gradeYear: 'Grade 5',
        subjects: [
          { subject: 'Math', marks: 90 },
          { subject: 'Science', marks: 85 },
          { subject: 'English', marks: 88 }
        ]
      };

      const response = await request(app)
        .post('/api/v1/child-education/add-grade')
        .query({ childId: testChild._id.toString() })
        .set('Authorization', `Bearer ${testToken}`)
        .send(gradeRecord)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toHaveLength(1);
      expect(response.body.data.suggestions.length).toBeGreaterThanOrEqual(0);
    });

    /**
     * Test validation for grade record
     */
    it('should return 400 for invalid grade record', async () => {
      const invalidGradeRecord = {
        gradeYear: 'Grade 5',
        subjects: [
          { subject: 'Math', marks: 150 } // Invalid marks > 100
        ]
      };

      const response = await request(app)
        .post('/api/v1/child-education/add-grade')
        .query({ childId: testChild._id.toString() })
        .set('Authorization', `Bearer ${testToken}`)
        .send(invalidGradeRecord)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    /**
     * Test auto-creation when no record exists
     */
    it('should create education record if none exists', async () => {
      await ChildEducation.deleteMany({ childId: testChild._id });

      const gradeRecord = {
        gradeYear: 'Grade 5',
        subjects: [
          { subject: 'Math', marks: 85 }
        ]
      };

      const response = await request(app)
        .post('/api/v1/child-education/add-grade')
        .query({ childId: testChild._id.toString() })
        .set('Authorization', `Bearer ${testToken}`)
        .send(gradeRecord)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toHaveLength(1);
    });
  });

  describe('GET /api/v1/child-education/analysis', () => {
    beforeEach(async () => {
      await ChildEducation.create({
        childId: testChild._id,
        records: [
          {
            gradeYear: 'Grade 4',
            subjects: [
              { subject: 'Math', marks: 75 },
              { subject: 'Science', marks: 70 },
              { subject: 'English', marks: 80 }
            ]
          },
          {
            gradeYear: 'Grade 5',
            subjects: [
              { subject: 'Math', marks: 85 },
              { subject: 'Science', marks: 80 },
              { subject: 'English', marks: 90 }
            ]
          }
        ],
        suggestions: []
      });
    });

    /**
     * Test getting performance analysis
     */
    it('should get performance analysis successfully', async () => {
      const response = await request(app)
        .get('/api/v1/child-education/analysis')
        .query({ childId: testChild._id.toString() })
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hasData).toBe(true);
      expect(response.body.data.analysis).toBeDefined();
      expect(response.body.data.analysis.trend).toBeDefined();
      expect(response.body.data.recordCount).toBe(2);
    });

    /**
     * Test analysis with no data
     */
    it('should return no data message when no records exist', async () => {
      await ChildEducation.deleteMany({ childId: testChild._id });
      await ChildEducation.create({
        childId: testChild._id,
        records: [],
        suggestions: []
      });

      const response = await request(app)
        .get('/api/v1/child-education/analysis')
        .query({ childId: testChild._id.toString() })
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hasData).toBe(false);
    });
  });

  describe('POST /api/v1/child-education/regenerate-suggestions', () => {
    beforeEach(async () => {
      await ChildEducation.create({
        childId: testChild._id,
        records: [
          {
            gradeYear: 'Grade 5',
            subjects: [
              { subject: 'Math', marks: 95 },
              { subject: 'Science', marks: 55 },
              { subject: 'English', marks: 88 }
            ]
          }
        ],
        suggestions: []
      });
    });

    /**
     * Test regenerating suggestions
     */
    it('should regenerate suggestions successfully', async () => {
      const response = await request(app)
        .post('/api/v1/child-education/regenerate-suggestions')
        .query({ childId: testChild._id.toString() })
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.suggestions.length).toBeGreaterThan(0);
    });

    /**
     * Test with no records
     */
    it('should return 404 when no records exist', async () => {
      await ChildEducation.deleteMany({ childId: testChild._id });
      await ChildEducation.create({
        childId: testChild._id,
        records: [],
        suggestions: []
      });

      const response = await request(app)
        .post('/api/v1/child-education/regenerate-suggestions')
        .query({ childId: testChild._id.toString() })
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/child-education/:id', () => {
    let testEducationRecord;

    beforeEach(async () => {
      testEducationRecord = await ChildEducation.create({
        childId: testChild._id,
        records: [
          {
            gradeYear: 'Grade 5',
            subjects: [
              { subject: 'Math', marks: 85 }
            ]
          }
        ],
        suggestions: []
      });
    });

    /**
     * Test updating education record
     */
    it('should update education record successfully', async () => {
      const updateData = {
        records: [
          {
            gradeYear: 'Grade 5',
            subjects: [
              { subject: 'Math', marks: 90 },
              { subject: 'Science', marks: 85 }
            ]
          }
        ]
      };

      const response = await request(app)
        .patch(`/api/v1/child-education/${testEducationRecord._id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.records[0].subjects).toHaveLength(2);
    });
  });

  describe('DELETE /api/v1/child-education/:id', () => {
    let testEducationRecord;

    beforeEach(async () => {
      testEducationRecord = await ChildEducation.create({
        childId: testChild._id,
        records: [],
        suggestions: []
      });
    });

    /**
     * Test deleting education record
     */
    it('should delete education record successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/child-education/${testEducationRecord._id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(true);

      const deletedRecord = await ChildEducation.findById(testEducationRecord._id);
      expect(deletedRecord).toBeNull();
    });

    /**
     * Test deleting non-existent record
     */
    it('should return 404 when record does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/v1/child-education/${fakeId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/child-education/:id/summary', () => {
    let testEducationRecord;

    beforeEach(async () => {
      testEducationRecord = await ChildEducation.create({
        childId: testChild._id,
        records: [
          {
            gradeYear: 'Grade 5',
            subjects: [
              { subject: 'Math', marks: 85 },
              { subject: 'Science', marks: 78 }
            ]
          }
        ],
        suggestions: [
          {
            subject: 'Math',
            suggestion: 'Keep up the good work',
            priority: 'low',
            type: 'performance'
          }
        ]
      });
    });

    /**
     * Test getting education summary
     */
    it('should get education summary successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/child-education/${testEducationRecord._id}/summary`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recordCount).toBeDefined();
    });
  });
});
