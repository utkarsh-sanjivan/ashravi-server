const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const Parent = require('../../src/models/Parent');
const authRoutes = require('../../src/routes/authRoute');
const errorHandler = require('../../src/middleware/errorHandler');

let app;
let mongod;

const setupTestApp = () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use('/api/v1/auth', authRoutes);
  testApp.use(errorHandler.handle);
  return testApp;
};

describe('Auth API - Integration Tests', () => {
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
  });

  afterEach(async () => {
    await Parent.deleteMany({});
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new parent successfully', async () => {
      const parentData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        city: 'New York',
        economicStatus: 'Middle Income',
        occupation: 'Software Engineer'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(parentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('parent');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.parent.email).toBe(parentData.email);
    });

    it('should return 400 when parent already exists', async () => {
      const parentData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        city: 'New York',
        economicStatus: 'Middle Income',
        occupation: 'Software Engineer'
      };

      await Parent.create(parentData);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(parentData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 with invalid data', async () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    let testParent;

    beforeEach(async () => {
      testParent = await Parent.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        city: 'New York',
        economicStatus: 'Middle Income',
        occupation: 'Software Engineer'
      });
    });

    it('should login with valid credentials', async () => {
      const credentials = {
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('parent');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should return 401 with invalid email', async () => {
      const credentials = {
        email: 'wrong@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 with invalid password', async () => {
      const credentials = {
        email: 'john@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    let testParent;
    let token;

    beforeEach(async () => {
      testParent = await Parent.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        city: 'New York',
        economicStatus: 'Middle Income',
        occupation: 'Software Engineer'
      });

      token = testParent.getSignedJwtToken();
    });

    it('should get profile with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('email', 'john@example.com');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/auth/profile', () => {
    let testParent;
    let token;

    beforeEach(async () => {
      testParent = await Parent.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        city: 'New York',
        economicStatus: 'Middle Income',
        occupation: 'Software Engineer'
      });

      token = testParent.getSignedJwtToken();
    });

    it('should update profile successfully', async () => {
      const updateData = {
        name: 'Jane Doe',
        city: 'Los Angeles'
      };

      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Jane Doe');
      expect(response.body.data.city).toBe('Los Angeles');
    });
  });

  describe('PUT /api/v1/auth/change-password', () => {
    let testParent;
    let token;

    beforeEach(async () => {
      testParent = await Parent.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        city: 'New York',
        economicStatus: 'Middle Income',
        occupation: 'Software Engineer'
      });

      token = testParent.getSignedJwtToken();
    });

    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password changed successfully');
    });

    it('should return 400 with incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let testParent;
    let refreshToken;

    beforeEach(async () => {
      testParent = await Parent.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        city: 'New York',
        economicStatus: 'Middle Income',
        occupation: 'Software Engineer'
      });

      refreshToken = testParent.generateRefreshToken();
      testParent.refreshTokens.push({
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      await testParent.save();
    });

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should return 401 with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/verify', () => {
    let testParent;
    let token;

    beforeEach(async () => {
      testParent = await Parent.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        city: 'New York',
        economicStatus: 'Middle Income',
        occupation: 'Software Engineer'
      });

      token = testParent.getSignedJwtToken();
    });

    it('should verify valid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify')
        .send({ token })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('valid', true);
      expect(response.body.data).toHaveProperty('parent');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify')
        .send({ token: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let testParent;
    let token;

    beforeEach(async () => {
      testParent = await Parent.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        city: 'New York',
        economicStatus: 'Middle Income',
        occupation: 'Software Engineer'
      });

      token = testParent.getSignedJwtToken();
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });
  });
});
