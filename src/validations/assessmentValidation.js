const Joi = require('joi');

const assessmentValidation = {
  processAssessment: Joi.object({
    responses: Joi.array().items(
      Joi.object({
        questionId: Joi.string().length(24).required(),
        answer: Joi.number().required()
      })
    ).min(1).required(),
    childId: Joi.string().length(24).required(),
    method: Joi.string().valid('weighted_average', 't_score_non_weighted', 't_score_weighted').default('weighted_average')
  }),

  getAssessment: Joi.object({
    childId: Joi.string().length(24).required(),
    assessmentId: Joi.string().uuid().required()
  }),

  childIdParam: Joi.object({
    childId: Joi.string().length(24).required()
  }),

  assessmentIdParam: Joi.object({
    assessmentId: Joi.string().uuid().required()
  })
};

module.exports = assessmentValidation;
