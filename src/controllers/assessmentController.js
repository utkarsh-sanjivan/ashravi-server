const assessmentService = require('../services/assessmentService');
const logger = require('../utils/logger');
const { sanitizeInput } = require('../validations/commonValidation');

/**
 * Process parent assessment for child
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Assessment result
 */
const processAssessment = async (req, res, next) => {
  try {
    const sanitizedData = sanitizeInput(req.body);
    const { responses, childId, method } = sanitizedData;
    const parentId = req.user.id;

    logger.info('Processing assessment', { 
      childId, 
      parentId, 
      method, 
      responseCount: responses.length 
    });

    const result = await assessmentService.processAssessment(
      responses,
      childId,
      parentId,
      method
    );

    res.status(200).json({
      success: true,
      message: 'Assessment processed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get specific assessment by ID
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Assessment data
 */
const getAssessment = async (req, res, next) => {
  try {
    const { childId, assessmentId } = req.params;

    const assessment = await assessmentService.getAssessmentById(childId, assessmentId);

    res.json({
      success: true,
      data: assessment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all assessments for a child
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Array of assessments
 */
const getChildAssessments = async (req, res, next) => {
  try {
    const { childId } = req.params;

    const assessments = await assessmentService.getChildAssessments(childId);

    res.json({
      success: true,
      data: assessments,
      count: assessments.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get latest assessment for a child
 * 
 * @params {req}: Request - Express request object
 * @params {res}: Response - Express response object
 * @params {next}: Function - Next middleware
 * @returns Latest assessment
 */
const getLatestAssessment = async (req, res, next) => {
  try {
    const { childId } = req.params;

    const assessments = await assessmentService.getChildAssessments(childId);

    if (assessments.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No assessments found for this child'
      });
    }

    const latestAssessment = assessments[assessments.length - 1];

    res.json({
      success: true,
      data: latestAssessment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  processAssessment,
  getAssessment,
  getChildAssessments,
  getLatestAssessment
};
