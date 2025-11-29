const buildParentKeys = (id) => ({
  pk: `PARENT#${id}`,
  sk: `PARENT#${id}`,
  entityType: 'parent'
});

const buildChildKeys = (parentId, childId) => ({
  pk: `PARENT#${parentId}`,
  sk: `CHILD#${childId}`,
  entityType: 'child'
});

const buildCourseKeys = (id) => ({
  pk: `COURSE#${id}`,
  sk: `COURSE#${id}`,
  entityType: 'course'
});

const buildCourseProgressKeys = (userId, courseId, progressId) => ({
  pk: `USER#${userId}`,
  sk: `COURSE_PROGRESS#${courseId}#${progressId}`,
  entityType: 'course_progress'
});

const buildInstructorKeys = (id) => ({
  pk: `INSTRUCTOR#${id}`,
  sk: `INSTRUCTOR#${id}`,
  entityType: 'instructor'
});

const buildQuestionKeys = (id) => ({
  pk: `QUESTION#${id}`,
  sk: `QUESTION#${id}`,
  entityType: 'question'
});

const buildOtpKeys = (contact, id) => ({
  pk: `OTP#${contact}`,
  sk: `OTP#${id}`,
  entityType: 'otp'
});

const buildChildEducationKeys = (childId, recordId) => ({
  pk: `CHILD#${childId}`,
  sk: `EDU#${recordId}`,
  entityType: 'child_education'
});

const buildChildNutritionKeys = (childId, recordId) => ({
  pk: `CHILD#${childId}`,
  sk: `NUT#${recordId}`,
  entityType: 'child_nutrition'
});

module.exports = {
  buildParentKeys,
  buildChildKeys,
  buildCourseKeys,
  buildCourseProgressKeys,
  buildInstructorKeys,
  buildQuestionKeys,
  buildOtpKeys,
  buildChildEducationKeys,
  buildChildNutritionKeys
};
