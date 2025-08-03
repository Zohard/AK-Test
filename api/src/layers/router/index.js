const express = require('express');
const animeRouter = require('./anime');
const mangaRouter = require('./manga');
const authRouter = require('./auth');
const reviewRouter = require('./review');

const router = express.Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   responses:
 *     UnauthorizedError:
 *       description: Access token is missing or invalid
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "Unauthorized access"
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     ForbiddenError:
 *       description: Insufficient permissions
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "Access forbidden"
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     ValidationError:
 *       description: Request validation failed
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "Validation failed"
 *               errors:
 *                 type: array
 *                 items:
 *                   type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     ServerError:
 *       description: Internal server error
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "Internal server error"
 *               timestamp:
 *                 type: string
 *                 format: date-time
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Root endpoint
 *     tags: [General]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 version:
 *                   type: string
 *                 documentation:
 *                   type: string
 *                 endpoints:
 *                   type: object
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Anime-Kun API v2.0 - Layered Architecture',
    version: '2.0.0',
    documentation: '/docs',
    endpoints: {
      animes: '/api/animes',
      mangas: '/api/mangas',
      reviews: '/api/reviews',
      auth: '/api/auth',
      admin: {
        animes: '/api/admin/animes',
        mangas: '/api/admin/mangas',
        reviews: '/api/admin/reviews',
        users: '/api/admin/users'
      },
      sso: '/sso',
      health: '/health',
      metrics: '/metrics'
    },
    features: [
      'RESTful API',
      'JWT Authentication',
      'Discourse SSO Integration',
      'Layered Architecture',
      'PostgreSQL Database',
      'Swagger Documentation',
      'Rate Limiting',
      'Request Validation',
      'Error Handling',
      'Security Headers'
    ]
  });
});

/**
 * @swagger
 * /api:
 *   get:
 *     summary: API information endpoint
 *     tags: [General]
 *     responses:
 *       200:
 *         description: API information
 */
router.get('/api', (req, res) => {
  res.json({
    message: 'Anime-Kun API v2.0',
    version: '2.0.0',
    architecture: 'Layered Architecture',
    layers: {
      presentation: 'Controllers handle HTTP requests/responses',
      router: 'Route definitions and middleware',
      service: 'Business logic and validation',
      data: 'Repository pattern for database access'
    },
    documentation: '/docs',
    timestamp: new Date().toISOString()
  });
});

// Mount routers
router.use('/api/animes', animeRouter);
router.use('/api/mangas', mangaRouter);
router.use('/api/auth', authRouter);
router.use('/api/reviews', reviewRouter);

// Mount auth router for SSO endpoints at root level
router.use('/', authRouter);

// Health check endpoint
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [General]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 memory:
 *                   type: object
 *                 version:
 *                   type: string
 */
router.get('/health', async (req, res) => {
  try {
    const healthInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '2.0.0',
      architecture: 'layered',
      database: 'postgresql'
    };

    // TODO: Add database health check
    // const db = require('../config/database');
    // await db.query('SELECT 1');
    // healthInfo.database_status = 'connected';

    res.json(healthInfo);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('Router error:', err);

  // Handle different types of errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.details || [err.message],
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access',
      timestamp: new Date().toISOString()
    });
  }

  if (err.status === 403) {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden',
      timestamp: new Date().toISOString()
    });
  }

  // Default to 500 server error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { error: err.message, stack: err.stack })
  });
});

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;