const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const ChildNutrition = require('../../src/models/ChildNutrition');
const Child = require('../../src/models/Child');
const childNutritionRoutes = require('../../src/routes/childNutrition');
const errorHandler = require('../../src/middleware/errorHandler');

let app;
let mongod;
let testUser;
let testToken;
let testChild;

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
  
  testApp.use('/api/v1/child-nutrition', childNutritionRoutes);
  testApp.use(errorHandler.handle.bind(errorHandler));
  
  return testApp;
};

describe('Child Nutrition API - Integration Tests', () => {
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
    await ChildNutrition.deleteMany({});
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
    await ChildNutrition.deleteMany({});
    await Child.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/v1/child-nutrition', () => {
    it('should create a new nutrition record successfully', async () => {
      const nutritionData = {
        childId: testChild._id.toString(),
        records: [],
        recommendations: []
      };

      const response = await request(app)
        .post('/api/v1/child-nutrition')
        .set('Authorization', `Bearer ${testToken}`)
        .send(nutritionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.childId).toBe(testChild._id.toString());
    });

    it('should return 409 for duplicate nutrition record', async () => {
      await ChildNutrition.create({
        childId: testChild._id,
        records: [],
        recommendations: []
      });

      const nutritionData = {
        childId: testChild._id.toString(),
        records: []
      };

      const response = await request(app)
        .post('/api/v1/child-nutrition')
        .set('Authorization', `Bearer ${testToken}`)
        .send(nutritionData)
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/child-nutrition/add-entry', () => {
    beforeEach(async () => {
      await ChildNutrition.create({
        childId: testChild._id,
        records: [],
        recommendations: []
      });
    });

    it('should add nutrition entry successfully', async () => {
      const entry = {
        physicalMeasurement: {
          heightCm: 140,
          weightKg: 35
        },
        eatingHabits: {
          eatsBreakfastRegularly: true,
          drinksEnoughWater: true,
          eatsFruitsDaily: true,
          eatsVegetablesDaily: true,
          limitsJunkFood: true,
          hasRegularMealTimes: true,
          enjoysVarietyOfFoods: true,
          eatsAppropriatePortions: true
        }
      };

      const response = await request(app)
        .post('/api/v1/child-nutrition/add-entry')
        .query({ childId: testChild._id.toString() })
        .set('Authorization', `Bearer ${testToken}`)
        .send(entry)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toHaveLength(1);
    });
  });

  describe('GET /api/v1/child-nutrition/analysis', () => {
    beforeEach(async () => {
      await ChildNutrition.create({
        childId: testChild._id,
        records: [
          {
            physicalMeasurement: {
              heightCm: 140,
              weightKg: 35
            },
            eatingHabits: {
              eatsBreakfastRegularly: true,
              drinksEnoughWater: true,
              eatsFruitsDaily: false,
              eatsVegetablesDaily: true,
              limitsJunkFood: false,
              hasRegularMealTimes: true,
              enjoysVarietyOfFoods: true,
              eatsAppropriatePortions: true
            }
          }
        ],
        recommendations: []
      });
    });

    it('should get nutrition analysis successfully', async () => {
      const response = await request(app)
        .get('/api/v1/child-nutrition/analysis')
        .query({ childId: testChild._id.toString() })
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hasData).toBe(true);
      expect(response.body.data.analysis).toBeDefined();
      expect(response.body.data.analysis.currentBMI).toBeDefined();
    });
  });
});
