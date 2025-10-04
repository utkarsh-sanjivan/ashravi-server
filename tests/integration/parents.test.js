const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const Parent = require('../../src/models/Parent');
const Child = require('../../src/models/Child');
const User = require('../../src/models/User');
const parentRoutes = require('../../src/routes/parents');
const errorHandler = require('../../src/middleware/errorHandler');

let app;
let mongod;
let testUser;
let testToken;

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
  
  testApp.use('/api/v1/parents', parentRoutes);
  testApp.use(errorHandler.handle.bind(errorHandler));
  
  return testApp;
};

describe('Parents API - Integration Tests', () => {
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
    await Parent.deleteMany({});
    await Child.deleteMany({});
    await User.deleteMany({});
    
    testUser = await User.create({
      name: 'Test User',
      email: `user${Date.now()}@example.com`,
      password: 'TestPass123!',
      role: 'admin'
    });
    
    testToken = testUser.getSignedJwtToken();
  });

  afterEach(async () => {
    await Parent.deleteMany({});
    await Child.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/v1/parents', () => {
    /**
     * Test creating a parent successfully
     */
    it('should create a new parent successfully', async () => {
      const parentData = {
        name: 'John Smith',
        phoneNumber: '+1-555-123-4567',
        emailAddress: 'john.smith@example.com',
        city: 'New York',
        economicStatus: 'Middle Class',
        occupation: 'Software Engineer'
      };

      const response = await request(app)
        .post('/api/v1/parents')
        .set('Authorization', `Bearer ${testToken}`)
        .send(parentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(parentData.name);
      expect(response.body.data.emailAddress).toBe(parentData.emailAddress);
    });

    /**
     * Test validation errors
     */
    it('should return 400 for validation errors', async () => {
      const invalidData = {
        name: 'J',
        phoneNumber: '123',
        emailAddress: 'invalid-email',
        city: 'NY',
        economicStatus: 'M',
        occupation: 'S'
      };

      const response = await request(app)
        .post('/api/v1/parents')
        .set('Authorization', `Bearer ${testToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });

    /**
     * Test duplicate email
     */
    it('should return 409 for duplicate email', async () => {
      const parentData = {
        name: 'John Smith',
        phoneNumber: '+1-555-123-4567',
        emailAddress: 'john.smith@example.com',
        city: 'New York',
        economicStatus: 'Middle Class',
        occupation: 'Software Engineer'
      };

      await Parent.create(parentData);

      const response = await request(app)
        .post('/api/v1/parents')
        .set('Authorization', `Bearer ${testToken}`)
        .send(parentData)
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/parents/:id', () => {
    let testParent;

    beforeEach(async () => {
      testParent = await Parent.create({
        name: 'Jane Doe',
        phoneNumber: '+1-555-987-6543',
        emailAddress: 'jane.doe@example.com',
        city: 'Los Angeles',
        economicStatus: 'Upper Class',
        occupation: 'Doctor'
      });
    });

    /**
     * Test getting parent by ID
     */
    it('should get parent by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/parents/${testParent._id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(testParent.name);
      expect(response.body.data.emailAddress).toBe(testParent.emailAddress);
    });

    /**
     * Test getting non-existent parent
     */
    it('should return 404 for non-existent parent', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/v1/parents/${fakeId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/parents/by-email', () => {
    let testParent;

    beforeEach(async () => {
      testParent = await Parent.create({
        name: 'Bob Wilson',
        phoneNumber: '+1-555-111-2222',
        emailAddress: 'bob.wilson@example.com',
        city: 'Chicago',
        economicStatus: 'Middle Class',
        occupation: 'Teacher'
      });
    });

    /**
     * Test getting parent by email
     */
    it('should get parent by email successfully', async () => {
      const response = await request(app)
        .get('/api/v1/parents/by-email')
        .query({ email: testParent.emailAddress })
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.emailAddress).toBe(testParent.emailAddress);
    });

    /**
     * Test with non-existent email
     */
    it('should return 404 for non-existent email', async () => {
      const response = await request(app)
        .get('/api/v1/parents/by-email')
        .query({ email: 'nonexistent@example.com' })
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/parents/by-city', () => {
    beforeEach(async () => {
      await Parent.create([
        {
          name: 'Parent 1',
          phoneNumber: '+1-555-111-1111',
          emailAddress: 'parent1@example.com',
          city: 'Boston',
          economicStatus: 'Middle Class',
          occupation: 'Engineer'
        },
        {
          name: 'Parent 2',
          phoneNumber: '+1-555-222-2222',
          emailAddress: 'parent2@example.com',
          city: 'Boston',
          economicStatus: 'Upper Class',
          occupation: 'Lawyer'
        }
      ]);
    });

    /**
     * Test getting parents by city
     */
    it('should get parents by city successfully', async () => {
      const response = await request(app)
        .get('/api/v1/parents/by-city')
        .query({ city: 'Boston' })
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('PATCH /api/v1/parents/:id', () => {
    let testParent;

    beforeEach(async () => {
      testParent = await Parent.create({
        name: 'Original Name',
        phoneNumber: '+1-555-999-9999',
        emailAddress: 'original@example.com',
        city: 'Miami',
        economicStatus: 'Middle Class',
        occupation: 'Artist'
      });
    });

    /**
     * Test updating parent
     */
    it('should update parent successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        city: 'Orlando'
      };

      const response = await request(app)
        .patch(`/api/v1/parents/${testParent._id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.city).toBe(updateData.city);
    });
  });

  describe('DELETE /api/v1/parents/:id', () => {
    let testParent;

    beforeEach(async () => {
      testParent = await Parent.create({
        name: 'To Be Deleted',
        phoneNumber: '+1-555-000-0000',
        emailAddress: 'delete@example.com',
        city: 'Seattle',
        economicStatus: 'Middle Class',
        occupation: 'Developer'
      });
    });

    /**
     * Test deleting parent without children
     */
    it('should delete parent successfully when no children', async () => {
      const response = await request(app)
        .delete(`/api/v1/parents/${testParent._id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(true);

      const deletedParent = await Parent.findById(testParent._id);
      expect(deletedParent).toBeNull();
    });

    /**
     * Test deleting parent with children without cascade
     */
    it('should return 400 when parent has children and cascade is false', async () => {
      const child = await Child.create({
        name: 'Test Child',
        age: 10,
        gender: 'male',
        grade: '5TH',
        parentId: testParent._id
      });

      testParent.childrenIds.push(child._id);
      await testParent.save();

      const response = await request(app)
        .delete(`/api/v1/parents/${testParent._id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/parents/:id/children', () => {
    let testParent;
    let testChild;

    beforeEach(async () => {
      testParent = await Parent.create({
        name: 'Test Parent',
        phoneNumber: '+1-555-777-7777',
        emailAddress: 'testparent@example.com',
        city: 'Denver',
        economicStatus: 'Middle Class',
        occupation: 'Nurse'
      });

      testChild = await Child.create({
        name: 'Test Child',
        age: 8,
        gender: 'female',
        grade: '3RD',
        parentId: testParent._id
      });
    });

    /**
     * Test adding child to parent
     */
    it('should add child to parent successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/parents/${testParent._id}/children`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ childId: testChild._id.toString() })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.childrenIds).toContain(testChild._id.toString());
    });
  });

  describe('GET /api/v1/parents/count', () => {
    beforeEach(async () => {
      await Parent.create([
        {
          name: 'Parent 1',
          phoneNumber: '+1-555-100-0001',
          emailAddress: 'count1@example.com',
          city: 'Austin',
          economicStatus: 'Middle Class',
          occupation: 'Mechanic'
        },
        {
          name: 'Parent 2',
          phoneNumber: '+1-555-100-0002',
          emailAddress: 'count2@example.com',
          city: 'Dallas',
          economicStatus: 'Upper Class',
          occupation: 'CEO'
        }
      ]);
    });

    /**
     * Test counting parents
     */
    it('should return correct count of parents', async () => {
      const response = await request(app)
        .get('/api/v1/parents/count')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(2);
    });
  });
});
