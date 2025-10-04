/**
 * @swagger
 * components:
 *   schemas:
 *     SubjectGrade:
 *       type: object
 *       required:
 *         - subject
 *         - marks
 *       properties:
 *         subject:
 *           type: string
 *           example: Mathematics
 *         marks:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 85
 * 
 *     EducationRecord:
 *       type: object
 *       required:
 *         - gradeYear
 *         - subjects
 *       properties:
 *         gradeYear:
 *           type: string
 *           example: Grade 10
 *         subjects:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SubjectGrade'
 *         recordedAt:
 *           type: string
 *           format: date-time
 *         gpa:
 *           type: number
 *           example: 3.5
 *         average:
 *           type: number
 *           example: 85.5
 * 
 *     Suggestion:
 *       type: object
 *       properties:
 *         subject:
 *           type: string
 *           example: Physics
 *         suggestion:
 *           type: string
 *           example: Focus on improving Physics. Consider additional practice sessions.
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *           example: high
 *         type:
 *           type: string
 *           enum: [performance, trend, consistency, strategic]
 *           example: performance
 *         createdAt:
 *           type: string
 *           format: date-time
 * 
 *     ChildEducation:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 650f9598f1f3d2b99f5fe1e1
 *         childId:
 *           type: string
 *           example: 650f9598f1f3d2b99f5feaa1
 *         records:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EducationRecord'
 *         suggestions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Suggestion'
 *         overallGpa:
 *           type: number
 *           example: 3.2
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     PerformanceAnalysis:
 *       type: object
 *       properties:
 *         childId:
 *           type: string
 *         hasData:
 *           type: boolean
 *         analysis:
 *           type: object
 *           properties:
 *             currentAverage:
 *               type: number
 *             trend:
 *               type: string
 *               enum: [improving, declining, stable]
 *             trendStrength:
 *               type: number
 *             subjectsNeedingAttention:
 *               type: array
 *               items:
 *                 type: string
 *             topPerformingSubjects:
 *               type: array
 *               items:
 *                 type: string
 *             overallGpa:
 *               type: number
 *             consistencyScore:
 *               type: number
 *         recordCount:
 *           type: integer
 *         latestGrade:
 *           type: string
 *         suggestions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Suggestion'
 * 
 * /api/v1/child-education:
 *   post:
 *     summary: Create new education record for a child
 *     tags: [Child Education]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - childId
 *             properties:
 *               childId:
 *                 type: string
 *               records:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/EducationRecord'
 *     responses:
 *       201:
 *         description: Education record created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         description: Record already exists for this child
 * 
 * /api/v1/child-education/by-child:
 *   get:
 *     summary: Get education record by child ID
 *     tags: [Child Education]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *     responses:
 *       200:
 *         description: Education record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ChildEducation'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * /api/v1/child-education/analysis:
 *   get:
 *     summary: Get performance analysis for a child
 *     tags: [Child Education]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *     responses:
 *       200:
 *         description: Performance analysis retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PerformanceAnalysis'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * /api/v1/child-education/add-grade:
 *   post:
 *     summary: Add grade record to child's education
 *     tags: [Child Education]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: childId
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
 *               - gradeYear
 *               - subjects
 *             properties:
 *               gradeYear:
 *                 type: string
 *                 example: Grade 10
 *               subjects:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/SubjectGrade'
 *     responses:
 *       200:
 *         description: Grade record added and suggestions updated
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 * 
 * /api/v1/child-education/regenerate-suggestions:
 *   post:
 *     summary: Regenerate intelligent suggestions for a child
 *     tags: [Child Education]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Suggestions regenerated successfully
 *       404:
 *         description: No education records found
 * 
 * /api/v1/child-education/{id}:
 *   get:
 *     summary: Get education record by ID
 *     tags: [Child Education]
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
 *         description: Education record retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 *   patch:
 *     summary: Update education record
 *     tags: [Child Education]
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
 *               records:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/EducationRecord'
 *               suggestions:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Suggestion'
 *     responses:
 *       200:
 *         description: Education record updated successfully
 * 
 *   delete:
 *     summary: Delete education record
 *     tags: [Child Education]
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
 *         description: Education record deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

module.exports = {};
