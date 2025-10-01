const request = require('supertest');
const { Server } = require('../../src/server');
const User = require('../../src/models/User');

describe('Authentication Integration Tests', () => {
  let app;
  let server;

  beforeAll(async () => {
    // Create server instance for testing
    const serverInstance = new Server();
    app = serverInstance.app;

    // Wait a bit for server to initialize
    await testUtils.wait(1000);
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const userData = testUtils.generateUserData();

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeTruthy();
    });

    it('should return 400 for duplicate email', async () => {
      const userData = testUtils.generateUserData();

      // Create user first
      await User.create(userData);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('User already exists');
    });

    it('should return 400 for validation errors', async () => {
      const invalidData = {
        name: 'A', // Too short
        email: 'invalid-email',
        password: '123' // Too short and no complexity
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
      expect(response.body.details).toBeInstanceOf(Array);
    });

    it('should return 429 for rate limit exceeded', async () => {
      const userData1 = testUtils.generateUserData({ email: 'test1@example.com' });
      const userData2 = testUtils.generateUserData({ email: 'test2@example.com' });
      const userData3 = testUtils.generateUserData({ email: 'test3@example.com' });
      const userData4 = testUtils.generateUserData({ email: 'test4@example.com' });
      const userData5 = testUtils.generateUserData({ email: 'test5@example.com' });
      const userData6 = testUtils.generateUserData({ email: 'test6@example.com' });

      // Make 5 successful requests (within rate limit)
      await request(app).post('/api/v1/auth/register').send(userData1);
      await request(app).post('/api/v1/auth/register').send(userData2);
      await request(app).post('/api/v1/auth/register').send(userData3);
      await request(app).post('/api/v1/auth/register').send(userData4);
      await request(app).post('/api/v1/auth/register').send(userData5);

      // 6th request should be rate limited
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData6)
        .expect(429);

      expect(response.body.error).toContain('Too many');
    }, 10000);
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const userData = testUtils.generateUserData();
      await User.create(userData);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeTruthy();
    });

    it('should return 401 for invalid credentials', async () => {
      const userData = testUtils.generateUserData();
      await User.create(userData);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authentication failed');
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      const userData = testUtils.generateUserData();
      const user = await User.create(userData);
      const token = user.getSignedJwtToken();

      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/auth/profile', () => {
    it('should update user profile', async () => {
      const userData = testUtils.generateUserData();
      const user = await User.create(userData);
      const token = user.getSignedJwtToken();

      const updateData = { name: 'Updated Name' };

      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe(updateData.name);
    });
  });

  describe('PUT /api/v1/auth/change-password', () => {
    it('should change password successfully', async () => {
      const userData = testUtils.generateUserData();
      const user = await User.create(userData);
      const token = user.getSignedJwtToken();

      const passwordData = {
        currentPassword: userData.password,
        newPassword: 'NewPassword123!'
      };

      const response = await request(app)
        .put('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password changed successfully');
    });

    it('should return 400 for incorrect current password', async () => {
      const userData = testUtils.generateUserData();
      const user = await User.create(userData);
      const token = user.getSignedJwtToken();

      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'NewPassword123!'
      };

      const response = await request(app)
        .put('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
