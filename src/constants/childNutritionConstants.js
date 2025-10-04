const EATING_HABITS_KEYS = [
  'eatsBreakfastRegularly',
  'drinksEnoughWater',
  'eatsFruitsDaily',
  'eatsVegetablesDaily',
  'limitsJunkFood',
  'hasRegularMealTimes',
  'enjoysVarietyOfFoods',
  'eatsAppropriatePor tions'
];

const BMI_CATEGORIES = {
  UNDERWEIGHT: 'underweight',
  NORMAL_WEIGHT: 'normal_weight',
  OVERWEIGHT: 'overweight',
  OBESE: 'obese'
};

const RECOMMENDATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

const RECOMMENDATION_CATEGORIES = {
  DIET: 'diet',
  EXERCISE: 'exercise',
  HABITS: 'habits',
  MEDICAL: 'medical'
};

module.exports = {
  EATING_HABITS_KEYS,
  BMI_CATEGORIES,
  RECOMMENDATION_PRIORITIES,
  RECOMMENDATION_CATEGORIES
};
