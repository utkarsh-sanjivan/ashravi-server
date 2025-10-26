const Joi = require('joi');

const pdfSchema = Joi.object({
  filename: Joi.string().required(),
  url: Joi.string().uri().required(),
  size: Joi.number().min(0).required(),
  uploadedBy: Joi.string().length(24)
});

const videoSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow(''),
  videoUrl: Joi.string().uri().required(),
  duration: Joi.number().min(0).required(),
  order: Joi.number().min(0).required(),
  isFree: Joi.boolean().default(false),
  thumbnail: Joi.string().uri().allow('')
});

const testSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow(''),
  questions: Joi.array().items(Joi.string().length(24)),
  passingScore: Joi.number().min(0).max(100).default(70),
  duration: Joi.number().min(0).default(30),
  order: Joi.number().min(0).required()
});

const sectionSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow(''),
  order: Joi.number().min(0).required(),
  videos: Joi.array().items(videoSchema).default([]),
  test: testSchema,
  pdfs: Joi.array().max(3).items(pdfSchema).messages({
    'array.max': 'A section cannot have more than 3 PDFs'
  }),
  isLocked: Joi.boolean().default(false)
});

const courseValidation = {
  create: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    headline: Joi.string().max(500),
    description: Joi.string().min(50).required(),
    shortDescription: Joi.string().max(300).required(),
    thumbnail: Joi.string().uri().required(),
    coverImage: Joi.string().uri(),
    category: Joi.string().required(),
    subCategory: Joi.string(),
    level: Joi.string().valid('beginner', 'intermediate', 'advanced').default('beginner'),
    language: Joi.string().default('English'),
    price: Joi.object({
      amount: Joi.number().min(0).required(),
      currency: Joi.string().default('USD'),
      discountedPrice: Joi.number().min(0)
    }).required(),
    sections: Joi.array().items(sectionSchema).min(1).required(),
    instructor: Joi.string().length(24),
    tags: Joi.array().items(Joi.string()),
    prerequisites: Joi.array().items(Joi.string()),
    learningOutcomes: Joi.array().items(Joi.string()).min(1).required(),
    targetAudience: Joi.array().items(Joi.string()),
    isPublished: Joi.boolean().default(false)
  }),
  update: Joi.object({
    title: Joi.string().min(5).max(200),
    headline: Joi.string().max(500),
    description: Joi.string().min(50),
    shortDescription: Joi.string().max(300),
    thumbnail: Joi.string().uri(),
    coverImage: Joi.string().uri(),
    category: Joi.string(),
    subCategory: Joi.string(),
    level: Joi.string().valid('beginner', 'intermediate', 'advanced'),
    language: Joi.string(),
    price: Joi.object({
      amount: Joi.number().min(0),
      currency: Joi.string(),
      discountedPrice: Joi.number().min(0)
    }),
    sections: Joi.array().items(sectionSchema),
    tags: Joi.array().items(Joi.string()),
    prerequisites: Joi.array().items(Joi.string()),
    learningOutcomes: Joi.array().items(Joi.string()),
    targetAudience: Joi.array().items(Joi.string()),
    isPublished: Joi.boolean()
  }),
  query: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20),
    category: Joi.string(),
    level: Joi.string().valid('beginner', 'intermediate', 'advanced'),
    isPublished: Joi.boolean(),
    instructor: Joi.string().length(24),
    tags: Joi.alternatives().try(
      Joi.string(),
      Joi.array().items(Joi.string())
    ),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0),
    search: Joi.string(),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'enrollmentCount', 'title').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),
  updateVideoProgress: Joi.object({
    sectionId: Joi.string().length(24).required(),
    videoId: Joi.string().length(24).required(),
    watchedDuration: Joi.number().min(0).required(),
    totalDuration: Joi.number().min(0).required()
  }),
  updateTestProgress: Joi.object({
    sectionId: Joi.string().length(24).required(),
    testId: Joi.string().length(24).required(),
    score: Joi.number().min(0).max(100).required(),
    passingScore: Joi.number().min(0).max(100).default(70)
  }),
  updateCourseNotes: Joi.object({
    notes: Joi.string().allow('').max(5000).required()
  }),
  addPdfs: Joi.object({
    pdfs: Joi.array().min(1).max(3).required().items(
      Joi.object({
        filename: Joi.string().required(),
        url: Joi.string().uri().required(),
        size: Joi.number().min(0).required()
      })
    ).messages({
      'array.min': 'At least one PDF is required',
      'array.max': 'Cannot add more than 3 PDFs at once',
      'any.required': 'PDFs array is required'
    })
  }),
  sectionPdfParams: Joi.object({
    courseId: Joi.string().length(24).required(),
    sectionId: Joi.string().length(24).required()
  }),
  removePdfParams: Joi.object({
    courseId: Joi.string().length(24).required(),
    sectionId: Joi.string().length(24).required(),
    pdfId: Joi.string().length(24).required()
  }),
  idParam: Joi.object({
    id: Joi.string().length(24).required()
  }),
  slugParam: Joi.object({
    slug: Joi.string().required()
  })
};

module.exports = courseValidation;
