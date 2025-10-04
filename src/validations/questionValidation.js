const Joi = require('joi');

const issueWeightageSchema = Joi.object({
  issueId: Joi.string().required(),
  issueName: Joi.string().required(),
  weightage: Joi.number().min(0).max(100).required()
});

const optionSchema = Joi.object({
  optionText: Joi.string().required(),
  optionValue: Joi.number().required(),
  isCorrect: Joi.boolean().default(false)
});

const ratingScaleSchema = Joi.object({
  min: Joi.number().default(1),
  max: Joi.number().default(5)
});

const ageGroupSchema = Joi.object({
  min: Joi.number().min(0).default(0),
  max: Joi.number().max(18).default(18)
});

const metadataSchema = Joi.object({
  createdBy: Joi.string().length(24),
  lastModifiedBy: Joi.string().length(24),
  notes: Joi.string().max(500)
});

const questionValidation = {
  create: Joi.object({
    questionText: Joi.string().min(10).max(1000).required(),
    questionType: Joi.string().valid('mcq', 'rating', 'boolean', 'text', 'multiselect').lowercase().required(),
    category: Joi.string().required(),
    subCategory: Joi.string(),
    options: Joi.array().items(optionSchema).when('questionType', {
      is: Joi.string().valid('mcq', 'multiselect'),
      then: Joi.array().min(2).required(),
      otherwise: Joi.array()
    }),
    ratingScale: ratingScaleSchema,
    issueWeightages: Joi.array().items(issueWeightageSchema).min(1).required(),
    ageGroup: ageGroupSchema,
    difficultyLevel: Joi.string().valid('easy', 'medium', 'hard').lowercase().default('medium'),
    tags: Joi.array().items(Joi.string()),
    isActive: Joi.boolean().default(true),
    metadata: metadataSchema
  }),

  update: Joi.object({
    questionText: Joi.string().min(10).max(1000),
    questionType: Joi.string().valid('mcq', 'rating', 'boolean', 'text', 'multiselect').lowercase(),
    category: Joi.string(),
    subCategory: Joi.string(),
    options: Joi.array().items(optionSchema),
    ratingScale: ratingScaleSchema,
    issueWeightages: Joi.array().items(issueWeightageSchema).min(1),
    ageGroup: ageGroupSchema,
    difficultyLevel: Joi.string().valid('easy', 'medium', 'hard').lowercase(),
    tags: Joi.array().items(Joi.string()),
    isActive: Joi.boolean(),
    metadata: metadataSchema
  }),

  query: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20),
    category: Joi.string(),
    questionType: Joi.string().valid('mcq', 'rating', 'boolean', 'text', 'multiselect'),
    isActive: Joi.boolean(),
    difficultyLevel: Joi.string().valid('easy', 'medium', 'hard'),
    issueId: Joi.string(),
    tags: Joi.alternatives().try(
      Joi.string(),
      Joi.array().items(Joi.string())
    ),
    ageMin: Joi.number().min(0).max(18),
    ageMax: Joi.number().min(0).max(18),
    search: Joi.string(),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'usageCount', 'category').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  categoryQuery: Joi.object({
    category: Joi.string().required(),
    limit: Joi.number().min(1).max(1000).default(100),
    activeOnly: Joi.boolean().default(true)
  }),

  issueQuery: Joi.object({
    issueId: Joi.string().required(),
    limit: Joi.number().min(1).max(1000).default(100)
  }),

  toggleActive: Joi.object({
    isActive: Joi.boolean().required()
  }),

  idParam: Joi.object({
    id: Joi.string().length(24).required()
  })
};

module.exports = questionValidation;
