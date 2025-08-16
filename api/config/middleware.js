const cors = require('cors');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');

const setupMiddleware = (app) => {
  // CORS setup
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
  }));

  // Rate limiting - disabled in development, enabled in production
  if (process.env.NODE_ENV === 'production') {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100
    });
    app.use('/api/', limiter);
  }

  // Static files
  app.use('/public', express.static(path.join(__dirname, '../../frontend/public')));
};

module.exports = { setupMiddleware };
