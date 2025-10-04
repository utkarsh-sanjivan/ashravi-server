const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const Course = require('../../src/models/Course');
const CourseProgress = require('../../src/models/CourseProgress');
const User = require('../../src/models/User');
const courseRoutes = require('../../src/routes/courses');
const errorHandler = require('../../src/middleware/errorHandler');

let app;
let mongod;
let instructorUser;
let instructorToken;
let regularUser;
let regularToken;
let adminUser;
let adminToken;

const setupTestApp = () => {
  const testApp = express();
  testApp.use(express.json());
  
  testApp.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader === `Bearer ${instructorToken}`) {
      req.user = {
        id: instructorUser._id,
        email: instructorUser.email,
        role: 'instructor',
        _id: instructorUser._id
      };
    } else if (authHeader === `Bearer ${regularToken}`) {
      req.user = {
        id: regularUser._id,
        email: regularUser.email,
        role: 'user',
        _id: regularUser._id
      };
    } else if (authHeader === `Bearer ${adminToken}`) {
      req.user = {
        id: adminUser._id,
        email: adminUser.email,
        role: 'admin',
        _id: adminUser._id
      };
    }
    next();
  });
  
  testApp.use('/api/v1/courses', courseRoutes);
  testApp.use(errorHandler.handle.bind(errorHandler));
  
  return testApp;
};

describe('Courses API - Integration Tests', () => {
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
    await Course.deleteMany({});
    await CourseProgress.deleteMany({});
    await User.deleteMany({});
    
    instructorUser = await User.create({
      name: 'Instructor User',
      email: `instructor${Date.now()}@example.com`,
      password: 'InstructorPass123!',
      role: 'instructor'
    });
    
    instructorToken = instructorUser.getSignedJwtToken();

    regularUser = await User.create({
      name: 'Regular User',
      email: `user${Date.now()}@example.com`,
      password: 'UserPass123!',
      role: 'user'
    });
    
    regularToken = regularUser.getSignedJwtToken();

    adminUser = await User.create({
      name: 'Admin User',
      email: `admin${Date.now()}@example.com`,
      password: 'AdminPass123!',
      role: 'admin'
    });
    
    adminToken = adminUser.getSignedJwtToken();
  });

  afterEach(async () => {
    await Course.deleteMany({});
    await CourseProgress.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/v1/courses', () => {
    /**
     * Test creating course as instructor
     */
    it('should create course successfully as instructor', async () => {
      const courseData = {
        title: 'Complete Web Development Course',
        headline: 'Learn web development from scratch',
        description: 'A comprehensive course covering HTML, CSS, JavaScript, and modern web frameworks including React and Node.js',
        shortDescription: 'Learn web development',
        thumbnail: 'https://example.com/thumb.jpg',
        category: 'Web Development',
        level: 'beginner',
        price: { amount: 99.99, currency: 'USD' },
        sections: [
          {
            title: 'Introduction to Web Development',
            description: 'Get started with web development',
            order: 0,
            videos: [
              {
                title: 'Welcome Video',
                videoUrl: 'https://example.com/video1.mp4',
                duration: 300,
                order: 0
              }
            ]
          }
        ],
        instructor: instructorUser._id.toString(),
        learningOutcomes: ['Learn HTML', 'Learn CSS', 'Learn JavaScript']
      };

      const response = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(courseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(courseData.title);
      expect(response.body.data.slug).toBe('complete-web-development-course');
      expect(response.body.data.sections).toHaveLength(1);
      expect(response.body.data.metadata.totalVideos).toBe(1);
    });

    /**
     * Test course validation
     */
    it('should validate course structure', async () => {
      const invalidData = {
        title: 'Test',
        headline: 'Test headline',
        description: 'Short',
        shortDescription: 'Test',
        thumbnail: 'https://example.com/thumb.jpg',
        category: 'Test',
        price: { amount: 99.99 },
        sections: [],
        instructor: instructorUser._id.toString(),
        learningOutcomes: ['Learn']
      };

      const response = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    /**
     * Test authorization for regular user
     */
    it('should deny access to regular user', async () => {
      const courseData = {
        title: 'Test Course',
        sections: [{ title: 'Section 1', order: 0, videos: [] }],
        instructor: instructorUser._id.toString()
      };

      const response = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${regularToken}`)
        .send(courseData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/courses', () => {
    beforeEach(async () => {
      await Course.create([
        {
          title: 'Web Development Course',
          headline: 'Learn web dev',
          description: 'A comprehensive course covering HTML, CSS, JavaScript, and modern frameworks',
          shortDescription: 'Web dev course',
          thumbnail: 'https://example.com/thumb1.jpg',
          category: 'Web Development',
          level: 'beginner',
          price: { amount: 99.99, currency: 'USD' },
          sections: [
            {
              title: 'Intro',
              order: 0,
              videos: [
                { title: 'Video 1', videoUrl: 'https://example.com/v1.mp4', duration: 300, order: 0 }
              ]
            }
          ],
          instructor: instructorUser._id,
          learningOutcomes: ['Learn HTML'],
          isPublished: true
        },
        {
          title: 'Data Science Course',
          headline: 'Learn data science',
          description: 'A comprehensive course covering Python, data analysis, machine learning, and visualization',
          shortDescription: 'Data science course',
          thumbnail: 'https://example.com/thumb2.jpg',
          category: 'Data Science',
          level: 'intermediate',
          price: { amount: 149.99, currency: 'USD' },
          sections: [
            {
              title: 'Intro',
              order: 0,
              videos: [
                { title: 'Video 1', videoUrl: 'https://example.com/v2.mp4', duration: 400, order: 0 }
              ]
            }
          ],
          instructor: instructorUser._id,
          learningOutcomes: ['Learn Python'],
          isPublished: true
        }
      ]);
    });

    /**
     * Test paginated retrieval
     */
    it('should get paginated courses', async () => {
      const response = await request(app)
        .get('/api/v1/courses')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
    });

    /**
     * Test filtering by category
     */
    it('should filter courses by category', async () => {
      const response = await request(app)
        .get('/api/v1/courses')
        .query({ category: 'Web Development' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(c => c.category === 'Web Development')).toBe(true);
    });

    /**
     * Test filtering by level
     */
    it('should filter courses by level', async () => {
      const response = await request(app)
        .get('/api/v1/courses')
        .query({ level: 'beginner' })
        .expect(200);

      expect(response.body.data.every(c => c.level === 'beginner')).toBe(true);
    });
  });

  describe('GET /api/v1/courses/:id', () => {
    let testCourse;

    beforeEach(async () => {
      testCourse = await Course.create({
        title: 'Test Course',
        headline: 'Test headline',
        description: 'A comprehensive course covering various topics in software development and testing',
        shortDescription: 'Test course',
        thumbnail: 'https://example.com/thumb.jpg',
        category: 'Programming',
        level: 'beginner',
        price: { amount: 49.99, currency: 'USD' },
        sections: [
          {
            title: 'Section 1',
            order: 0,
            videos: [
              { title: 'Video 1', videoUrl: 'https://example.com/v1.mp4', duration: 300, order: 0 }
            ]
          }
        ],
        instructor: instructorUser._id,
        learningOutcomes: ['Learn testing'],
        isPublished: true
      });
    });

    /**
     * Test getting course by ID
     */
    it('should get course by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/courses/${testCourse._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(testCourse.title);
      expect(response.body.data.instructor).toBeDefined();
    });

    /**
     * Test getting non-existent course
     */
    it('should return 404 for non-existent course', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/v1/courses/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/courses/slug/:slug', () => {
    beforeEach(async () => {
      await Course.create({
        title: 'Unique Course Title',
        slug: 'unique-course-title',
        headline: 'Unique headline',
        description: 'A comprehensive course with a unique title for testing slug-based retrieval',
        shortDescription: 'Unique course',
        thumbnail: 'https://example.com/thumb.jpg',
        category: 'Test',
        level: 'beginner',
        price: { amount: 29.99, currency: 'USD' },
        sections: [
          {
            title: 'Section 1',
            order: 0,
            videos: [
              { title: 'Video 1', videoUrl: 'https://example.com/v1.mp4', duration: 300, order: 0 }
            ]
          }
        ],
        instructor: instructorUser._id,
        learningOutcomes: ['Learn something'],
        isPublished: true
      });
    });

    /**
     * Test getting course by slug
     */
    it('should get course by slug', async () => {
      const response = await request(app)
        .get('/api/v1/courses/slug/unique-course-title')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe('unique-course-title');
    });
  });

  describe('POST /api/v1/courses/:id/enroll', () => {
    let testCourse;

    beforeEach(async () => {
      testCourse = await Course.create({
        title: 'Enrollment Test Course',
        headline: 'Test enrollment',
        description: 'A comprehensive course designed to test the enrollment functionality and user progress tracking',
        shortDescription: 'Enrollment test',
        thumbnail: 'https://example.com/thumb.jpg',
        category: 'Test',
        level: 'beginner',
        price: { amount: 0, currency: 'USD' },
        sections: [
          {
            title: 'Section 1',
            order: 0,
            videos: [
              { title: 'Video 1', videoUrl: 'https://example.com/v1.mp4', duration: 300, order: 0 }
            ]
          }
        ],
        instructor: instructorUser._id,
        learningOutcomes: ['Learn enrollment'],
        isPublished: true
      });
    });

    /**
     * Test enrolling in course
     */
    it('should enroll user in course successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/courses/${testCourse._id}/enroll`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.courseId).toBeDefined();
      expect(response.body.data.userId).toBeDefined();

      const progress = await CourseProgress.findOne({
        userId: regularUser._id,
        courseId: testCourse._id
      });
      expect(progress).toBeTruthy();
    });

    /**
     * Test duplicate enrollment
     */
    it('should handle duplicate enrollment', async () => {
      await request(app)
        .post(`/api/v1/courses/${testCourse._id}/enroll`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);

      const response = await request(app)
        .post(`/api/v1/courses/${testCourse._id}/enroll`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/courses/:id/progress/video', () => {
    let testCourse;

    beforeEach(async () => {
      testCourse = await Course.create({
        title: 'Progress Test Course',
        headline: 'Test progress',
        description: 'A comprehensive course designed to test video progress tracking and completion monitoring',
        shortDescription: 'Progress test',
        thumbnail: 'https://example.com/thumb.jpg',
        category: 'Test',
        level: 'beginner',
        price: { amount: 0, currency: 'USD' },
        sections: [
          {
            _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439030'),
            title: 'Section 1',
            order: 0,
            videos: [
              {
                _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439040'),
                title: 'Video 1',
                videoUrl: 'https://example.com/v1.mp4',
                duration: 300,
                order: 0
              }
            ]
          }
        ],
        instructor: instructorUser._id,
        learningOutcomes: ['Learn progress'],
        isPublished: true
      });

      await request(app)
        .post(`/api/v1/courses/${testCourse._id}/enroll`)
        .set('Authorization', `Bearer ${regularToken}`);
    });

    /**
     * Test updating video progress
     */
    it('should update video progress successfully', async () => {
      const progressData = {
        sectionId: '507f1f77bcf86cd799439030',
        videoId: '507f1f77bcf86cd799439040',
        watchedDuration: 150,
        totalDuration: 300
      };

      const response = await request(app)
        .post(`/api/v1/courses/${testCourse._id}/progress/video`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send(progressData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overallProgress).toBeGreaterThanOrEqual(0);
    });

    /**
     * Test completing video
     */
    it('should mark video as completed when watched duration is high', async () => {
      const progressData = {
        sectionId: '507f1f77bcf86cd799439030',
        videoId: '507f1f77bcf86cd799439040',
        watchedDuration: 280,
        totalDuration: 300
      };

      const response = await request(app)
        .post(`/api/v1/courses/${testCourse._id}/progress/video`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send(progressData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/courses/:id/progress', () => {
    let testCourse;

    beforeEach(async () => {
      testCourse = await Course.create({
        title: 'Progress Retrieval Test',
        headline: 'Test getting progress',
        description: 'A comprehensive course designed to test progress retrieval and display functionality',
        shortDescription: 'Progress retrieval',
        thumbnail: 'https://example.com/thumb.jpg',
        category: 'Test',
        level: 'beginner',
        price: { amount: 0, currency: 'USD' },
        sections: [
          {
            title: 'Section 1',
            order: 0,
            videos: [
              { title: 'Video 1', videoUrl: 'https://example.com/v1.mp4', duration: 300, order: 0 }
            ]
          }
        ],
        instructor: instructorUser._id,
        learningOutcomes: ['Learn retrieval'],
        isPublished: true
      });

      await request(app)
        .post(`/api/v1/courses/${testCourse._id}/enroll`)
        .set('Authorization', `Bearer ${regularToken}`);
    });

    /**
     * Test getting course progress
     */
    it('should get user course progress', async () => {
      const response = await request(app)
        .get(`/api/v1/courses/${testCourse._id}/progress`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.course).toBeDefined();
      expect(response.body.data.progress).toBeDefined();
      expect(response.body.data.isEnrolled).toBe(true);
    });
  });

  describe('GET /api/v1/courses/my-progress', () => {
    beforeEach(async () => {
      const course1 = await Course.create({
        title: 'Course 1',
        headline: 'First course',
        description: 'A comprehensive first course covering various introductory topics and basic concepts',
        shortDescription: 'Course 1',
        thumbnail: 'https://example.com/thumb1.jpg',
        category: 'Test',
        level: 'beginner',
        price: { amount: 0, currency: 'USD' },
        sections: [
          {
            title: 'Section 1',
            order: 0,
            videos: [
              { title: 'Video 1', videoUrl: 'https://example.com/v1.mp4', duration: 300, order: 0 }
            ]
          }
        ],
        instructor: instructorUser._id,
        learningOutcomes: ['Learn 1'],
        isPublished: true
      });

      const course2 = await Course.create({
        title: 'Course 2',
        headline: 'Second course',
        description: 'A comprehensive second course covering more advanced topics and intermediate concepts',
        shortDescription: 'Course 2',
        thumbnail: 'https://example.com/thumb2.jpg',
        category: 'Test',
        level: 'intermediate',
        price: { amount: 0, currency: 'USD' },
        sections: [
          {
            title: 'Section 1',
            order: 0,
            videos: [
              { title: 'Video 1', videoUrl: 'https://example.com/v2.mp4', duration: 400, order: 0 }
            ]
          }
        ],
        instructor: instructorUser._id,
        learningOutcomes: ['Learn 2'],
        isPublished: true
      });

      await request(app)
        .post(`/api/v1/courses/${course1._id}/enroll`)
        .set('Authorization', `Bearer ${regularToken}`);

      await request(app)
        .post(`/api/v1/courses/${course2._id}/enroll`)
        .set('Authorization', `Bearer ${regularToken}`);
    });

    /**
     * Test getting all user progress
     */
    it('should get all user progress', async () => {
      const response = await request(app)
        .get('/api/v1/courses/my-progress')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('PATCH /api/v1/courses/:id', () => {
    let testCourse;

    beforeEach(async () => {
      testCourse = await Course.create({
        title: 'Course to Update',
        headline: 'Original headline',
        description: 'A comprehensive course that will be updated to test the update functionality and validation',
        shortDescription: 'Original description',
        thumbnail: 'https://example.com/thumb.jpg',
        category: 'Test',
        level: 'beginner',
        price: { amount: 49.99, currency: 'USD' },
        sections: [
          {
            title: 'Section 1',
            order: 0,
            videos: [
              { title: 'Video 1', videoUrl: 'https://example.com/v1.mp4', duration: 300, order: 0 }
            ]
          }
        ],
        instructor: instructorUser._id,
        learningOutcomes: ['Learn original'],
        isPublished: false
      });
    });

    /**
     * Test updating course
     */
    it('should update course successfully', async () => {
      const updateData = {
        title: 'Updated Course Title',
        headline: 'Updated headline'
      };

      const response = await request(app)
        .patch(`/api/v1/courses/${testCourse._id}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.headline).toBe(updateData.headline);
    });
  });

  describe('DELETE /api/v1/courses/:id', () => {
    let testCourse;

    beforeEach(async () => {
      testCourse = await Course.create({
        title: 'Course to Delete',
        headline: 'To be deleted',
        description: 'A comprehensive course created specifically to test the deletion functionality and cleanup',
        shortDescription: 'Delete test',
        thumbnail: 'https://example.com/thumb.jpg',
        category: 'Test',
        level: 'beginner',
        price: { amount: 0, currency: 'USD' },
        sections: [
          {
            title: 'Section 1',
            order: 0,
            videos: [
              { title: 'Video 1', videoUrl: 'https://example.com/v1.mp4', duration: 300, order: 0 }
            ]
          }
        ],
        instructor: instructorUser._id,
        learningOutcomes: ['Learn deletion'],
        isPublished: true
      });
    });

    /**
     * Test deleting course
     */
    it('should delete course successfully as admin', async () => {
      const response = await request(app)
        .delete(`/api/v1/courses/${testCourse._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(true);

      const deleted = await Course.findById(testCourse._id);
      expect(deleted).toBeNull();
    });

    /**
     * Test authorization for deletion
     */
    it('should deny deletion to regular user', async () => {
      const response = await request(app)
        .delete(`/api/v1/courses/${testCourse._id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
