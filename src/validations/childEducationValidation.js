const Joi = require('joi');

const subjectGradeSchema = Joi.object({
  subject: Joi.string().min(1).trim().required(),
  marks: Joi.number().min(0).max(100).required()
});

const educationRecordSchema = Joi.object({
  gradeYear: Joi.string().min(1).trim().required(),
  subjects: Joi.array().items(subjectGradeSchema).min(1).required(),
  recordedAt: Joi.date().optional()
});

const suggestionSchema = Joi.object({
  subject: Joi.string().min(1).trim().required(),
  suggestion: Joi.string().min(1).trim().required(),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  type: Joi.string().valid('performance', 'trend', 'consistency', 'strategic').default('performance'),
  createdAt: Joi.date().optional()
});

const childEducationValidation = {
  create: Joi.object({
    childId: Joi.string().length(24).required(),
    records: Joi.array().items(educationRecordSchema).default([]),
    suggestions: Joi.array().items(suggestionSchema).default([])
  }),

  update: Joi.object({
    records: Joi.array().items(educationRecordSchema),
    suggestions: Joi.array().items(suggestionSchema)
  }),

  addGradeRecord: Joi.object({
    gradeYear: Joi.string().min(1).trim().required(),
    subjects: Joi.array().items(subjectGradeSchema).min(1).required()
  }),

  childIdQuery: Joi.object({
    childId: Joi.string().length(24).required()
  }),

  idParam: Joi.object({
    id: Joi.string().length(24).required()
  })
};

module.exports = childEducationValidation;
