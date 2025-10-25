/**
 * Central export hub for all models
 * 
 * This file provides centralized access to all Mongoose models
 * Helps prevent circular dependency issues and provides single import point
 */


const Child = require('./Child');
const ChildEducation = require('./ChildEducation');
const ChildNutrition = require('./ChildNutrition');
const Course = require('./Course');
const CourseProgress = require('./CourseProgress');
const Parent = require('./Parent');
const Instructor = require('./Instructor');
const Questions = require('./Questions');
const Otp = require('./Otp');

module.exports = {
  Child,
  ChildEducation,
  ChildNutrition,
  Course,
  CourseProgress,
  Parent,
  Instructor,
  Questions,
  Otp
};
