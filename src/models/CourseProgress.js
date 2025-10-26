const mongoose = require('mongoose');

const videoProgressSchema = new mongoose.Schema({
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  watchedDuration: {
    type: Number,
    default: 0,
    min: 0
  },
  totalDuration: {
    type: Number,
    required: true,
    min: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  lastWatchedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const testProgressSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  attempts: {
    type: Number,
    default: 0,
    min: 0
  },
  bestScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isPassed: {
    type: Boolean,
    default: false
  },
  lastAttemptAt: Date,
  completedAt: Date
}, { _id: false });

const sectionProgressSchema = new mongoose.Schema({
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  videos: {
    type: [videoProgressSchema],
    default: []
  },
  test: testProgressSchema,
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: Date
}, { _id: false });

const courseProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required'],
    index: true
  },
  sections: {
    type: [sectionProgressSchema],
    default: []
  },
  overallProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  startedAt: Date,
  completedAt: Date,
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: '',
    trim: true,
    maxlength: 5000
  },
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateIssuedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

courseProgressSchema.virtual('completedVideos').get(function() {
  let count = 0;
  this.sections.forEach(section => {
    if (section.videos) {
      count += section.videos.filter(v => v.isCompleted).length;
    }
  });
  return count;
});

courseProgressSchema.virtual('completedTests').get(function() {
  let count = 0;
  this.sections.forEach(section => {
    if (section.test && section.test.isPassed) {
      count++;
    }
  });
  return count;
});

courseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });
courseProgressSchema.index({ userId: 1, updatedAt: -1 });
courseProgressSchema.index({ courseId: 1, isCompleted: 1 });

module.exports = mongoose.model('CourseProgress', courseProgressSchema);
