const mongoose = require('mongoose');

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
    max: [18, 'Age must not exceed 18']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    lowercase: true,
    enum: {
      values: ['male', 'female', 'other'],
      message: 'Gender must be male, female, or other'
    }
  },
  grade: {
    type: String,
    required: [true, 'Grade is required'],
    uppercase: true,
    trim: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Parent ID is required'],
    index: true
  },
  courseIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }]
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance optimization
childSchema.index({ parentId: 1, createdAt: -1 });
childSchema.index({ name: 'text' });

module.exports = mongoose.model('Child', childSchema);
