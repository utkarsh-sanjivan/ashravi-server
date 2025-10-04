const childService = require('../../src/services/childService');
const childRepository = require('../../src/repositories/childRepository');
const childEducationRepository = require('../../src/repositories/childEducationRepository');
const childNutritionRepository = require('../../src/repositories/childNutritionRepository');
const User = require('../../src/models/User');

jest.mock('../../src/repositories/childRepository');
jest.mock('../../src/repositories/childEducationRepository');
jest.mock('../../src/repositories/childNutritionRepository');
jest.mock('../../src/models/User');

describe('Child Service - Linked Data Unit Tests', () => {
  let mockParent;
  let mockChild;
  let mockEducationRecord;
  let mockNutritionRecord;

  beforeEach(() => {
    jest.clearAllMocks();

    mockParent = {
      _id: '507f1f77bcf86cd799439010',
      name: 'Parent User',
      email: 'parent@example.com',
      role: 'user'
    };

    mockChild = {
      _id: '507f1f77bcf86cd799439011',
      id: '507f1f77bcf86cd799439011',
      name: 'John Doe',
      age: 10,
      gender: 'male',
      grade: '5TH',
      parentId: '507f1f77bcf86cd799439010',
      courseIds: []
    };

    mockEducationRecord = {
      _id: '507f1f77bcf86cd799439020',
      id: '507f1f77bcf86cd799439020',
      childId: '507f1f77bcf86cd799439011',
      records: [
        {
          gradeYear: 'Grade 5',
          subjects: [{ subject: 'Math', marks: 85 }]
        }
      ],
      suggestions: []
    };

    mockNutritionRecord = {
      _id: '507f1f77bcf86cd799439021',
      id: '507f1f77bcf86cd799439021',
      childId: '507f1f77bcf86cd799439011',
      records: [
        {
          physicalMeasurement: { heightCm: 140, weightKg: 35 },
          eatingHabits: {
            eatsBreakfastRegularly: true,
            drinksEnoughWater: true,
            eatsFruitsDaily: true,
            eatsVegetablesDaily: true,
            limitsJunkFood: true,
            hasRegularMealTimes: true,
            enjoysVarietyOfFoods: true,
            eatsAppropriatePor tions: true
          }
        }
      ],
      recommendations: []
    };
  });

  describe('createChild with initializeRelated', () => {
    /**
     * Test creating child with initialized related records
     */
    it('should create child and initialize related records', async () => {
      const childData = {
        name: 'John Doe',
        age: 10,
        gender: 'male',
        grade: '5TH',
        parentId: '507f1f77bcf86cd799439010'
      };

      User.findById = jest.fn().mockResolvedValue(mockParent);
      User.findByIdAndUpdate = jest.fn().mockResolvedValue(mockParent);
      childRepository.createChild = jest.fn().mockResolvedValue(mockChild);
      childEducationRepository.createEducationRecord = jest.fn().mockResolvedValue(mockEducationRecord);
      childNutritionRepository.createNutritionRecord = jest.fn().mockResolvedValue(mockNutritionRecord);

      const result = await childService.createChild(childData, true);

      expect(result).toBeDefined();
      expect(childEducationRepository.createEducationRecord).toHaveBeenCalled();
      expect(childNutritionRepository.createNutritionRecord).toHaveBeenCalled();
    });
  });

  describe('getChild with includeRelated', () => {
    /**
     * Test getting child with related data
     */
    it('should return child with education and nutrition data', async () => {
      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      childEducationRepository.getByChildId = jest.fn().mockResolvedValue(mockEducationRecord);
      childNutritionRepository.getByChildId = jest.fn().mockResolvedValue(mockNutritionRecord);

      const result = await childService.getChild('507f1f77bcf86cd799439011', true);

      expect(result).toBeDefined();
      expect(result.educationData).toBeTruthy();
      expect(result.nutritionData).toBeTruthy();
      expect(childEducationRepository.getByChildId).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(childNutritionRepository.getByChildId).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('deleteChild with cascade', () => {
    /**
     * Test cascade deletion
     */
    it('should delete child and related records', async () => {
      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      childEducationRepository.getByChildId = jest.fn().mockResolvedValue(mockEducationRecord);
      childNutritionRepository.getByChildId = jest.fn().mockResolvedValue(mockNutritionRecord);
      childEducationRepository.deleteEducationRecord = jest.fn().mockResolvedValue(true);
      childNutritionRepository.deleteNutritionRecord = jest.fn().mockResolvedValue(true);
      childRepository.deleteChild = jest.fn().mockResolvedValue(true);
      User.findByIdAndUpdate = jest.fn().mockResolvedValue(mockParent);

      const result = await childService.deleteChild('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439010');

      expect(result).toBe(true);
      expect(childEducationRepository.deleteEducationRecord).toHaveBeenCalled();
      expect(childNutritionRepository.deleteNutritionRecord).toHaveBeenCalled();
      expect(childRepository.deleteChild).toHaveBeenCalled();
    });
  });

  describe('getChildSummary', () => {
    /**
     * Test getting child summary with insights
     */
    it('should return comprehensive summary with education and nutrition insights', async () => {
      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      childEducationRepository.getByChildId = jest.fn().mockResolvedValue(mockEducationRecord);
      childNutritionRepository.getByChildId = jest.fn().mockResolvedValue(mockNutritionRecord);

      const result = await childService.getChildSummary('507f1f77bcf86cd799439011');

      expect(result).toBeDefined();
      expect(result.hasEducationData).toBe(true);
      expect(result.hasNutritionData).toBe(true);
      expect(result.education).toBeDefined();
      expect(result.education.recordCount).toBe(1);
      expect(result.nutrition).toBeDefined();
      expect(result.nutrition.recordCount).toBe(1);
      expect(result.nutrition.currentBMI).toBeDefined();
    });
  });
});
