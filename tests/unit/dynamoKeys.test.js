const {
  buildParentKeys,
  buildChildKeys,
  buildCourseKeys,
  buildCourseProgressKeys,
  buildOtpKeys
} = require('../../src/repositories/keyFactory');

describe('DynamoDB key factory', () => {
  test('buildParentKeys sets pk/sk and entityType', () => {
    const keys = buildParentKeys('123');
    expect(keys).toEqual({ pk: 'PARENT#123', sk: 'PARENT#123', entityType: 'parent' });
  });

  test('buildChildKeys nests under parent pk', () => {
    const keys = buildChildKeys('parent1', 'child9');
    expect(keys).toEqual({ pk: 'PARENT#parent1', sk: 'CHILD#child9', entityType: 'child' });
  });

  test('buildCourseProgressKeys includes user and course references', () => {
    const keys = buildCourseProgressKeys('userA', 'courseB', 'progressC');
    expect(keys).toEqual({
      pk: 'USER#userA',
      sk: 'COURSE_PROGRESS#courseB#progressC',
      entityType: 'course_progress'
    });
  });

  test('buildCourseKeys uses course prefix', () => {
    const keys = buildCourseKeys('course-1');
    expect(keys).toEqual({ pk: 'COURSE#course-1', sk: 'COURSE#course-1', entityType: 'course' });
  });

  test('buildOtpKeys groups by contact', () => {
    const keys = buildOtpKeys('user@example.com', 'otp-1');
    expect(keys).toEqual({ pk: 'OTP#user@example.com', sk: 'OTP#otp-1', entityType: 'otp' });
  });
});
