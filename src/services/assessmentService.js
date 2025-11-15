const Child = require('../models/Child');
const Question = require('../models/Questions');
const ASSESSMENT_CONSTANTS = require('../constants/assessmentConstants');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Process assessment and calculate issue scores
 * 
 * @params {responses}: array - Array of question responses with questionId and answer
 * @params {childId}: string - Child ID
 * @params {parentId}: string - Parent ID
 * @params {method}: string - Assessment method (weighted_average, t_score_non_weighted, t_score_weighted)
 * @returns Assessment result object
 */
const processAssessment = async (responses, childId, parentId, method = 'weighted_average') => {
  try {
    const child = await Child.findById(childId);
    if (!child) {
      const error = new Error(`Child with ID ${childId} not found`);
      error.statusCode = 404;
      error.code = 'CHILD_NOT_FOUND';
      throw error;
    }

    if (child.parentId.toString() !== parentId) {
      const error = new Error('Unauthorized: Parent ID does not match child record');
      error.statusCode = 403;
      error.code = 'UNAUTHORIZED_ACCESS';
      throw error;
    }

    const questionIds = responses.map(r => r.questionId);
    const questions = await Question.find({ _id: { $in: questionIds }, isActive: true });

    if (questions.length === 0) {
      const error = new Error('No valid questions found');
      error.statusCode = 400;
      error.code = 'INVALID_QUESTIONS';
      throw error;
    }

    const questionMap = new Map(questions.map(q => [q._id.toString(), q]));

    let issueScores;
    if (method === 'weighted_average') {
      issueScores = calculateWeightedAverage(responses, questionMap);
    } else if (method === 't_score_non_weighted') {
      issueScores = calculateTScoreNonWeighted(responses, questionMap);
    } else if (method === 't_score_weighted') {
      issueScores = calculateTScoreWeighted(responses, questionMap);
    } else {
      const error = new Error('Invalid assessment method');
      error.statusCode = 400;
      error.code = 'INVALID_METHOD';
      throw error;
    }

    const assessmentResult = buildAssessmentResult(
      issueScores,
      method,
      parentId,
      questions.length
    );

    await attachAssessmentToChild(childId, assessmentResult);

    await processCoursesAndReferrals(childId, assessmentResult);

    logger.info('Assessment processed successfully', { 
      childId, 
      assessmentId: assessmentResult.assessmentId,
      method 
    });

    return assessmentResult;
  } catch (error) {
    logger.error('Error processing assessment', { 
      childId, 
      error: error.message 
    });
    throw error;
  }
};

/**
 * Calculate weighted average scores for issues
 * 
 * @params {responses}: array - User responses
 * @params {questionMap}: Map - Map of questions by ID
 * @returns Object with issue scores
 */
const calculateWeightedAverage = (responses, questionMap) => {
  const issueScores = {};

  responses.forEach(response => {
    const question = questionMap.get(response.questionId);
    if (!question) return;

    const answer = parseFloat(response.answer);
    if (isNaN(answer)) return;

    question.issueWeightages.forEach(({ issueId, issueName, weightage }) => {
      if (!issueScores[issueId]) {
        issueScores[issueId] = {
          issueId,
          issueName,
          rawScore: 0,
          totalWeight: 0
        };
      }

      issueScores[issueId].rawScore += answer * weightage;
      issueScores[issueId].totalWeight += weightage;
    });
  });

  Object.keys(issueScores).forEach(issueId => {
    const issue = issueScores[issueId];
    issue.score = issue.totalWeight > 0 
      ? (issue.rawScore / issue.totalWeight) 
      : 0;
    issue.normalizedScore = Math.min(100, Math.max(0, issue.score));
  });

  return issueScores;
};

/**
 * Calculate T-scores (non-weighted)
 * 
 * @params {responses}: array - User responses
 * @params {questionMap}: Map - Map of questions by ID
 * @returns Object with issue T-scores
 */
const calculateTScoreNonWeighted = (responses, questionMap) => {
  const issueScores = {};

  responses.forEach(response => {
    const question = questionMap.get(response.questionId);
    if (!question) return;

    const answer = parseFloat(response.answer);
    if (isNaN(answer)) return;

    question.issueWeightages.forEach(({ issueId, issueName }) => {
      if (!issueScores[issueId]) {
        issueScores[issueId] = {
          issueId,
          issueName,
          rawScore: 0,
          count: 0
        };
      }

      issueScores[issueId].rawScore += answer;
      issueScores[issueId].count++;
    });
  });

  Object.keys(issueScores).forEach(issueId => {
    const issue = issueScores[issueId];
    const meanScore = issue.count > 0 ? issue.rawScore / issue.count : 0;

    const stats = ASSESSMENT_CONSTANTS.tScoreStatistics[issueId] || { mean: 50, stdDev: 10 };
    
    const zScore = stats.stdDev > 0 
      ? (meanScore - stats.mean) / stats.stdDev 
      : 0;
    
    issue.tScore = 50 + (zScore * 10);
    issue.score = issue.tScore;
    issue.normalizedScore = Math.min(100, Math.max(0, issue.tScore));
  });

  return issueScores;
};

/**
 * Calculate T-scores (weighted)
 * 
 * @params {responses}: array - User responses
 * @params {questionMap}: Map - Map of questions by ID
 * @returns Object with weighted issue T-scores
 */
const calculateTScoreWeighted = (responses, questionMap) => {
  const issueScores = {};

  responses.forEach(response => {
    const question = questionMap.get(response.questionId);
    if (!question) return;

    const answer = parseFloat(response.answer);
    if (isNaN(answer)) return;

    question.issueWeightages.forEach(({ issueId, issueName, weightage }) => {
      if (!issueScores[issueId]) {
        issueScores[issueId] = {
          issueId,
          issueName,
          weightedSum: 0,
          totalWeight: 0
        };
      }

      issueScores[issueId].weightedSum += answer * (weightage / 100);
      issueScores[issueId].totalWeight += (weightage / 100);
    });
  });

  Object.keys(issueScores).forEach(issueId => {
    const issue = issueScores[issueId];
    const weightedMean = issue.totalWeight > 0 
      ? issue.weightedSum / issue.totalWeight 
      : 0;

    const stats = ASSESSMENT_CONSTANTS.tScoreStatistics[issueId] || { mean: 50, stdDev: 10 };
    
    const zScore = stats.stdDev > 0 
      ? (weightedMean - stats.mean) / stats.stdDev 
      : 0;
    
    issue.tScore = 50 + (zScore * 10);
    issue.score = issue.tScore;
    issue.normalizedScore = Math.min(100, Math.max(0, issue.tScore));
  });

  return issueScores;
};

/**
 * Determine severity level based on score and method
 * 
 * @params {issueId}: string - Issue identifier
 * @params {score}: number - Calculated score
 * @params {method}: string - Assessment method
 * @returns Severity level (normal, borderline, clinical)
 */
const determineSeverity = (issueId, score, method) => {
  const issueConfig = ASSESSMENT_CONSTANTS.issues[issueId];
  if (!issueConfig) return ASSESSMENT_CONSTANTS.severityLevels.NORMAL;

  const thresholdType = method === 'weighted_average' ? 'weighted_average' : 't_score';
  const thresholds = issueConfig.thresholds[thresholdType];

  if (!thresholds) return ASSESSMENT_CONSTANTS.severityLevels.NORMAL;

  if (score >= thresholds.clinical.min) {
    return ASSESSMENT_CONSTANTS.severityLevels.CLINICAL;
  } else if (score >= thresholds.borderline.min) {
    return ASSESSMENT_CONSTANTS.severityLevels.BORDERLINE;
  } else {
    return ASSESSMENT_CONSTANTS.severityLevels.NORMAL;
  }
};

/**
 * Build complete assessment result
 * 
 * @params {issueScores}: object - Calculated issue scores
 * @params {method}: string - Assessment method
 * @params {conductedBy}: string - Parent/user ID
 * @params {totalQuestions}: number - Total questions answered
 * @returns Complete assessment result object
 */
const buildAssessmentResult = (issueScores, method, conductedBy, totalQuestions) => {
  const assessmentId = uuidv4();
  const issues = [];
  const primaryConcerns = [];
  const recommendations = [];

  Object.values(issueScores).forEach(issueData => {
    const severity = determineSeverity(issueData.issueId, issueData.score, method);
    const issueConfig = ASSESSMENT_CONSTANTS.issues[issueData.issueId];

    const issueResult = {
      issueId: issueData.issueId,
      issueName: issueData.issueName,
      score: Math.round(issueData.score * 100) / 100,
      normalizedScore: Math.round(issueData.normalizedScore * 100) / 100,
      severity
    };

    if (issueData.tScore !== undefined) {
      issueResult.tScore = Math.round(issueData.tScore * 100) / 100;
    }

    if (severity === ASSESSMENT_CONSTANTS.severityLevels.NORMAL && issueConfig) {
      issueResult.recommendedCourseId = issueConfig.recommendedCourseId;
    }

    if (severity === ASSESSMENT_CONSTANTS.severityLevels.BORDERLINE && issueConfig) {
      issueResult.professionalReferral = {
        required: true,
        contactDetails: issueConfig.professional
      };
      primaryConcerns.push(issueData.issueName);
      
      recommendations.push({
        category: issueData.issueName,
        text: `Professional consultation recommended for ${issueData.issueName}`,
        priority: 'high'
      });
    }

    if (severity === ASSESSMENT_CONSTANTS.severityLevels.CLINICAL) {
      primaryConcerns.push(issueData.issueName);
      
      recommendations.push({
        category: issueData.issueName,
        text: `Immediate professional intervention recommended for ${issueData.issueName}`,
        priority: 'critical'
      });
    }

    issues.push(issueResult);
  });

  issues.sort((a, b) => b.score - a.score);

  const overallSummary = generateOverallSummary(issues);

  return {
    assessmentId,
    method,
    assessmentDate: new Date(),
    conductedBy,
    issues,
    primaryConcerns,
    overallSummary,
    recommendations,
    metadata: {
      totalQuestions,
      confidence: calculateConfidence(totalQuestions),
      riskIndicators: primaryConcerns
    }
  };
};

/**
 * Generate overall assessment summary
 * 
 * @params {issues}: array - Assessed issues
 * @returns Summary text
 */
const generateOverallSummary = (issues) => {
  const borderlineCount = issues.filter(i => i.severity === 'borderline').length;
  const clinicalCount = issues.filter(i => i.severity === 'clinical').length;

  if (clinicalCount > 0) {
    return `Assessment indicates ${clinicalCount} clinical concern(s) requiring immediate attention. Professional consultation is strongly recommended.`;
  } else if (borderlineCount > 0) {
    return `Assessment shows ${borderlineCount} borderline concern(s). Professional evaluation is recommended for comprehensive support.`;
  } else {
    return `Assessment results are within normal ranges. Recommended courses have been assigned to support continued healthy development.`;
  }
};

/**
 * Calculate confidence score based on questions answered
 * 
 * @params {totalQuestions}: number - Total questions answered
 * @returns Confidence percentage
 */
const calculateConfidence = (totalQuestions) => {
  if (totalQuestions >= 50) return 95;
  if (totalQuestions >= 30) return 85;
  if (totalQuestions >= 20) return 75;
  if (totalQuestions >= 10) return 65;
  return 50;
};

/**
 * Attach assessment result to child record
 * 
 * @params {childId}: string - Child ID
 * @params {assessmentResult}: object - Assessment result
 * @returns Updated child object
 */
const attachAssessmentToChild = async (childId, assessmentResult) => {
  try {
    const updated = await Child.findByIdAndUpdate(
      childId,
      { $push: { assessmentResults: assessmentResult } },
      { new: true }
    );

    if (!updated) {
      logger.warn('Failed to attach assessment to child', { childId });
      return null;
    }

    logger.info('Assessment attached to child', { 
      childId, 
      assessmentId: assessmentResult.assessmentId 
    });

    return updated;
  } catch (error) {
    logger.error('Error attaching assessment to child', { 
      childId, 
      error: error.message 
    });
    throw error;
  }
};

/**
 * Process courses and professional referrals based on assessment
 * 
 * @params {childId}: string - Child ID
 * @params {assessmentResult}: object - Assessment result
 * @returns Updated child with courses
 */
const processCoursesAndReferrals = async (childId, assessmentResult) => {
  try {
    const courseIds = [];

    assessmentResult.issues.forEach(issue => {
      if (issue.severity === ASSESSMENT_CONSTANTS.severityLevels.NORMAL && issue.recommendedCourseId) {
        courseIds.push(issue.recommendedCourseId);
      }
    });

    if (courseIds.length > 0) {
      await Child.findByIdAndUpdate(
        childId,
        { $addToSet: { courseIds: { $each: courseIds } } }
      );

      logger.info('Courses assigned to child', { 
        childId, 
        courseCount: courseIds.length 
      });
    }

    const referralsNeeded = assessmentResult.issues.filter(
      issue => issue.professionalReferral?.required
    ).length;

    if (referralsNeeded > 0) {
      logger.info('Professional referrals needed', { 
        childId, 
        referralCount: referralsNeeded 
      });
    }

    return { coursesAssigned: courseIds.length, referralsNeeded };
  } catch (error) {
    logger.error('Error processing courses and referrals', { 
      childId, 
      error: error.message 
    });
    throw error;
  }
};

/**
 * Get assessment by ID for a child
 * 
 * @params {childId}: string - Child ID
 * @params {assessmentId}: string - Assessment ID
 * @returns Assessment result
 */
const getAssessmentById = async (childId, assessmentId) => {
  try {
    const child = await Child.findById(childId);
    if (!child) {
      const error = new Error(`Child with ID ${childId} not found`);
      error.statusCode = 404;
      error.code = 'CHILD_NOT_FOUND';
      throw error;
    }

    const assessment = child.assessmentResults.find(
      ar => ar.assessmentId === assessmentId
    );

    if (!assessment) {
      const error = new Error(`Assessment with ID ${assessmentId} not found`);
      error.statusCode = 404;
      error.code = 'ASSESSMENT_NOT_FOUND';
      throw error;
    }

    return assessment;
  } catch (error) {
    logger.error('Error fetching assessment', { 
      childId, 
      assessmentId, 
      error: error.message 
    });
    throw error;
  }
};

/**
 * Get all assessments for a child
 * 
 * @params {childId}: string - Child ID
 * @returns Array of assessments
 */
const getChildAssessments = async (childId) => {
  try {
    const child = await Child.findById(childId).select('assessmentResults');
    if (!child) {
      const error = new Error(`Child with ID ${childId} not found`);
      error.statusCode = 404;
      error.code = 'CHILD_NOT_FOUND';
      throw error;
    }

    return child.assessmentResults || [];
  } catch (error) {
    logger.error('Error fetching child assessments', { 
      childId, 
      error: error.message 
    });
    throw error;
  }
};

module.exports = {
  processAssessment,
  getAssessmentById,
  getChildAssessments,
  determineSeverity,
  calculateConfidence
};
