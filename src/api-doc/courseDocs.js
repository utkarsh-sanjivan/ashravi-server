/**
 * @swagger
 * components:
 *   schemas:
 *     Video:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         videoUrl:
 *           type: string
 *         duration:
 *           type: number
 *         order:
 *           type: number
 *         isFree:
 *           type: boolean
 *         thumbnail:
 *           type: string
 * 
 *     Test:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         questions:
 *           type: array
 *           items:
 *             type: string
 *         passingScore:
 *           type: number
 *         duration:
 *           type: number
 *         order:
 *           type: number
 * 
 *     Section:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         order:
 *           type: number
 *         videos:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Video'
 *         test:
 *           $ref: '#/components/schemas/Test'
 *         isLocked:
 *           type: boolean
 * 
 *     Course:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         slug:
 *           type: string
 *         headline:
 *           type: string
 *         description:
 *           type: string
 *         shortDescription:
 *           type: string
 *         thumbnail:
 *           type: string
 *         coverImage:
 *           type: string
 *         category:
 *           type: string
 *         subCategory:
 *           type: string
 *         level:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         language:
 *           type: string
 *         price:
 *           type: object
 *           properties:
 *             amount:
 *               type: number
 *             currency:
 *               type: string
 *             discountedPrice:
 *               type: number
 *         sections:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Section'
 *         instructor:
 *           type: object
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         prerequisites:
 *           type: array
 *           items:
 *             type: string
 *         learningOutcomes:
 *           type: array
 *           items:
 *             type: string
 *         targetAudience:
 *           type: array
 *           items:
 *             type: string
 *         isPublished:
 *           type: boolean
 *         enrollmentCount:
 *           type: number
 *         rating:
 *           type: object
 *           properties:
 *             average:
 *               type: number
 *             count:
 *               type: number
 *         metadata:
 *           type: object
 *           properties:
 *             totalDuration:
 *               type: number
 *             totalVideos:
 *               type: number
 *             totalTests:
 *               type: number
 * 
 *     CourseProgress:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         courseId:
 *           type: string
 *         overallProgress:
 *           type: number
 *         isCompleted:
 *           type: boolean
 *         enrolledAt:
 *           type: string
 *           format: date-time
 *         completedAt:
 *           type: string
 *           format: date-time
 *         certificateIssued:
 *           type: boolean
 *         sections:
 *           type: array
 *           items:
 *             type: object
 * 
 * /api/v1/courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - headline
 *               - description
 *               - shortDescription
 *               - thumbnail
 *               - category
 *               - price
 *               - sections
 *               - instructor
 *               - learningOutcomes
 *             properties:
 *               title:
 *                 type: string
 *               headline:
 *                 type: string
 *               description:
 *                 type: string
 *               shortDescription:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *               category:
 *                 type: string
 *               price:
 *                 type: object
 *               sections:
 *                 type: array
 *               learningOutcomes:
 *                 type: array
 *     responses:
 *       201:
 *         description: Course created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 * 
 *   get:
 *     summary: Get courses with filters
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *       - in: query
 *         name: isPublished
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Paginated courses list
 * 
 * /api/v1/courses/my-progress:
 *   get:
 *     summary: Get user's all course progress
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's progress for all enrolled courses
 * 
 * /api/v1/courses/slug/{slug}:
 *   get:
 *     summary: Get course by slug
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course retrieved successfully
 * 
 * /api/v1/courses/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course retrieved successfully
 * 
 *   patch:
 *     summary: Update course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Course updated successfully
 * 
 *   delete:
 *     summary: Delete course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course deleted successfully
 * 
 * /api/v1/courses/{id}/enroll:
 *   post:
 *     summary: Enroll in course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully enrolled in course
 * 
 * /api/v1/courses/{id}/progress:
 *   get:
 *     summary: Get user's progress for specific course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course progress retrieved successfully
 * 
 * /api/v1/courses/{id}/progress/video:
 *   post:
 *     summary: Update video progress
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sectionId
 *               - videoId
 *               - watchedDuration
 *               - totalDuration
 *             properties:
 *               sectionId:
 *                 type: string
 *               videoId:
 *                 type: string
 *               watchedDuration:
 *                 type: number
 *               totalDuration:
 *                 type: number
 *     responses:
 *       200:
 *         description: Video progress updated successfully
 * 
 * /api/v1/courses/{id}/progress/test:
 *   post:
 *     summary: Update test progress
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sectionId
 *               - testId
 *               - score
 *             properties:
 *               sectionId:
 *                 type: string
 *               testId:
 *                 type: string
 *               score:
 *                 type: number
 *               passingScore:
 *                 type: number
 *     responses:
 *       200:
 *         description: Test progress updated successfully
 * 
 * /api/v1/courses/{id}/certificate:
 *   post:
 *     summary: Issue certificate
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Certificate issued successfully
 */

module.exports = {};
