const childEducationService = require('../../src/services/childEducationService');
const childEducationRepository = require('../../src/repositories/childEducationRepository');
const childRepository = require('../../src/repositories/childRepository');

jest.mock('../../src/repositories/childEducationRepository');
jest.mock('../../src/repositories/childRepository');

describe('Child Education Service - Unit Tests', () => {
  let mockChild;
  let mockEducationRecord;

  beforeEach(() => {
    jest.clearAllMocks();

    mockChild = {
      _id: '507f1f77bcf86cd799439011',
      id: '507f1f77bcf86cd799439011',
      name: 'John Doe',
      age: 10,
      gender: 'male',
      grade: '5TH',
      parentId: '507f1f77bcf86cd799439010'
    };

    mockEducationRecord = {
      _id: '507f1f77bcf86cd799439020',
      id: '507f1f77bcf86cd799439020',
      childId: '507f1f77bcf86cd799439011',
      records: [
        {
          gradeYear: 'Grade 5',
          subjects: [
            { subject: 'Math', marks: 85 },
            { subject: 'Science', marks: 78 },
            { subject: 'English', marks: 92 }
          ],
          recordedAt: new Date()
        }
      ],
      suggestions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createEducationRecord', () => {
    /**
     * Test successful education record creation
     */
    it('should create education record successfully', async () => {
      const recordData = {
        childId: '507f1f77bcf86cd799439011',
        records: [],
        suggestions: []
      };

      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      childEducationRepository.getByChildId = jest.fn().mockResolvedValue(null);
      childEducationRepository.createEducationRecord = jest.fn().mockResolvedValue(mockEducationRecord);

      const result = await childEducationService.createEducationRecord(recordData);

      expect(result).toBeDefined();
      expect(result.childId).toBe(recordData.childId);
      expect(childRepository.getChild).toHaveBeenCalledWith(recordData.childId);
      expect(childEducationRepository.createEducationRecord).toHaveBeenCalledWith(recordData);
    });

    /**
     * Test creation without child ID
     */
    it('should throw error when childId is not provided', async () => {
      const recordData = {
        records: [],
        suggestions: []
      };

      await expect(childEducationService.createEducationRecord(recordData))
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

      await expect(childEducationService.createEducationRecord(recordData))
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
      childEducationRepository.getByChildId = jest.fn().mockResolvedValue(mockEducationRecord);

      await expect(childEducationService.createEducationRecord(recordData))
        .rejects
        .toThrow('Education record already exists for this child');
    });

    /**
     * Test creation failure
     */
    it('should throw error when creation fails', async () => {
      const recordData = {
        childId: '507f1f77bcf86cd799439011',
        records: []
      };

      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      childEducationRepository.getByChildId = jest.fn().mockResolvedValue(null);
      childEducationRepository.createEducationRecord = jest.fn().mockResolvedValue(null);

      await expect(childEducationService.createEducationRecord(recordData))
        .rejects
        .toThrow('Failed to create education record');
    });
  });

  describe('getEducationRecord', () => {
    /**
     * Test getting education record by ID successfully
     */
    it('should return education record when valid ID is provided', async () => {
      childEducationRepository.getEducationRecord = jest.fn().mockResolvedValue(mockEducationRecord);

      const result = await childEducationService.getEducationRecord('507f1f77bcf86cd799439020');

      expect(result).toBeDefined();
      expect(result.childId).toBe(mockEducationRecord.childId);
      expect(childEducationRepository.getEducationRecord).toHaveBeenCalledWith('507f1f77bcf86cd799439020');
    });

    /**
     * Test getting record with null ID
     */
    it('should return null when no ID is provided', async () => {
      const result = await childEducationService.getEducationRecord(null);

      expect(result).toBeNull();
      expect(childEducationRepository.getEducationRecord).not.toHaveBeenCalled();
    });
  });

  describe('getEducationRecordWithValidation', () => {
    /**
     * Test getting record with validation
     */
    it('should return education record when found', async () => {
      childEducationRepository.getEducationRecord = jest.fn().mockResolvedValue(mockEducationRecord);

      const result = await childEducationService.getEducationRecordWithValidation('507f1f77bcf86cd799439020');

      expect(result).toBeDefined();
      expect(result.childId).toBe(mockEducationRecord.childId);
    });

    /**
     * Test validation failure when record not found
     */
    it('should throw error when record not found', async () => {
      childEducationRepository.getEducationRecord = jest.fn().mockResolvedValue(null);

      await expect(childEducationService.getEducationRecordWithValidation('507f1f77bcf86cd799439999'))
        .rejects
        .toThrow('Education record with ID 507f1f77bcf86cd799439999 not found');
    });
  });

  describe('getByChildId', () => {
    /**
     * Test getting education record by child ID
     */
    it('should return education record for valid child ID', async () => {
      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      childEducationRepository.getByChildId = jest.fn().mockResolvedValue(mockEducationRecord);

      const result = await childEducationService.getByChildId('507f1f77bcf86cd799439011');

      expect(result).toBeDefined();
      expect(result.childId).toBe(mockChild._id);
      expect(childEducationRepository.getByChildId).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    /**
     * Test with non-existent child
     */
    it('should throw error when child does not exist', async () => {
      childRepository.getChild = jest.fn().mockResolvedValue(null);

      await expect(childEducationService.getByChildId('507f1f77bcf86cd799439999'))
        .rejects
        .toThrow('Child with ID 507f1f77bcf86cd799439999 not found');
    });

    /**
     * Test with null child ID
     */
    it('should return null when no child ID provided', async () => {
      const result = await childEducationService.getByChildId(null);

      expect(result).toBeNull();
      expect(childRepository.getChild).not.toHaveBeenCalled();
    });
  });

  describe('updateEducationRecord', () => {
    /**
     * Test successful record update
     */
    it('should update education record successfully', async () => {
      const updateData = { 
        records: [
          {
            gradeYear: 'Grade 6',
            subjects: [{ subject: 'Math', marks: 90 }]
          }
        ]
      };
      const updatedRecord = { ...mockEducationRecord, ...updateData };

      childEducationRepository.getEducationRecord = jest.fn().mockResolvedValue(mockEducationRecord);
      childEducationRepository.updateEducationRecord = jest.fn().mockResolvedValue(updatedRecord);

      const result = await childEducationService.updateEducationRecord('507f1f77bcf86cd799439020', updateData);

      expect(result).toBeDefined();
      expect(childEducationRepository.updateEducationRecord).toHaveBeenCalledWith('507f1f77bcf86cd799439020', updateData);
    });

    /**
     * Test update without record ID
     */
    it('should throw error when record ID is not provided', async () => {
      await expect(childEducationService.updateEducationRecord(null, { records: [] }))
        .rejects
        .toThrow('Record ID is required for update');
    });

    /**
     * Test update of non-existent record
     */
    it('should throw error when record does not exist', async () => {
      childEducationRepository.getEducationRecord = jest.fn().mockResolvedValue(null);

      await expect(childEducationService.updateEducationRecord('507f1f77bcf86cd799439999', { records: [] }))
        .rejects
        .toThrow('Education record with ID 507f1f77bcf86cd799439999 not found');
    });

    /**
     * Test update failure
     */
    it('should throw error when update fails', async () => {
      childEducationRepository.getEducationRecord = jest.fn().mockResolvedValue(mockEducationRecord);
      childEducationRepository.updateEducationRecord = jest.fn().mockResolvedValue(null);

      await expect(childEducationService.updateEducationRecord('507f1f77bcf86cd799439020', { records: [] }))
        .rejects
        .toThrow('Failed to update education record');
    });
  });

  describe('deleteEducationRecord', () => {
    /**
     * Test successful deletion
     */
    it('should delete education record successfully', async () => {
      childEducationRepository.getEducationRecord = jest.fn().mockResolvedValue(mockEducationRecord);
      childEducationRepository.deleteEducationRecord = jest.fn().mockResolvedValue(true);

      const result = await childEducationService.deleteEducationRecord('507f1f77bcf86cd799439020');

      expect(result).toBe(true);
      expect(childEducationRepository.deleteEducationRecord).toHaveBeenCalledWith('507f1f77bcf86cd799439020');
    });

    /**
     * Test deletion with null ID
     */
    it('should return false when record ID is null', async () => {
      const result = await childEducationService.deleteEducationRecord(null);

      expect(result).toBe(false);
      expect(childEducationRepository.deleteEducationRecord).not.toHaveBeenCalled();
    });

    /**
     * Test deletion of non-existent record
     */
    it('should throw error when record does not exist', async () => {
      childEducationRepository.getEducationRecord = jest.fn().mockResolvedValue(null);

      await expect(childEducationService.deleteEducationRecord('507f1f77bcf86cd799439999'))
        .rejects
        .toThrow('Education record with ID 507f1f77bcf86cd799439999 not found');
    });

    /**
     * Test deletion failure
     */
    it('should return false when deletion fails', async () => {
      childEducationRepository.getEducationRecord = jest.fn().mockResolvedValue(mockEducationRecord);
      childEducationRepository.deleteEducationRecord = jest.fn().mockResolvedValue(false);

      const result = await childEducationService.deleteEducationRecord('507f1f77bcf86cd799439020');

      expect(result).toBe(false);
    });
  });

  describe('addGradeRecord', () => {
    /**
     * Test adding grade record successfully
     */
    it('should add grade record and generate suggestions', async () => {
      const gradeRecord = {
        gradeYear: 'Grade 6',
        subjects: [
          { subject: 'Math', marks: 90 },
          { subject: 'Science', marks: 85 }
        ]
      };

      const updatedRecord = {
        ...mockEducationRecord,
        records: [...mockEducationRecord.records, gradeRecord]
      };

      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      childEducationRepository.getByChildId = jest.fn()
        .mockResolvedValueOnce(mockEducationRecord)
        .mockResolvedValueOnce(updatedRecord);
      childEducationRepository.addGradeRecord = jest.fn().mockResolvedValue(updatedRecord);
      childEducationRepository.updateSuggestions = jest.fn().mockResolvedValue(updatedRecord);

      const result = await childEducationService.addGradeRecord('507f1f77bcf86cd799439011', gradeRecord);

      expect(result).toBeDefined();
      expect(childEducationRepository.addGradeRecord).toHaveBeenCalledWith('507f1f77bcf86cd799439011', gradeRecord);
      expect(childEducationRepository.updateSuggestions).toHaveBeenCalled();
    });

    /**
     * Test adding grade without child ID
     */
    it('should throw error when childId or gradeRecord is missing', async () => {
      await expect(childEducationService.addGradeRecord(null, {}))
        .rejects
        .toThrow('childId and gradeRecord are required');
    });

    /**
     * Test with non-existent child
     */
    it('should throw error when child does not exist', async () => {
      const gradeRecord = {
        gradeYear: 'Grade 5',
        subjects: [{ subject: 'Math', marks: 80 }]
      };

      childRepository.getChild = jest.fn().mockResolvedValue(null);

      await expect(childEducationService.addGradeRecord('507f1f77bcf86cd799439999', gradeRecord))
        .rejects
        .toThrow('Child with ID 507f1f77bcf86cd799439999 not found');
    });

    /**
     * Test auto-creation when no record exists
     */
    it('should create education record if none exists', async () => {
      const gradeRecord = {
        gradeYear: 'Grade 5',
        subjects: [{ subject: 'Math', marks: 80 }]
      };

      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      childEducationRepository.getByChildId = jest.fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockEducationRecord);
      childEducationRepository.createEducationRecord = jest.fn().mockResolvedValue(mockEducationRecord);
      childEducationRepository.addGradeRecord = jest.fn().mockResolvedValue(mockEducationRecord);
      childEducationRepository.updateSuggestions = jest.fn().mockResolvedValue(mockEducationRecord);

      const result = await childEducationService.addGradeRecord('507f1f77bcf86cd799439011', gradeRecord);

      expect(result).toBeDefined();
      expect(childEducationRepository.createEducationRecord).toHaveBeenCalled();
    });

    /**
     * Test add grade failure
     */
    it('should throw error when adding grade fails', async () => {
      const gradeRecord = {
        gradeYear: 'Grade 5',
        subjects: [{ subject: 'Math', marks: 80 }]
      };

      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      childEducationRepository.getByChildId = jest.fn().mockResolvedValue(mockEducationRecord);
      childEducationRepository.addGradeRecord = jest.fn().mockResolvedValue(null);

      await expect(childEducationService.addGradeRecord('507f1f77bcf86cd799439011', gradeRecord))
        .rejects
        .toThrow('Failed to add grade record');
    });
  });

  describe('analyzePerformance', () => {
    /**
     * Test performance analysis with improving trend
     */
    it('should analyze performance correctly with improving trend', () => {
      const records = [
        {
          gradeYear: 'Grade 4',
          subjects: [
            { subject: 'Math', marks: 70 },
            { subject: 'Science', marks: 68 },
            { subject: 'English', marks: 75 }
          ]
        },
        {
          gradeYear: 'Grade 5',
          subjects: [
            { subject: 'Math', marks: 85 },
            { subject: 'Science', marks: 82 },
            { subject: 'English', marks: 90 }
          ]
        }
      ];

      const analysis = childEducationService.analyzePerformance(records);

      expect(analysis).toBeDefined();
      expect(analysis.trend).toBe('improving');
      expect(analysis.currentAverage).toBeGreaterThan(80);
      expect(analysis.overallGpa).toBeGreaterThan(0);
      expect(analysis.consistencyScore).toBeDefined();
      expect(analysis.subjectsNeedingAttention).toBeDefined();
      expect(analysis.topPerformingSubjects).toBeDefined();
    });

    /**
     * Test analysis with declining trend
     */
    it('should detect declining trend', () => {
      const records = [
        {
          gradeYear: 'Grade 4',
          subjects: [
            { subject: 'Math', marks: 90 },
            { subject: 'Science', marks: 88 }
          ]
        },
        {
          gradeYear: 'Grade 5',
          subjects: [
            { subject: 'Math', marks: 70 },
            { subject: 'Science', marks: 68 }
          ]
        }
      ];

      const analysis = childEducationService.analyzePerformance(records);

      expect(analysis.trend).toBe('declining');
      expect(analysis.trendStrength).toBeGreaterThan(0);
    });

    /**
     * Test analysis with stable trend
     */
    it('should detect stable trend', () => {
      const records = [
        {
          gradeYear: 'Grade 4',
          subjects: [{ subject: 'Math', marks: 80 }]
        },
        {
          gradeYear: 'Grade 5',
          subjects: [{ subject: 'Math', marks: 82 }]
        }
      ];

      const analysis = childEducationService.analyzePerformance(records);

      expect(analysis.trend).toBe('stable');
    });

    /**
     * Test analysis with empty records
     */
    it('should return default values for empty records', () => {
      const analysis = childEducationService.analyzePerformance([]);

      expect(analysis.currentAverage).toBe(0);
      expect(analysis.trend).toBe('stable');
      expect(analysis.trendStrength).toBe(0);
      expect(analysis.subjectsNeedingAttention).toEqual([]);
      expect(analysis.topPerformingSubjects).toEqual([]);
      expect(analysis.overallGpa).toBe(0);
      expect(analysis.consistencyScore).toBe(0);
    });

    /**
     * Test identifying subjects needing attention
     */
    it('should identify subjects needing attention', () => {
      const records = [
        {
          gradeYear: 'Grade 5',
          subjects: [
            { subject: 'Math', marks: 95 },
            { subject: 'Science', marks: 45 },
            { subject: 'English', marks: 88 }
          ]
        }
      ];

      const analysis = childEducationService.analyzePerformance(records);

      expect(analysis.subjectsNeedingAttention).toContain('Science');
      expect(analysis.topPerformingSubjects).toContain('Math');
    });
  });

  describe('generateSuggestions', () => {
    /**
     * Test suggestion generation for weak subjects
     */
    it('should generate suggestions for weak subjects', () => {
      const records = [
        {
          gradeYear: 'Grade 5',
          subjects: [
            { subject: 'Math', marks: 95 },
            { subject: 'Science', marks: 55 },
            { subject: 'English', marks: 88 }
          ]
        }
      ];

      const suggestions = childEducationService.generateSuggestions(records);

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.priority === 'high')).toBe(true);
      expect(suggestions.some(s => s.type === 'performance')).toBe(true);
      expect(suggestions.some(s => s.subject === 'Science')).toBe(true);
    });

    /**
     * Test suggestions for declining performance
     */
    it('should generate suggestions for declining trend', () => {
      const records = [
        {
          gradeYear: 'Grade 4',
          subjects: [{ subject: 'Math', marks: 90 }]
        },
        {
          gradeYear: 'Grade 5',
          subjects: [{ subject: 'Math', marks: 65 }]
        }
      ];

      const suggestions = childEducationService.generateSuggestions(records);

      expect(suggestions.some(s => s.type === 'trend' && s.priority === 'high')).toBe(true);
    });

    /**
     * Test positive suggestions for improving performance
     */
    it('should generate positive suggestions for improving trend', () => {
      const records = [
        {
          gradeYear: 'Grade 4',
          subjects: [{ subject: 'Math', marks: 70 }]
        },
        {
          gradeYear: 'Grade 5',
          subjects: [{ subject: 'Math', marks: 90 }]
        }
      ];

      const suggestions = childEducationService.generateSuggestions(records);

      expect(suggestions.some(s => s.type === 'trend' && s.priority === 'low')).toBe(true);
    });

    /**
     * Test consistency suggestions
     */
    it('should suggest balance for inconsistent performance', () => {
      const records = [
        {
          gradeYear: 'Grade 5',
          subjects: [
            { subject: 'Math', marks: 95 },
            { subject: 'Science', marks: 50 },
            { subject: 'English', marks: 92 }
          ]
        }
      ];

      const suggestions = childEducationService.generateSuggestions(records);

      expect(suggestions.some(s => s.type === 'consistency')).toBe(true);
    });

    /**
     * Test strategic suggestions
     */
    it('should generate strategic suggestions', () => {
      const records = [
        {
          gradeYear: 'Grade 5',
          subjects: [
            { subject: 'Math', marks: 95 },
            { subject: 'Science', marks: 55 },
            { subject: 'English', marks: 92 }
          ]
        }
      ];

      const suggestions = childEducationService.generateSuggestions(records);

      expect(suggestions.some(s => s.type === 'strategic')).toBe(true);
    });

    /**
     * Test high performer suggestions
     */
    it('should generate advanced learning suggestions for high performers', () => {
      const records = [
        {
          gradeYear: 'Grade 5',
          subjects: [
            { subject: 'Math', marks: 95 },
            { subject: 'Science', marks: 92 },
            { subject: 'English', marks: 96 }
          ]
        }
      ];

      const suggestions = childEducationService.generateSuggestions(records);

      expect(suggestions.some(s => s.subject === 'Advanced Learning')).toBe(true);
    });

    /**
     * Test empty suggestions for empty records
     */
    it('should return empty array for empty records', () => {
      const suggestions = childEducationService.generateSuggestions([]);

      expect(suggestions).toEqual([]);
    });

    /**
     * Test suggestions are sorted by priority
     */
    it('should sort suggestions by priority', () => {
      const records = [
        {
          gradeYear: 'Grade 5',
          subjects: [
            { subject: 'Math', marks: 95 },
            { subject: 'Science', marks: 55 },
            { subject: 'English', marks: 88 }
          ]
        }
      ];

      const suggestions = childEducationService.generateSuggestions(records);

      const priorities = suggestions.map(s => s.priority);
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      
      for (let i = 0; i < priorities.length - 1; i++) {
        expect(priorityOrder[priorities[i]]).toBeGreaterThanOrEqual(priorityOrder[priorities[i + 1]]);
      }
    });
  });

  describe('getPerformanceAnalysis', () => {
    /**
     * Test getting complete performance analysis
     */
    it('should return complete performance analysis', async () => {
      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      childEducationRepository.getByChildId = jest.fn().mockResolvedValue(mockEducationRecord);

      const result = await childEducationService.getPerformanceAnalysis('507f1f77bcf86cd799439011');

      expect(result).toBeDefined();
      expect(result.hasData).toBe(true);
      expect(result.analysis).toBeDefined();
      expect(result.recordCount).toBe(mockEducationRecord.records.length);
      expect(result.latestGrade).toBe('Grade 5');
      expect(result.suggestions).toBeDefined();
    });

    /**
     * Test analysis with no data
     */
    it('should return no data message when no records exist', async () => {
      const emptyRecord = { ...mockEducationRecord, records: [] };

      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      childEducationRepository.getByChildId = jest.fn().mockResolvedValue(emptyRecord);

      const result = await childEducationService.getPerformanceAnalysis('507f1f77bcf86cd799439011');

      expect(result.hasData).toBe(false);
      expect(result.message).toBe('No education records found for analysis');
    });

    /**
     * Test analysis with null record
     */
    it('should return no data when record is null', async () => {
      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      childEducationRepository.getByChildId = jest.fn().mockResolvedValue(null);

      const result = await childEducationService.getPerformanceAnalysis('507f1f77bcf86cd799439011');

      expect(result.hasData).toBe(false);
    });
  });

  describe('regenerateSuggestions', () => {
    /**
     * Test regenerating suggestions successfully
     */
    it('should regenerate suggestions successfully', async () => {
      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      childEducationRepository.getByChildId = jest.fn().mockResolvedValue(mockEducationRecord);
      childEducationRepository.updateSuggestions = jest.fn().mockResolvedValue(mockEducationRecord);

      const result = await childEducationService.regenerateSuggestions('507f1f77bcf86cd799439011');

      expect(result).toBeDefined();
      expect(childEducationRepository.updateSuggestions).toHaveBeenCalled();
    });

    /**
     * Test regeneration with no records
     */
    it('should throw error when no records exist', async () => {
      const emptyRecord = { ...mockEducationRecord, records: [] };

      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      childEducationRepository.getByChildId = jest.fn().mockResolvedValue(emptyRecord);

      await expect(childEducationService.regenerateSuggestions('507f1f77bcf86cd799439011'))
        .rejects
        .toThrow('No education records found to generate suggestions');
    });

    /**
     * Test regeneration with null record
     */
    it('should throw error when record is null', async () => {
      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      childEducationRepository.getByChildId = jest.fn().mockResolvedValue(null);

      await expect(childEducationService.regenerateSuggestions('507f1f77bcf86cd799439011'))
        .rejects
        .toThrow('No education records found to generate suggestions');
    });
  });
});
