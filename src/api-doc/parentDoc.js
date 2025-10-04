/**
 * @swagger
 * components:
 *   schemas:
 *     Parent:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 650f9598f1f3d2b99f5fe1e1
 *         name:
 *           type: string
 *           example: John Smith
 *         phoneNumber:
 *           type: string
 *           example: +1-555-123-4567
 *         emailAddress:
 *           type: string
 *           format: email
 *           example: john.smith@example.com
 *         city:
 *           type: string
 *           example: New York
 *         economicStatus:
 *           type: string
 *           example: Middle Class
 *         occupation:
 *           type: string
 *           example: Software Engineer
 *         childrenIds:
 *           type: array
 *           items:
 *             type: string
 *           example: ["650f9598f1f3d2b99f5feaa1", "650f9598f1f3d2b99f5feaa2"]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     ParentCreate:
 *       type: object
 *       required:
 *         - name
 *         - phoneNumber
 *         - emailAddress
 *         - city
 *         - economicStatus
 *         - occupation
 *       properties:
 *         name:
 *           type: string
 *           example: John Smith
 *         phoneNumber:
 *           type: string
 *           example: +1-555-123-4567
 *         emailAddress:
 *           type: string
 *           format: email
 *           example: john.smith@example.com
 *         city:
 *           type: string
 *           example: New York
 *         economicStatus:
 *           type: string
 *           example: Middle Class
 *         occupation:
 *           type: string
 *           example: Software Engineer
 * 
 *     ParentUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         emailAddress:
 *           type: string
 *           format: email
 *         city:
 *           type: string
 *         economicStatus:
 *           type: string
 *         occupation:
 *           type: string
 * 
 *     ChildOperation:
 *       type: object
 *       required:
 *         - childId
 *       properties:
 *         childId:
 *           type: string
 *           example: 650f9598f1f3d2b99f5feaa1
 * 
 * /api/v1/parents:
 *   post:
 *     summary: Create a new parent
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ParentCreate'
 *     responses:
 *       201:
 *         description: Parent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Parent created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Parent'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         description: Parent with this email already exists
 * 
 * /api/v1/parents/by-email:
 *   get:
 *     summary: Get parent by email address
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Parent email address
 *         example: john.smith@example.com
 *     responses:
 *       200:
 *         description: Parent retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 * 
 * /api/v1/parents/by-city:
 *   get:
 *     summary: Get parents by city
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *         description: City name
 *         example: New York
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
 *     responses:
 *       200:
 *         description: List of parents in the specified city
 * 
 * /api/v1/parents/all-children:
 *   get:
 *     summary: Get all children across all parents (Admin/Moderator only)
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all children
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 * 
 * /api/v1/parents/count:
 *   get:
 *     summary: Count total parents (Admin/Moderator only)
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total count of parents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 * 
 * /api/v1/parents/{id}:
 *   get:
 *     summary: Get parent by ID
 *     tags: [Parents]
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
 *         description: Parent retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 *   patch:
 *     summary: Update parent
 *     tags: [Parents]
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
 *             $ref: '#/components/schemas/ParentUpdate'
 *     responses:
 *       200:
 *         description: Parent updated successfully
 *       409:
 *         description: Email already in use
 * 
 *   delete:
 *     summary: Delete parent
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: cascade
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to delete all children as well
 *     responses:
 *       200:
 *         description: Parent deleted successfully
 *       400:
 *         description: Parent has children (enable cascade)
 * 
 * /api/v1/parents/{id}/children:
 *   get:
 *     summary: Get children for a specific parent
 *     tags: [Parents]
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
 *         description: List of children
 * 
 *   post:
 *     summary: Add child to parent
 *     tags: [Parents]
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
 *             $ref: '#/components/schemas/ChildOperation'
 *     responses:
 *       200:
 *         description: Child added successfully
 * 
 *   delete:
 *     summary: Remove child from parent
 *     tags: [Parents]
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
 *             $ref: '#/components/schemas/ChildOperation'
 *     responses:
 *       200:
 *         description: Child removed successfully
 */

module.exports = {};
