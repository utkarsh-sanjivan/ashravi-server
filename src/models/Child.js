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
    max: [18, 'Age must be at most 18']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    lowercase: true,
    trim: true
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
    required: [true, 'Parent ID is required']
  },
  courseIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate for education data
childSchema.virtual('educationData', {
  ref: 'ChildEducation',
  localField: '_id',
  foreignField: 'childId',
  justOne: true
});

// Virtual populate for nutrition data
childSchema.virtual('nutritionData', {
  ref: 'ChildNutrition',
  localField: '_id',
  foreignField: 'childId',
  justOne: true
});

childSchema.index({ parentId: 1, createdAt: -1 });
childSchema.index({ name: 'text' });

// Cascade delete education and nutrition records when child is deleted
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

// Cascade delete for multiple children
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
