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
} else {
  console.log('🔓 Rate limiting disabled in development mode');
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine the base path - works for both Docker and local development
    const isDocker = fs.existsSync('/.dockerenv');
    const projectRoot = isDocker ? '/app' : path.resolve(process.cwd(), '..');
    
    // Determine upload directory based on the URL - use originalUrl for most reliable detection
    let uploadDir;
    console.log('=== MULTER DESTINATION DEBUG ===');
    console.log('Multer destination - originalUrl:', req.originalUrl);
    console.log('Multer destination - route.path:', req.route?.path);
    console.log('Multer destination - method:', req.method);
    console.log('Multer destination - isDocker:', isDocker);
    console.log('Multer destination - projectRoot:', projectRoot);
    
    if (req.originalUrl && req.originalUrl.includes('/screenshots')) {
      uploadDir = path.join(projectRoot, 'frontend/public/images/screenshots');
      console.log('Detected screenshots upload - URL:', req.originalUrl);
    } else if (req.originalUrl && req.originalUrl.includes('/admin/animes')) {
      uploadDir = path.join(projectRoot, 'frontend/public/images/anime');
      console.log('Detected anime upload - URL:', req.originalUrl);
    } else if (req.originalUrl && req.originalUrl.includes('/admin/mangas')) {
      uploadDir = path.join(projectRoot, 'frontend/public/images/mangas');
      console.log('Detected manga upload - URL:', req.originalUrl);
    } else {
      uploadDir = path.join(projectRoot, 'frontend/public/images');
      console.log('Default upload directory - URL:', req.originalUrl);
    }
    
    // Verify path exists and create if it doesn't
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('Created upload directory:', uploadDir);
      }
      
      console.log('Final upload directory:', uploadDir);
      console.log('Directory exists:', fs.existsSync(uploadDir));
      
      // Test write permissions
      try {
        fs.accessSync(uploadDir, fs.constants.W_OK);
        console.log('Directory is writable: YES');
      } catch (accessError) {
        console.log('Directory is writable: NO -', accessError.message);
      }
      
      cb(null, uploadDir);
    } catch (error) {
      console.error('Error setting up upload directory:', error);
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + extension;
    
    console.log('Generated filename:', filename);
    console.log('Original filename:', file.originalname);
    console.log('File field name:', file.fieldname);
    
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/gif', 'image/png', 'image/webp'];
  const allowedExtensions = /\.(jpeg|jpg|gif|png|webp)$/i;
  
  const extname = allowedExtensions.test(file.originalname.toLowerCase());
  const mimetype = allowedMimeTypes.includes(file.mimetype.toLowerCase());

  console.log('File validation:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    extname: extname,
    mimetypeValid: mimetype
  });

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error(`Only JPEG, JPG, GIF and PNG images are allowed. Received: ${file.mimetype}`));
  }
};

// Create memory storage as fallback
const memoryStorage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Also create a memory upload for debugging
const memoryUpload = multer({
  storage: memoryStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  }
});

// Make upload middleware available globally
app.locals.upload = upload;
app.locals.memoryUpload = memoryUpload;

// Serve static files (images) with CORS support
const isDocker = fs.existsSync('/.dockerenv');
const projectRoot = isDocker ? '/app' : path.resolve(process.cwd(), '..');
const publicPath = path.join(projectRoot, 'frontend/public');

console.log('Setting up static file serving from:', publicPath);
app.use('/images', cors({
  origin: true,
  credentials: false
}), express.static(path.join(publicPath, 'images')));

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

// Start server - bind to 0.0.0.0 for Docker compatibility
app.listen(port, '0.0.0.0', () => {
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