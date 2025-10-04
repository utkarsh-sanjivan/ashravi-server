/**
 * @swagger
 * components:
 *   schemas:
 *     IssueWeightage:
 *       type: object
 *       required:
 *         - issueId
 *         - issueName
 *         - weightage
 *       properties:
 *         issueId:
 *           type: string
 *           example: anxiety
 *         issueName:
 *           type: string
 *           example: Anxiety Disorder
 *         weightage:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 75
 * 
 *     Option:
 *       type: object
 *       required:
 *         - optionText
 *         - optionValue
 *       properties:
 *         optionText:
 *           type: string
 *           example: Always
 *         optionValue:
 *           type: number
 *           example: 5
 *         isCorrect:
 *           type: boolean
 *           example: false
 * 
 *     Question:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         questionText:
 *           type: string
 *           example: How often does your child feel anxious in social situations?
 *         questionType:
 *           type: string
 *           enum: [mcq, rating, boolean, text, multiselect]
 *           example: rating
 *         category:
 *           type: string
 *           example: Behavioral Assessment
 *         subCategory:
 *           type: string
 *           example: Social Anxiety
 *         options:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Option'
 *         ratingScale:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *               example: 1
 *             max:
 *               type: number
 *               example: 5
 *         issueWeightages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IssueWeightage'
 *         ageGroup:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *               example: 6
 *             max:
 *               type: number
 *               example: 12
 *         difficultyLevel:
 *           type: string
 *           enum: [easy, medium, hard]
 *           example: medium
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: [anxiety, social, behavior]
 *         isActive:
 *           type: boolean
 *           example: true
 *         usageCount:
 *           type: number
 *           example: 42
 *         version:
 *           type: number
 *           example: 1
 *         totalWeightage:
 *           type: number
 *           example: 100
 *         primaryIssue:
 *           $ref: '#/components/schemas/IssueWeightage'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     QuestionStats:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *         active:
 *           type: integer
 *         inactive:
 *           type: integer
 *         byCategory:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *               count:
 *                 type: integer
 *         byType:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               count:
 *                 type: integer
 * 
 * /api/v1/questions:
 *   post:
 *     summary: Create a new question (Admin/Moderator only)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionText
 *               - questionType
 *               - category
 *               - issueWeightages
 *             properties:
 *               questionText:
 *                 type: string
 *               questionType:
 *                 type: string
 *                 enum: [mcq, rating, boolean, text, multiselect]
 *               category:
 *                 type: string
 *               subCategory:
 *                 type: string
 *               options:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Option'
 *               issueWeightages:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/IssueWeightage'
 *               ageGroup:
 *                 type: object
 *               difficultyLevel:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Question created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 * 
 *   get:
 *     summary: Get questions with pagination and filters
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: questionType
 *         schema:
 *           type: string
 *           enum: [mcq, rating, boolean, text, multiselect]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: difficultyLevel
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *       - in: query
 *         name: issueId
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated tags
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, usageCount, category]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Paginated questions list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Question'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 * 
 * /api/v1/questions/by-category:
 *   get:
 *     summary: Get questions by category
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Questions in category
 * 
 * /api/v1/questions/by-issue:
 *   get:
 *     summary: Get questions by issue ID
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: issueId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Questions for issue
 * 
 * /api/v1/questions/random:
 *   get:
 *     summary: Get random questions for assessment
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: count
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: difficultyLevel
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Random questions
 * 
 * /api/v1/questions/stats:
 *   get:
 *     summary: Get questions statistics (Admin/Moderator only)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Questions statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/QuestionStats'
 * 
 * /api/v1/questions/{id}:
 *   get:
 *     summary: Get question by ID
 *     tags: [Questions]
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
 *         description: Question retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 *   patch:
 *     summary: Update question (Admin/Moderator only)
 *     tags: [Questions]
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
 *             properties:
 *               questionText:
 *                 type: string
 *               options:
 *                 type: array
 *               issueWeightages:
 *                 type: array
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Question updated successfully
 * 
 *   delete:
 *     summary: Delete question (Admin only)
 *     tags: [Questions]
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
 *         description: Question deleted successfully
 * 
 * /api/v1/questions/{id}/toggle-active:
 *   patch:
 *     summary: Toggle question active status (Admin/Moderator only)
 *     tags: [Questions]
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
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Active status toggled successfully
 */

module.exports = {};
