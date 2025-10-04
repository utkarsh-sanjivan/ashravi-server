const Joi = require('joi');

const childValidation = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).trim().required(),
    age: Joi.number().integer().min(0).max(18).required(),
    gender: Joi.string().lowercase().trim().required(),
    grade: Joi.string().uppercase().trim().required(),
    parentId: Joi.string().length(24).required(),
    courseIds: Joi.array().items(Joi.string().length(24)).default([])
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(100).trim(),
    age: Joi.number().integer().min(0).max(18),
    gender: Joi.string().lowercase().trim(),
    grade: Joi.string().uppercase().trim(),
    courseIds: Joi.array().items(Joi.string().length(24))
  }),

  courseOperation: Joi.object({
    courseIds: Joi.array().items(Joi.string().length(24)).min(1).required()
  }),

  parentIdQuery: Joi.object({
    parentId: Joi.string().length(24).required(),
    limit: Joi.number().min(1).max(1000).default(100),
    skip: Joi.number().min(0).default(0),
    includeRelated: Joi.boolean().default(false)
  }),

  idParam: Joi.object({
    id: Joi.string().length(24).required()
  }),

  listQuery: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(20),
    skip: Joi.number().integer().min(0).default(0)
  })
};

module.exports = childValidation;
