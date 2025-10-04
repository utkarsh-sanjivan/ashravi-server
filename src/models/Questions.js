const mongoose = require('mongoose');

const issueWeightageSchema = new mongoose.Schema({
  issueId: {
    type: String,
    required: [true, 'Issue ID is required'],
    trim: true
  },
  issueName: {
    type: String,
    required: [true, 'Issue name is required'],
    trim: true
  },
  weightage: {
    type: Number,
    required: [true, 'Weightage is required'],
    min: [0, 'Weightage must be at least 0'],
    max: [100, 'Weightage cannot exceed 100']
  }
}, { _id: false });

const optionSchema = new mongoose.Schema({
  optionText: {
    type: String,
    required: [true, 'Option text is required'],
    trim: true
  },
  optionValue: {
    type: Number,
    required: [true, 'Option value is required']
  },
  isCorrect: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    minlength: [10, 'Question text must be at least 10 characters'],
    maxlength: [1000, 'Question text cannot exceed 1000 characters']
  },
  questionType: {
    type: String,
    required: [true, 'Question type is required'],
    enum: {
      values: ['mcq', 'rating', 'boolean', 'text', 'multiselect'],
      message: '{VALUE} is not a valid question type'
    },
    lowercase: true
  },
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
  options: {
    type: [optionSchema],
    validate: {
      validator: function(options) {
        if (['mcq', 'multiselect'].includes(this.questionType)) {
          return options && options.length >= 2;
        }
        return true;
      },
      message: 'MCQ and multiselect questions must have at least 2 options'
    }
  },
  ratingScale: {
    min: {
      type: Number,
      default: 1
    },
    max: {
      type: Number,
      default: 5
    }
  },
  issueWeightages: {
    type: [issueWeightageSchema],
    required: [true, 'Issue weightages are required'],
    validate: {
      validator: (weightages) => weightages && weightages.length > 0,
      message: 'At least one issue weightage is required'
    }
  },
  ageGroup: {
    min: {
      type: Number,
      default: 0,
      min: [0, 'Minimum age cannot be negative']
    },
    max: {
      type: Number,
      default: 18,
      max: [18, 'Maximum age cannot exceed 18']
    }
  },
  difficultyLevel: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
    lowercase: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      maxlength: 500
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

questionSchema.virtual('totalWeightage').get(function() {
  if (!this.issueWeightages || this.issueWeightages.length === 0) return 0;
  return this.issueWeightages.reduce((sum, iw) => sum + iw.weightage, 0);
});

questionSchema.virtual('primaryIssue').get(function() {
  if (!this.issueWeightages || this.issueWeightages.length === 0) return null;
  return this.issueWeightages.reduce((max, iw) => 
    iw.weightage > max.weightage ? iw : max
  );
});

questionSchema.index({ questionText: 'text', category: 'text', tags: 'text' });
questionSchema.index({ category: 1, isActive: 1, createdAt: -1 });
questionSchema.index({ 'issueWeightages.issueId': 1, isActive: 1 });
questionSchema.index({ ageGroup: 1, difficultyLevel: 1 });

questionSchema.pre('save', function(next) {
  if (this.isModified('issueWeightages')) {
    const issueIds = this.issueWeightages.map(iw => iw.issueId);
    const uniqueIssueIds = new Set(issueIds);
    if (issueIds.length !== uniqueIssueIds.size) {
      return next(new Error('Duplicate issue IDs found in weightages'));
    }
  }
  next();
});

module.exports = mongoose.model('Question', questionSchema);
