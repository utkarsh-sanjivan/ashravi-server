const CourseProgress = require('../models/CourseProgress');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * Validate MongoDB ObjectId
 * 
 * @params {idString}: string - ID to validate
 * @returns Valid ObjectId or null
 */
const validateObjectId = (idString) => {
  try {
    return mongoose.Types.ObjectId.isValid(idString) ? idString : null;
  } catch (error) {
    logger.warn('Invalid ObjectId format', { idString, error: error.message });
    return null;
  }
};

/**
 * Format document for response
 * 
 * @params {document}: object - MongoDB document
 * @returns Formatted document with id field
 */
const formatDocument = (document) => {
  if (!document) return document;
  const formatted = document.toObject ? document.toObject() : { ...document };
  formatted.id = formatted._id.toString();
  return formatted;
};

/**
 * Create or get course progress
 * 
 * @params {userId}: string - User ID
 * @params {courseId}: string - Course ID
 * @returns Course progress
 */
const getOrCreateProgress = async (userId, courseId) => {
  try {
    const userObjectId = validateObjectId(userId);
    const courseObjectId = validateObjectId(courseId);

    if (!userObjectId || !courseObjectId) return null;

    let progress = await CourseProgress.findOne({
      userId: userObjectId,
      courseId: courseObjectId
    }).lean();

    if (!progress) {
      const newProgress = new CourseProgress({
        userId: userObjectId,
        courseId: courseObjectId,
        sections: [],
        overallProgress: 0,
        notes: ''
      });

      const saved = await newProgress.save();
      logger.info('Created course progress', { userId, courseId });
      progress = saved.toObject();
    }

    return formatDocument(progress);
  } catch (error) {
    logger.error('Error getting/creating progress', { userId, courseId, error: error.message });
    throw error;
  }
};

/**
 * Get user's progress for a course
 * 
 * @params {userId}: string - User ID
 * @params {courseId}: string - Course ID
 * @returns Course progress or null
 */
const getUserCourseProgress = async (userId, courseId) => {
  try {
    const userObjectId = validateObjectId(userId);
    const courseObjectId = validateObjectId(courseId);

    if (!userObjectId || !courseObjectId) return null;

    const progress = await CourseProgress.findOne({
      userId: userObjectId,
      courseId: courseObjectId
    }).lean();

    return progress ? formatDocument(progress) : null;
  } catch (error) {
    logger.error('Error fetching user course progress', { userId, courseId, error: error.message });
    throw error;
  }
};

/**
 * Get all courses progress for a user
 * 
 * @params {userId}: string - User ID
 * @params {limit}: number - Max results
 * @returns Array of progress records
 */
const getUserProgress = async (userId, limit = 100) => {
  try {
    const userObjectId = validateObjectId(userId);
    if (!userObjectId) return [];

    const progress = await CourseProgress.find({ userId: userObjectId })
      .populate('courseId', 'title thumbnail category')
      .sort({ lastAccessedAt: -1 })
      .limit(limit)
      .lean();

    return progress.map(formatDocument);
  } catch (error) {
    logger.error('Error fetching user progress', { userId, error: error.message });
    throw error;
  }
};

/**
 * Update video progress
 * 
 * @params {userId}: string - User ID
 * @params {courseId}: string - Course ID
 * @params {sectionId}: string - Section ID
 * @params {videoId}: string - Video ID
 * @params {watchedDuration}: number - Watched duration
 * @params {totalDuration}: number - Total duration
 * @returns Updated progress
 */
const updateVideoProgress = async (userId, courseId, sectionId, videoId, watchedDuration, totalDuration) => {
  try {
    const progress = await getOrCreateProgress(userId, courseId);
    if (!progress) return null;

    const sectionIndex = progress.sections.findIndex(
      s => s.sectionId.toString() === sectionId
    );

    const isCompleted = watchedDuration >= totalDuration * 0.9;

    if (sectionIndex === -1) {
      progress.sections.push({
        sectionId,
        videos: [{
          videoId,
          watchedDuration,
          totalDuration,
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
          lastWatchedAt: new Date()
        }],
        isCompleted: false
      });
    } else {
      const section = progress.sections[sectionIndex];
      const videoIndex = section.videos.findIndex(
        v => v.videoId.toString() === videoId
      );

      if (videoIndex === -1) {
        section.videos.push({
          videoId,
          watchedDuration,
          totalDuration,
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
          lastWatchedAt: new Date()
        });
      } else {
        section.videos[videoIndex].watchedDuration = Math.max(
          section.videos[videoIndex].watchedDuration,
          watchedDuration
        );
        section.videos[videoIndex].lastWatchedAt = new Date();
        
        if (isCompleted && !section.videos[videoIndex].isCompleted) {
          section.videos[videoIndex].isCompleted = true;
          section.videos[videoIndex].completedAt = new Date();
        }
      }
    }

    const updated = await CourseProgress.findOneAndUpdate(
      { userId, courseId },
      {
        $set: {
          sections: progress.sections,
          lastAccessedAt: new Date(),
          startedAt: progress.startedAt || new Date()
        }
      },
      { new: true, upsert: true }
    ).lean();

    logger.info('Updated video progress', { userId, courseId, videoId });
    return formatDocument(updated);
  } catch (error) {
    logger.error('Error updating video progress', { error: error.message });
    throw error;
  }
};

/**
 * Update test progress
 * 
 * @params {userId}: string - User ID
 * @params {courseId}: string - Course ID
 * @params {sectionId}: string - Section ID
 * @params {testId}: string - Test ID
 * @params {score}: number - Test score
 * @params {passingScore}: number - Passing score
 * @returns Updated progress
 */
const updateTestProgress = async (userId, courseId, sectionId, testId, score, passingScore = 70) => {
  try {
    const progress = await getOrCreateProgress(userId, courseId);
    if (!progress) return null;

    const sectionIndex = progress.sections.findIndex(
      s => s.sectionId.toString() === sectionId
    );

    const isPassed = score >= passingScore;

    if (sectionIndex === -1) {
      progress.sections.push({
        sectionId,
        videos: [],
        test: {
          testId,
          attempts: 1,
          bestScore: score,
          isPassed,
          lastAttemptAt: new Date(),
          completedAt: isPassed ? new Date() : null
        },
        isCompleted: false
      });
    } else {
      const section = progress.sections[sectionIndex];
      
      if (!section.test) {
        section.test = {
          testId,
          attempts: 1,
          bestScore: score,
          isPassed,
          lastAttemptAt: new Date(),
          completedAt: isPassed ? new Date() : null
        };
      } else {
        section.test.attempts++;
        section.test.bestScore = Math.max(section.test.bestScore, score);
        section.test.lastAttemptAt = new Date();
        
        if (isPassed && !section.test.isPassed) {
          section.test.isPassed = true;
          section.test.completedAt = new Date();
        }
      }
    }

    const updated = await CourseProgress.findOneAndUpdate(
      { userId, courseId },
      {
        $set: {
          sections: progress.sections,
          lastAccessedAt: new Date()
        }
      },
      { new: true, upsert: true }
    ).lean();

    logger.info('Updated test progress', { userId, courseId, testId, score });
    return formatDocument(updated);
  } catch (error) {
    logger.error('Error updating test progress', { error: error.message });
    throw error;
  }
};

/**
 * Update course notes for a user
 *
 * @params {userId}: string - User ID
 * @params {courseId}: string - Course ID
 * @params {notes}: string - Notes content
 * @returns Updated progress
 */
const updateCourseNotes = async (userId, courseId, notes) => {
  try {
    const userObjectId = validateObjectId(userId);
    const courseObjectId = validateObjectId(courseId);

    if (!userObjectId || !courseObjectId) return null;

    const updated = await CourseProgress.findOneAndUpdate(
      { userId: userObjectId, courseId: courseObjectId },
      {
        $set: {
          notes,
          lastAccessedAt: new Date()
        },
        $setOnInsert: {
          sections: [],
          overallProgress: 0,
          enrolledAt: new Date()
        }
      },
      { new: true, upsert: true }
    ).lean();

    if (updated) {
      logger.info('Updated course notes', { userId, courseId });
      return formatDocument(updated);
    }

    return null;
  } catch (error) {
    logger.error('Error updating course notes', { userId, courseId, error: error.message });
    throw error;
  }
};

/**
 * Calculate and update overall progress
 * 
 * @params {userId}: string - User ID
 * @params {courseId}: string - Course ID
 * @params {totalVideos}: number - Total videos in course
 * @params {totalTests}: number - Total tests in course
 * @returns Updated progress
 */
const calculateOverallProgress = async (userId, courseId, totalVideos, totalTests) => {
  try {
    const progress = await getUserCourseProgress(userId, courseId);
    if (!progress) return null;

    let completedVideos = 0;
    let completedTests = 0;

    progress.sections.forEach(section => {
      if (section.videos) {
        completedVideos += section.videos.filter(v => v.isCompleted).length;
      }
      if (section.test && section.test.isPassed) {
        completedTests++;
      }
    });

    const totalItems = totalVideos + totalTests;
    const completedItems = completedVideos + completedTests;
    const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    const isCompleted = overallProgress === 100;

    const updated = await CourseProgress.findOneAndUpdate(
      { userId, courseId },
      {
        $set: {
          overallProgress,
          isCompleted,
          completedAt: isCompleted ? new Date() : null
        }
      },
      { new: true }
    ).lean();

    logger.info('Calculated overall progress', { userId, courseId, overallProgress });
    return formatDocument(updated);
  } catch (error) {
    logger.error('Error calculating overall progress', { error: error.message });
    throw error;
  }
};

/**
 * Issue certificate
 * 
 * @params {userId}: string - User ID
 * @params {courseId}: string - Course ID
 * @returns Updated progress
 */
const issueCertificate = async (userId, courseId) => {
  try {
    const updated = await CourseProgress.findOneAndUpdate(
      { userId, courseId, isCompleted: true, certificateIssued: false },
      {
        $set: {
          certificateIssued: true,
          certificateIssuedAt: new Date()
        }
      },
      { new: true }
    ).lean();

    if (updated) {
      logger.info('Certificate issued', { userId, courseId });
      return formatDocument(updated);
    }

    return null;
  } catch (error) {
    logger.error('Error issuing certificate', { error: error.message });
    throw error;
  }
};

module.exports = {
  getOrCreateProgress,
  getUserCourseProgress,
  getUserProgress,
  updateVideoProgress,
  updateTestProgress,
  calculateOverallProgress,
  issueCertificate,
  updateCourseNotes
};
