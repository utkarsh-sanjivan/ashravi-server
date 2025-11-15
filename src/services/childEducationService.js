const childEducationRepository = require('../repositories/childEducationRepository');
const childRepository = require('../repositories/childRepository');
const logger = require('../utils/logger');

/**
 * Analyze performance trends across education records
 * 
 * @params {records}: array - Array of education records
 * @returns Performance analysis object
 */
const analyzePerformance = (records) => {
  if (!records || records.length === 0) {
    return {
      currentAverage: 0,
      trend: 'stable',
      trendStrength: 0,
      subjectsNeedingAttention: [],
      topPerformingSubjects: [],
      overallGpa: 0,
      consistencyScore: 0
    };
  }

  const averages = records.map(record => {
    const total = record.subjects.reduce((sum, s) => sum + s.marks, 0);
    return total / record.subjects.length;
  });

  const currentAverage = averages[averages.length - 1] || 0;
  
  let trend = 'stable';
  let trendStrength = 0;

  if (averages.length >= 2) {
    const recentAvg = averages.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, averages.length);
    const olderAvg = averages.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(1, averages.length - 3);
    const difference = recentAvg - olderAvg;

    if (difference > 5) {
      trend = 'improving';
      trendStrength = Math.min(difference / 10, 1);
    } else if (difference < -5) {
      trend = 'declining';
      trendStrength = Math.min(Math.abs(difference) / 10, 1);
    }
  }

  const latestRecord = records[records.length - 1];
  const subjectMap = new Map();

  latestRecord.subjects.forEach(subject => {
    subjectMap.set(subject.subject, subject.marks);
  });

  const subjectsNeedingAttention = Array.from(subjectMap.entries())
    .filter(([, marks]) => marks < 60)
    .map(([subject]) => subject)
    .slice(0, 3);

  const topPerformingSubjects = Array.from(subjectMap.entries())
    .filter(([, marks]) => marks >= 85)
    .map(([subject]) => subject)
    .slice(0, 3);

  const allMarks = latestRecord.subjects.map(s => s.marks);
  const mean = allMarks.reduce((a, b) => a + b, 0) / allMarks.length;
  const variance = allMarks.reduce((sum, mark) => sum + Math.pow(mark - mean, 2), 0) / allMarks.length;
  const stdDev = Math.sqrt(variance);
  const consistencyScore = Math.max(0, 100 - stdDev);

  const overallGpa = records.reduce((sum, record) => {
    const recordAvg = record.subjects.reduce((s, sub) => s + sub.marks, 0) / record.subjects.length;
    return sum + marksToGpa(recordAvg);
  }, 0) / records.length;

  return {
    currentAverage: Math.round(currentAverage * 100) / 100,
    trend,
    trendStrength: Math.round(trendStrength * 100) / 100,
    subjectsNeedingAttention,
    topPerformingSubjects,
    overallGpa: Math.round(overallGpa * 100) / 100,
    consistencyScore: Math.round(consistencyScore * 100) / 100
  };
};

/**
 * Convert marks to GPA on 4.0 scale
 * 
 * @params {marks}: number - Marks obtained
 * @returns GPA value
 */
const marksToGpa = (marks) => {
  if (marks >= 90) return 4.0;
  if (marks >= 80) return 3.0;
  if (marks >= 70) return 2.0;
  if (marks >= 60) return 1.0;
  return 0.0;
};

/**
 * Generate intelligent suggestions based on performance
 * 
 * @params {records}: array - Education records
 * @returns Array of suggestions
 */
const generateSuggestions = (records) => {
  if (!records || records.length === 0) return [];

  const analysis = analyzePerformance(records);
  const suggestions = [];

  if (analysis.subjectsNeedingAttention.length > 0) {
    analysis.subjectsNeedingAttention.forEach(subject => {
      suggestions.push({
        subject,
        suggestion: `Focus on improving ${subject}. Consider additional practice sessions and consulting with the teacher.`,
        priority: 'high',
        type: 'performance',
        createdAt: new Date()
      });
    });
  }

  if (analysis.trend === 'declining' && analysis.trendStrength > 0.3) {
    suggestions.push({
      subject: 'Overall Performance',
      suggestion: 'Recent decline in overall performance detected. Consider reviewing study habits and time management strategies.',
      priority: 'high',
      type: 'trend',
      createdAt: new Date()
    });
  }

  if (analysis.trend === 'improving') {
    suggestions.push({
      subject: 'Overall Performance',
      suggestion: 'Great progress! Keep up the good work and maintain your current study routine.',
      priority: 'low',
      type: 'trend',
      createdAt: new Date()
    });
  }

  if (analysis.consistencyScore < 60) {
    suggestions.push({
      subject: 'Study Balance',
      suggestion: 'High variation in subject performance. Try to balance study time across all subjects for more consistent results.',
      priority: 'medium',
      type: 'consistency',
      createdAt: new Date()
    });
  }

  if (analysis.topPerformingSubjects.length > 0 && analysis.subjectsNeedingAttention.length > 0) {
    suggestions.push({
      subject: 'Strategic Planning',
      suggestion: `Leverage strengths in ${analysis.topPerformingSubjects.join(', ')} to boost confidence while working on weaker areas.`,
      priority: 'medium',
      type: 'strategic',
      createdAt: new Date()
    });
  }

  if (analysis.overallGpa >= 3.5) {
    suggestions.push({
      subject: 'Advanced Learning',
      suggestion: 'Excellent academic performance! Consider exploring advanced topics or competitive examinations.',
      priority: 'low',
      type: 'strategic',
      createdAt: new Date()
    });
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

/**
 * Create new education record
 * 
 * @params {data}: object - Education record data
 * @returns Created education record
 */
const createEducationRecord = async (data) => {
  try {
    if (!data.childId) {
      const error = new Error('childId is required');
      error.statusCode = 400;
      error.code = 'CHILD_ID_REQUIRED';
      throw error;
    }

    const child = await childRepository.getChild(data.childId);
    if (!child) {
      const error = new Error(`Child with ID ${data.childId} not found`);
      error.statusCode = 404;
      error.code = 'CHILD_NOT_FOUND';
      throw error;
    }

    const existing = await childEducationRepository.getByChildId(data.childId);
    if (existing) {
      const error = new Error('Education record already exists for this child');
      error.statusCode = 409;
      error.code = 'RECORD_EXISTS';
      throw error;
    }

    logger.info('Creating education record', { childId: data.childId });
    const created = await childEducationRepository.createEducationRecord(data);

    if (!created) {
      const error = new Error('Failed to create education record');
      error.statusCode = 500;
      error.code = 'CREATION_FAILED';
      throw error;
    }

    return created;
  } catch (error) {
    logger.error('Error creating education record', { error: error.message, data });
    throw error;
  }
};

/**
 * Get education record by ID
 * 
 * @params {recordId}: string - Record ID
 * @returns Education record or null
 */
const getEducationRecord = async (recordId) => {
  try {
    if (!recordId) return null;
    return await childEducationRepository.getEducationRecord(recordId);
  } catch (error) {
    logger.error('Error retrieving education record', { recordId, error: error.message });
    throw error;
  }
};

/**
 * Get education record with validation
 * 
 * @params {recordId}: string - Record ID
 * @returns Education record
 */
const getEducationRecordWithValidation = async (recordId) => {
  const record = await getEducationRecord(recordId);
  if (!record) {
    const error = new Error(`Education record with ID ${recordId} not found`);
    error.statusCode = 404;
    error.code = 'RECORD_NOT_FOUND';
    throw error;
  }
  return record;
};

/**
 * Get education record by child ID
 * 
 * @params {childId}: string - Child ID
 * @returns Education record or null
 */
const getByChildId = async (childId) => {
  try {
    if (!childId) return null;

    const child = await childRepository.getChild(childId);
    if (!child) {
      const error = new Error(`Child with ID ${childId} not found`);
      error.statusCode = 404;
      error.code = 'CHILD_NOT_FOUND';
      throw error;
    }

    return await childEducationRepository.getByChildId(childId);
  } catch (error) {
    logger.error('Error retrieving record by child ID', { childId, error: error.message });
    throw error;
  }
};

/**
 * Update education record
 * 
 * @params {recordId}: string - Record ID
 * @params {data}: object - Update data
 * @returns Updated education record
 */
const updateEducationRecord = async (recordId, data) => {
  try {
    if (!recordId) {
      const error = new Error('Record ID is required for update');
      error.statusCode = 400;
      error.code = 'RECORD_ID_REQUIRED';
      throw error;
    }

    await getEducationRecordWithValidation(recordId);

    logger.info('Updating education record', { recordId });
    const updated = await childEducationRepository.updateEducationRecord(recordId, data);

    if (!updated) {
      const error = new Error('Failed to update education record');
      error.statusCode = 500;
      error.code = 'UPDATE_FAILED';
      throw error;
    }

    return updated;
  } catch (error) {
    logger.error('Error updating education record', { recordId, error: error.message });
    throw error;
  }
};

/**
 * Delete education record
 * 
 * @params {recordId}: string - Record ID
 * @returns Boolean indicating success
 */
const deleteEducationRecord = async (recordId) => {
  try {
    if (!recordId) return false;

    await getEducationRecordWithValidation(recordId);

    logger.info('Deleting education record', { recordId });
    const deleted = await childEducationRepository.deleteEducationRecord(recordId);

    if (!deleted) {
      logger.warn('Failed to delete education record', { recordId });
      return false;
    }

    logger.info('Successfully deleted education record', { recordId });
    return true;
  } catch (error) {
    logger.error('Error deleting education record', { recordId, error: error.message });
    throw error;
  }
};

/**
 * Add grade record to existing education document
 * 
 * @params {childId}: string - Child ID
 * @params {gradeRecord}: object - Grade record to add
 * @returns Updated education record
 */
const addGradeRecord = async (childId, gradeRecord) => {
  try {
    if (!childId || !gradeRecord) {
      const error = new Error('childId and gradeRecord are required');
      error.statusCode = 400;
      error.code = 'INVALID_INPUT';
      throw error;
    }

    const child = await childRepository.getChild(childId);
    if (!child) {
      const error = new Error(`Child with ID ${childId} not found`);
      error.statusCode = 404;
      error.code = 'CHILD_NOT_FOUND';
      throw error;
    }

    let educationRecord = await childEducationRepository.getByChildId(childId);

    if (!educationRecord) {
      educationRecord = await childEducationRepository.createEducationRecord({
        childId,
        records: [],
        suggestions: []
      });
    }

    const updated = await childEducationRepository.addGradeRecord(childId, gradeRecord);

    if (!updated) {
      const error = new Error('Failed to add grade record');
      error.statusCode = 500;
      error.code = 'ADD_GRADE_FAILED';
      throw error;
    }

    const suggestions = generateSuggestions(updated.records);
    await childEducationRepository.updateSuggestions(childId, suggestions);

    const finalRecord = await childEducationRepository.getByChildId(childId);
    logger.info('Added grade record and updated suggestions', { childId });

    return finalRecord;
  } catch (error) {
    logger.error('Error adding grade record', { childId, error: error.message });
    throw error;
  }
};

/**
 * Get performance analysis for a child
 * 
 * @params {childId}: string - Child ID
 * @returns Performance analysis object
 */
const getPerformanceAnalysis = async (childId) => {
  try {
    const record = await getByChildId(childId);
    
    if (!record || !record.records || record.records.length === 0) {
      return {
        childId,
        hasData: false,
        message: 'No education records found for analysis'
      };
    }

    const analysis = analyzePerformance(record.records);

    return {
      childId,
      hasData: true,
      analysis,
      recordCount: record.records.length,
      latestGrade: record.records[record.records.length - 1].gradeYear,
      suggestions: record.suggestions || []
    };
  } catch (error) {
    logger.error('Error getting performance analysis', { childId, error: error.message });
    throw error;
  }
};

/**
 * Regenerate suggestions for a child
 * 
 * @params {childId}: string - Child ID
 * @returns Updated education record with new suggestions
 */
const regenerateSuggestions = async (childId) => {
  try {
    const record = await getByChildId(childId);

    if (!record || !record.records || record.records.length === 0) {
      const error = new Error('No education records found to generate suggestions');
      error.statusCode = 404;
      error.code = 'NO_RECORDS';
      throw error;
    }

    const suggestions = generateSuggestions(record.records);
    const updated = await childEducationRepository.updateSuggestions(childId, suggestions);

    logger.info('Regenerated suggestions', { childId, count: suggestions.length });
    return updated;
  } catch (error) {
    logger.error('Error regenerating suggestions', { childId, error: error.message });
    throw error;
  }
};

module.exports = {
  createEducationRecord,
  getEducationRecord,
  getEducationRecordWithValidation,
  getByChildId,
  updateEducationRecord,
  deleteEducationRecord,
  addGradeRecord,
  getPerformanceAnalysis,
  regenerateSuggestions,
  analyzePerformance,
  generateSuggestions
};
