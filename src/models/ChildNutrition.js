const mongoose = require('mongoose');

const eatingHabitsSchema = new mongoose.Schema({
  eatsBreakfastRegularly: { type: Boolean, required: true },
  drinksEnoughWater: { type: Boolean, required: true },
  eatsFruitsDaily: { type: Boolean, required: true },
  eatsVegetablesDaily: { type: Boolean, required: true },
  limitsJunkFood: { type: Boolean, required: true },
  hasRegularMealTimes: { type: Boolean, required: true },
  enjoysVarietyOfFoods: { type: Boolean, required: true },
  eatsAppropriatePortions: { type: Boolean, required: true }
}, { _id: false });

eatingHabitsSchema.virtual('healthyHabitsScore').get(function() {
  const positiveCount = [
    this.eatsBreakfastRegularly,
    this.drinksEnoughWater,
    this.eatsFruitsDaily,
    this.eatsVegetablesDaily,
    this.limitsJunkFood,
    this.hasRegularMealTimes,
    this.enjoysVarietyOfFoods,
    this.eatsAppropriatePortions
  ].filter(Boolean).length;
  
  return Math.round((positiveCount / 8) * 1000) / 10;
});

const physicalMeasurementSchema = new mongoose.Schema({
  heightCm: {
    type: Number,
    required: [true, 'Height is required'],
    min: [1, 'Height must be positive'],
    max: [250, 'Height cannot exceed 250cm']
  },
  weightKg: {
    type: Number,
    required: [true, 'Weight is required'],
    min: [1, 'Weight must be positive'],
    max: [200, 'Weight cannot exceed 200kg']
  },
  measurementDate: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

physicalMeasurementSchema.virtual('bmi').get(function() {
  const heightInMeters = this.heightCm / 100;
  return Math.round((this.weightKg / (heightInMeters * heightInMeters)) * 10) / 10;
});

physicalMeasurementSchema.virtual('bmiCategory').get(function() {
  const bmi = this.bmi;
  if (bmi < 16) return 'underweight';
  if (bmi < 25) return 'normal_weight';
  if (bmi < 30) return 'overweight';
  return 'obese';
});

const nutritionRecordSchema = new mongoose.Schema({
  physicalMeasurement: {
    type: physicalMeasurementSchema,
    required: [true, 'Physical measurement is required']
  },
  eatingHabits: {
    type: eatingHabitsSchema,
    required: [true, 'Eating habits are required']
  },
  recordedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, { _id: false });

nutritionRecordSchema.virtual('healthScore').get(function() {
  const bmiHealthy = this.physicalMeasurement.bmiCategory === 'normal_weight';
  const bmiScore = bmiHealthy ? 100 : 70;
  const habitsScore = this.eatingHabits.healthyHabitsScore;
  return Math.round((bmiScore * 0.5 + habitsScore * 0.5) * 10) / 10;
});

const nutritionRecommendationSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['diet', 'exercise', 'habits', 'medical']
  },
  recommendation: {
    type: String,
    required: [true, 'Recommendation text is required'],
    minlength: [1, 'Recommendation cannot be empty'],
    maxlength: [500, 'Recommendation cannot exceed 500 characters']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  targetArea: {
    type: String,
    required: [true, 'Target area is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const childNutritionSchema = new mongoose.Schema({
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: [true, 'Child ID is required'],
    unique: true,
    index: true
  },
  records: {
    type: [nutritionRecordSchema],
    default: []
  },
  recommendations: {
    type: [nutritionRecommendationSchema],
    default: []
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

childNutritionSchema.virtual('latestRecord').get(function() {
  return this.records && this.records.length > 0 
    ? this.records[this.records.length - 1] 
    : null;
});

childNutritionSchema.virtual('currentBmi').get(function() {
  const latest = this.latestRecord;
  return latest ? latest.physicalMeasurement.bmi : null;
});

childNutritionSchema.virtual('currentHealthScore').get(function() {
  const latest = this.latestRecord;
  return latest ? latest.healthScore : null;
});

childNutritionSchema.virtual('highPriorityRecommendations').get(function() {
  return this.recommendations.filter(r => r.priority === 'high' || r.priority === 'critical');
});

childNutritionSchema.index({ childId: 1, updatedAt: -1 });

module.exports = mongoose.model('ChildNutrition', childNutritionSchema);
