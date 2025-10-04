const express = require('express');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Import route modules
const authRoutes = require('./auth');
const assessmentRoutes = require('./assessmentsRoutes');
const childrenRoutes = require('./childrenRoutes');
const childEducationRoutes = require('./childEducationRoutes');
const childNutritionRoutes = require('./childNutritionRoutes');
const courseRoutes = require('./coursesRoutes');
const parentRoutes = require('./parentsRoutes');
const questionRoutes = require('./questionsRoutes');

// Import utilities
const logger = require('../utils/logger');
const swaggerOptions = require('../../swagger.json');

const router = express.Router();


let swaggerSpec;
try {
  swaggerSpec = swaggerJSDoc(swaggerOptions);
} catch (error) {
  logger.error('Swagger specification generation failed:', error);
  swaggerSpec = {
    openapi: '3.0.0',
    info: { title: 'API Documentation', version: '1.0.0' },
    paths: {}
  };
}

// API Documentation (only in development or if explicitly enabled)
if (process.env.NODE_ENV === 'development' || process.env.API_DOCS_ENABLED === 'true') {
  router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #3b82f6 }
    `,
    customSiteTitle: 'Node.js Server API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      tryItOutEnabled: true
    }
  }));

  // Serve swagger spec as JSON
  router.get('/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  logger.info('API documentation enabled at /api/v1/docs');
}

// API Routes
router.use('/auth', authRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/children', childrenRoutes);
router.use('/child-education', childEducationRoutes);
router.use('/child-nutrition', childNutritionRoutes);
router.use('/courses', courseRoutes);
router.use('/parents', parentRoutes);
router.use('/questions', questionRoutes);

// API Information endpoint
router.get('/', (req, res) => {
  const info = {
    name: 'Node.js Server API - Layered Architecture',
    version: '1.0.0',
    description: 'A comprehensive Node.js server with proper layered architecture',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    endpoints: {
      documentation: process.env.NODE_ENV === 'development' || process.env.API_DOCS_ENABLED === 'true' 
        ? '/api/v1/docs' 
        : null,
      healthCheck: '/health-check',
      authentication: {
        base: '/api/v1/auth',
        register: '/api/v1/auth/register',
        login: '/api/v1/auth/login',
        profile: '/api/v1/auth/profile',
        refresh: '/api/v1/auth/refresh',
        logout: '/api/v1/auth/logout'
      },
      users: {
        base: '/api/v1/users',
        list: '/api/v1/users',
        stats: '/api/v1/users/stats',
        search: '/api/v1/users/search',
        export: '/api/v1/users/export',
        bulkUpdate: '/api/v1/users/bulk-update'
      }
    },
    features: [
      'JWT Authentication',
      'Role-based Authorization', 
      'Input Validation',
      'Rate Limiting',
      'Request Logging',
      'Error Handling',
      'API Documentation',
      'Health Monitoring',
      'Redis Caching',
      'MongoDB Integration'
    ],
    architecture: {
      pattern: 'Layered Architecture',
      layers: [
        'Routes (HTTP endpoints)',
        'Controllers (Request/Response handling)',
        'Services (Business logic)',
        'Models (Data layer)',
        'Middleware (Cross-cutting concerns)',
        'Validations (Input validation)'
      ]
    },
    status: 'operational'
  };

  // Log API info request
  logger.api(req.method, req.originalUrl, 200, 0, {
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  res.json(info);
});

// Route usage statistics (development only)
if (process.env.NODE_ENV === 'development') {
  router.get('/stats', (req, res) => {
    // This is a placeholder for route statistics
    // In a real application, you might track route usage
    res.json({
      message: 'Route statistics feature',
      note: 'This endpoint would show API usage statistics in a real implementation',
      routes: {
        '/auth': 'Authentication routes',
        '/users': 'User management routes'
      }
    });
  });
}

module.exports = router;
