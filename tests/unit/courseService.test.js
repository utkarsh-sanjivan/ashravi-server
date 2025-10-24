const courseService = require('../../src/services/courseService');
const courseRepository = require('../../src/repositories/courseRepository');
const courseProgressRepository = require('../../src/repositories/courseProgressRepository');
const Instructor = require('../../src/models/Instructor');
const Parent = require('../../src/models/Parent');

jest.mock('../../src/repositories/courseRepository');
jest.mock('../../src/repositories/courseProgressRepository');
jest.mock('../../src/models/Instructor');
jest.mock('../../src/models/Parent');

describe('Course Service - Unit Tests', () => {
  let mockInstructor;
  let mockUser;
  let mockCourse;
  let mockProgress;

  beforeEach(() => {
    jest.clearAllMocks();

    mockInstructor = {
      _id: '507f1f77bcf86cd799439010',
      firstName: 'Instructor',
      lastName: 'Name',
      email: 'instructor@example.com',
      role: 'instructor',
      isActive: true
    };

    mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'user@example.com',
      role: 'user'
    };

    mockCourse = {
      _id: '507f1f77bcf86cd799439020',
      id: '507f1f77bcf86cd799439020',
      title: 'Complete Web Development Course',
      slug: 'complete-web-development-course',
      headline: 'Learn web development from scratch',
      description: 'A comprehensive course covering HTML, CSS, JavaScript, and modern frameworks',
      shortDescription: 'Learn web development',
      thumbnail: 'https://example.com/thumb.jpg',
      category: 'Web Development',
      level: 'beginner',
      price: { amount: 99.99, currency: 'USD' },
      sections: [
        {
          _id: '507f1f77bcf86cd799439030',
          title: 'Introduction',
          order: 0,
          videos: [
            {
              _id: '507f1f77bcf86cd799439040',
              title: 'Welcome Video',
              videoUrl: 'https://example.com/video1.mp4',
              duration: 300,
              order: 0
            }
          ]
        }
      ],
      instructor: mockInstructor._id,
      learningOutcomes: ['Learn HTML', 'Learn CSS'],
      isPublished: true,
      metadata: {
        totalDuration: 300,
        totalVideos: 1,
        totalTests: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockProgress = {
      _id: '507f1f77bcf86cd799439050',
      id: '507f1f77bcf86cd799439050',
      userId: mockUser._id,
      courseId: mockCourse._id,
      sections: [],
      overallProgress: 0,
      isCompleted: false,
      enrolledAt: new Date(),
      lastAccessedAt: new Date()
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createCourse', () => {
    /**
     * Test successful course creation
     */
    it('should create course successfully', async () => {
      const courseData = {
        title: 'New Course',
        headline: 'Learn something new',
        description: 'A detailed description of the course that is at least 50 characters long',
        shortDescription: 'Short desc',
        thumbnail: 'https://example.com/thumb.jpg',
        category: 'Programming',
        price: { amount: 49.99, currency: 'USD' },
        sections: [
          {
            title: 'Section 1',
            order: 0,
            videos: [
              {
                title: 'Video 1',
                videoUrl: 'https://example.com/video.mp4',
                duration: 300,
                order: 0
              }
            ]
          }
        ],
        instructor: mockInstructor._id,
        learningOutcomes: ['Outcome 1']
      };

      Instructor.findById = jest.fn().mockResolvedValue(mockInstructor);
      courseRepository.createCourse = jest.fn().mockResolvedValue(mockCourse);

      const result = await courseService.createCourse(courseData);

      expect(result).toBeDefined();
      expect(result.title).toBe(mockCourse.title);
      expect(Instructor.findById).toHaveBeenCalledWith(courseData.instructor);
      expect(courseRepository.createCourse).toHaveBeenCalledWith(courseData);
    });

    /**
     * Test validation for instructor
     */
    it('should throw error when instructor does not exist', async () => {
      const courseData = {
        title: 'New Course',
        sections: [{ title: 'Section 1', order: 0, videos: [] }],
        instructor: '507f1f77bcf86cd799439999',
        learningOutcomes: ['Outcome 1']
      };

      Instructor.findById = jest.fn().mockResolvedValue(null);

      await expect(courseService.createCourse(courseData))
        .rejects
        .toThrow('Instructor with ID 507f1f77bcf86cd799439999 not found');
    });

    /**
     * Test validation for course structure
     */
    it('should throw error when sections are empty', async () => {
      const courseData = {
        title: 'New Course',
        sections: [],
        instructor: mockInstructor._id,
        learningOutcomes: ['Outcome 1']
      };

      Instructor.findById = jest.fn().mockResolvedValue(mockInstructor);

      await expect(courseService.createCourse(courseData))
        .rejects
        .toThrow('Course must have at least one section');
    });

    /**
     * Test validation for section content
     */
    it('should throw error when section has no title', async () => {
      const courseData = {
        title: 'New Course',
        sections: [{ order: 0, videos: [] }],
        instructor: mockInstructor._id,
        learningOutcomes: ['Outcome 1']
      };

      Instructor.findById = jest.fn().mockResolvedValue(mockInstructor);

      await expect(courseService.createCourse(courseData))
        .rejects
        .toThrow('Section 1 must have a title');
    });
  });

  describe('getCourse', () => {
    /**
     * Test getting course by ID
     */
    it('should return course when valid ID is provided', async () => {
      courseRepository.getCourse = jest.fn().mockResolvedValue(mockCourse);

      const result = await courseService.getCourse('507f1f77bcf86cd799439020');

      expect(result).toBeDefined();
      expect(result.id).toBe(mockCourse.id);
      expect(courseRepository.getCourse).toHaveBeenCalledWith('507f1f77bcf86cd799439020', true);
    });

    /**
     * Test getting course with null ID
     */
    it('should return null when no ID is provided', async () => {
      const result = await courseService.getCourse(null);

      expect(result).toBeNull();
      expect(courseRepository.getCourse).not.toHaveBeenCalled();
    });
  });

  describe('getCourseWithValidation', () => {
    /**
     * Test getting course with validation
     */
    it('should return course when found', async () => {
      courseRepository.getCourse = jest.fn().mockResolvedValue(mockCourse);

      const result = await courseService.getCourseWithValidation('507f1f77bcf86cd799439020');

      expect(result).toBeDefined();
      expect(result.id).toBe(mockCourse.id);
    });

    /**
     * Test validation failure when course not found
     */
    it('should throw error when course not found', async () => {
      courseRepository.getCourse = jest.fn().mockResolvedValue(null);

      await expect(courseService.getCourseWithValidation('507f1f77bcf86cd799439999'))
        .rejects
        .toThrow('Course with ID 507f1f77bcf86cd799439999 not found');
    });
  });

  describe('getCourses', () => {
    /**
     * Test getting paginated courses
     */
    it('should return paginated courses', async () => {
      const mockResult = {
        data: [mockCourse],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
          hasNext: false,
          hasPrev: false
        }
      };

      courseRepository.getCourses = jest.fn().mockResolvedValue(mockResult);

      const result = await courseService.getCourses({}, 1, 20);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.pagination).toBeDefined();
      expect(courseRepository.getCourses).toHaveBeenCalled();
    });

    /**
     * Test filtering by category
     */
    it('should filter courses by category', async () => {
      const mockResult = {
        data: [mockCourse],
        pagination: { page: 1, limit: 20, total: 1, pages: 1 }
      };

      courseRepository.getCourses = jest.fn().mockResolvedValue(mockResult);

      await courseService.getCourses({ category: 'Web Development' }, 1, 20);

      expect(courseRepository.getCourses).toHaveBeenCalledWith(
        { category: 'Web Development' },
        1,
        20,
        { createdAt: -1 }
      );
    });
  });

  describe('updateCourse', () => {
    /**
     * Test successful course update
     */
    it('should update course successfully', async () => {
      const updateData = { title: 'Updated Course Title' };
      const updatedCourse = { ...mockCourse, ...updateData };

      courseRepository.getCourse = jest.fn().mockResolvedValue(mockCourse);
      courseRepository.updateCourse = jest.fn().mockResolvedValue(updatedCourse);

      const result = await courseService.updateCourse('507f1f77bcf86cd799439020', updateData);

      expect(result).toBeDefined();
      expect(result.title).toBe('Updated Course Title');
      expect(courseRepository.updateCourse).toHaveBeenCalledWith('507f1f77bcf86cd799439020', updateData);
    });

    /**
     * Test update without course ID
     */
    it('should throw error when course ID is not provided', async () => {
      await expect(courseService.updateCourse(null, { title: 'Test' }))
        .rejects
        .toThrow('Course ID is required for update');
    });
  });

  describe('deleteCourse', () => {
    /**
     * Test successful deletion
     */
    it('should delete course successfully', async () => {
      courseRepository.getCourse = jest.fn().mockResolvedValue(mockCourse);
      courseRepository.deleteCourse = jest.fn().mockResolvedValue(true);

      const result = await courseService.deleteCourse('507f1f77bcf86cd799439020');

      expect(result).toBe(true);
      expect(courseRepository.deleteCourse).toHaveBeenCalledWith('507f1f77bcf86cd799439020');
    });

    /**
     * Test deletion with null ID
     */
    it('should return false when course ID is null', async () => {
      const result = await courseService.deleteCourse(null);

      expect(result).toBe(false);
      expect(courseRepository.deleteCourse).not.toHaveBeenCalled();
    });
  });

  describe('enrollInCourse', () => {
    /**
     * Test successful enrollment
     */
    it('should enroll user in course successfully', async () => {
      courseRepository.getCourse = jest.fn().mockResolvedValue(mockCourse);
      Parent.findById = jest.fn().mockResolvedValue(mockUser);
      courseProgressRepository.getUserCourseProgress = jest.fn().mockResolvedValue(null);
      courseRepository.incrementEnrollment = jest.fn().mockResolvedValue(mockCourse);
      courseProgressRepository.getOrCreateProgress = jest.fn().mockResolvedValue(mockProgress);

      const result = await courseService.enrollInCourse(mockUser._id, mockCourse._id);

      expect(result).toBeDefined();
      expect(courseRepository.incrementEnrollment).toHaveBeenCalledWith(mockCourse._id);
      expect(courseProgressRepository.getOrCreateProgress).toHaveBeenCalledWith(mockUser._id, mockCourse._id);
    });

    /**
     * Test enrollment when already enrolled
     */
    it('should return existing progress when already enrolled', async () => {
      courseRepository.getCourse = jest.fn().mockResolvedValue(mockCourse);
      Parent.findById = jest.fn().mockResolvedValue(mockUser);
      courseProgressRepository.getUserCourseProgress = jest.fn().mockResolvedValue(mockProgress);

      const result = await courseService.enrollInCourse(mockUser._id, mockCourse._id);

      expect(result).toBe(mockProgress);
      expect(courseRepository.incrementEnrollment).not.toHaveBeenCalled();
    });

    /**
     * Test enrollment with non-existent user
     */
    it('should throw error when user does not exist', async () => {
      courseRepository.getCourse = jest.fn().mockResolvedValue(mockCourse);
      Parent.findById = jest.fn().mockResolvedValue(null);

      await expect(courseService.enrollInCourse('507f1f77bcf86cd799439999', mockCourse._id))
        .rejects
        .toThrow('User with ID 507f1f77bcf86cd799439999 not found');
    });
  });

  describe('updateVideoProgress', () => {
    /**
     * Test updating video progress
     */
    it('should update video progress and recalculate overall progress', async () => {
      const updatedProgress = { ...mockProgress, overallProgress: 50 };

      courseRepository.getCourse = jest.fn().mockResolvedValue(mockCourse);
      courseProgressRepository.updateVideoProgress = jest.fn().mockResolvedValue(mockProgress);
      courseProgressRepository.calculateOverallProgress = jest.fn().mockResolvedValue(updatedProgress);

      const result = await courseService.updateVideoProgress(
        mockUser._id,
        mockCourse._id,
        '507f1f77bcf86cd799439030',
        '507f1f77bcf86cd799439040',
        150,
        300
      );

      expect(result).toBeDefined();
      expect(result.overallProgress).toBe(50);
      expect(courseProgressRepository.updateVideoProgress).toHaveBeenCalled();
      expect(courseProgressRepository.calculateOverallProgress).toHaveBeenCalled();
    });
  });

  describe('updateTestProgress', () => {
    /**
     * Test updating test progress
     */
    it('should update test progress and recalculate overall progress', async () => {
      const updatedProgress = { ...mockProgress, overallProgress: 100, isCompleted: true };

      courseRepository.getCourse = jest.fn().mockResolvedValue(mockCourse);
      courseProgressRepository.updateTestProgress = jest.fn().mockResolvedValue(mockProgress);
      courseProgressRepository.calculateOverallProgress = jest.fn().mockResolvedValue(updatedProgress);
      courseProgressRepository.issueCertificate = jest.fn().mockResolvedValue(updatedProgress);

      const result = await courseService.updateTestProgress(
        mockUser._id,
        mockCourse._id,
        '507f1f77bcf86cd799439030',
        '507f1f77bcf86cd799439041',
        85,
        70
      );

      expect(result).toBeDefined();
      expect(courseProgressRepository.issueCertificate).toHaveBeenCalled();
    });
  });

  describe('issueCertificate', () => {
    /**
     * Test issuing certificate
     */
    it('should issue certificate when course is completed', async () => {
      const completedProgress = { ...mockProgress, isCompleted: true, certificateIssued: false };

      courseProgressRepository.getUserCourseProgress = jest.fn().mockResolvedValue(completedProgress);
      courseProgressRepository.issueCertificate = jest.fn().mockResolvedValue({
        ...completedProgress,
        certificateIssued: true
      });

      const result = await courseService.issueCertificate(mockUser._id, mockCourse._id);

      expect(result).toBeDefined();
      expect(courseProgressRepository.issueCertificate).toHaveBeenCalledWith(mockUser._id, mockCourse._id);
    });

    /**
     * Test certificate issuance when course not completed
     */
    it('should throw error when course is not completed', async () => {
      const incompleteProgress = { ...mockProgress, isCompleted: false };

      courseProgressRepository.getUserCourseProgress = jest.fn().mockResolvedValue(incompleteProgress);

      await expect(courseService.issueCertificate(mockUser._id, mockCourse._id))
        .rejects
        .toThrow('Course must be completed before issuing certificate');
    });
  });

  describe('hasAccessToCourse', () => {
    /**
     * Test checking course access
     */
    it('should return true when user has access', async () => {
      courseProgressRepository.getUserCourseProgress = jest.fn().mockResolvedValue(mockProgress);

      const result = await courseService.hasAccessToCourse(mockUser._id, mockCourse._id);

      expect(result).toBe(true);
    });

    /**
     * Test when user has no access
     */
    it('should return false when user has no access', async () => {
      courseProgressRepository.getUserCourseProgress = jest.fn().mockResolvedValue(null);

      const result = await courseService.hasAccessToCourse(mockUser._id, mockCourse._id);

      expect(result).toBe(false);
    });
  });
});
