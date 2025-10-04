/**
 * @swagger
 * components:
 *   schemas:
 *     Child:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 650f9598f1f3d2b99f5fe1e1
 *         name:
 *           type: string
 *           example: John Doe
 *         age:
 *           type: integer
 *           minimum: 0
 *           maximum: 18
 *           example: 10
 *         gender:
 *           type: string
 *           example: male
 *         grade:
 *           type: string
 *           example: 5TH
 *         parentId:
 *           type: string
 *           example: 650f9598f1f3d2b99f5fedf0
 *         courseIds:
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
 *     ChildCreate:
 *       type: object
 *       required:
 *         - name
 *         - age
 *         - gender
 *         - grade
 *         - parentId
 *       properties:
 *         name:
 *           type: string
 *           example: John Doe
 *         age:
 *           type: integer
 *           example: 10
 *         gender:
 *           type: string
 *           example: male
 *         grade:
 *           type: string
 *           example: 5TH
 *         parentId:
 *           type: string
 *           example: 650f9598f1f3d2b99f5fedf0
 *         courseIds:
 *           type: array
 *           items:
 *             type: string
 * 
 * /api/v1/children:
 *   post:
 *     summary: Create a new child
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChildCreate'
 *     responses:
 *       201:
 *         description: Child created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
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
 *     responses:
 *       200:
 *         description: List of children
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 * 
 * /api/v1/children/count:
 *   get:
 *     summary: Count children by parent ID
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: parentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Count of children
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
 *     responses:
 *       200:
 *         description: Child retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 *   patch:
 *     summary: Update child
 *     tags: [Children]
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
 *               name:
 *                 type: string
 *               age:
 *                 type: integer
 *               gender:
 *                 type: string
 *               grade:
 *                 type: string
 *     responses:
 *       200:
 *         description: Child updated successfully
 * 
 *   delete:
 *     summary: Delete child
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
 *     responses:
 *       200:
 *         description: Child deleted successfully
 * 
 * /api/v1/children/{id}/summary:
 *   get:
 *     summary: Get child summary
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
 *         description: Child summary retrieved
 * 
 * /api/v1/children/{id}/courses:
 *   post:
 *     summary: Add courses to child
 *     tags: [Children]
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
 *               courseIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Courses added successfully
 */

module.exports = {};
