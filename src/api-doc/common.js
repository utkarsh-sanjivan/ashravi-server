/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: |
 *         JWT token for authentication. Include the token in the Authorization header as:
 *         `Authorization: Bearer <token>`
 *   
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: Validation error
 *         message:
 *           type: string
 *           example: Invalid email format
 *         code:
 *           type: string
 *           example: VALIDATION_ERROR
 *         details:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 example: email
 *               message:
 *                 type: string
 *                 example: Email is required
 *         requestId:
 *           type: string
 *           example: 550e8400-e29b-41d4-a716-446655440000
 *     
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Operation completed successfully
 *         data:
 *           type: object
 *     
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         total:
 *           type: integer
 *           example: 100
 *         totalPages:
 *           type: integer
 *           example: 10
 *         hasNextPage:
 *           type: boolean
 *           example: true
 *         hasPreviousPage:
 *           type: boolean
 *           example: false
 *   
 *   responses:
 *     BadRequest:
 *       description: Bad request - Invalid input or validation error
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     
 *     Unauthorized:
 *       description: Unauthorized - Authentication required
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     
 *     Forbidden:
 *       description: Forbidden - Insufficient permissions
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     
 *     NotFound:
 *       description: Resource not found
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     
 *     TooManyRequests:
 *       description: Too many requests - Rate limit exceeded
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     
 *     InternalServerError:
 *       description: Internal server error
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication and profile management
 *   - name: Users
 *     description: User management operations (admin/moderator)
 */

module.exports = {};
