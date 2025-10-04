const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const Child = require('../../src/models/Child');
const ChildEducation = require('../../src/models/ChildEducation');
const ChildNutrition = require('../../src/models/ChildNutrition');
const User = require('../../src/models/User');
const childrenRoutes = require('../../src/routes/children');
const errorHandler = require('../../src/middleware/errorHandler');

let app;
let mongod;
let testUser;
let testToken;

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
  
  testApp.use('/api/v1/children', childrenRoutes);
  testApp.use(errorHandler.handle.bind(errorHandler));
  
  return testApp;
};

describe('Children API - Linked Data Integration Tests', () => {
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
    await ChildEducation.deleteMany({});
    await ChildNutrition.deleteMany({});
    await User.deleteMany({});
    
    testUser = await User.create({
      name: 'Test Parent',
      email: `parent${Date.now()}@example.com`,
      password: 'TestPass123!',
      role: 'user'
    });
    
    testToken = testUser.getSignedJwtToken();
  });

  afterEach(async () => {
    await Child.deleteMany({});
    await ChildEducation.deleteMany({});
    await ChildNutrition.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/v1/children with initializeRelated', () => {
    /**
     * Test creating child with initialized related records
     */
    it('should create child and initialize education and nutrition records', async () => {
      const childData = {
        name: 'John Doe',
        age: 10,
        gender: 'male',
        grade: '5TH',
        parentId: testUser._id.toString()
      };

      const response = await request(app)
        .post('/api/v1/children')
        .query({ initializeRelated: 'true' })
        .set('Authorization', `Bearer ${testToken}`)
        .send(childData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(childData.name);

      const childId = response.body.data.id || response.body.data._id;

      // Verify education record was created
      const educationRecord = await ChildEducation.findOne({ childId });
      expect(educationRecord).toBeTruthy();
      expect(educationRecord.records).toHaveLength(0);

      // Verify nutrition record was created
      const nutritionRecord = await ChildNutrition.findOne({ childId });
      expect(nutritionRecord).toBeTruthy();
      expect(nutritionRecord.records).toHaveLength(0);
    });
  });

  describe('GET /api/v1/children/:id with includeRelated', () => {
    let testChild;

    beforeEach(async () => {
      testChild = await Child.create({
        name: 'Jane Doe',
        age: 8,
        gender: 'female',
        grade: '3RD',
        parentId: testUser._id
      });

      await ChildEducation.create({
        childId: testChild._id,
        records: [
          {
            gradeYear: 'Grade 3',
            subjects: [{ subject: 'Math', marks: 85 }]
          }
        ],
        suggestions: []
      });

      await ChildNutrition.create({
        childId: testChild._id,
        records: [
          {
            physicalMeasurement: {
              heightCm: 130,
              weightKg: 30
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
          }
        ],
        recommendations: []
      });
    });

    /**
     * Test getting child with related data
     */
    it('should get child with education and nutrition data', async () => {
      const response = await request(app)
        .get(`/api/v1/children/${testChild._id}`)
        .query({ includeRelated: 'true' })
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.educationData).toBeTruthy();
      expect(response.body.data.educationData.records).toHaveLength(1);
      expect(response.body.data.nutritionData).toBeTruthy();
      expect(response.body.data.nutritionData.records).toHaveLength(1);
    });

    /**
     * Test getting child without related data
     */
    it('should get child without related data when includeRelated is false', async () => {
      const response = await request(app)
        .get(`/api/v1/children/${testChild._id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.educationData).toBeUndefined();
      expect(response.body.data.nutritionData).toBeUndefined();
    });
  });

  describe('GET /api/v1/children/by-parent with includeRelated', () => {
    beforeEach(async () => {
      const child1 = await Child.create({
        name: 'Child 1',
        age: 10,
        gender: 'male',
        grade: '5TH',
        parentId: testUser._id
      });

      const child2 = await Child.create({
        name: 'Child 2',
        age: 8,
        gender: 'female',
        grade: '3RD',
        parentId: testUser._id
      });

      await ChildEducation.create({
        childId: child1._id,
        records: [{ gradeYear: 'Grade 5', subjects: [{ subject: 'Math', marks: 90 }] }],
        suggestions: []
      });

      await ChildNutrition.create({
        childId: child2._id,
        records: [{
          physicalMeasurement: { heightCm: 130, weightKg: 30 },
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
        }],
        recommendations: []
      });
    });

    /**
     * Test getting children by parent with related data
     */
    it('should get children with related data', async () => {
      const response = await request(app)
        .get('/api/v1/children/by-parent')
        .query({ 
          parentId: testUser._id.toString(),
          includeRelated: 'true'
        })
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      
      const firstChild = response.body.data[0];
      const secondChild = response.body.data[1];
      
      expect(firstChild.educationData || firstChild.nutritionData).toBeTruthy();
      expect(secondChild.educationData || secondChild.nutritionData).toBeTruthy();
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
        parentId: testUser._id
      });

      await ChildEducation.create({
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
        suggestions: [
          {
            subject: 'Science',
            suggestion: 'Focus on improvement',
            priority: 'high',
            type: 'performance'
          }
        ]
      });

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
        recommendations: [
          {
            category: 'diet',
            recommendation: 'Include more fruits',
            priority: 'medium',
            targetArea: 'Fruits'
          }
        ]
      });
    });

    /**
     * Test getting child summary with insights
     */
    it('should get comprehensive child summary', async () => {
      const response = await request(app)
        .get(`/api/v1/children/${testChild._id}/summary`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const summary = response.body.data;

      expect(summary.name).toBe('Test Child');
      expect(summary.hasEducationData).toBe(true);
      expect(summary.hasNutritionData).toBe(true);

      expect(summary.education).toBeDefined();
      expect(summary.education.recordCount).toBe(1);
      expect(summary.education.latestGrade).toBe('Grade 5');
      expect(summary.education.currentAverage).toBeGreaterThan(0);
      expect(summary.education.suggestionCount).toBe(1);
      expect(summary.education.highPrioritySuggestions).toBe(1);

      expect(summary.nutrition).toBeDefined();
      expect(summary.nutrition.recordCount).toBe(1);
      expect(summary.nutrition.currentBMI).toBeDefined();
      expect(summary.nutrition.recommendationCount).toBe(1);
    });
  });

  describe('DELETE /api/v1/children/:id cascade', () => {
    let testChild;

    beforeEach(async () => {
      testChild = await Child.create({
        name: 'To Delete',
        age: 10,
        gender: 'male',
        grade: '5TH',
        parentId: testUser._id
      });

      await ChildEducation.create({
        childId: testChild._id,
        records: [],
        suggestions: []
      });

      await ChildNutrition.create({
        childId: testChild._id,
        records: [],
        recommendations: []
      });
    });

    /**
     * Test cascade deletion of child and related data
     */
    it('should delete child and cascade to education and nutrition', async () => {
      const response = await request(app)
        .delete(`/api/v1/children/${testChild._id}`)
        .query({ parentId: testUser._id.toString() })
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(true);

      // Verify child is deleted
      const deletedChild = await Child.findById(testChild._id);
      expect(deletedChild).toBeNull();

      // Verify education record is deleted
      const educationRecord = await ChildEducation.findOne({ childId: testChild._id });
      expect(educationRecord).toBeNull();

      // Verify nutrition record is deleted
      const nutritionRecord = await ChildNutrition.findOne({ childId: testChild._id });
      expect(nutritionRecord).toBeNull();
    });
  });
});
