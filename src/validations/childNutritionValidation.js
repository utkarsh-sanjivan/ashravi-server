const Joi = require('joi');

const eatingHabitsSchema = Joi.object({
  eatsBreakfastRegularly: Joi.boolean().required(),
  drinksEnoughWater: Joi.boolean().required(),
  eatsFruitsDaily: Joi.boolean().required(),
  eatsVegetablesDaily: Joi.boolean().required(),
  limitsJunkFood: Joi.boolean().required(),
  hasRegularMealTimes: Joi.boolean().required(),
  enjoysVarietyOfFoods: Joi.boolean().required(),
  eatsAppropriatePortions: Joi.boolean().required()
});

const physicalMeasurementSchema = Joi.object({
  heightCm: Joi.number().min(1).max(250).required(),
  weightKg: Joi.number().min(1).max(200).required(),
  measurementDate: Joi.date().optional()
});

const nutritionRecordSchema = Joi.object({
  physicalMeasurement: physicalMeasurementSchema.required(),
  eatingHabits: eatingHabitsSchema.required(),
  recordedAt: Joi.date().optional(),
  notes: Joi.string().max(500).optional()
});

const recommendationSchema = Joi.object({
  category: Joi.string().valid('diet', 'exercise', 'habits', 'medical').required(),
  recommendation: Joi.string().min(1).max(500).required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  targetArea: Joi.string().required(),
  createdAt: Joi.date().optional()
});

const childNutritionValidation = {
  create: Joi.object({
    childId: Joi.string().length(24).required(),
    records: Joi.array().items(nutritionRecordSchema).default([]),
    recommendations: Joi.array().items(recommendationSchema).default([])
  }),

  update: Joi.object({
    records: Joi.array().items(nutritionRecordSchema),
    recommendations: Joi.array().items(recommendationSchema)
  }),

  addEntry: nutritionRecordSchema,

  childIdQuery: Joi.object({
    childId: Joi.string().length(24).required()
  }),

  idParam: Joi.object({
    id: Joi.string().length(24).required()
  })
};

module.exports = childNutritionValidation;
