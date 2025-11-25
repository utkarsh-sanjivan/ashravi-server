const tables = {
  parents: process.env.PARENTS_TABLE_NAME,
  children: process.env.CHILDREN_TABLE_NAME,
  courses: process.env.COURSES_TABLE_NAME,
  courseProgress: process.env.COURSE_PROGRESS_TABLE_NAME,
  instructors: process.env.INSTRUCTORS_TABLE_NAME,
  questions: process.env.QUESTIONS_TABLE_NAME,
  otps: process.env.OTPS_TABLE_NAME,
  childEducation: process.env.CHILD_EDUCATION_TABLE_NAME,
  childNutrition: process.env.CHILD_NUTRITION_TABLE_NAME
};

module.exports = { tables };
