require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Import database connection
const pool = require('./config/database');

// Import routes
const setupRoutes = require('./routes/index');

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Anime-Kun API',
      version: '2.0.0',
      description: 'API REST pour la base de données d\'animes et mangas avec PostgreSQL',
      contact: {
        name: 'Anime-Kun Team',
        email: 'contact@anime-kun.com',
        url: 'https://anime-kun.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Development server'
      },
      {
        url: 'https://api.anime-kun.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./routes/*.js'], // Path to the API docs in route files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Security and middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// CORS configuration - allow all origins for development
app.use(cors({
  origin: true, // Allow all origins during development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));

// Rate limiting - disabled in development, enabled in production
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // 100 requests per window for production
  });
  app.use('/api/', limiter);
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine upload directory based on the route
    let uploadDir;
    if (req.route && req.route.path && req.route.path.includes('screenshots')) {
      uploadDir = path.join(__dirname, '../frontend/public/images/screenshots');
    } else if (req.originalUrl && req.originalUrl.includes('/admin/animes')) {
      uploadDir = path.join(__dirname, '../frontend/public/images/anime');
    } else if (req.originalUrl && req.originalUrl.includes('/admin/mangas')) {
      uploadDir = path.join(__dirname, '../frontend/public/images/mangas');
    } else {
      uploadDir = path.join(__dirname, '../frontend/public/images');
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = /jpeg|jpg|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPEG, JPG and GIF images are allowed'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Make upload middleware available globally
app.locals.upload = upload;

// Swagger documentation
app.get('/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Anime-Kun API Documentation'
}));

// API root endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Anime-Kun API v2.0',
    database: 'PostgreSQL',
    status: 'active',
    documentation: '/docs',
    endpoints: {
      authentication: '/api/auth/*',
      animes: '/api/animes',
      mangas: '/api/mangas',
      reviews: '/api/reviews',
      users: '/api/users',
      search: '/api/search',
      admin: '/api/admin/*',
      business: '/api/business/*'
    }
  });
});

// Setup all routes
setupRoutes(app);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      database: 'connected', 
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      database: 'disconnected', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Handle multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Fichier trop volumineux (max 10MB)' });
    }
    return res.status(400).json({ error: 'Erreur lors de l\'upload du fichier' });
  }
  
  // Handle other errors
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' ? 'Erreur interne du serveur' : err.message 
  });
});

// 404 handler
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'Endpoint introuvable' });
  } else {
    res.status(404).json({ error: 'Page introuvable' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Anime-Kun API v2.0 running on http://localhost:${port}`);
  console.log(`📊 Health check at http://localhost:${port}/health`);
  console.log(`📚 API documentation at http://localhost:${port}/docs`);
  console.log(`🔧 API endpoints at http://localhost:${port}/api`);
  console.log(`💾 Database: PostgreSQL`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

module.exports = app;