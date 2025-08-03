require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const promClient = require('prom-client');

// Import configurations
const database = require('./src/config/database');
const { swaggerSpec } = require('./src/config/swagger');
const { handleMulterError } = require('./src/config/multer');

// Import routes
const routes = require('./src/layers/router');

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Root - Layered Architecture
 *     tags: [General]
 *     responses:
 *       200:
 *         description: Welcome to Anime-Kun API v2.0
 */

class AnimeKunServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    this.setupMetrics();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
    }));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'production' ? 100 : 1000, // limit each IP
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        timestamp: new Date().toISOString()
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use(limiter);

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());

    // Logging
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined'));
    }

    // Static files
    this.app.use('/uploads', express.static('uploads'));
  }

  setupRoutes() {
    // API Documentation
    this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Anime-Kun API Documentation',
      customfavIcon: '/favicon.ico'
    }));

    // Swagger JSON endpoint
    this.app.get('/docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    // Mount all routes through the router layer
    this.app.use('/', routes);
  }

  setupErrorHandling() {
    // Multer error handling
    this.app.use(handleMulterError);

    // Global error handler
    this.app.use((err, req, res, next) => {
      console.error('Global error handler:', err);

      // Log error details in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error stack:', err.stack);
      }

      // Handle different types of errors
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: err.details || [err.message],
          timestamp: new Date().toISOString()
        });
      }

      if (err.name === 'UnauthorizedError' || err.statusCode === 401) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized access',
          timestamp: new Date().toISOString()
        });
      }

      if (err.statusCode === 403) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden',
          timestamp: new Date().toISOString()
        });
      }

      // Database errors
      if (err.code && err.code.startsWith('ER_')) {
        return res.status(500).json({
          success: false,
          message: 'Database error occurred',
          timestamp: new Date().toISOString()
        });
      }

      // Default error response
      const statusCode = err.statusCode || err.status || 500;
      res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal server error',
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { 
          error: err.message, 
          stack: err.stack 
        })
      });
    });

    // 404 handler (catch all)
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    });
  }

  setupMetrics() {
    // Create a Registry which registers the metrics
    const register = new promClient.Registry();

    // Add a default label which is added to all metrics
    register.setDefaultLabels({
      app: 'anime-kun-api',
      version: '2.0.0'
    });

    // Enable the collection of default metrics
    promClient.collectDefaultMetrics({ register });

    // Custom metrics
    const httpRequestsTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [register]
    });

    const httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      registers: [register]
    });

    // Middleware to collect metrics
    this.app.use((req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route ? req.route.path : req.path;
        
        httpRequestsTotal.inc({
          method: req.method,
          route: route,
          status_code: res.statusCode
        });
        
        httpRequestDuration.observe({
          method: req.method,
          route: route,
          status_code: res.statusCode
        }, duration);
      });
      
      next();
    });

    // Metrics endpoint
    this.app.get('/metrics', async (req, res) => {
      try {
        res.set('Content-Type', register.contentType);
        const metrics = await register.metrics();
        res.end(metrics);
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to collect metrics',
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  async start() {
    try {
      // Connect to database
      await database.connect();
      console.log('✅ Database connected successfully');

      // Start server
      this.server = this.app.listen(this.port, () => {
        console.log('🚀 Anime-Kun API v2.0 (Layered Architecture) is running!');
        console.log(`📍 Server: http://localhost:${this.port}`);
        console.log(`📚 Documentation: http://localhost:${this.port}/docs`);
        console.log(`📊 Metrics: http://localhost:${this.port}/metrics`);
        console.log(`🏥 Health: http://localhost:${this.port}/health`);
        console.log('🏗️  Architecture: 4-Layer (Controller → Service → Repository → Database)');
        console.log('🛡️  Security: Helmet, CORS, Rate Limiting');
        console.log('📝 Features: JWT Auth, SSO, Swagger, Metrics, Error Handling');
      });

      // Graceful shutdown handling
      process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  async gracefulShutdown(signal) {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    
    if (this.server) {
      this.server.close(async () => {
        console.log('📥 HTTP server closed');
        
        try {
          await database.close();
          console.log('🔌 Database connection closed');
        } catch (error) {
          console.error('❌ Error closing database:', error);
        }
        
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      });
    }
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new AnimeKunServer();
  server.start();
}

module.exports = AnimeKunServer;