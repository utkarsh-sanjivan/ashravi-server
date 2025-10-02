const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const Child = require('../../src/models/Child');
const User = require('../../src/models/User');
const childrenRoutes = require('../../src/routes/children');
const errorHandler = require('../../src/middleware/errorHandler');

let app;
let mongod;
let testParent;
let testToken;

/**
 * Setup test application with routes and middleware
 */
const setupTestApp = () => {
  const testApp = express();
  testApp.use(express.json());
  
  testApp.use((req, res, next) => {
    if (testParent && testToken) {
      req.user = {
        id: testParent._id,
        email: testParent.email,
        role: testParent.role,
        _id: testParent._id
      };
    }
    next();
  });
  
  testApp.use('/api/v1/children', childrenRoutes);
  testApp.use(errorHandler.handle.bind(errorHandler));
  
  return testApp;
};

describe('Children API - Integration Tests', () => {
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
    await User.deleteMany({});
    
    testParent = await User.create({
      name: 'Test Parent',
      email: `parent${Date.now()}@example.com`,
      password: 'TestPass123!',
      role: 'user'
    });
    
    testToken = testParent.getSignedJwtToken();
  });

  afterEach(async () => {
    await Child.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/v1/children', () => {
    /**
     * Test creating a child successfully
     */
    it('should create a new child successfully', async () => {
      const childData = {
        name: 'John Doe',
        age: 10,
        gender: 'male',
        grade: '5TH',
        parentId: testParent._id.toString()
      };

      const response = await request(app)
        .post('/api/v1/children')
        .set('Authorization', `Bearer ${testToken}`)
        .send(childData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(childData.name);
      expect(response.body.data.age).toBe(childData.age);
      expect(response.body.data.gender).toBe(childData.gender);
      expect(response.body.data.grade).toBe(childData.grade);
    });

    /**
     * Test validation errors
     */
    it('should return 400 for validation errors', async () => {
      const invalidData = {
        name: 'J',
        age: 25,
        gender: 'male',
        grade: '5TH',
        parentId: testParent._id.toString()
      };

      const response = await request(app)
        .post('/api/v1/children')
        .set('Authorization', `Bearer ${testToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });

    /**
     * Test missing required fields
     */
    it('should return 400 when required fields are missing', async () => {
      const incompleteData = {
        name: 'John Doe',
        age: 10
      };

      const response = await request(app)
        .post('/api/v1/children')
        .set('Authorization', `Bearer ${testToken}`)
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    /**
     * Test with non-existent parent
     */
    it('should return 404 when parent does not exist', async () => {
      const childData = {
        name: 'John Doe',
        age: 10,
        gender: 'male',
        grade: '5TH',
        parentId: new mongoose.Types.ObjectId().toString()
      };

      const response = await request(app)
        .post('/api/v1/children')
        .set('Authorization', `Bearer ${testToken}`)
        .send(childData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/children/:id', () => {
    let testChild;

    beforeEach(async () => {
      testChild = await Child.create({
        name: 'Jane Doe',
        age: 8,
        gender: 'female',
        grade: '3RD',
        parentId: testParent._id
      });
    });

    /**
     * Test getting child by ID
     */
    it('should get child by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/children/${testChild._id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(testChild.name);
      expect(response.body.data.age).toBe(testChild.age);
    });

    /**
     * Test getting non-existent child
     */
    it('should return 404 for non-existent child', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/v1/children/${fakeId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    /**
     * Test with invalid ID format
     */
    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/v1/children/invalid-id')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/children/by-parent', () => {
    beforeEach(async () => {
      await Child.create([
        { name: 'Child 1', age: 10, gender: 'male', grade: '5TH', parentId: testParent._id },
        { name: 'Child 2', age: 8, gender: 'female', grade: '3RD', parentId: testParent._id },
        { name: 'Child 3', age: 12, gender: 'male', grade: '7TH', parentId: testParent._id }
      ]);
    });

    /**
     * Test getting children by parent
     */
    it('should get all children for a parent', async () => {
      const response = await request(app)
        .get('/api/v1/children/by-parent')
        .query({ parentId: testParent._id.toString() })
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
    });

    /**
     * Test with pagination
     */
    it('should respect pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/children/by-parent')
        .query({ 
          parentId: testParent._id.toString(),
          limit: 2,
          skip: 1
        })
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    /**
     * Test without parent ID
     */
    it('should return 400 when parent ID is missing', async () => {
      const response = await request(app)
        .get('/api/v1/children/by-parent')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/children/:id', () => {
    let testChild;

    beforeEach(async () => {
      testChild = await Child.create({
        name: 'Original Name',
        age: 10,
        gender: 'male',
        grade: '5TH',
        parentId: testParent._id
      });
    });

    /**
     * Test updating child
     */
    it('should update child successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        age: 11
      };

      const response = await request(app)
        .patch(`/api/v1/children/${testChild._id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.age).toBe(updateData.age);
    });

    /**
     * Test partial update
     */
    it('should allow partial updates', async () => {
      const updateData = { age: 12 };

      const response = await request(app)
        .patch(`/api/v1/children/${testChild._id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.age).toBe(updateData.age);
      expect(response.body.data.name).toBe(testChild.name);
    });

    /**
     * Test invalid update data
     */
    it('should return 400 for invalid age', async () => {
      const updateData = { age: 25 };

      const response = await request(app)
        .patch(`/api/v1/children/${testChild._id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/children/:id', () => {
    let testChild;

    beforeEach(async () => {
      testChild = await Child.create({
        name: 'To Be Deleted',
        age: 10,
        gender: 'male',
        grade: '5TH',
        parentId: testParent._id
      });
    });

    /**
     * Test deleting child
     */
    it('should delete child successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/children/${testChild._id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(true);

      const deletedChild = await Child.findById(testChild._id);
      expect(deletedChild).toBeNull();
    });

    /**
     * Test deleting non-existent child
     */
    it('should return 404 when child does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/v1/children/${fakeId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/children/:id/courses', () => {
    let testChild;

    beforeEach(async () => {
      testChild = await Child.create({
        name: 'Test Child',
        age: 10,
        gender: 'male',
        grade: '5TH',
        parentId: testParent._id,
        courseIds: []
      });
    });

    /**
     * Test adding courses to child
     */
    it('should add courses to child successfully', async () => {
      const courseIds = [
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString()
      ];

      const response = await request(app)
        .post(`/api/v1/children/${testChild._id}/courses`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ courseIds })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.courseIds).toHaveLength(2);
    });

    /**
     * Test adding courses with empty array
     */
    it('should return 400 when course IDs array is empty', async () => {
      const response = await request(app)
        .post(`/api/v1/children/${testChild._id}/courses`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ courseIds: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/children/:id/summary', () => {
    let testChild;

    beforeEach(async () => {
      testChild = await Child.create({
        name: 'Test Child',
        age: 10,
        gender: 'male',
        grade: '5TH',
        parentId: testParent._id,
        courseIds: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()]
      });
    });

    /**
     * Test getting child summary
     */
    it('should get child summary with course count', async () => {
      const response = await request(app)
        .get(`/api/v1/children/${testChild._id}/summary`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.courseCount).toBe(2);
      expect(response.body.data.name).toBe(testChild.name);
      expect(response.body.data.age).toBe(testChild.age);
    });
  });

  describe('GET /api/v1/children/count', () => {
    beforeEach(async () => {
      await Child.create([
        { name: 'Child 1', age: 10, gender: 'male', grade: '5TH', parentId: testParent._id },
        { name: 'Child 2', age: 8, gender: 'female', grade: '3RD', parentId: testParent._id }
      ]);
    });

    /**
     * Test counting children
     */
    it('should return correct count of children for parent', async () => {
      const response = await request(app)
        .get('/api/v1/children/count')
        .query({ parentId: testParent._id.toString() })
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(2);
    });

    /**
     * Test count without parent ID
     */
    it('should return 400 when parent ID is missing', async () => {
      const response = await request(app)
        .get('/api/v1/children/count')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
