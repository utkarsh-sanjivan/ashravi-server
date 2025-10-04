const childNutritionService = require('../../src/services/childNutritionService');
const childNutritionRepository = require('../../src/repositories/childNutritionRepository');
const childRepository = require('../../src/repositories/childRepository');

jest.mock('../../src/repositories/childNutritionRepository');
jest.mock('../../src/repositories/childRepository');

describe('Child Nutrition Service - Unit Tests', () => {
  let mockChild;
  let mockNutritionRecord;

  beforeEach(() => {
    jest.clearAllMocks();

    mockChild = {
      _id: '507f1f77bcf86cd799439011',
      id: '507f1f77bcf86cd799439011',
      name: 'John Doe',
      age: 10,
      gender: 'male',
      grade: '5TH'
    };

    mockNutritionRecord = {
      _id: '507f1f77bcf86cd799439020',
      id: '507f1f77bcf86cd799439020',
      childId: '507f1f77bcf86cd799439011',
      records: [
        {
          physicalMeasurement: {
            heightCm: 140,
            weightKg: 35,
            measurementDate: new Date()
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
          },
          recordedAt: new Date(),
          notes: 'Doing well overall'
        }
      ],
      recommendations: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createNutritionRecord', () => {
    /**
     * Test successful nutrition record creation
     */
    it('should create nutrition record successfully', async () => {
      const recordData = {
        childId: '507f1f77bcf86cd799439011',
        records: [],
        recommendations: []
      };

      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      childNutritionRepository.getByChildId = jest.fn().mockResolvedValue(null);
      childNutritionRepository.createNutritionRecord = jest.fn().mockResolvedValue(mockNutritionRecord);

      const result = await childNutritionService.createNutritionRecord(recordData);

      expect(result).toBeDefined();
      expect(result.childId).toBe(recordData.childId);
      expect(childRepository.getChild).toHaveBeenCalledWith(recordData.childId);
      expect(childNutritionRepository.createNutritionRecord).toHaveBeenCalledWith(recordData);
    });

    /**
     * Test creation without child ID
     */
    it('should throw error when childId is not provided', async () => {
      const recordData = {
        records: [],
        recommendations: []
      };

      await expect(childNutritionService.createNutritionRecord(recordData))
        .rejects
        .toThrow('childId is required');
    });

    /**
     * Test creation with non-existent child
     */
    it('should throw error when child does not exist', async () => {
      const recordData = {
        childId: '507f1f77bcf86cd799439999',
        records: []
      };

      childRepository.getChild = jest.fn().mockResolvedValue(null);

      await expect(childNutritionService.createNutritionRecord(recordData))
        .rejects
        .toThrow('Child with ID 507f1f77bcf86cd799439999 not found');
    });

    /**
     * Test duplicate record creation
     */
    it('should throw error when record already exists', async () => {
      const recordData = {
        childId: '507f1f77bcf86cd799439011',
        records: []
      };

      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      childNutritionRepository.getByChildId = jest.fn().mockResolvedValue(mockNutritionRecord);

      await expect(childNutritionService.createNutritionRecord(recordData))
        .rejects
        .toThrow('Nutrition record already exists for this child');
    });
  });

  describe('calculateHealthyHabitsScore', () => {
    /**
     * Test habits score calculation
     */
    it('should calculate healthy habits score correctly', () => {
      const eatingHabits = {
        eatsBreakfastRegularly: true,
        drinksEnoughWater: true,
        eatsFruitsDaily: true,
        eatsVegetablesDaily: true,
        limitsJunkFood: true,
        hasRegularMealTimes: true,
        enjoysVarietyOfFoods: true,
        eatsAppropriatePortions: true
      };

      const score = childNutritionService.calculateHealthyHabitsScore(eatingHabits);

      expect(score).toBe(100);
    });

    /**
     * Test with mixed habits
     */
    it('should calculate partial score correctly', () => {
      const eatingHabits = {
        eatsBreakfastRegularly: true,
        drinksEnoughWater: true,
        eatsFruitsDaily: false,
        eatsVegetablesDaily: false,
        limitsJunkFood: false,
        hasRegularMealTimes: false,
        enjoysVarietyOfFoods: false,
        eatsAppropriatePortions: false
      };

      const score = childNutritionService.calculateHealthyHabitsScore(eatingHabits);

      expect(score).toBe(25);
    });
  });

  describe('calculateHealthScore', () => {
    /**
     * Test overall health score calculation
     */
    it('should calculate health score correctly for healthy BMI', () => {
      const physicalMeasurement = {
        heightCm: 140,
        weightKg: 35
      };

      const eatingHabits = {
        eatsBreakfastRegularly: true,
        drinksEnoughWater: true,
        eatsFruitsDaily: true,
        eatsVegetablesDaily: true,
        limitsJunkFood: true,
        hasRegularMealTimes: true,
        enjoysVarietyOfFoods: true,
        eatsAppropriatePortions: true
      };

      const score = childNutritionService.calculateHealthScore(physicalMeasurement, eatingHabits);

      expect(score).toBeGreaterThan(80);
      expect(score).toBeLessThanOrEqual(100);
    });

    /**
     * Test with unhealthy BMI
     */
    it('should calculate lower score for unhealthy BMI', () => {
      const physicalMeasurement = {
        heightCm: 140,
        weightKg: 60
      };

      const eatingHabits = {
        eatsBreakfastRegularly: false,
        drinksEnoughWater: false,
        eatsFruitsDaily: false,
        eatsVegetablesDaily: false,
        limitsJunkFood: false,
        hasRegularMealTimes: false,
        enjoysVarietyOfFoods: false,
        eatsAppropriatePortions: false
      };

      const score = childNutritionService.calculateHealthScore(physicalMeasurement, eatingHabits);

      expect(score).toBeLessThan(50);
    });
  });

  describe('generateRecommendations', () => {
    /**
     * Test recommendation generation for underweight
     */
    it('should generate recommendations for underweight child', () => {
      const records = [
        {
          physicalMeasurement: {
            heightCm: 140,
            weightKg: 25
          },
          eatingHabits: mockNutritionRecord.records[0].eatingHabits
        }
      ];

      const recommendations = childNutritionService.generateRecommendations(records);

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.priority === 'high' || r.priority === 'critical')).toBe(true);
      expect(recommendations.some(r => r.category === 'diet')).toBe(true);
    });

    /**
     * Test recommendations for overweight
     */
    it('should generate recommendations for overweight child', () => {
      const records = [
        {
          physicalMeasurement: {
            heightCm: 140,
            weightKg: 55
          },
          eatingHabits: mockNutritionRecord.records[0].eatingHabits
        }
      ];

      const recommendations = childNutritionService.generateRecommendations(records);

      expect(recommendations.some(r => r.category === 'exercise')).toBe(true);
      expect(recommendations.some(r => r.targetArea === 'Weight Management')).toBe(true);
    });

    /**
     * Test recommendations for poor eating habits
     */
    it('should generate recommendations for poor eating habits', () => {
      const records = [
        {
          physicalMeasurement: {
            heightCm: 140,
            weightKg: 35
          },
          eatingHabits: {
            eatsBreakfastRegularly: false,
            drinksEnoughWater: false,
            eatsFruitsDaily: false,
            eatsVegetablesDaily: false,
            limitsJunkFood: false,
            hasRegularMealTimes: false,
            enjoysVarietyOfFoods: false,
            eatsAppropriatePortions: true
          }
        }
      ];

      const recommendations = childNutritionService.generateRecommendations(records);

      expect(recommendations.some(r => r.category === 'habits')).toBe(true);
      expect(recommendations.some(r => r.targetArea === 'Breakfast Habits')).toBe(true);
      expect(recommendations.some(r => r.targetArea === 'Hydration')).toBe(true);
    });

    /**
     * Test BMI trend monitoring
     */
    it('should detect significant BMI changes', () => {
      const records = [
        {
          physicalMeasurement: {
            heightCm: 140,
            weightKg: 35
          },
          eatingHabits: mockNutritionRecord.records[0].eatingHabits
        },
        {
          physicalMeasurement: {
            heightCm: 140,
            weightKg: 45
          },
          eatingHabits: mockNutritionRecord.records[0].eatingHabits
        }
      ];

      const recommendations = childNutritionService.generateRecommendations(records);

      expect(recommendations.some(r => r.targetArea === 'BMI Monitoring')).toBe(true);
    });
  });

  describe('addNutritionEntry', () => {
    /**
     * Test adding nutrition entry successfully
     */
    it('should add nutrition entry and generate recommendations', async () => {
      const nutritionEntry = {
        physicalMeasurement: {
          heightCm: 145,
          weightKg: 38
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

      const updatedRecord = {
        ...mockNutritionRecord,
        records: [...mockNutritionRecord.records, nutritionEntry]
      };

      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      childNutritionRepository.getByChildId = jest.fn()
        .mockResolvedValueOnce(mockNutritionRecord)
        .mockResolvedValueOnce(updatedRecord);
      childNutritionRepository.addNutritionEntry = jest.fn().mockResolvedValue(updatedRecord);
      childNutritionRepository.updateRecommendations = jest.fn().mockResolvedValue(updatedRecord);

      const result = await childNutritionService.addNutritionEntry('507f1f77bcf86cd799439011', nutritionEntry);

      expect(result).toBeDefined();
      expect(childNutritionRepository.addNutritionEntry).toHaveBeenCalledWith('507f1f77bcf86cd799439011', nutritionEntry);
      expect(childNutritionRepository.updateRecommendations).toHaveBeenCalled();
    });

    /**
     * Test auto-creation when no record exists
     */
    it('should create nutrition record if none exists', async () => {
      const nutritionEntry = {
        physicalMeasurement: {
          heightCm: 140,
          weightKg: 35
        },
        eatingHabits: mockNutritionRecord.records[0].eatingHabits
      };

      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      childNutritionRepository.getByChildId = jest.fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockNutritionRecord);
      childNutritionRepository.createNutritionRecord = jest.fn().mockResolvedValue(mockNutritionRecord);
      childNutritionRepository.addNutritionEntry = jest.fn().mockResolvedValue(mockNutritionRecord);
      childNutritionRepository.updateRecommendations = jest.fn().mockResolvedValue(mockNutritionRecord);

      const result = await childNutritionService.addNutritionEntry('507f1f77bcf86cd799439011', nutritionEntry);

      expect(result).toBeDefined();
      expect(childNutritionRepository.createNutritionRecord).toHaveBeenCalled();
    });
  });

  describe('getNutritionAnalysis', () => {
    /**
     * Test getting nutrition analysis
     */
    it('should return complete nutrition analysis', async () => {
      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      childNutritionRepository.getByChildId = jest.fn().mockResolvedValue(mockNutritionRecord);

      const result = await childNutritionService.getNutritionAnalysis('507f1f77bcf86cd799439011');

      expect(result).toBeDefined();
      expect(result.hasData).toBe(true);
      expect(result.analysis).toBeDefined();
      expect(result.analysis.currentBMI).toBeDefined();
      expect(result.analysis.bmiCategory).toBeDefined();
      expect(result.recordCount).toBe(mockNutritionRecord.records.length);
    });

    /**
     * Test analysis with no data
     */
    it('should return no data message when no records exist', async () => {
      const emptyRecord = { ...mockNutritionRecord, records: [] };

      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      childNutritionRepository.getByChildId = jest.fn().mockResolvedValue(emptyRecord);

      const result = await childNutritionService.getNutritionAnalysis('507f1f77bcf86cd799439011');

      expect(result.hasData).toBe(false);
      expect(result.message).toBeDefined();
    });
  });

  describe('regenerateRecommendations', () => {
    /**
     * Test regenerating recommendations
     */
    it('should regenerate recommendations successfully', async () => {
      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      childNutritionRepository.getByChildId = jest.fn().mockResolvedValue(mockNutritionRecord);
      childNutritionRepository.updateRecommendations = jest.fn().mockResolvedValue(mockNutritionRecord);

      const result = await childNutritionService.regenerateRecommendations('507f1f77bcf86cd799439011');

      expect(result).toBeDefined();
      expect(childNutritionRepository.updateRecommendations).toHaveBeenCalled();
    });

    /**
     * Test regeneration with no records
     */
    it('should throw error when no records exist', async () => {
      const emptyRecord = { ...mockNutritionRecord, records: [] };

      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      childNutritionRepository.getByChildId = jest.fn().mockResolvedValue(emptyRecord);

      await expect(childNutritionService.regenerateRecommendations('507f1f77bcf86cd799439011'))
        .rejects
        .toThrow('No nutrition records found to generate recommendations');
    });
  });

  describe('deleteNutritionRecord', () => {
    /**
     * Test successful deletion
     */
    it('should delete nutrition record successfully', async () => {
      childNutritionRepository.getNutritionRecord = jest.fn().mockResolvedValue(mockNutritionRecord);
      childNutritionRepository.deleteNutritionRecord = jest.fn().mockResolvedValue(true);

      const result = await childNutritionService.deleteNutritionRecord('507f1f77bcf86cd799439020');

      expect(result).toBe(true);
      expect(childNutritionRepository.deleteNutritionRecord).toHaveBeenCalledWith('507f1f77bcf86cd799439020');
    });

    /**
     * Test deletion with null ID
     */
    it('should return false when record ID is null', async () => {
      const result = await childNutritionService.deleteNutritionRecord(null);

      expect(result).toBe(false);
      expect(childNutritionRepository.deleteNutritionRecord).not.toHaveBeenCalled();
    });
  });
});
