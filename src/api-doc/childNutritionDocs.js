/**
 * @swagger
 * components:
 *   schemas:
 *     EatingHabits:
 *       type: object
 *       required:
 *         - eatsBreakfastRegularly
 *         - drinksEnoughWater
 *         - eatsFruitsDaily
 *         - eatsVegetablesDaily
 *         - limitsJunkFood
 *         - hasRegularMealTimes
 *         - enjoysVarietyOfFoods
 *         - eatsAppropriatePor tions
 *       properties:
 *         eatsBreakfastRegularly:
 *           type: boolean
 *           example: true
 *         drinksEnoughWater:
 *           type: boolean
 *           example: true
 *         eatsFruitsDaily:
 *           type: boolean
 *           example: false
 *         eatsVegetablesDaily:
 *           type: boolean
 *           example: true
 *         limitsJunkFood:
 *           type: boolean
 *           example: false
 *         hasRegularMealTimes:
 *           type: boolean
 *           example: true
 *         enjoysVarietyOfFoods:
 *           type: boolean
 *           example: true
 *         eatsAppropriatePor tions:
 *           type: boolean
 *           example: true
 * 
 *     PhysicalMeasurement:
 *       type: object
 *       required:
 *         - heightCm
 *         - weightKg
 *       properties:
 *         heightCm:
 *           type: number
 *           minimum: 1
 *           maximum: 250
 *           example: 140
 *         weightKg:
 *           type: number
 *           minimum: 1
 *           maximum: 200
 *           example: 35
 *         measurementDate:
 *           type: string
 *           format: date-time
 *         bmi:
 *           type: number
 *           example: 17.9
 *         bmiCategory:
 *           type: string
 *           enum: [underweight, normal_weight, overweight, obese]
 *           example: normal_weight
 * 
 *     NutritionRecord:
 *       type: object
 *       required:
 *         - physicalMeasurement
 *         - eatingHabits
 *       properties:
 *         physicalMeasurement:
 *           $ref: '#/components/schemas/PhysicalMeasurement'
 *         eatingHabits:
 *           $ref: '#/components/schemas/EatingHabits'
 *         recordedAt:
 *           type: string
 *           format: date-time
 *         notes:
 *           type: string
 *           maxLength: 500
 *           example: Child is doing well with current diet plan
 *         healthScore:
 *           type: number
 *           example: 82.5
 * 
 *     NutritionRecommendation:
 *       type: object
 *       properties:
 *         category:
 *           type: string
 *           enum: [diet, exercise, habits, medical]
 *           example: diet
 *         recommendation:
 *           type: string
 *           example: Include at least 5 servings of fruits and vegetables daily
 *         priority:
 *           type: string
 *           enum: [low, medium, high, critical]
 *           example: high
 *         targetArea:
 *           type: string
 *           example: Fruits & Vegetables
 *         createdAt:
 *           type: string
 *           format: date-time
 * 
 *     ChildNutrition:
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
 *             $ref: '#/components/schemas/NutritionRecord'
 *         recommendations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/NutritionRecommendation'
 *         currentBmi:
 *           type: number
 *           example: 17.9
 *         currentHealthScore:
 *           type: number
 *           example: 82.5
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     NutritionAnalysis:
 *       type: object
 *       properties:
 *         childId:
 *           type: string
 *         hasData:
 *           type: boolean
 *         analysis:
 *           type: object
 *           properties:
 *             currentBMI:
 *               type: number
 *             bmiCategory:
 *               type: string
 *             healthScore:
 *               type: number
 *             healthyHabitsScore:
 *               type: number
 *             isHealthyWeight:
 *               type: boolean
 *         recordCount:
 *           type: integer
 *         latestMeasurement:
 *           $ref: '#/components/schemas/PhysicalMeasurement'
 *         recommendations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/NutritionRecommendation'
 * 
 * /api/v1/child-nutrition:
 *   post:
 *     summary: Create new nutrition record for a child
 *     tags: [Child Nutrition]
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
 *                   $ref: '#/components/schemas/NutritionRecord'
 *     responses:
 *       201:
 *         description: Nutrition record created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         description: Record already exists for this child
 * 
 * /api/v1/child-nutrition/by-child:
 *   get:
 *     summary: Get nutrition record by child ID
 *     tags: [Child Nutrition]
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
 *         description: Nutrition record retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * /api/v1/child-nutrition/analysis:
 *   get:
 *     summary: Get nutrition analysis for a child
 *     tags: [Child Nutrition]
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
 *         description: Nutrition analysis retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/NutritionAnalysis'
 * 
 * /api/v1/child-nutrition/add-entry:
 *   post:
 *     summary: Add nutrition entry to child's record
 *     tags: [Child Nutrition]
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
 *             $ref: '#/components/schemas/NutritionRecord'
 *     responses:
 *       200:
 *         description: Nutrition entry added and recommendations updated
 * 
 * /api/v1/child-nutrition/regenerate-recommendations:
 *   post:
 *     summary: Regenerate intelligent recommendations for a child
 *     tags: [Child Nutrition]
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
 *         description: Recommendations regenerated successfully
 * 
 * /api/v1/child-nutrition/{id}:
 *   get:
 *     summary: Get nutrition record by ID
 *     tags: [Child Nutrition]
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
 *         description: Nutrition record retrieved successfully
 * 
 *   patch:
 *     summary: Update nutrition record
 *     tags: [Child Nutrition]
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
 *                   $ref: '#/components/schemas/NutritionRecord'
 *     responses:
 *       200:
 *         description: Nutrition record updated successfully
 * 
 *   delete:
 *     summary: Delete nutrition record
 *     tags: [Child Nutrition]
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
 *         description: Nutrition record deleted successfully
 */

module.exports = {};
