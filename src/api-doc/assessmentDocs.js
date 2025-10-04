/**
 * @swagger
 * components:
 *   schemas:
 *     AssessmentResponse:
 *       type: object
 *       required:
 *         - questionId
 *         - answer
 *       properties:
 *         questionId:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         answer:
 *           type: number
 *           example: 4
 * 
 *     IssueResult:
 *       type: object
 *       properties:
 *         issueId:
 *           type: string
 *           example: anxiety
 *         issueName:
 *           type: string
 *           example: Anxiety Disorder
 *         score:
 *           type: number
 *           example: 65.5
 *         normalizedScore:
 *           type: number
 *           example: 65.5
 *         tScore:
 *           type: number
 *           example: 58.3
 *         severity:
 *           type: string
 *           enum: [normal, borderline, clinical]
 *           example: borderline
 *         recommendedCourseId:
 *           type: string
 *         professionalReferral:
 *           type: object
 *           properties:
 *             required:
 *               type: boolean
 *             contactDetails:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 email:
 *                   type: string
 *                 address:
 *                   type: string
 * 
 *     AssessmentResult:
 *       type: object
 *       properties:
 *         assessmentId:
 *           type: string
 *           format: uuid
 *         method:
 *           type: string
 *           enum: [weighted_average, t_score_non_weighted, t_score_weighted]
 *         assessmentDate:
 *           type: string
 *           format: date-time
 *         conductedBy:
 *           type: string
 *         issues:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IssueResult'
 *         primaryConcerns:
 *           type: array
 *           items:
 *             type: string
 *         overallSummary:
 *           type: string
 *         recommendations:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *               text:
 *                 type: string
 *               priority:
 *                 type: string
 *         metadata:
 *           type: object
 *           properties:
 *             totalQuestions:
 *               type: integer
 *             confidence:
 *               type: number
 *             riskIndicators:
 *               type: array
 *               items:
 *                 type: string
 * 
 * /api/v1/assessments/process:
 *   post:
 *     summary: Process parent assessment for child
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - responses
 *               - childId
 *             properties:
 *               responses:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/AssessmentResponse'
 *               childId:
 *                 type: string
 *               method:
 *                 type: string
 *                 enum: [weighted_average, t_score_non_weighted, t_score_weighted]
 *                 default: weighted_average
 *     responses:
 *       200:
 *         description: Assessment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/AssessmentResult'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * /api/v1/assessments/child/{childId}:
 *   get:
 *     summary: Get all assessments for a child
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Child assessments retrieved successfully
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
 *                     $ref: '#/components/schemas/AssessmentResult'
 *                 count:
 *                   type: integer
 * 
 * /api/v1/assessments/child/{childId}/latest:
 *   get:
 *     summary: Get latest assessment for a child
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Latest assessment retrieved successfully
 *       404:
 *         description: No assessments found
 * 
 * /api/v1/assessments/child/{childId}/assessment/{assessmentId}:
 *   get:
 *     summary: Get specific assessment by ID
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Assessment retrieved successfully
 *       404:
 *         description: Assessment not found
 */

module.exports = {};
