const { v4: uuidv4 } = require('uuid');
const { tableName } = require('../config/dynamoConfig');
const dynamoRepository = require('./dynamoRepository');
const { buildCourseProgressKeys } = require('./keyFactory');
const logger = require('../utils/logger');

const format = (doc) => (doc ? { ...doc, _id: doc.id } : null);

const getOrCreateProgress = async (userId, courseId) => {
  const { items } = await dynamoRepository.queryByPk(tableName, `USER#${userId}`, {
    beginsWith: `COURSE_PROGRESS#${courseId}`
  });
  const existing = (items || []).find((i) => i.courseId === courseId);

  if (existing) return format(existing);

  const id = uuidv4();
  const payload = {
    id,
    ...buildCourseProgressKeys(userId, courseId, id),
    userId,
    courseId,
    sections: [],
    overallProgress: 0,
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString()
  };
  const created = await dynamoRepository.createItem(tableName, payload);
  logger.info('Created course progress', { userId, courseId });
  return format(created);
};

const getUserCourseProgress = async (userId, courseId) => {
  const { items } = await dynamoRepository.queryByPk(tableName, `USER#${userId}`, {
    beginsWith: `COURSE_PROGRESS#${courseId}`
  });
  const progress = (items || []).find((i) => i.courseId === courseId);
  return format(progress || null);
};

const getUserProgress = async (userId, limit = 100) => {
  const { items } = await dynamoRepository.queryByPk(tableName, `USER#${userId}`);
  const sorted = (items || []).sort(
    (a, b) => new Date(b.lastAccessedAt || 0) - new Date(a.lastAccessedAt || 0)
  );
  return sorted.slice(0, limit).map(format);
};

const updateCourseProgress = async (userId, courseId, data) => {
  const progress = await getUserCourseProgress(userId, courseId);
  if (!progress) return null;
  const { pk, sk } = buildCourseProgressKeys(userId, courseId, progress.id);
  const updated = await dynamoRepository.updateItem(tableName, pk, sk, data);
  return format(updated);
};

const updateVideoProgress = async (userId, courseId, sectionId, videoId, watchedDuration, totalDuration) => {
  const progress = await getUserCourseProgress(userId, courseId);
  if (!progress) return null;
  const sections = progress.sections || [];
  const updatedSections = sections.map((s) =>
    s.sectionId === sectionId
      ? {
          ...s,
          videos: (s.videos || []).map((v) =>
            v.videoId === videoId ? { ...v, watchedDuration, totalDuration } : v
          )
        }
      : s
  );
  const { pk, sk } = buildCourseProgressKeys(userId, courseId, progress.id);
  const updated = await dynamoRepository.updateItem(tableName, pk, sk, {
    sections: updatedSections,
    lastAccessedAt: new Date().toISOString()
  });
  return format(updated);
};

const updateTestProgress = async (userId, courseId, sectionId, testId, score, passingScore) => {
  const progress = await getUserCourseProgress(userId, courseId);
  if (!progress) return null;
  const sections = progress.sections || [];
  const updatedSections = sections.map((s) =>
    s.sectionId === sectionId
      ? {
          ...s,
          tests: (s.tests || []).map((t) =>
            t.testId === testId ? { ...t, score, passingScore, completedAt: new Date().toISOString() } : t
          )
        }
      : s
  );
  const { pk, sk } = buildCourseProgressKeys(userId, courseId, progress.id);
  const updated = await dynamoRepository.updateItem(tableName, pk, sk, {
    sections: updatedSections,
    lastAccessedAt: new Date().toISOString()
  });
  return format(updated);
};

const calculateOverallProgress = async (userId, courseId, totalVideos = 0, totalTests = 0) => {
  const progress = await getUserCourseProgress(userId, courseId);
  if (!progress) return null;
  const sections = progress.sections || [];
  const watched = sections.flatMap((s) => s.videos || []).filter((v) => v.watchedDuration && v.totalDuration && v.watchedDuration >= v.totalDuration).length;
  const testsCompleted = sections.flatMap((s) => s.tests || []).filter((t) => t.score !== undefined).length;
  const videoProgress = totalVideos > 0 ? (watched / totalVideos) * 100 : 0;
  const testProgress = totalTests > 0 ? (testsCompleted / totalTests) * 100 : 0;
  const overallProgress = Math.min(100, Math.round((videoProgress + testProgress) / 2));
  const isCompleted = overallProgress >= 100;
  const { pk, sk } = buildCourseProgressKeys(userId, courseId, progress.id);
  const updated = await dynamoRepository.updateItem(tableName, pk, sk, {
    overallProgress,
    isCompleted,
    lastAccessedAt: new Date().toISOString()
  });
  return format(updated);
};

const updateCourseNotes = async (userId, courseId, notes) => {
  const progress = await getUserCourseProgress(userId, courseId);
  if (!progress) return null;
  const { pk, sk } = buildCourseProgressKeys(userId, courseId, progress.id);
  const updated = await dynamoRepository.updateItem(tableName, pk, sk, {
    notes,
    updatedAt: new Date().toISOString()
  });
  return format(updated);
};

const issueCertificate = async (userId, courseId) => {
  const progress = await getUserCourseProgress(userId, courseId);
  if (!progress) return null;
  const { pk, sk } = buildCourseProgressKeys(userId, courseId, progress.id);
  const updated = await dynamoRepository.updateItem(tableName, pk, sk, {
    certificateIssued: true,
    certificateIssuedAt: new Date().toISOString()
  });
  return format(updated);
};

const deleteProgress = async (id) => {
  const { items } = await dynamoRepository.queryByEntityType(tableName, 'course_progress', {
    filterExpression: '#id = :id',
    expressionNames: { '#id': 'id' },
    expressionValues: { ':id': id },
    limit: 1
  });
  const progress = items?.[0];
  if (!progress) return true;
  await dynamoRepository.deleteItem(tableName, progress.pk, progress.sk);
  return true;
};

module.exports = {
  getOrCreateProgress,
  getUserCourseProgress,
  getUserProgress,
  updateCourseProgress,
  updateVideoProgress,
  updateTestProgress,
  calculateOverallProgress,
  updateCourseNotes,
  issueCertificate,
  deleteProgress
};
