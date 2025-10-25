const mongoose = require('mongoose');

const pdfMetadataSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'PDF filename is required'],
    trim: true
  },
  url: {
    type: String,
    required: [true, 'PDF URL is required'],
    trim: true
  },
  size: {
    type: Number,
    required: [true, 'PDF size is required'],
    min: [0, 'File size must be non-negative']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: [true, 'Uploader reference is required']
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Video title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  videoUrl: {
    type: String,
    required: [true, 'Video URL is required']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [0, 'Duration must be positive']
  },
  order: {
    type: Number,
    required: [true, 'Order is required'],
    min: 0
  },
  isFree: {
    type: Boolean,
    default: false
  },
  thumbnail: String
}, { _id: true });

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Test title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  passingScore: {
    type: Number,
    default: 70,
    min: 0,
    max: 100
  },
  duration: {
    type: Number,
    default: 30
  },
  order: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: true });

const sectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Section title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    required: [true, 'Order is required'],
    min: 0
  },
  videos: {
    type: [videoSchema],
    default: []
  },
  test: testSchema,
  pdfs: {
    type: [pdfMetadataSchema],
    default: [],
    validate: {
      validator: function(pdfs) {
        return pdfs.length <= 3;
      },
      message: 'A section cannot have more than 3 PDF files'
    }
  },
  isLocked: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
    index: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  headline: {
    type: String,
    trim: true,
    maxlength: [500, 'Headline cannot exceed 500 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [50, 'Description must be at least 50 characters']
  },
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    trim: true,
    maxlength: [300, 'Short description cannot exceed 300 characters']
  },
  thumbnail: {
    type: String,
    required: [true, 'Thumbnail is required']
  },
  coverImage: String,
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    index: true
  },
  subCategory: {
    type: String,
    trim: true
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
    lowercase: true
  },
  language: {
    type: String,
    default: 'English',
    trim: true
  },
  textLanguage: {
    type: String,
    default: 'english',
    lowercase: true,
    select: false
  },
  price: {
    amount: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true
    },
    discountedPrice: {
      type: Number,
      min: 0
    }
  },
  sections: {
    type: [sectionSchema],
    default: [],
    validate: {
      validator: (sections) => sections.length > 0,
      message: 'Course must have at least one section'
    }
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instructor'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  prerequisites: [{
    type: String,
    trim: true
  }],
  learningOutcomes: [{
    type: String,
    required: true,
    trim: true
  }],
  targetAudience: [{
    type: String,
    trim: true
  }],
  isPurchased: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: false,
    index: true
  },
  publishedAt: Date,
  enrollmentCount: {
    type: Number,
    default: 0,
    min: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  metadata: {
    totalDuration: {
      type: Number,
      default: 0
    },
    totalVideos: {
      type: Number,
      default: 0
    },
    totalTests: {
      type: Number,
      default: 0
    },
    lastUpdated: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

courseSchema.virtual('totalSections').get(function() {
  return this.sections ? this.sections.length : 0;
});

courseSchema.virtual('effectivePrice').get(function() {
  return this.price.discountedPrice || this.price.amount;
});

courseSchema.virtual('hasDiscount').get(function() {
  return this.price.discountedPrice && this.price.discountedPrice < this.price.amount;
});

courseSchema.index(
  { title: 'text', description: 'text', tags: 'text' },
  {
    default_language: 'english',
    language_override: 'textLanguage'
  }
);
courseSchema.index({ category: 1, isPublished: 1, createdAt: -1 });
courseSchema.index({ 'price.amount': 1, isPublished: 1 });

courseSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  if (this.isModified('sections')) {
    let totalDuration = 0;
    let totalVideos = 0;
    let totalTests = 0;
    this.sections.forEach(section => {
      if (section.videos) {
        totalVideos += section.videos.length;
        section.videos.forEach(video => {
          totalDuration += video.duration || 0;
        });
      }
      if (section.test) {
        totalTests++;
      }
    });
    this.metadata = {
      totalDuration,
      totalVideos,
      totalTests,
      lastUpdated: new Date()
    };
  }
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Course', courseSchema);
