const Joi = require('joi');

const socialLinksSchema = Joi.object({
  website: Joi.string().uri(),
  linkedin: Joi.string().uri(),
  twitter: Joi.string().uri(),
  youtube: Joi.string().uri()
}).optional();

const instructorValidation = {
  create: Joi.object({
    firstName: Joi.string().max(100).required(),
    lastName: Joi.string().max(100).allow(''),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().allow('', null),
    bio: Joi.string().max(2000).allow(''),
    profileImage: Joi.string().uri().allow(''),
    expertiseAreas: Joi.array().items(Joi.string().max(100)).max(10),
    yearsOfExperience: Joi.number().min(0).max(100),
    socialLinks: socialLinksSchema,
    isActive: Joi.boolean()
  }),
  update: Joi.object({
    firstName: Joi.string().max(100),
    lastName: Joi.string().max(100).allow(''),
    phoneNumber: Joi.string().allow('', null),
    bio: Joi.string().max(2000).allow(''),
    profileImage: Joi.string().uri().allow(''),
    expertiseAreas: Joi.array().items(Joi.string().max(100)).max(10),
    yearsOfExperience: Joi.number().min(0).max(100),
    socialLinks: socialLinksSchema,
    isActive: Joi.boolean()
  }),
  query: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20),
    search: Joi.string(),
    expertise: Joi.alternatives().try(
      Joi.string(),
      Joi.array().items(Joi.string())
    ),
    isActive: Joi.boolean(),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'firstName', 'lastName').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),
  idParam: Joi.object({
    id: Joi.string().length(24).required()
  })
};

module.exports = instructorValidation;
