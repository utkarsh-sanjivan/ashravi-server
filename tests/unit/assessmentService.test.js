const assessmentService = require('../../src/services/assessmentService');
const Child = require('../../src/models/Child');
const Question = require('../../src/models/Question');
const ASSESSMENT_CONSTANTS = require('../../src/constants/assessmentConstants');

jest.mock('../../src/models/Child');
jest.mock('../../src/models/Question');

describe('Assessment Service - Unit Tests', () => {
  let mockChild;
  let mockQuestions;
  let mockResponses;

  beforeEach(() => {
    jest.clearAllMocks();

    mockChild = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test Child',
      age: 10,
      gender: 'male',
      grade: 'GRADE_5',
      parentId: '507f1f77bcf86cd799439010',
      courseIds: [],
      assessmentResults: []
    };

    mockQuestions = [
      {
        _id: '507f1f77bcf86cd799439020',
        questionText: 'How often does your child feel anxious?',
        questionType: 'rating',
        issueWeightages: [
          { issueId: 'anxiety', issueName: 'Anxiety Disorder', weightage: 80 },
          { issueId: 'depression', issueName: 'Depression', weightage: 20 }
        ]
      },
      {
        _id: '507f1f77bcf86cd799439021',
        questionText: 'Does your child avoid social situations?',
        questionType: 'rating',
        issueWeightages: [
          { issueId: 'social_phobia', issueName: 'Social Phobia', weightage: 90 },
          { issueId: 'anxiety', issueName: 'Anxiety Disorder', weightage: 10 }
        ]
      }
    ];

    mockResponses = [
      { questionId: '507f1f77bcf86cd799439020', answer: 4 },
      { questionId: '507f1f77bcf86cd799439021', answer: 3 }
    ];
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('processAssessment', () => {
    /**
     * Test successful assessment processing with weighted average
     */
    it('should process assessment successfully with weighted_average method', async () => {
      Child.findById = jest.fn().mockResolvedValue(mockChild);
      Question.find = jest.fn().mockResolvedValue(mockQuestions);
      Child.findByIdAndUpdate = jest.fn()
        .mockResolvedValueOnce(mockChild)
        .mockResolvedValueOnce(mockChild);

      const result = await assessmentService.processAssessment(
        mockResponses,
        mockChild._id,
        mockChild.parentId,
        'weighted_average'
      );

      expect(result).toBeDefined();
      expect(result.assessmentId).toBeDefined();
      expect(result.method).toBe('weighted_average');
      expect(result.issues).toBeDefined();
      expect(result.issues.length).toBeGreaterThan(0);
      expect(Child.findByIdAndUpdate).toHaveBeenCalled();
    });

    /**
     * Test T-score non-weighted method
     */
    it('should process assessment with t_score_non_weighted method', async () => {
      Child.findById = jest.fn().mockResolvedValue(mockChild);
      Question.find = jest.fn().mockResolvedValue(mockQuestions);
      Child.findByIdAndUpdate = jest.fn()
        .mockResolvedValueOnce(mockChild)
        .mockResolvedValueOnce(mockChild);

      const result = await assessmentService.processAssessment(
        mockResponses,
        mockChild._id,
        mockChild.parentId,
        't_score_non_weighted'
      );

      expect(result).toBeDefined();
      expect(result.method).toBe('t_score_non_weighted');
      expect(result.issues.every(issue => issue.tScore !== undefined)).toBe(true);
    });

    /**
     * Test T-score weighted method
     */
    it('should process assessment with t_score_weighted method', async () => {
      Child.findById = jest.fn().mockResolvedValue(mockChild);
      Question.find = jest.fn().mockResolvedValue(mockQuestions);
      Child.findByIdAndUpdate = jest.fn()
        .mockResolvedValueOnce(mockChild)
        .mockResolvedValueOnce(mockChild);

      const result = await assessmentService.processAssessment(
        mockResponses,
        mockChild._id,
        mockChild.parentId,
        't_score_weighted'
      );

      expect(result).toBeDefined();
      expect(result.method).toBe('t_score_weighted');
      expect(result.issues.every(issue => issue.tScore !== undefined)).toBe(true);
    });

    /**
     * Test error when child not found
     */
    it('should throw error when child does not exist', async () => {
      Child.findById = jest.fn().mockResolvedValue(null);

      await expect(
        assessmentService.processAssessment(
          mockResponses,
          '507f1f77bcf86cd799439999',
          mockChild.parentId,
          'weighted_average'
        )
      ).rejects.toThrow('Child with ID 507f1f77bcf86cd799439999 not found');
    });

    /**
     * Test unauthorized access
     */
    it('should throw error when parent ID does not match', async () => {
      Child.findById = jest.fn().mockResolvedValue(mockChild);

      await expect(
        assessmentService.processAssessment(
          mockResponses,
          mockChild._id,
          '507f1f77bcf86cd799439999',
          'weighted_average'
        )
      ).rejects.toThrow('Unauthorized: Parent ID does not match child record');
    });

    /**
     * Test invalid questions
     */
    it('should throw error when no valid questions found', async () => {
      Child.findById = jest.fn().mockResolvedValue(mockChild);
      Question.find = jest.fn().mockResolvedValue([]);

      await expect(
        assessmentService.processAssessment(
          mockResponses,
          mockChild._id,
          mockChild.parentId,
          'weighted_average'
        )
      ).rejects.toThrow('No valid questions found');
    });

    /**
     * Test invalid method
     */
    it('should throw error for invalid assessment method', async () => {
      Child.findById = jest.fn().mockResolvedValue(mockChild);
      Question.find = jest.fn().mockResolvedValue(mockQuestions);

      await expect(
        assessmentService.processAssessment(
          mockResponses,
          mockChild._id,
          mockChild.parentId,
          'invalid_method'
        )
      ).rejects.toThrow('Invalid assessment method');
    });
  });

  describe('determineSeverity', () => {
    /**
     * Test normal severity determination
     */
    it('should return normal severity for low scores', () => {
      const severity = assessmentService.determineSeverity('anxiety', 40, 'weighted_average');
      expect(severity).toBe(ASSESSMENT_CONSTANTS.severityLevels.NORMAL);
    });

    /**
     * Test borderline severity determination
     */
    it('should return borderline severity for mid-range scores', () => {
      const severity = assessmentService.determineSeverity('anxiety', 60, 'weighted_average');
      expect(severity).toBe(ASSESSMENT_CONSTANTS.severityLevels.BORDERLINE);
    });

    /**
     * Test clinical severity determination
     */
    it('should return clinical severity for high scores', () => {
      const severity = assessmentService.determineSeverity('anxiety', 80, 'weighted_average');
      expect(severity).toBe(ASSESSMENT_CONSTANTS.severityLevels.CLINICAL);
    });

    /**
     * Test unknown issue handling
     */
    it('should return normal for unknown issue', () => {
      const severity = assessmentService.determineSeverity('unknown_issue', 80, 'weighted_average');
      expect(severity).toBe(ASSESSMENT_CONSTANTS.severityLevels.NORMAL);
    });
  });

  describe('calculateConfidence', () => {
    /**
     * Test confidence calculation
     */
    it('should return 95% confidence for 50+ questions', () => {
      const confidence = assessmentService.calculateConfidence(50);
      expect(confidence).toBe(95);
    });

    it('should return 85% confidence for 30-49 questions', () => {
      const confidence = assessmentService.calculateConfidence(35);
      expect(confidence).toBe(85);
    });

    it('should return 75% confidence for 20-29 questions', () => {
      const confidence = assessmentService.calculateConfidence(25);
      expect(confidence).toBe(75);
    });

    it('should return 65% confidence for 10-19 questions', () => {
      const confidence = assessmentService.calculateConfidence(15);
      expect(confidence).toBe(65);
    });

    it('should return 50% confidence for less than 10 questions', () => {
      const confidence = assessmentService.calculateConfidence(5);
      expect(confidence).toBe(50);
    });
  });

  describe('getAssessmentById', () => {
    /**
     * Test getting assessment by ID
     */
    it('should return assessment when found', async () => {
      const mockAssessment = {
        assessmentId: 'test-uuid',
        method: 'weighted_average',
        issues: []
      };

      mockChild.assessmentResults = [mockAssessment];
      Child.findById = jest.fn().mockResolvedValue(mockChild);

      const result = await assessmentService.getAssessmentById(
        mockChild._id,
        'test-uuid'
      );

      expect(result).toBeDefined();
      expect(result.assessmentId).toBe('test-uuid');
    });

    /**
     * Test assessment not found
     */
    it('should throw error when assessment not found', async () => {
      mockChild.assessmentResults = [];
      Child.findById = jest.fn().mockResolvedValue(mockChild);

      await expect(
        assessmentService.getAssessmentById(mockChild._id, 'non-existent-uuid')
      ).rejects.toThrow('Assessment with ID non-existent-uuid not found');
    });
  });

  describe('getChildAssessments', () => {
    /**
     * Test getting all child assessments
     */
    it('should return all assessments for a child', async () => {
      const mockAssessments = [
        { assessmentId: 'uuid-1', method: 'weighted_average' },
        { assessmentId: 'uuid-2', method: 't_score_weighted' }
      ];

      Child.findById = jest.fn().mockResolvedValue({
        ...mockChild,
        assessmentResults: mockAssessments,
        select: jest.fn().mockReturnThis()
      });

      const result = await assessmentService.getChildAssessments(mockChild._id);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    /**
     * Test empty assessments
     */
    it('should return empty array when no assessments exist', async () => {
      Child.findById = jest.fn().mockResolvedValue({
        ...mockChild,
        assessmentResults: [],
        select: jest.fn().mockReturnThis()
      });

      const result = await assessmentService.getChildAssessments(mockChild._id);

      expect(result).toEqual([]);
    });
  });

  describe('Assessment Result Structure', () => {
    /**
     * Test complete result structure
     */
    it('should include all required fields in assessment result', async () => {
      Child.findById = jest.fn().mockResolvedValue(mockChild);
      Question.find = jest.fn().mockResolvedValue(mockQuestions);
      Child.findByIdAndUpdate = jest.fn()
        .mockResolvedValueOnce(mockChild)
        .mockResolvedValueOnce(mockChild);

      const result = await assessmentService.processAssessment(
        mockResponses,
        mockChild._id,
        mockChild.parentId,
        'weighted_average'
      );

      expect(result).toHaveProperty('assessmentId');
      expect(result).toHaveProperty('method');
      expect(result).toHaveProperty('assessmentDate');
      expect(result).toHaveProperty('conductedBy');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('primaryConcerns');
      expect(result).toHaveProperty('overallSummary');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('totalQuestions');
      expect(result.metadata).toHaveProperty('confidence');
      expect(result.metadata).toHaveProperty('riskIndicators');
    });

    /**
     * Test issue result structure
     */
    it('should include correct fields in each issue result', async () => {
      Child.findById = jest.fn().mockResolvedValue(mockChild);
      Question.find = jest.fn().mockResolvedValue(mockQuestions);
      Child.findByIdAndUpdate = jest.fn()
        .mockResolvedValueOnce(mockChild)
        .mockResolvedValueOnce(mockChild);

      const result = await assessmentService.processAssessment(
        mockResponses,
        mockChild._id,
        mockChild.parentId,
        'weighted_average'
      );

      result.issues.forEach(issue => {
        expect(issue).toHaveProperty('issueId');
        expect(issue).toHaveProperty('issueName');
        expect(issue).toHaveProperty('score');
        expect(issue).toHaveProperty('normalizedScore');
        expect(issue).toHaveProperty('severity');
      });
    });
  });
});
