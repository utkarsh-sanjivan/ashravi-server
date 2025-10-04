/**
 * @swagger
 * components:
 *   schemas:
 *     Child:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         age:
 *           type: integer
 *         gender:
 *           type: string
 *         grade:
 *           type: string
 *         parentId:
 *           type: string
 *         courseIds:
 *           type: array
 *           items:
 *             type: string
 *         educationData:
 *           $ref: '#/components/schemas/ChildEducation'
 *         nutritionData:
 *           $ref: '#/components/schemas/ChildNutrition'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     ChildSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         age:
 *           type: integer
 *         gender:
 *           type: string
 *         grade:
 *           type: string
 *         parentId:
 *           type: string
 *         courseCount:
 *           type: integer
 *         hasEducationData:
 *           type: boolean
 *         hasNutritionData:
 *           type: boolean
 *         education:
 *           type: object
 *           properties:
 *             recordCount:
 *               type: integer
 *             latestGrade:
 *               type: string
 *             currentAverage:
 *               type: number
 *             suggestionCount:
 *               type: integer
 *             highPrioritySuggestions:
 *               type: integer
 *         nutrition:
 *           type: object
 *           properties:
 *             recordCount:
 *               type: integer
 *             currentBMI:
 *               type: number
 *             recommendationCount:
 *               type: integer
 *             criticalRecommendations:
 *               type: integer
 * 
 * /api/v1/children:
 *   post:
 *     summary: Create a new child
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: initializeRelated
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Initialize empty education and nutrition records
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - age
 *               - gender
 *               - grade
 *               - parentId
 *             properties:
 *               name:
 *                 type: string
 *               age:
 *                 type: integer
 *               gender:
 *                 type: string
 *               grade:
 *                 type: string
 *               parentId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Child created successfully
 * 
 * /api/v1/children/by-parent:
 *   get:
 *     summary: Get children by parent ID
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: parentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: includeRelated
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include education and nutrition data
 *     responses:
 *       200:
 *         description: List of children with optional related data
 * 
 * /api/v1/children/{id}:
 *   get:
 *     summary: Get child by ID
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeRelated
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include education and nutrition data
 *     responses:
 *       200:
 *         description: Child retrieved successfully
 * 
 *   delete:
 *     summary: Delete child (cascades to education and nutrition)
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *         description: Parent ID to unlink child
 *     responses:
 *       200:
 *         description: Child and related data deleted successfully
 * 
 * /api/v1/children/{id}/summary:
 *   get:
 *     summary: Get child summary with education and nutrition insights
 *     tags: [Children]
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
 *         description: Child summary with insights
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ChildSummary'
 */

module.exports = {};
