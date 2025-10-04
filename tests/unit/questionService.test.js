const questionService = require('../../src/services/questionService');
const questionRepository = require('../../src/repositories/questionRepository');

jest.mock('../../src/repositories/questionRepository');

describe('Question Service - Unit Tests', () => {
  let mockQuestion;

  beforeEach(() => {
    jest.clearAllMocks();

    mockQuestion = {
      _id: '507f1f77bcf86cd799439011',
      id: '507f1f77bcf86cd799439011',
      questionText: 'How often does your child feel anxious in social situations?',
      questionType: 'rating',
      category: 'Behavioral Assessment',
      subCategory: 'Social Anxiety',
      ratingScale: { min: 1, max: 5 },
      issueWeightages: [
        { issueId: 'anxiety', issueName: 'Anxiety Disorder', weightage: 75 },
        { issueId: 'social_phobia', issueName: 'Social Phobia', weightage: 25 }
      ],
      ageGroup: { min: 6, max: 12 },
      difficultyLevel: 'medium',
      tags: ['anxiety', 'social', 'behavior'],
      isActive: true,
      usageCount: 0,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createQuestion', () => {
    /**
     * Test successful question creation
     */
    it('should create question successfully', async () => {
      const questionData = {
        questionText: 'How often does your child feel anxious?',
        questionType: 'rating',
        category: 'Behavioral Assessment',
        issueWeightages: [
          { issueId: 'anxiety', issueName: 'Anxiety', weightage: 100 }
        ]
      };

      questionRepository.createQuestion = jest.fn().mockResolvedValue(mockQuestion);

      const result = await questionService.createQuestion(questionData);

      expect(result).toBeDefined();
      expect(result.questionText).toBe(mockQuestion.questionText);
      expect(questionRepository.createQuestion).toHaveBeenCalledWith(questionData);
    });

    /**
     * Test validation for question text length
     */
    it('should throw error when question text is too short', async () => {
      const invalidData = {
        questionText: 'Short',
        questionType: 'rating',
        category: 'Test',
        issueWeightages: [{ issueId: 'test', issueName: 'Test', weightage: 100 }]
      };

      await expect(questionService.createQuestion(invalidData))
        .rejects
        .toThrow('Question text must be at least 10 characters');
    });

    /**
     * Test validation for MCQ options
     */
    it('should throw error when MCQ lacks sufficient options', async () => {
      const invalidData = {
        questionText: 'This is a valid question text?',
        questionType: 'mcq',
        category: 'Test',
        options: [{ optionText: 'Only one', optionValue: 1 }],
        issueWeightages: [{ issueId: 'test', issueName: 'Test', weightage: 100 }]
      };

      await expect(questionService.createQuestion(invalidData))
        .rejects
        .toThrow('MCQ and multiselect questions must have at least 2 options');
    });

    /**
     * Test validation for missing issue weightages
     */
    it('should throw error when issue weightages are missing', async () => {
      const invalidData = {
        questionText: 'This is a valid question text?',
        questionType: 'rating',
        category: 'Test',
        issueWeightages: []
      };

      await expect(questionService.createQuestion(invalidData))
        .rejects
        .toThrow('At least one issue weightage is required');
    });

    /**
     * Test validation for duplicate issue IDs
     */
    it('should throw error when duplicate issue IDs exist', async () => {
      const invalidData = {
        questionText: 'This is a valid question text?',
        questionType: 'rating',
        category: 'Test',
        issueWeightages: [
          { issueId: 'anxiety', issueName: 'Anxiety', weightage: 50 },
          { issueId: 'anxiety', issueName: 'Anxiety Dup', weightage: 50 }
        ]
      };

      await expect(questionService.createQuestion(invalidData))
        .rejects
        .toThrow('Duplicate issue IDs found in weightages');
    });
  });

  describe('getQuestion', () => {
    /**
     * Test getting question by ID
     */
    it('should return question when valid ID is provided', async () => {
      questionRepository.getQuestion = jest.fn().mockResolvedValue(mockQuestion);

      const result = await questionService.getQuestion('507f1f77bcf86cd799439011');

      expect(result).toBeDefined();
      expect(result.id).toBe(mockQuestion.id);
      expect(questionRepository.getQuestion).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    /**
     * Test getting question with null ID
     */
    it('should return null when no ID is provided', async () => {
      const result = await questionService.getQuestion(null);

      expect(result).toBeNull();
      expect(questionRepository.getQuestion).not.toHaveBeenCalled();
    });
  });

  describe('getQuestionWithValidation', () => {
    /**
     * Test getting question with validation
     */
    it('should return question when found', async () => {
      questionRepository.getQuestion = jest.fn().mockResolvedValue(mockQuestion);

      const result = await questionService.getQuestionWithValidation('507f1f77bcf86cd799439011');

      expect(result).toBeDefined();
      expect(result.id).toBe(mockQuestion.id);
    });

    /**
     * Test validation failure when question not found
     */
    it('should throw error when question not found', async () => {
      questionRepository.getQuestion = jest.fn().mockResolvedValue(null);

      await expect(questionService.getQuestionWithValidation('507f1f77bcf86cd799439999'))
        .rejects
        .toThrow('Question with ID 507f1f77bcf86cd799439999 not found');
    });
  });

  describe('getQuestions', () => {
    /**
     * Test getting paginated questions
     */
    it('should return paginated questions', async () => {
      const mockResult = {
        data: [mockQuestion],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
          hasNext: false,
          hasPrev: false
        }
      };

      questionRepository.getQuestions = jest.fn().mockResolvedValue(mockResult);

      const result = await questionService.getQuestions({}, 1, 20);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.pagination).toBeDefined();
      expect(questionRepository.getQuestions).toHaveBeenCalled();
    });

    /**
     * Test filtering by category
     */
    it('should filter questions by category', async () => {
      const mockResult = {
        data: [mockQuestion],
        pagination: { page: 1, limit: 20, total: 1, pages: 1 }
      };

      questionRepository.getQuestions = jest.fn().mockResolvedValue(mockResult);

      await questionService.getQuestions({ category: 'Behavioral Assessment' }, 1, 20);

      expect(questionRepository.getQuestions).toHaveBeenCalledWith(
        { category: 'Behavioral Assessment' },
        1,
        20,
        { createdAt: -1 }
      );
    });

    /**
     * Test tags parsing from string
     */
    it('should parse comma-separated tags', async () => {
      const mockResult = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 }
      };

      questionRepository.getQuestions = jest.fn().mockResolvedValue(mockResult);

      await questionService.getQuestions({ tags: 'anxiety,social,behavior' }, 1, 20);

      const calledFilters = questionRepository.getQuestions.mock.calls[0][0];
      expect(calledFilters.tags).toEqual(['anxiety', 'social', 'behavior']);
    });
  });

  describe('updateQuestion', () => {
    /**
     * Test successful question update
     */
    it('should update question successfully', async () => {
      const updateData = { questionText: 'Updated question text here?' };
      const updatedQuestion = { ...mockQuestion, ...updateData, version: 2 };

      questionRepository.getQuestion = jest.fn().mockResolvedValue(mockQuestion);
      questionRepository.updateQuestion = jest.fn().mockResolvedValue(updatedQuestion);

      const result = await questionService.updateQuestion('507f1f77bcf86cd799439011', updateData);

      expect(result).toBeDefined();
      expect(result.version).toBe(2);
      expect(questionRepository.updateQuestion).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateData);
    });

    /**
     * Test update without question ID
     */
    it('should throw error when question ID is not provided', async () => {
      await expect(questionService.updateQuestion(null, { questionText: 'Test' }))
        .rejects
        .toThrow('Question ID is required for update');
    });

    /**
     * Test update of non-existent question
     */
    it('should throw error when question does not exist', async () => {
      questionRepository.getQuestion = jest.fn().mockResolvedValue(null);

      await expect(questionService.updateQuestion('507f1f77bcf86cd799439999', {}))
        .rejects
        .toThrow('Question with ID 507f1f77bcf86cd799439999 not found');
    });
  });

  describe('deleteQuestion', () => {
    /**
     * Test successful deletion
     */
    it('should delete question successfully', async () => {
      questionRepository.getQuestion = jest.fn().mockResolvedValue(mockQuestion);
      questionRepository.deleteQuestion = jest.fn().mockResolvedValue(true);

      const result = await questionService.deleteQuestion('507f1f77bcf86cd799439011');

      expect(result).toBe(true);
      expect(questionRepository.deleteQuestion).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    /**
     * Test deletion with null ID
     */
    it('should return false when question ID is null', async () => {
      const result = await questionService.deleteQuestion(null);

      expect(result).toBe(false);
      expect(questionRepository.deleteQuestion).not.toHaveBeenCalled();
    });
  });

  describe('getQuestionsByCategory', () => {
    /**
     * Test getting questions by category
     */
    it('should return questions for valid category', async () => {
      questionRepository.getQuestionsByCategory = jest.fn().mockResolvedValue([mockQuestion]);

      const result = await questionService.getQuestionsByCategory('Behavioral Assessment');

      expect(result).toHaveLength(1);
      expect(questionRepository.getQuestionsByCategory).toHaveBeenCalledWith('Behavioral Assessment', 100, true);
    });

    /**
     * Test without category
     */
    it('should throw error when category is not provided', async () => {
      await expect(questionService.getQuestionsByCategory(null))
        .rejects
        .toThrow('Category is required');
    });
  });

  describe('getQuestionsByIssue', () => {
    /**
     * Test getting questions by issue ID
     */
    it('should return questions for valid issue ID', async () => {
      questionRepository.getQuestionsByIssue = jest.fn().mockResolvedValue([mockQuestion]);

      const result = await questionService.getQuestionsByIssue('anxiety');

      expect(result).toHaveLength(1);
      expect(questionRepository.getQuestionsByIssue).toHaveBeenCalledWith('anxiety', 100);
    });

    /**
     * Test without issue ID
     */
    it('should throw error when issue ID is not provided', async () => {
      await expect(questionService.getQuestionsByIssue(null))
        .rejects
        .toThrow('Issue ID is required');
    });
  });

  describe('toggleActiveStatus', () => {
    /**
     * Test toggling active status
     */
    it('should toggle active status successfully', async () => {
      const toggledQuestion = { ...mockQuestion, isActive: false };

      questionRepository.getQuestion = jest.fn().mockResolvedValue(mockQuestion);
      questionRepository.toggleActiveStatus = jest.fn().mockResolvedValue(toggledQuestion);

      const result = await questionService.toggleActiveStatus('507f1f77bcf86cd799439011', false);

      expect(result).toBeDefined();
      expect(result.isActive).toBe(false);
      expect(questionRepository.toggleActiveStatus).toHaveBeenCalledWith('507f1f77bcf86cd799439011', false);
    });

    /**
     * Test toggle without question ID
     */
    it('should throw error when question ID is not provided', async () => {
      await expect(questionService.toggleActiveStatus(null, true))
        .rejects
        .toThrow('Question ID is required');
    });
  });

  describe('getQuestionsStats', () => {
    /**
     * Test getting statistics
     */
    it('should return questions statistics', async () => {
      const mockStats = {
        total: 100,
        active: 85,
        inactive: 15,
        byCategory: [{ category: 'Behavioral Assessment', count: 50 }],
        byType: [{ type: 'rating', count: 60 }]
      };

      questionRepository.getQuestionsStats = jest.fn().mockResolvedValue(mockStats);

      const result = await questionService.getQuestionsStats();

      expect(result).toBeDefined();
      expect(result.total).toBe(100);
      expect(result.active).toBe(85);
      expect(questionRepository.getQuestionsStats).toHaveBeenCalled();
    });
  });

  describe('bulkIncrementUsage', () => {
    /**
     * Test bulk incrementing usage counts
     */
    it('should increment usage for multiple questions', async () => {
      questionRepository.incrementUsageCount = jest.fn().mockResolvedValue(mockQuestion);

      const questionIds = ['id1', 'id2', 'id3'];
      const result = await questionService.bulkIncrementUsage(questionIds);

      expect(result).toBe(3);
    });

    /**
     * Test with empty array
     */
    it('should return 0 for empty question IDs', async () => {
      const result = await questionService.bulkIncrementUsage([]);

      expect(result).toBe(0);
      expect(questionRepository.incrementUsageCount).not.toHaveBeenCalled();
    });
  });

  describe('getRandomQuestions', () => {
    /**
     * Test getting random questions
     */
    it('should return random questions', async () => {
      const mockResult = {
        data: [mockQuestion, { ...mockQuestion, id: 'different' }],
        pagination: {}
      };

      questionRepository.getQuestions = jest.fn().mockResolvedValue(mockResult);

      const result = await questionService.getRandomQuestions('Behavioral Assessment', 2);

      expect(result).toHaveLength(2);
      expect(questionRepository.getQuestions).toHaveBeenCalled();
    });

    /**
     * Test with no available questions
     */
    it('should return empty array when no questions available', async () => {
      const mockResult = { data: [], pagination: {} };

      questionRepository.getQuestions = jest.fn().mockResolvedValue(mockResult);

      const result = await questionService.getRandomQuestions('NonExistent', 10);

      expect(result).toEqual([]);
    });
  });
});
