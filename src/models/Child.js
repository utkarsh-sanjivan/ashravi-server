const mongoose = require('mongoose');

const assessmentResultSchema = new mongoose.Schema({
  assessmentId: {
    type: String,
    required: true,
    unique: true
  },
  method: {
    type: String,
    enum: ['weighted_average', 't_score_non_weighted', 't_score_weighted'],
    required: true
  },
  assessmentDate: {
    type: Date,
    default: Date.now
  },
  conductedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  issues: [{
    issueId: {
      type: String,
      required: true
    },
    issueName: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      required: true
    },
    normalizedScore: Number,
    tScore: Number,
    severity: {
      type: String,
      enum: ['normal', 'borderline', 'clinical'],
      required: true
    },
    recommendedCourseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    professionalReferral: {
      required: Boolean,
      contactDetails: {
        name: String,
        phone: String,
        alternatePhone: String,
        email: String,
        address: String
      }
    }
  }],
  primaryConcerns: [{
    type: String
  }],
  overallSummary: String,
  recommendations: [{
    category: String,
    text: String,
    priority: String
  }],
  metadata: {
    totalQuestions: Number,
    confidence: Number,
    riskIndicators: [String]
  }
}, { _id: false, timestamps: true });

const childSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [0, 'Age must be at least 0'],
    max: [18, 'Age must be at most 18']
  },
  gender: {
    type: String,
    lowercase: true,
    trim: true
  },
  grade: {
    type: String,
    uppercase: true,
    trim: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Parent ID is required']
  },
  courseIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  assessmentResults: [assessmentResultSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

childSchema.virtual('educationData', {
  ref: 'ChildEducation',
  localField: '_id',
  foreignField: 'childId',
  justOne: true
});

childSchema.virtual('nutritionData', {
  ref: 'ChildNutrition',
  localField: '_id',
  foreignField: 'childId',
  justOne: true
});

childSchema.virtual('latestAssessment').get(function() {
  if (!this.assessmentResults || this.assessmentResults.length === 0) {
    return null;
  }
  return this.assessmentResults[this.assessmentResults.length - 1];
});

childSchema.index({ parentId: 1, createdAt: -1 });
childSchema.index({ name: 'text' });
childSchema.index({ 'assessmentResults.assessmentId': 1 });

childSchema.pre('findOneAndDelete', async function(next) {
  try {
    const childId = this.getQuery()._id;
    if (childId) {
      const ChildEducation = mongoose.model('ChildEducation');
      const ChildNutrition = mongoose.model('ChildNutrition');
      await Promise.all([
        ChildEducation.deleteOne({ childId }),
        ChildNutrition.deleteOne({ childId })
      ]);
    }
    next();
  } catch (error) {
    next(error);
  }
});

childSchema.pre('deleteMany', async function(next) {
  try {
    const Child = mongoose.model('Child');
    const children = await Child.find(this.getFilter());
    const childIds = children.map(c => c._id);
    if (childIds.length > 0) {
      const ChildEducation = mongoose.model('ChildEducation');
      const ChildNutrition = mongoose.model('ChildNutrition');
      await Promise.all([
        ChildEducation.deleteMany({ childId: { $in: childIds } }),
        ChildNutrition.deleteMany({ childId: { $in: childIds } })
      ]);
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Child', childSchema);
