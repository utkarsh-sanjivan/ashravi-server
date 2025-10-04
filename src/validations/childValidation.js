const Joi = require('joi');

const childValidation = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).trim().required(),
    age: Joi.number().integer().min(0).max(18).required(),
    gender: Joi.string().trim().required(),
    grade: Joi.string().trim().required(),
    parentId: Joi.string().length(24).required(),
    courseIds: Joi.array().items(Joi.string().length(24)).optional()
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(100).trim(),
    age: Joi.number().integer().min(0).max(18),
    gender: Joi.string().trim(),
    grade: Joi.string().trim(),
    courseIds: Joi.array().items(Joi.string().length(24))
  }),

  addCourses: Joi.object({
    courseIds: Joi.array().items(Joi.string().length(24)).min(1).required()
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
