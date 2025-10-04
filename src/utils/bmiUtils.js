/**
 * Calculate BMI from height and weight
 * 
 * @params {heightCm}: number - Height in centimeters
 * @params {weightKg}: number - Weight in kilograms
 * @returns BMI value rounded to 1 decimal place
 */
const calculateBMI = (heightCm, weightKg) => {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
    return 0;
  }
  
  const heightInMeters = heightCm / 100;
  return Math.round((weightKg / (heightInMeters * heightInMeters)) * 10) / 10;
};

/**
 * Get BMI category based on BMI value
 * 
 * @params {bmi}: number - BMI value
 * @returns BMI category string
 */
const getBMICategory = (bmi) => {
  if (bmi < 16) return 'underweight';
  if (bmi < 25) return 'normal_weight';
  if (bmi < 30) return 'overweight';
  return 'obese';
};

/**
 * Check if BMI is in healthy range
 * 
 * @params {bmi}: number - BMI value
 * @returns Boolean indicating if BMI is healthy
 */
const isHealthyBMI = (bmi) => {
  return bmi >= 16 && bmi < 25;
};

module.exports = {
  calculateBMI,
  getBMICategory,
  isHealthyBMI
};
