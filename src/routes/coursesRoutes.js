const express = require('express');
const { validateRequest, validateParams, validateQuery } = require('../validations/commonValidation');
const courseValidation = require('../validations/courseValidation');
const courseController = require('../controllers/courseController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/',
  auth,
  authorize('admin', 'instructor'),
  validateRequest(courseValidation.create),
  courseController.createCourse
);

router.get('/',
  validateQuery(courseValidation.query),
  courseController.getCourses
);

router.get('/my-progress',
  auth,
  courseController.getUserProgress
);

router.get('/slug/:slug',
  validateParams(courseValidation.slugParam),
  courseController.getCourseBySlug
);

router.get('/:id',
  validateParams(courseValidation.idParam),
  courseController.getCourse
);

router.patch('/:id',
  auth,
  authorize('admin', 'instructor'),
  validateParams(courseValidation.idParam),
  validateRequest(courseValidation.update),
  courseController.updateCourse
);

router.delete('/:id',
  auth,
  authorize('admin'),
  validateParams(courseValidation.idParam),
  courseController.deleteCourse
);

router.post('/:id/enroll',
  auth,
  validateParams(courseValidation.idParam),
  courseController.enrollInCourse
);

router.get('/:id/progress',
  auth,
  validateParams(courseValidation.idParam),
  courseController.getUserCourseProgress
);

router.post('/:id/progress/video',
  auth,
  validateParams(courseValidation.idParam),
  validateRequest(courseValidation.updateVideoProgress),
  courseController.updateVideoProgress
);

router.post('/:id/progress/test',
  auth,
  validateParams(courseValidation.idParam),
  validateRequest(courseValidation.updateTestProgress),
  courseController.updateTestProgress
);

router.patch('/:id/progress/notes',
  auth,
  validateParams(courseValidation.idParam),
  validateRequest(courseValidation.updateCourseNotes),
  courseController.updateCourseNotes
);

router.post('/:id/certificate',
  auth,
  validateParams(courseValidation.idParam),
  courseController.issueCertificate
);

router.post('/:courseId/sections/:sectionId/pdfs',
  auth,
  authorize('admin', 'instructor'),
  validateParams(courseValidation.sectionPdfParams),
  validateRequest(courseValidation.addPdfs),
  courseController.addPdfsToSection
);

router.delete('/:courseId/sections/:sectionId/pdfs/:pdfId',
  auth,
  authorize('admin', 'instructor'),
  validateParams(courseValidation.removePdfParams),
  courseController.removePdfFromSection
);

module.exports = router;
