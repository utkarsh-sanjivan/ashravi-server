const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const redis = require('redis');

let mongod;
let redisClient;

// Global test setup
beforeAll(async () => {
  // Setup in-memory MongoDB
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  await mongoose.connect(uri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferCommands: false,
    bufferMaxEntries: 0
  });

  // Setup Redis mock for testing
  jest.mock('redis', () => ({
    createClient: jest.fn(() => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
      ping: jest.fn(() => Promise.resolve('PONG')),
      set: jest.fn(() => Promise.resolve('OK')),
      get: jest.fn(() => Promise.resolve(null)),
      del: jest.fn(() => Promise.resolve(1)),
      exists: jest.fn(() => Promise.resolve(0)),
      setEx: jest.fn(() => Promise.resolve('OK')),
      quit: jest.fn(() => Promise.resolve()),
      on: jest.fn(),
    }))
  }));
}, 30000);

// Clean up after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Global test teardown
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();

  if (mongod) {
    await mongod.stop();
  }
}, 30000);

// Test utilities
global.testUtils = {
  // Generate test user data
  generateUserData: (overrides = {}) => ({
    name: 'Test User',
    email: 'test@example.com',
    password: 'TestPassword123!',
    ...overrides
  }),

  // Generate admin user data
  generateAdminData: (overrides = {}) => ({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'AdminPassword123!',
    role: 'admin',
    ...overrides
  }),

  // Wait for a specific time
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate random string
  randomString: (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Generate random email
  randomEmail: () => `test${Date.now()}@example.com`
};
