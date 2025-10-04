const mongoose = require('mongoose');

const subjectGradeSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true
  },
  marks: {
    type: Number,
    required: [true, 'Marks are required'],
    min: [0, 'Marks must be at least 0'],
    max: [100, 'Marks cannot exceed 100']
  }
}, { _id: false });

const educationRecordSchema = new mongoose.Schema({
  gradeYear: {
    type: String,
    required: [true, 'Grade year is required'],
    trim: true
  },
  subjects: {
    type: [subjectGradeSchema],
    required: true,
    validate: {
      validator: (v) => v && v.length > 0,
      message: 'At least one subject is required'
    }
  },
  recordedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

educationRecordSchema.virtual('gpa').get(function() {
  if (!this.subjects || this.subjects.length === 0) return 0;
  const totalGpa = this.subjects.reduce((sum, s) => sum + marksToGpa(s.marks), 0);
  return Math.round((totalGpa / this.subjects.length) * 100) / 100;
});

educationRecordSchema.virtual('average').get(function() {
  if (!this.subjects || this.subjects.length === 0) return 0;
  const total = this.subjects.reduce((sum, s) => sum + s.marks, 0);
  return Math.round((total / this.subjects.length) * 100) / 100;
});

const suggestionSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  suggestion: {
    type: String,
    required: [true, 'Suggestion text is required'],
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  type: {
    type: String,
    enum: ['performance', 'trend', 'consistency', 'strategic'],
    default: 'performance'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const childEducationSchema = new mongoose.Schema({
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: [true, 'Child ID is required'],
    index: true
  },
  records: {
    type: [educationRecordSchema],
    default: []
  },
  suggestions: {
    type: [suggestionSchema],
    default: []
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

childEducationSchema.index({ childId: 1, updatedAt: -1 });

childEducationSchema.virtual('latestRecord').get(function() {
  return this.records && this.records.length > 0 
    ? this.records[this.records.length - 1] 
    : null;
});

childEducationSchema.virtual('overallGpa').get(function() {
  if (!this.records || this.records.length === 0) return 0;
  const totalGpa = this.records.reduce((sum, r) => sum + r.gpa, 0);
  return Math.round((totalGpa / this.records.length) * 100) / 100;
});

childEducationSchema.virtual('highPrioritySuggestions').get(function() {
  return this.suggestions.filter(s => s.priority === 'high');
});

/**
 * Convert marks to GPA on 4.0 scale
 */
function marksToGpa(marks) {
  if (marks >= 90) return 4.0;
  if (marks >= 80) return 3.0;
  if (marks >= 70) return 2.0;
  if (marks >= 60) return 1.0;
  return 0.0;
}

module.exports = mongoose.model('ChildEducation', childEducationSchema);
