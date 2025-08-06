require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const morgan = require('morgan');
const NodeCache = require('node-cache');
const promClient = require('prom-client');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import authentication utilities
const { verifyPassword, generateToken, sanitizeUser } = require('./utils/auth');
const { authenticateToken: authMiddleware, optionalAuth, requireAdmin: adminMiddleware } = require('./middleware/auth');

const app = express();
const port = process.env.PORT || 3000;

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
        url: `http://localhost:${process.env.EXTERNAL_PORT || 3001}`,
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
      },
      schemas: {
        Anime: {
          type: 'object',
          properties: {
            id_anime: { type: 'integer', description: 'ID unique de l\'anime' },
            nice_url: { type: 'string', description: 'URL SEO-friendly' },
            titre: { type: 'string', description: 'Titre de l\'anime' },
            titre_orig: { type: 'string', description: 'Titre original' },
            annee: { type: 'integer', description: 'Année de sortie' },
            nb_ep: { type: 'integer', description: 'Nombre d\'épisodes' },
            studio: { type: 'string', description: 'Studio d\'animation' },
            synopsis: { type: 'string', description: 'Synopsis' },
            image: { type: 'string', description: 'URL de l\'image' },
            moyenne_notes: { type: 'number', description: 'Note moyenne' },
            nb_reviews: { type: 'integer', description: 'Nombre de critiques' },
            statut: { type: 'integer', description: 'Statut (1=actif, 0=inactif)' }
          }
        },
        Manga: {
          type: 'object',
          properties: {
            id_manga: { type: 'integer', description: 'ID unique du manga' },
            nice_url: { type: 'string', description: 'URL SEO-friendly' },
            titre: { type: 'string', description: 'Titre du manga' },
            auteur: { type: 'string', description: 'Auteur/Mangaka' },
            annee: { type: 'integer', description: 'Année de publication' },
            nb_volumes: { type: 'integer', description: 'Nombre de volumes' },
            synopsis: { type: 'string', description: 'Synopsis' },
            image: { type: 'string', description: 'URL de l\'image' },
            moyenne_notes: { type: 'number', description: 'Note moyenne' },
            nb_reviews: { type: 'integer', description: 'Nombre de critiques' }
          }
        },
        Review: {
          type: 'object',
          properties: {
            id_critique: { type: 'integer', description: 'ID unique de la critique' },
            titre: { type: 'string', description: 'Titre de la critique' },
            critique: { type: 'string', description: 'Contenu de la critique' },
            notation: { type: 'integer', minimum: 1, maximum: 10, description: 'Note sur 10' },
            id_membre: { type: 'integer', description: 'ID de l\'auteur' },
            id_anime: { type: 'integer', description: 'ID de l\'anime (si applicable)' },
            id_manga: { type: 'integer', description: 'ID du manga (si applicable)' },
            date_critique: { type: 'string', format: 'date-time', description: 'Date de création' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id_member: { type: 'integer', description: 'ID unique de l\'utilisateur' },
            member_name: { type: 'string', description: 'Nom d\'utilisateur' },
            real_name: { type: 'string', description: 'Nom réel' },
            email_address: { type: 'string', format: 'email', description: 'Adresse email' },
            date_registered: { type: 'string', format: 'date-time', description: 'Date d\'inscription' },
            nb_critiques: { type: 'integer', description: 'Nombre de critiques écrites' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Message d\'erreur' },
            message: { type: 'string', description: 'Description détaillée' }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', description: 'Page actuelle' },
            limit: { type: 'integer', description: 'Nombre d\'éléments par page' },
            total: { type: 'integer', description: 'Nombre total d\'éléments' },
            pages: { type: 'integer', description: 'Nombre total de pages' }
          }
        }
      }
    }
  },
  apis: ['./server.js'], // Path to the API docs
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

// Rate limiting - more permissive for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000 // 1000 requests for dev, 100 for production
});
app.use('/api/', limiter);

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
    cb(new Error('Formats autorisés: JPG, JPEG, GIF uniquement'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 200 * 1024 // 200KB max
  },
  fileFilter: fileFilter
});

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'anime-kun-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());


// Swagger UI with CORS-friendly configuration
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Anime-Kun API Documentation',
  swaggerOptions: {
    url: `/docs.json`,
    // Explicitly set the server URL to avoid CORS issues
    servers: [
      {
        url: `http://localhost:${process.env.EXTERNAL_PORT || 3001}`,
        description: 'Development server'
      }
    ],
    requestInterceptor: (req) => {
      // Ensure proper headers for CORS
      req.headers['Accept'] = 'application/json';
      return req;
    }
  }
}));

// Swagger JSON with CORS headers
app.get('/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.send(swaggerSpec);
});

// Serve static files for images and screenshots
app.use('/public', express.static(path.join(__dirname, '../frontend/public')));

// Cache and metrics
const cache = new NodeCache({ stdTTL: 600 });
const register = promClient.register;
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status']
});

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'anime_user',
  password: process.env.DB_PASSWORD || 'anime_password',
  database: process.env.DB_NAME || 'anime_kun',
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware to track requests
app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode
    });
  });
  next();
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Passport configuration
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const result = await pool.query('SELECT * FROM smf_members WHERE email_address = $1', [email]);
      const user = result.rows[0];
      
      if (!user) {
        return done(null, false, { message: 'User not found' });
      }
      
      const isValid = await bcrypt.compare(password, user.passwd);
      if (!isValid) {
        return done(null, false, { message: 'Invalid password' });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id_member);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM smf_members WHERE id_member = $1', [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error);
  }
});

// ===== API ROOT =====

// API Root - Documentation
app.get('/', (req, res) => {
  res.json({
    message: 'Anime-Kun API v2.0',
    description: 'API REST pour la base de données d\'animes et mangas',
    database: 'PostgreSQL',
    status: 'active',
    documentation: {
      swagger_ui: '/docs',
      swagger_json: '/docs.json',
      endpoints: '/api',
      health: '/health',
      metrics: '/metrics'
    },
    version: '2.0.0',
    contact: {
      email: 'contact@anime-kun.com',
      website: 'https://anime-kun.com'
    }
  });
});

// API Routes
app.get('/api', (req, res) => {
  res.json({
    message: 'Anime-Kun API v2.0',
    database: 'PostgreSQL',
    status: 'active',
    endpoints: {
      authentication: '/api/auth/*',
      animes: '/api/animes',
      mangas: '/api/mangas',
      reviews: '/api/reviews',
      users: '/api/users',
      search: '/api/search',
      webzine: '/api/webzine/*'
    }
  });
});

// ===== AUTHENTICATION ROUTES =====

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     description: Crée un nouveau compte utilisateur et retourne un token JWT
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - username
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Adresse email unique
 *                 example: "user@anime-kun.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Mot de passe (minimum 6 caractères)
 *                 example: "motdepasse123"
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 description: Nom d'utilisateur unique
 *                 example: "otaku_fan"
 *               realName:
 *                 type: string
 *                 description: Nom réel (optionnel)
 *                 example: "Jean Dupont"
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token JWT pour l'authentification
 *                 user:
 *                   type: object
 *                   properties:
 *                     id_member:
 *                       type: integer
 *                     member_name:
 *                       type: string
 *                     email_address:
 *                       type: string
 *       400:
 *         description: Données invalides ou utilisateur déjà existant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/auth/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('username').isLength({ min: 3 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password, username, realName } = req.body;
    
    // Check if user exists
    const existingUser = await pool.query(
      'SELECT * FROM smf_members WHERE email_address = $1 OR member_name = $2',
      [email, username]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert user
    const result = await pool.query(`
      INSERT INTO smf_members (member_name, real_name, email_address, passwd, date_registered, id_group)
      VALUES ($1, $2, $3, $4, NOW(), 0)
      RETURNING id_member, member_name, email_address
    `, [username, realName || username, email, hashedPassword]);
    
    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id_member, username: user.member_name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     description: Authentifie un utilisateur et retourne un token JWT
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Nom d'utilisateur ou adresse email
 *                 example: "zohard"
 *               password:
 *                 type: string
 *                 description: Mot de passe
 *                 example: "motdepasse123"
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token JWT pour l'authentification
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Identifiants incorrects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/auth/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array() 
    });
  }

  try {
    const { username, password } = req.body;
    
    // Find user by username or email
    const result = await pool.query(
      'SELECT * FROM smf_members WHERE member_name = $1 OR email_address = $1', 
      [username]
    );
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify SMF password
    const isPasswordValid = verifyPassword(
      password, 
      user.passwd, 
      user.member_name, 
      user.password_salt
    );
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login (Unix timestamp)
    await pool.query(
      'UPDATE smf_members SET last_login = $1 WHERE id_member = $2', 
      [Math.floor(Date.now() / 1000), user.id_member]
    );
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Return sanitized user data
    const sanitizedUser = sanitizeUser(user);
    
    res.json({ 
      success: true,
      token, 
      user: sanitizedUser 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Déconnexion utilisateur
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *       401:
 *         description: Token invalide
 */
app.post('/api/auth/logout', authMiddleware, (req, res) => {
  // With JWT, logout is typically handled client-side by removing the token
  // Here we can implement token blacklisting if needed
  res.json({ 
    success: true,
    message: 'Logged out successfully' 
  });
});

/**
 * @swagger
 * /sso:
 *   get:
 *     summary: Discourse SSO Provider
 *     description: Handles Discourse Single Sign-On authentication
 *     tags: [SSO]
 *     parameters:
 *       - in: query
 *         name: sso
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64 encoded SSO payload from Discourse
 *       - in: query
 *         name: sig
 *         required: true
 *         schema:
 *           type: string
 *         description: HMAC-SHA256 signature of the SSO payload
 *     responses:
 *       302:
 *         description: Redirect to Discourse with authenticated user data
 *       403:
 *         description: Invalid SSO signature
 *       401:
 *         description: User not authenticated
 */
app.get('/sso', async (req, res) => {
  try {
    const { sso, sig } = req.query;
    
    if (!sso || !sig) {
      return res.status(400).json({ error: 'Missing SSO parameters' });
    }

    // Import SSO functions
    const { validateSSOSignature, decodeSSOPayload, createSSOResponse, extractToken, verifyToken, sanitizeUser } = require('./utils/auth');

    // 1. Validate signature
    if (!validateSSOSignature(sso, sig)) {
      return res.status(403).json({ error: 'Invalid SSO signature' });
    }

    // 2. Decode payload
    const ssoParams = decodeSSOPayload(sso);
    
    // 3. Check if user is authenticated
    const token = extractToken(req);
    if (!token) {
      // Redirect to login with SSO parameters preserved
      const loginUrl = `/login?sso=${encodeURIComponent(sso)}&sig=${encodeURIComponent(sig)}`;
      return res.redirect(loginUrl);
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      const loginUrl = `/login?sso=${encodeURIComponent(sso)}&sig=${encodeURIComponent(sig)}`;
      return res.redirect(loginUrl);
    }

    // 4. Get user from database
    const result = await pool.query(
      'SELECT * FROM smf_members WHERE id_member = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = sanitizeUser(result.rows[0]);
    
    // 5. Create SSO response
    const ssoResponse = createSSOResponse(user, ssoParams.nonce);
    
    // 6. Redirect back to Discourse
    const discourseUrl = `${ssoParams.return_sso_url}?sso=${encodeURIComponent(ssoResponse.sso)}&sig=${ssoResponse.sig}`;
    res.redirect(discourseUrl);
    
  } catch (error) {
    console.error('SSO error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /sso/logout:
 *   post:
 *     summary: Discourse SSO Logout
 *     description: Handles logout from Discourse
 *     tags: [SSO]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Not authenticated
 */
app.post('/sso/logout', authMiddleware, (req, res) => {
  // Log the user out from the main site
  // Clear any server-side sessions if you use them
  res.json({ 
    success: true, 
    message: 'Logged out from SSO' 
  });
});

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Profil utilisateur connecté
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur
 *       401:
 *         description: Token invalide
 */
app.get('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM smf_members WHERE id_member = $1', 
      [req.user.id]
    );
    const user = result.rows[0];
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const sanitizedUser = sanitizeUser(user);
    res.json({ user: sanitizedUser });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Vérification du token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token valide
 *       401:
 *         description: Token invalide
 */
app.get('/api/auth/verify', authMiddleware, async (req, res) => {
  try {
    // Get full user data from database to ensure we have latest info
    const result = await pool.query(
      'SELECT * FROM smf_members WHERE id_member = $1', 
      [req.user.id]
    );
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Return sanitized user data with admin status
    const sanitizedUser = sanitizeUser(user);
    
    res.json({ 
      success: true,
      user: sanitizedUser
    });
  } catch (error) {
    console.error('Verify endpoint error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ===== ANIME ROUTES =====

/**
 * @swagger
 * /api/animes:
 *   get:
 *     summary: Récupère la liste des animes
 *     description: Retourne une liste paginée d'animes avec possibilité de filtrage
 *     tags: [Animes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche dans le titre et synopsis
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filtrer par année
 *       - in: query
 *         name: studio
 *         schema:
 *           type: string
 *         description: Filtrer par studio
 *     responses:
 *       200:
 *         description: Liste des animes récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Anime'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/animes', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, year, studio, status, genre } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = 'WHERE statut = 1';
    let params = [];
    let paramCount = 0;
    
    if (search) {
      paramCount++;
      whereClause += ` AND (titre ILIKE $${paramCount} OR synopsis ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    if (year) {
      paramCount++;
      whereClause += ` AND annee = $${paramCount}`;
      params.push(year);
    }
    
    if (studio) {
      paramCount++;
      whereClause += ` AND studio ILIKE $${paramCount}`;
      params.push(`%${studio}%`);
    }
    
    const query = `
      SELECT id_anime, nice_url, titre, titre_orig, annee, nb_ep, studio, 
             image, nb_reviews, moyennenotes as moyenne_notes, date_ajout, synopsis
      FROM ak_animes ${whereClause}
      ORDER BY annee DESC, titre ASC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    params.push(parseInt(limit), offset);
    
    const [animes, total] = await Promise.all([
      pool.query(query, params),
      pool.query(`SELECT COUNT(*) FROM ak_animes ${whereClause}`, params.slice(0, paramCount))
    ]);

    // Get recent reviews for each anime
    const animesWithReviews = await Promise.all(
      animes.rows.map(async (anime) => {
        const reviews = await pool.query(`
          SELECT titre as review_title, notation as rating
          FROM ak_critique
          WHERE id_anime = $1 AND statut = 0
          ORDER BY date_critique DESC
          LIMIT 3
        `, [anime.id_anime]);
        
        return {
          ...anime,
          recent_reviews: reviews.rows
        };
      })
    );
    
    res.json({
      data: animesWithReviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.rows[0].count),
        pages: Math.ceil(total.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Animes fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch animes' });
  }
});

/**
 * @swagger
 * /api/animes/{id}:
 *   get:
 *     summary: Récupère un anime par son ID
 *     description: Retourne les détails complets d'un anime avec ses épisodes, screenshots et critiques récentes
 *     tags: [Animes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'anime
 *     responses:
 *       200:
 *         description: Anime trouvé
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Anime'
 *                 - type: object
 *                   properties:
 *                     episodes:
 *                       type: array
 *                       items:
 *                         type: object
 *                     screenshots:
 *                       type: array
 *                       items:
 *                         type: object
 *                     recent_reviews:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Review'
 *       404:
 *         description: Anime non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/animes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const anime = await pool.query(`
      SELECT a.*, 
             COUNT(c.id_critique) as review_count,
             AVG(c.notation) as avg_rating
      FROM ak_animes a
      LEFT JOIN ak_critique c ON a.id_anime = c.id_anime AND c.statut = 0
      WHERE a.id_anime = $1 AND a.statut = 1
      GROUP BY a.id_anime, a.nice_url, a.titre, a.titre_orig, a.annee, a.nb_ep, a.studio, a.image, a.nb_reviews, a.moyennenotes, a.date_ajout, a.synopsis, a.statut
    `, [id]);
    
    if (anime.rows.length === 0) {
      return res.status(404).json({ error: 'Anime not found' });
    }
    
    // Get episodes (table structure doesn't support anime linking)
    const episodes = { rows: [] };
    
    // Get screenshots (using id_titre as anime id)
    const screenshots = await pool.query(`
      SELECT * FROM ak_screenshots 
      WHERE id_titre = $1 
      ORDER BY id_screen ASC
    `, [id]);
    
    // Get staff
    const staff = await pool.query(`
      SELECT 
        bta.id_business as business_id,
        b.denomination as business_name,
        bta.type as fonction,
        bta.precisions
      FROM ak_business_to_animes bta
      JOIN ak_business b ON bta.id_business = b.id_business
      WHERE bta.id_anime = $1
      ORDER BY bta.type, b.denomination
    `, [id]);
    
    // Get reviews
    const reviews = await pool.query(`
      SELECT c.*, u.member_name as author_name
      FROM ak_critique c
      LEFT JOIN smf_members u ON c.id_membre = u.id_member
      WHERE c.id_anime = $1 AND c.statut = 0
      ORDER BY c.date_critique DESC
      LIMIT 5
    `, [id]);
    
    res.json({
      ...anime.rows[0],
      episodes: episodes.rows,
      screenshots: screenshots.rows,
      staff: staff.rows,
      recent_reviews: reviews.rows
    });
  } catch (error) {
    console.error('Anime fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch anime' });
  }
});

/**
 * @swagger
 * /api/animes/{id}/business:
 *   get:
 *     summary: Récupère les liens business pour un anime
 *     description: Retourne la liste des entreprises/personnes liées à un anime avec leur rôle
 *     tags: [Animes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'anime
 *     responses:
 *       200:
 *         description: Liens business récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_business:
 *                         type: integer
 *                       denomination:
 *                         type: string
 *                       type:
 *                         type: string
 *                       precisions:
 *                         type: string
 *       404:
 *         description: Anime non trouvé
 *       500:
 *         description: Erreur serveur
 */
app.get('/api/animes/:id/business', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if anime exists
    const animeCheck = await pool.query(`
      SELECT id_anime FROM ak_animes WHERE id_anime = $1 AND statut = 1
    `, [id]);
    
    if (animeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Anime not found' });
    }
    
    // Get business links
    const businessLinks = await pool.query(`
      SELECT 
        b.id_business,
        b.denomination,
        b.type as business_type,
        b.site_officiel,
        ba.type,
        ba.precisions
      FROM ak_business_to_animes ba
      INNER JOIN ak_business b ON ba.id_business = b.id_business
      WHERE ba.id_anime = $1 AND b.statut = 1
      ORDER BY ba.type ASC, b.denomination ASC
    `, [id]);
    
    res.json({
      data: businessLinks.rows
    });
  } catch (error) {
    console.error('Business links fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch business links' });
  }
});

/**
 * @swagger
 * /api/animes/{id}/tags:
 *   get:
 *     summary: Récupère les tags pour un anime
 *     description: Retourne la liste des genres/themes pour un anime spécifique
 *     tags: [Animes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'anime
 *     responses:
 *       200:
 *         description: Liste des tags récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_tag:
 *                         type: integer
 *                       tag_name:
 *                         type: string
 *                       tag_nice_url:
 *                         type: string
 *                       description:
 *                         type: string
 *                       categorie:
 *                         type: string
 *       404:
 *         description: Anime non trouvé
 *       500:
 *         description: Erreur serveur
 */
app.get('/api/animes/:id/tags', async (req, res) => {
  try {
    const { id } = req.params;
    
    const tags = await pool.query(`
      SELECT 
        t.id_tag,
        t.tag_name,
        t.tag_nice_url,
        t.description,
        t.categorie
      FROM ak_tags t
      INNER JOIN ak_tag2fiche t2f ON t.id_tag = t2f.id_tag
      WHERE t2f.id_fiche = $1 AND t2f.type = 'anime'
      ORDER BY t.categorie ASC, t.tag_name ASC
    `, [id]);
    
    res.json({
      data: tags.rows
    });
  } catch (error) {
    console.error('Tags fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// ===== MANGA ROUTES =====

/**
 * @swagger
 * /api/mangas:
 *   get:
 *     summary: Récupère la liste des mangas
 *     description: Retourne une liste paginée de mangas avec possibilité de filtrage
 *     tags: [Mangas]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche dans le titre et synopsis
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filtrer par année
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Filtrer par auteur/mangaka
 *     responses:
 *       200:
 *         description: Liste des mangas récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Manga'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/mangas', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, year, author } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = 'WHERE statut = 1';
    let params = [];
    let paramCount = 0;
    
    if (search) {
      paramCount++;
      whereClause += ` AND (titre ILIKE $${paramCount} OR synopsis ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    if (year) {
      paramCount++;
      whereClause += ` AND annee = $${paramCount}`;
      params.push(year);
    }
    
    if (author) {
      paramCount++;
      whereClause += ` AND auteur ILIKE $${paramCount}`;
      params.push(`%${author}%`);
    }
    
    const query = `
      SELECT id_manga, nice_url, titre, auteur, annee, nb_volumes, 
             image, nb_reviews, moyennenotes as moyenne_notes, date_ajout
      FROM ak_mangas ${whereClause}
      ORDER BY annee DESC, titre ASC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    params.push(parseInt(limit), offset);
    
    const [mangas, total] = await Promise.all([
      pool.query(query, params),
      pool.query(`SELECT COUNT(*) FROM ak_mangas ${whereClause}`, params.slice(0, paramCount))
    ]);
    
    res.json({
      data: mangas.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.rows[0].count),
        pages: Math.ceil(total.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Mangas fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch mangas' });
  }
});

/**
 * @swagger
 * /api/mangas/{id}:
 *   get:
 *     summary: Récupère un manga par son ID
 *     description: Retourne les détails complets d'un manga avec ses critiques récentes
 *     tags: [Mangas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du manga
 *     responses:
 *       200:
 *         description: Manga trouvé
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Manga'
 *                 - type: object
 *                   properties:
 *                     recent_reviews:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Review'
 *       404:
 *         description: Manga non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/mangas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const manga = await pool.query(`
      SELECT m.*, 
             COUNT(c.id_critique) as review_count,
             AVG(c.notation) as avg_rating
      FROM ak_mangas m
      LEFT JOIN ak_critique c ON m.id_manga = c.id_manga AND c.statut = 0
      WHERE m.id_manga = $1 AND m.statut = 1
      GROUP BY m.id_manga
    `, [id]);
    
    if (manga.rows.length === 0) {
      return res.status(404).json({ error: 'Manga not found' });
    }
    
    // Get reviews
    const reviews = await pool.query(`
      SELECT c.*, u.member_name as author_name
      FROM ak_critique c
      LEFT JOIN smf_members u ON c.id_membre = u.id_member
      WHERE c.id_manga = $1 AND c.statut = 0
      ORDER BY c.date_critique DESC
      LIMIT 5
    `, [id]);
    
    res.json({
      ...manga.rows[0],
      recent_reviews: reviews.rows
    });
  } catch (error) {
    console.error('Manga fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch manga' });
  }
});

// ===== REVIEW ROUTES =====

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: Récupère la liste des critiques
 *     description: Retourne une liste paginée de critiques avec possibilité de filtrage
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [anime, manga]
 *         description: Type de contenu (anime ou manga)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur pour filtrer ses critiques
 *     responses:
 *       200:
 *         description: Liste des critiques récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Review'
 *                       - type: object
 *                         properties:
 *                           author_name:
 *                             type: string
 *                             description: Nom de l'auteur
 *                           anime_titre:
 *                             type: string
 *                             description: Titre de l'anime (si applicable)
 *                           manga_titre:
 *                             type: string
 *                             description: Titre du manga (si applicable)
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/reviews', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, userId } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = 'WHERE c.statut = 1';
    let params = [];
    let paramCount = 0;
    
    if (type === 'anime') {
      whereClause += ' AND c.id_anime > 0';
    } else if (type === 'manga') {
      whereClause += ' AND c.id_manga > 0';
    }
    
    if (userId) {
      paramCount++;
      whereClause += ` AND c.id_membre = $${paramCount}`;
      params.push(userId);
    }
    
    const query = `
      SELECT c.*, u.member_name as author_name,
             a.titre as anime_titre, a.image as anime_image,
             m.titre as manga_titre, m.image as manga_image
      FROM ak_critique c
      LEFT JOIN smf_members u ON c.id_membre = u.id_member
      LEFT JOIN ak_animes a ON c.id_anime = a.id_anime
      LEFT JOIN ak_mangas m ON c.id_manga = m.id_manga
      ${whereClause}
      ORDER BY c.date_critique DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    params.push(parseInt(limit), offset);
    
    const [reviews, total] = await Promise.all([
      pool.query(query, params),
      pool.query(`SELECT COUNT(*) FROM ak_critique c ${whereClause}`, params.slice(0, paramCount))
    ]);
    
    res.json({
      data: reviews.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.rows[0].count),
        pages: Math.ceil(total.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Reviews fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Crée une nouvelle critique
 *     description: Permet à un utilisateur authentifié de créer une critique pour un anime ou manga
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - rating
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 description: Titre de la critique
 *                 example: "Une oeuvre exceptionnelle"
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 description: Contenu de la critique
 *                 example: "Cette série m'a vraiment marqué par sa profondeur..."
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 description: Note sur 10
 *                 example: 9
 *               animeId:
 *                 type: integer
 *                 description: ID de l'anime (requis si pas de mangaId)
 *                 example: 123
 *               mangaId:
 *                 type: integer
 *                 description: ID du manga (requis si pas d'animeId)
 *                 example: 456
 *     responses:
 *       201:
 *         description: Critique créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400:
 *         description: Données invalides ou manquantes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentification requise
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/reviews', authMiddleware, [
  body('title').isLength({ min: 3 }),
  body('content').isLength({ min: 10 }),
  body('rating').isInt({ min: 1, max: 10 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, content, rating, animeId, mangaId } = req.body;
    
    if (!animeId && !mangaId) {
      return res.status(400).json({ error: 'Either animeId or mangaId is required' });
    }
    
    const result = await pool.query(`
      INSERT INTO ak_critique (titre, critique, notation, id_membre, id_anime, id_manga, date_critique, statut)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), 1)
      RETURNING *
    `, [title, content, rating, req.user.userId, animeId || 0, mangaId || 0]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// ===== SEARCH ROUTES =====

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Recherche globale dans les animes et mangas
 *     description: Effectue une recherche dans les titres et synopsis des animes et mangas
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Terme de recherche
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, anime, manga]
 *           default: all
 *         description: Type de contenu à rechercher
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Nombre de résultats par page
 *     responses:
 *       200:
 *         description: Résultats de recherche
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [anime, manga]
 *                       id:
 *                         type: integer
 *                       titre:
 *                         type: string
 *                       image:
 *                         type: string
 *                       annee:
 *                         type: integer
 *                       moyenne_notes:
 *                         type: number
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Paramètres de recherche manquants
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/search', async (req, res) => {
  try {
    const { q, type = 'all', page = 1, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const searchTerm = `%${q}%`;
    
    let results = [];
    
    if (type === 'all' || type === 'anime') {
      const animes = await pool.query(`
        SELECT 'anime' as type, id_anime as id, titre, image, annee, moyennenotes as moyenne_notes
        FROM ak_animes 
        WHERE statut = 1 AND (titre ILIKE $1 OR synopsis ILIKE $1)
        ORDER BY moyennenotes DESC NULLS LAST
        LIMIT $2
      `, [searchTerm, limit]);
      results = results.concat(animes.rows);
    }
    
    if (type === 'all' || type === 'manga') {
      const mangas = await pool.query(`
        SELECT 'manga' as type, id_manga as id, titre, image, annee, moyennenotes as moyenne_notes
        FROM ak_mangas 
        WHERE statut = 1 AND (titre ILIKE $1 OR synopsis ILIKE $1)
        ORDER BY moyennenotes DESC NULLS LAST
        LIMIT $2
      `, [searchTerm, limit]);
      results = results.concat(mangas.rows);
    }
    
    // Sort by rating and slice for pagination
    results.sort((a, b) => (b.moyenne_notes || 0) - (a.moyenne_notes || 0));
    
    const paginatedResults = results.slice(offset, offset + parseInt(limit));
    
    res.json({
      data: paginatedResults,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: results.length,
        pages: Math.ceil(results.length / limit)
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * @swagger
 * /api/animes/autocomplete:
 *   get:
 *     summary: Autocomplete pour animes
 *     description: Recherche rapide d'animes pour autocomplete
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Terme de recherche
 *       - in: query
 *         name: exclude
 *         schema:
 *           type: integer
 *         description: ID d'anime à exclure des résultats
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre maximum de résultats
 */
app.get('/api/animes/autocomplete', async (req, res) => {
  try {
    const { q, exclude, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ data: [] });
    }
    
    let whereClause = 'WHERE titre ILIKE $1 AND statut = 1';
    let params = [`%${q}%`];
    
    if (exclude) {
      whereClause += ' AND id_anime != $2';
      params.push(parseInt(exclude, 10));
    }
    
    const results = await pool.query(`
      SELECT id_anime, titre, image, annee
      FROM ak_animes 
      ${whereClause}
      ORDER BY titre ASC
      LIMIT ${parseInt(limit)}
    `, params);
    
    res.json({ data: results.rows });
  } catch (error) {
    console.error('Anime autocomplete error:', error);
    res.status(500).json({ error: 'Failed to search animes' });
  }
});

/**
 * @swagger
 * /api/mangas/autocomplete:
 *   get:
 *     summary: Autocomplete pour mangas
 *     description: Recherche rapide de mangas pour autocomplete
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Terme de recherche
 *       - in: query
 *         name: exclude
 *         schema:
 *           type: integer
 *         description: ID de manga à exclure des résultats
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre maximum de résultats
 */
app.get('/api/mangas/autocomplete', async (req, res) => {
  try {
    const { q, exclude, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ data: [] });
    }
    
    let whereClause = 'WHERE titre ILIKE $1 AND statut = 1';
    let params = [`%${q}%`];
    
    if (exclude) {
      whereClause += ' AND id_manga != $2';
      params.push(parseInt(exclude, 10));
    }
    
    const results = await pool.query(`
      SELECT id_manga, titre, image, annee
      FROM ak_mangas 
      ${whereClause}
      ORDER BY titre ASC
      LIMIT ${parseInt(limit)}
    `, params);
    
    res.json({ data: results.rows });
  } catch (error) {
    console.error('Manga autocomplete error:', error);
    res.status(500).json({ error: 'Failed to search mangas' });
  }
});

/**
 * @swagger
 * /api/animes/{id}/relations:
 *   get:
 *     summary: Récupère les relations d'un anime (public)
 *     description: Retourne la liste des relations d'un anime vers d'autres animes/mangas
 *     tags: [Animes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'anime
 */
app.get('/api/animes/:id/relations', async (req, res) => {
  try {
    const { id } = req.params;
    
    const relations = await pool.query(`
      SELECT 
        r.id_relation,
        r.id_fiche_depart,
        r.id_anime,
        r.id_manga,
        CASE 
          WHEN r.id_anime > 0 THEN a.titre 
          WHEN r.id_manga > 0 THEN m.titre 
        END as titre,
        CASE 
          WHEN r.id_anime > 0 THEN 'anime'
          WHEN r.id_manga > 0 THEN 'manga'
        END as type,
        CASE 
          WHEN r.id_anime > 0 THEN a.image 
          WHEN r.id_manga > 0 THEN m.image 
        END as image,
        CASE 
          WHEN r.id_anime > 0 THEN a.annee::text 
          WHEN r.id_manga > 0 THEN m.annee::text 
        END as annee
      FROM ak_fiche_to_fiche r
      LEFT JOIN ak_animes a ON r.id_anime = a.id_anime AND a.statut = 1
      LEFT JOIN ak_mangas m ON r.id_manga = m.id_manga AND m.statut = 1
      WHERE r.id_fiche_depart = $1
        AND (r.id_anime > 0 OR r.id_manga > 0)
      ORDER BY titre ASC
    `, [`anime${id}`]);
    
    res.json({ data: relations.rows });
  } catch (error) {
    console.error('Anime relations fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch anime relations' });
  }
});

/**
 * @swagger
 * /api/mangas/{id}/relations:
 *   get:
 *     summary: Récupère les relations d'un manga (public)
 *     description: Retourne la liste des relations d'un manga vers d'autres animes/mangas
 *     tags: [Mangas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du manga
 */
app.get('/api/mangas/:id/relations', async (req, res) => {
  try {
    const { id } = req.params;
    
    const relations = await pool.query(`
      SELECT 
        r.id_relation,
        r.id_fiche_depart,
        r.id_anime,
        r.id_manga,
        CASE 
          WHEN r.id_anime > 0 THEN a.titre 
          WHEN r.id_manga > 0 THEN m.titre 
        END as titre,
        CASE 
          WHEN r.id_anime > 0 THEN 'anime'
          WHEN r.id_manga > 0 THEN 'manga'
        END as type,
        CASE 
          WHEN r.id_anime > 0 THEN a.image 
          WHEN r.id_manga > 0 THEN m.image 
        END as image,
        CASE 
          WHEN r.id_anime > 0 THEN a.annee::text 
          WHEN r.id_manga > 0 THEN m.annee::text 
        END as annee
      FROM ak_fiche_to_fiche r
      LEFT JOIN ak_animes a ON r.id_anime = a.id_anime AND a.statut = 1
      LEFT JOIN ak_mangas m ON r.id_manga = m.id_manga AND m.statut = 1
      WHERE r.id_fiche_depart = $1
        AND (r.id_anime > 0 OR r.id_manga > 0)
      ORDER BY titre ASC
    `, [`manga${id}`]);
    
    res.json({ data: relations.rows });
  } catch (error) {
    console.error('Manga relations fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch manga relations' });
  }
});

/**
 * @swagger
 * /api/tags:
 *   get:
 *     summary: Récupère tous les tags (public)
 *     description: Retourne la liste des tags groupés par catégorie
 *     tags: [Tags]
 */
app.get('/api/tags', async (req, res) => {
  try {
    const tags = await pool.query(`
      SELECT id_tag, tag_name, categorie as tag_category
      FROM ak_tags 
      ORDER BY categorie, tag_name ASC
    `);
    
    // Group tags by category
    const categorizedTags = {};
    tags.rows.forEach(tag => {
      const category = tag.tag_category || 'Divers';
      if (!categorizedTags[category]) {
        categorizedTags[category] = [];
      }
      categorizedTags[category].push(tag);
    });
    
    res.json({ data: categorizedTags });
  } catch (error) {
    console.error('Tags fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

/**
 * @swagger
 * /api/animes/{id}/tags:
 *   get:
 *     summary: Récupère les tags d'un anime (public)
 *     description: Retourne la liste des tags associés à un anime
 *     tags: [Animes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'anime
 */
app.get('/api/animes/:id/tags', async (req, res) => {
  try {
    const { id } = req.params;
    
    const tags = await pool.query(`
      SELECT t.id_tag, t.tag_name, t.categorie as tag_category
      FROM ak_tag2fiche t2f
      JOIN ak_tags t ON t2f.id_tag = t.id_tag
      WHERE t2f.id_fiche = $1 AND t2f.type = 'anime'
      ORDER BY t.categorie, t.tag_name ASC
    `, [id]);
    
    res.json({ data: tags.rows });
  } catch (error) {
    console.error('Anime tags fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch anime tags' });
  }
});

/**
 * @swagger
 * /api/animes/{id}/related-tags:
 *   get:
 *     summary: Récupère les tags suggérés pour un anime (public)
 *     description: Retourne des tags suggérés basés sur des animes similaires
 *     tags: [Animes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'anime
 */
app.get('/api/animes/:id/related-tags', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get current anime's year first
    const currentAnime = await pool.query(`
      SELECT annee FROM ak_animes WHERE id_anime = $1
    `, [id]);
    
    if (currentAnime.rows.length === 0) {
      return res.json({ data: [] });
    }
    
    const year = currentAnime.rows[0].annee;
    
    // Get popular tags that this anime doesn't have yet
    const relatedTags = await pool.query(`
      SELECT DISTINCT t.id_tag, t.tag_name, t.categorie as tag_category, COUNT(*) as usage_count
      FROM ak_tag2fiche t2f
      JOIN ak_tags t ON t2f.id_tag = t.id_tag
      WHERE t2f.type = 'anime'
        AND t.id_tag NOT IN (
          SELECT id_tag 
          FROM ak_tag2fiche 
          WHERE id_fiche = $1 AND type = 'anime'
        )
        AND t.id_tag IS NOT NULL
      GROUP BY t.id_tag, t.tag_name, t.categorie
      HAVING COUNT(*) >= 5
      ORDER BY usage_count DESC, t.tag_name ASC
      LIMIT 20
    `, [id]);
    
    res.json({ data: relatedTags.rows });
  } catch (error) {
    console.error('Related tags fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch related tags' });
  }
});

/**
 * @swagger
 * /api/mangas/{id}/tags:
 *   get:
 *     summary: Récupère les tags d'un manga (public)
 *     description: Retourne la liste des tags associés à un manga
 *     tags: [Mangas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du manga
 */
app.get('/api/mangas/:id/tags', async (req, res) => {
  try {
    const { id } = req.params;
    
    const tags = await pool.query(`
      SELECT t.id_tag, t.tag_name, t.categorie as tag_category
      FROM ak_tag2fiche t2f
      JOIN ak_tags t ON t2f.id_tag = t.id_tag
      WHERE t2f.id_fiche = $1 AND t2f.type = 'manga'
      ORDER BY t.categorie, t.tag_name ASC
    `, [id]);
    
    res.json({ data: tags.rows });
  } catch (error) {
    console.error('Manga tags fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch manga tags' });
  }
});

/**
 * @swagger
 * /api/mangas/{id}/related-tags:
 *   get:
 *     summary: Récupère les tags suggérés pour un manga (public)
 *     description: Retourne des tags suggérés basés sur des mangas similaires
 *     tags: [Mangas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du manga
 */
app.get('/api/mangas/:id/related-tags', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get current manga's year first
    const currentManga = await pool.query(`
      SELECT annee FROM ak_mangas WHERE id_manga = $1
    `, [id]);
    
    if (currentManga.rows.length === 0) {
      return res.json({ data: [] });
    }
    
    const year = currentManga.rows[0].annee;
    
    // Get popular tags that this manga doesn't have yet
    const relatedTags = await pool.query(`
      SELECT DISTINCT t.id_tag, t.tag_name, t.categorie as tag_category, COUNT(*) as usage_count
      FROM ak_tag2fiche t2f
      JOIN ak_tags t ON t2f.id_tag = t.id_tag
      WHERE t2f.type = 'manga'
        AND t.id_tag NOT IN (
          SELECT id_tag 
          FROM ak_tag2fiche 
          WHERE id_fiche = $1 AND type = 'manga'
        )
        AND t.id_tag IS NOT NULL
      GROUP BY t.id_tag, t.tag_name, t.categorie
      HAVING COUNT(*) >= 5
      ORDER BY usage_count DESC, t.tag_name ASC
      LIMIT 20
    `, [id]);
    
    res.json({ data: relatedTags.rows });
  } catch (error) {
    console.error('Related tags fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch related tags' });
  }
});

// ===== USER ROUTES =====

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Récupère les informations d'un utilisateur
 *     description: Retourne les données publiques d'un utilisateur par son ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Utilisateur trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Utilisateur non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await pool.query(`
      SELECT id_member, member_name, real_name, date_registered, posts,
             nb_critiques, nb_synopsis, nb_contributions, experience
      FROM smf_members 
      WHERE id_member = $1
    `, [id]);
    
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user.rows[0]);
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ===== WEBZINE ROUTES =====

/**
 * @swagger
 * /api/webzine/articles:
 *   get:
 *     summary: Récupère la liste des articles du webzine
 *     description: Retourne une liste paginée d'articles publiés
 *     tags: [Webzine]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: Nombre d'articles par page
 *     responses:
 *       200:
 *         description: Liste des articles récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_art:
 *                         type: integer
 *                         description: ID de l'article
 *                       titre:
 *                         type: string
 *                         description: Titre de l'article
 *                       contenu:
 *                         type: string
 *                         description: Contenu de l'article
 *                       nice_url:
 *                         type: string
 *                         description: URL SEO-friendly
 *                       author_name:
 *                         type: string
 *                         description: Nom de l'auteur
 *                       date:
 *                         type: string
 *                         format: date-time
 *                         description: Date de publication
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/webzine/articles', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const [articles, total] = await Promise.all([
      pool.query(`
        SELECT a.*, u.member_name as author_name
        FROM ak_webzine_articles a
        LEFT JOIN smf_members u ON a.auteur = u.id_member
        WHERE a.statut = 1
        ORDER BY a.date DESC
        LIMIT $1 OFFSET $2
      `, [parseInt(limit), offset]),
      pool.query('SELECT COUNT(*) FROM ak_webzine_articles WHERE statut = 1')
    ]);
    
    res.json({
      data: articles.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.rows[0].count),
        pages: Math.ceil(total.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Articles fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

/**
 * @swagger
 * /api/webzine/articles/{slug}:
 *   get:
 *     summary: Récupère un article par son slug
 *     description: Retourne un article complet avec ses commentaires
 *     tags: [Webzine]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Slug URL de l'article
 *     responses:
 *       200:
 *         description: Article trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_art:
 *                   type: integer
 *                 titre:
 *                   type: string
 *                 contenu:
 *                   type: string
 *                 nice_url:
 *                   type: string
 *                 author_name:
 *                   type: string
 *                 date:
 *                   type: string
 *                   format: date-time
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_com:
 *                         type: integer
 *                       commentaire:
 *                         type: string
 *                       author_name:
 *                         type: string
 *                       date_com:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Article non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/webzine/articles/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const article = await pool.query(`
      SELECT a.*, u.member_name as author_name
      FROM ak_webzine_articles a
      LEFT JOIN smf_members u ON a.auteur = u.id_member
      WHERE a.nice_url = $1 AND a.statut = 1
    `, [slug]);
    
    if (article.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    // Get comments
    const comments = await pool.query(`
      SELECT c.*, u.member_name as author_name
      FROM ak_webzine_com c
      LEFT JOIN smf_members u ON c.id_membre = u.id_member
      WHERE c.id_article = $1
      ORDER BY c.date_com ASC
    `, [article.rows[0].id_art]);
    
    res.json({
      ...article.rows[0],
      comments: comments.rows
    });
  } catch (error) {
    console.error('Article fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// ===== ADMIN ROUTES =====

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Tableau de bord administrateur
 *     description: Récupère les statistiques générales et l'activité récente (accès admin requis)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Données du tableau de bord
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total_animes:
 *                       type: integer
 *                       description: Nombre total d'animes
 *                     total_mangas:
 *                       type: integer
 *                       description: Nombre total de mangas
 *                     total_reviews:
 *                       type: integer
 *                       description: Nombre total de critiques
 *                     total_users:
 *                       type: integer
 *                       description: Nombre total d'utilisateurs
 *                     total_articles:
 *                       type: integer
 *                       description: Nombre total d'articles
 *                 recent_activity:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [review, article]
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       title:
 *                         type: string
 *       401:
 *         description: Authentification requise
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Accès admin requis
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/admin/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM ak_animes) as total_animes,
        (SELECT COUNT(*) FROM ak_mangas) as total_mangas,
        (SELECT COUNT(*) FROM ak_critique) as total_reviews,
        (SELECT COUNT(*) FROM smf_members) as total_users,
        (SELECT COUNT(*) FROM ak_webzine_articles) as total_articles,
        (SELECT COUNT(*) FROM ak_business) as total_business
    `);
    
    const recentActivity = await pool.query(`
      SELECT 'review' as type, date_critique as date, titre as title
      FROM ak_critique 
      WHERE statut = 0
      UNION ALL
      SELECT 'article' as type, date, titre as title
      FROM ak_webzine_articles
      WHERE statut = 1
      ORDER BY date DESC
      LIMIT 10
    `);
    
    res.json({
      stats: stats.rows[0],
      recent_activity: recentActivity.rows
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// ===== ADMIN ANIME ROUTES =====

/**
 * @swagger
 * /api/admin/animes:
 *   get:
 *     summary: Liste des animes pour l'administration
 *     description: Récupère la liste complète des animes avec pagination pour l'interface d'administration
 *     tags: [Admin - Animes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche dans le titre
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, inactive]
 *           default: all
 *         description: Filtrer par statut
 *     responses:
 *       200:
 *         description: Liste des animes récupérée avec succès
 *       401:
 *         description: Authentification requise
 *       403:
 *         description: Accès admin requis
 */
app.get('/api/admin/animes', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, status = 'all' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = '';
    let params = [];
    let paramCount = 0;
    
    if (status !== 'all') {
      paramCount++;
      whereClause += ` WHERE statut = $${paramCount}`;
      params.push(parseInt(status));
    }
    
    if (search) {
      paramCount++;
      const searchClause = ` ${whereClause ? 'AND' : 'WHERE'} titre ILIKE $${paramCount}`;
      whereClause += searchClause;
      params.push(`%${search}%`);
    }
    
    const query = `
      SELECT id_anime, nice_url, titre, titre_orig, annee, nb_ep, studio, 
             image, nb_reviews, moyennenotes, date_ajout, statut
      FROM ak_animes ${whereClause}
      ORDER BY date_ajout DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    params.push(parseInt(limit), offset);
    
    const [animes, total] = await Promise.all([
      pool.query(query, params),
      pool.query(`SELECT COUNT(*) FROM ak_animes ${whereClause}`, params.slice(0, paramCount))
    ]);
    
    res.json({
      data: animes.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.rows[0].count),
        pages: Math.ceil(total.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Admin animes fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch animes' });
  }
});

/**
 * @swagger
 * /api/admin/animes:
 *   post:
 *     summary: Créer un nouvel anime
 *     description: Ajoute un nouvel anime à la base de données
 *     tags: [Admin - Animes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titre
 *               - annee
 *             properties:
 *               titre:
 *                 type: string
 *                 description: Titre de l'anime
 *               titre_orig:
 *                 type: string
 *                 description: Titre original
 *               annee:
 *                 type: integer
 *                 description: Année de sortie
 *               nb_ep:
 *                 type: integer
 *                 description: Nombre d'épisodes
 *               studio:
 *                 type: string
 *                 description: Studio d'animation
 *               synopsis:
 *                 type: string
 *                 description: Synopsis
 *               image:
 *                 type: string
 *                 description: URL de l'image
 *               statut:
 *                 type: integer
 *                 default: 1
 *                 description: Statut (1=actif, 0=inactif)
 *     responses:
 *       201:
 *         description: Anime créé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Authentification requise
 *       403:
 *         description: Accès admin requis
 */
app.post('/api/admin/animes', upload.single('image'), authMiddleware, adminMiddleware, [
  body('titre').notEmpty().withMessage('Titre is required'),
  body('annee').isInt({ min: 1900, max: 2030 }).withMessage('Valid year required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { 
      titre, titre_orig, titres_alternatifs, annee, format, nb_ep, studio, 
      licence, titre_fr, official_site, doubleurs, synopsis, commentaire, statut = 1 
    } = req.body;
    
    // Map doubleurs to doublage (database column name)
    const doublage = doubleurs;
    
    // Handle uploaded image
    let imagePath = null;
    if (req.file) {
      imagePath = req.file.filename; // Just store the filename
    }
    
    // Generate nice_url
    const niceUrl = titre.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
    
    const result = await pool.query(`
      INSERT INTO ak_animes (
        nice_url, titre, titre_orig, titres_alternatifs, annee, format, nb_ep, studio, 
        licence, titre_fr, official_site, doublage, synopsis, commentaire,
        image, date_ajout, statut, nb_reviews, moyennenotes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), $16, 0, 0)
      RETURNING *
    `, [niceUrl, titre, titre_orig, titres_alternatifs, annee, format, nb_ep || 0, studio, 
         licence || 0, titre_fr, official_site, doublage, synopsis, commentaire, imagePath, statut]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Anime creation error:', error);
    res.status(500).json({ error: 'Failed to create anime' });
  }
});

/**
 * @swagger
 * /api/admin/animes/search:
 *   get:
 *     summary: Rechercher des animes
 *     description: Recherche des animes par titre pour l'administration
 *     tags: [Admin - Animes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Terme de recherche
 *       - in: query
 *         name: exclude
 *         required: false
 *         schema:
 *           type: integer
 *         description: ID d'anime à exclure des résultats
 *     responses:
 *       200:
 *         description: Résultats de recherche
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_anime:
 *                         type: integer
 *                       titre:
 *                         type: string
 *                       image:
 *                         type: string
 *                       annee:
 *                         type: integer
 *       403:
 *         description: Accès admin requis
 */
app.get('/api/admin/animes/search', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { q, exclude } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ data: [] });
    }
    
    let query = `
      SELECT id_anime, titre, image, annee
      FROM ak_animes 
      WHERE titre ILIKE $1 AND statut = 1
    `;
    let params = [`%${q}%`];
    
    if (exclude) {
      query += ` AND id_anime != $2`;
      params.push(parseInt(exclude, 10));
    }
    
    query += ` ORDER BY titre ASC LIMIT 10`;
    
    const results = await pool.query(query, params);
    
    res.json({ data: results.rows });
  } catch (error) {
    console.error('Anime search error:', error);
    res.status(500).json({ error: 'Failed to search animes' });
  }
});

/**
 * @swagger
 * /api/admin/animes/{id}:
 *   get:
 *     summary: Récupérer un anime par ID
 *     description: Récupère les détails d'un anime spécifique pour l'administration
 *     tags: [Admin - Animes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'anime
 *     responses:
 *       200:
 *         description: Anime récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Anime'
 *       404:
 *         description: Anime non trouvé
 *       401:
 *         description: Authentification requise
 *       403:
 *         description: Accès admin requis
 */
app.get('/api/admin/animes/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT id_anime, nice_url, titre, titre_orig, titres_alternatifs, 
             annee, format, nb_ep, studio, licence, titre_fr, official_site, 
             doublage, synopsis, commentaire, image, nb_reviews, 
             moyennenotes as moyenne_notes, date_ajout, statut
      FROM ak_animes 
      WHERE id_anime = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anime not found' });
    }
    
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Admin anime fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch anime' });
  }
});

/**
 * @swagger
 * /api/admin/animes/{id}:
 *   put:
 *     summary: Mettre à jour un anime
 *     description: Modifie les informations d'un anime existant
 *     tags: [Admin - Animes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'anime
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titre:
 *                 type: string
 *               titre_orig:
 *                 type: string
 *               annee:
 *                 type: integer
 *               nb_ep:
 *                 type: integer
 *               studio:
 *                 type: string
 *               synopsis:
 *                 type: string
 *               image:
 *                 type: string
 *               statut:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Anime mis à jour avec succès
 *       404:
 *         description: Anime non trouvé
 *       401:
 *         description: Authentification requise
 *       403:
 *         description: Accès admin requis
 */
app.put('/api/admin/animes/:id', upload.single('image'), authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      titre, titre_orig, titres_alternatifs, annee, format, nb_ep, studio, 
      licence, titre_fr, official_site, doubleurs, synopsis, commentaire, image, statut 
    } = req.body;
    
    // Map doubleurs to doublage (database column name)
    const doublage = doubleurs;
    
    // Handle uploaded image
    let finalImage = image; // Use existing image from form if no file uploaded
    if (req.file) {
      finalImage = req.file.filename; // Use uploaded file filename
    }
    
    // Update nice_url if titre changed
    let niceUrl;
    if (titre) {
      niceUrl = titre.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
    }
    
    const result = await pool.query(`
      UPDATE ak_animes 
      SET titre = COALESCE($1, titre),
          titre_orig = COALESCE($2, titre_orig),
          titres_alternatifs = COALESCE($3, titres_alternatifs),
          annee = COALESCE($4, annee),
          format = COALESCE($5, format),
          nb_ep = COALESCE($6, nb_ep),
          studio = COALESCE($7, studio),
          licence = COALESCE($8, licence),
          titre_fr = COALESCE($9, titre_fr),
          official_site = COALESCE($10, official_site),
          doublage = COALESCE($11, doublage),
          synopsis = COALESCE($12, synopsis),
          commentaire = COALESCE($13, commentaire),
          image = COALESCE($14, image),
          statut = COALESCE($15, statut),
          nice_url = COALESCE($16, nice_url)
      WHERE id_anime = $17
      RETURNING *
    `, [titre, titre_orig, titres_alternatifs, annee, format, nb_ep, studio, 
         licence, titre_fr, official_site, doublage, synopsis, commentaire, finalImage, statut, niceUrl, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anime not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Anime update error:', error);
    res.status(500).json({ error: 'Failed to update anime' });
  }
});

/**
 * @swagger
 * /api/admin/animes/{id}:
 *   delete:
 *     summary: Supprimer un anime
 *     description: Supprime définitivement un anime et ses données associées
 *     tags: [Admin - Animes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'anime
 *     responses:
 *       200:
 *         description: Anime supprimé avec succès
 *       404:
 *         description: Anime non trouvé
 *       401:
 *         description: Authentification requise
 *       403:
 *         description: Accès admin requis
 */
app.delete('/api/admin/animes/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete associated data first
    await pool.query('DELETE FROM ak_critique WHERE id_anime = $1', [id]);
    await pool.query('DELETE FROM ak_screenshots WHERE id_titre = $1', [id]);
    await pool.query('DELETE FROM ak_tag2fiche WHERE id_fiche = $1 AND type = $2', [id, 'anime']);
    await pool.query('DELETE FROM ak_business_to_animes WHERE id_anime = $1', [id]);
    
    // Delete the anime
    const result = await pool.query('DELETE FROM ak_animes WHERE id_anime = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anime not found' });
    }
    
    res.json({ message: 'Anime deleted successfully', deleted: result.rows[0] });
  } catch (error) {
    console.error('Anime deletion error:', error);
    res.status(500).json({ error: 'Failed to delete anime' });
  }
});

/**
 * @swagger
 * /api/business/search:
 *   get:
 *     summary: Rechercher des fiches business
 *     description: Recherche des fiches business par nom
 *     tags: [Business]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Terme de recherche
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre de résultats maximum
 *     responses:
 *       200:
 *         description: Résultats de recherche
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nom:
 *                         type: string
 *                       type:
 *                         type: string
 */
app.get('/api/business/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({ data: [] });
    }
    
    const result = await pool.query(`
      SELECT id_business as id, denomination as nom, type
      FROM ak_business 
      WHERE denomination ILIKE $1 
      ORDER BY denomination 
      LIMIT $2
    `, [`%${q.trim()}%`, parseInt(limit)]);
    
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Business search error:', error);
    res.status(500).json({ error: 'Failed to search business' });
  }
});

/**
 * @swagger
 * /api/admin/animes/{id}/staff:
 *   get:
 *     summary: Récupérer le staff d'un anime
 *     description: Récupère la liste du staff associé à un anime
 *     tags: [Admin - Animes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'anime
 *     responses:
 *       200:
 *         description: Liste du staff récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       business_id:
 *                         type: integer
 *                       business_name:
 *                         type: string
 *                       fonction:
 *                         type: string
 *                       precisions:
 *                         type: string
 */
app.get('/api/admin/animes/:id/staff', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        bta.id_business as business_id,
        b.denomination as business_name,
        bta.type as fonction,
        bta.precisions
      FROM ak_business_to_animes bta
      JOIN ak_business b ON bta.id_business = b.id_business
      WHERE bta.id_anime = $1
      ORDER BY bta.type, b.denomination
    `, [id]);
    
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Staff fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

/**
 * @swagger
 * /api/admin/animes/{id}/staff:
 *   post:
 *     summary: Ajouter un membre au staff
 *     description: Ajoute un membre du staff à un anime
 *     tags: [Admin - Animes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'anime
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - business_id
 *               - fonction
 *             properties:
 *               business_id:
 *                 type: integer
 *                 description: ID de la fiche business
 *               fonction:
 *                 type: string
 *                 description: Fonction/rôle
 *               precisions:
 *                 type: string
 *                 description: Précisions optionnelles
 *     responses:
 *       201:
 *         description: Membre ajouté avec succès
 *       409:
 *         description: Membre déjà présent avec cette fonction
 */
app.post('/api/admin/animes/:id/staff', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { business_id, fonction, precisions } = req.body;
    
    if (!business_id || !fonction) {
      return res.status(400).json({ error: 'Business ID and fonction are required' });
    }
    
    // Check if combination already exists
    const existing = await pool.query(`
      SELECT id_business FROM ak_business_to_animes 
      WHERE id_anime = $1 AND id_business = $2 AND type = $3
    `, [id, business_id, fonction]);
    
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Cette combinaison business/fonction existe déjà' });
    }
    
    // Insert new staff member
    await pool.query(`
      INSERT INTO ak_business_to_animes (id_anime, id_business, type, precisions)
      VALUES ($1, $2, $3, $4)
    `, [id, business_id, fonction, precisions || null]);
    
    res.status(201).json({ message: 'Staff member added successfully' });
  } catch (error) {
    console.error('Add staff error:', error);
    res.status(500).json({ error: 'Failed to add staff member' });
  }
});

/**
 * @swagger
 * /api/admin/animes/{id}/staff:
 *   delete:
 *     summary: Supprimer un membre du staff
 *     description: Supprime un membre du staff d'un anime
 *     tags: [Admin - Animes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'anime
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - business_id
 *               - fonction
 *             properties:
 *               business_id:
 *                 type: integer
 *                 description: ID de la fiche business
 *               fonction:
 *                 type: string
 *                 description: Fonction/rôle
 *     responses:
 *       200:
 *         description: Membre supprimé avec succès
 *       404:
 *         description: Membre non trouvé
 */
app.delete('/api/admin/animes/:id/staff', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { business_id, fonction } = req.body;
    
    if (!business_id || !fonction) {
      return res.status(400).json({ error: 'Business ID and fonction are required' });
    }
    
    const result = await pool.query(`
      DELETE FROM ak_business_to_animes 
      WHERE id_anime = $1 AND id_business = $2 AND type = $3
      RETURNING *
    `, [id, business_id, fonction]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    
    res.json({ message: 'Staff member removed successfully' });
  } catch (error) {
    console.error('Remove staff error:', error);
    res.status(500).json({ error: 'Failed to remove staff member' });
  }
});

// ===== MANGA STAFF ROUTES =====

/**
 * @swagger
 * /api/admin/mangas/{id}/staff:
 *   get:
 *     summary: Récupère le staff d'un manga
 *     description: Retourne la liste des membres du staff pour un manga
 *     tags: [Admin - Mangas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du manga
 *     responses:
 *       200:
 *         description: Liste du staff
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       business_id:
 *                         type: integer
 *                       business_name:
 *                         type: string
 *                       fonction:
 *                         type: string
 *                       precisions:
 *                         type: string
 */
app.get('/api/admin/mangas/:id/staff', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        btm.id_business as business_id,
        b.denomination as business_name,
        btm.type as fonction,
        btm.precisions
      FROM ak_business_to_mangas btm
      JOIN ak_business b ON btm.id_business = b.id_business
      WHERE btm.id_manga = $1
      ORDER BY btm.type, b.denomination
    `, [id]);
    
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Manga staff fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch manga staff' });
  }
});

/**
 * @swagger
 * /api/admin/mangas/{id}/staff:
 *   post:
 *     summary: Ajouter un membre au staff du manga
 *     description: Ajoute un membre du staff à un manga
 *     tags: [Admin - Mangas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du manga
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - business_id
 *               - fonction
 *             properties:
 *               business_id:
 *                 type: integer
 *                 description: ID de la fiche business
 *               fonction:
 *                 type: string
 *                 description: Fonction/rôle
 *               precisions:
 *                 type: string
 *                 description: Précisions optionnelles
 *     responses:
 *       201:
 *         description: Membre ajouté avec succès
 *       409:
 *         description: Membre déjà présent avec cette fonction
 */
app.post('/api/admin/mangas/:id/staff', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { business_id, fonction, precisions } = req.body;
    
    if (!business_id || !fonction) {
      return res.status(400).json({ error: 'Business ID and fonction are required' });
    }
    
    // Check if combination already exists
    const existing = await pool.query(`
      SELECT id_business FROM ak_business_to_mangas 
      WHERE id_manga = $1 AND id_business = $2 AND type = $3
    `, [id, business_id, fonction]);
    
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Cette combinaison business/fonction existe déjà' });
    }
    
    // Insert new staff member
    await pool.query(`
      INSERT INTO ak_business_to_mangas (id_manga, id_business, type, precisions)
      VALUES ($1, $2, $3, $4)
    `, [id, business_id, fonction, precisions || null]);
    
    res.status(201).json({ message: 'Manga staff member added successfully' });
  } catch (error) {
    console.error('Add manga staff error:', error);
    res.status(500).json({ error: 'Failed to add manga staff member' });
  }
});

/**
 * @swagger
 * /api/admin/mangas/{id}/staff/{business_id}:
 *   delete:
 *     summary: Supprimer un membre du staff du manga
 *     description: Supprime un membre du staff d'un manga
 *     tags: [Admin - Mangas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du manga
 *       - in: path
 *         name: business_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la fiche business
 *       - in: query
 *         name: fonction
 *         required: true
 *         schema:
 *           type: string
 *         description: Fonction du membre à supprimer
 *     responses:
 *       200:
 *         description: Membre supprimé avec succès
 *       404:
 *         description: Membre non trouvé
 */
app.delete('/api/admin/mangas/:id/staff/:business_id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id, business_id } = req.params;
    const { fonction } = req.query;
    
    if (!fonction) {
      return res.status(400).json({ error: 'Fonction is required' });
    }
    
    const result = await pool.query(`
      DELETE FROM ak_business_to_mangas 
      WHERE id_manga = $1 AND id_business = $2 AND type = $3
      RETURNING *
    `, [id, business_id, fonction]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Manga staff member not found' });
    }
    
    res.json({ message: 'Manga staff member removed successfully' });
  } catch (error) {
    console.error('Remove manga staff error:', error);
    res.status(500).json({ error: 'Failed to remove manga staff member' });
  }
});

// ===== MANGA RELATIONS ROUTES =====

/**
 * @swagger
 * /api/admin/mangas/{id}/relations:
 *   get:
 *     summary: Récupère les relations d'un manga
 *     description: Retourne la liste des relations d'un manga vers d'autres animes/mangas
 *     tags: [Admin - Relations]
 *     security:
 *       - bearerAuth: []
 */
app.get('/api/admin/mangas/:id/relations', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const relations = await pool.query(`
      SELECT 
        r.id_relation,
        r.id_fiche_depart,
        r.id_anime,
        r.id_manga,
        CASE 
          WHEN r.id_anime > 0 THEN a.titre 
          WHEN r.id_manga > 0 THEN m.titre 
        END as titre,
        CASE 
          WHEN r.id_anime > 0 THEN 'anime'
          WHEN r.id_manga > 0 THEN 'manga'
        END as type,
        CASE 
          WHEN r.id_anime > 0 THEN a.image 
          WHEN r.id_manga > 0 THEN m.image 
        END as image,
        CASE 
          WHEN r.id_anime > 0 THEN a.annee::text 
          WHEN r.id_manga > 0 THEN m.annee::text 
        END as annee
      FROM ak_fiche_to_fiche r
      LEFT JOIN ak_animes a ON r.id_anime = a.id_anime AND a.statut = 1
      LEFT JOIN ak_mangas m ON r.id_manga = m.id_manga AND m.statut = 1
      WHERE r.id_fiche_depart = $1
        AND (r.id_anime > 0 OR r.id_manga > 0)
      ORDER BY titre ASC
    `, [`manga${id}`]);
    
    res.json({ data: relations.rows });
  } catch (error) {
    console.error('Manga relations fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch manga relations' });
  }
});

/**
 * @swagger
 * /api/admin/mangas/{id}/relations:
 *   post:
 *     summary: Ajoute une relation à un manga
 *     description: Ajoute une relation entre un manga et un autre anime/manga
 *     tags: [Admin - Relations]
 *     security:
 *       - bearerAuth: []
 */
app.post('/api/admin/mangas/:id/relations', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { target_type, target_id } = req.body;
    
    if (!target_type || !target_id) {
      return res.status(400).json({ error: 'target_type and target_id are required' });
    }
    
    if (!['anime', 'manga'].includes(target_type)) {
      return res.status(400).json({ error: 'target_type must be anime or manga' });
    }
    
    // Check if relation already exists
    const existing = await pool.query(`
      SELECT id_relation FROM ak_fiche_to_fiche 
      WHERE id_fiche_depart = $1 
        AND ${target_type === 'anime' ? 'id_anime' : 'id_manga'} = $2
    `, [`manga${id}`, target_id]);
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Relation already exists' });
    }
    
    // Verify target exists
    const targetTable = target_type === 'anime' ? 'ak_animes' : 'ak_mangas';
    const targetIdField = target_type === 'anime' ? 'id_anime' : 'id_manga';
    const targetCheck = await pool.query(`
      SELECT ${targetIdField} FROM ${targetTable} WHERE ${targetIdField} = $1 AND statut = 1
    `, [target_id]);
    
    if (targetCheck.rows.length === 0) {
      return res.status(404).json({ error: `${target_type} not found` });
    }
    
    // Insert relation
    const insertData = {
      id_fiche_depart: `manga${id}`,
      id_anime: target_type === 'anime' ? target_id : 0,
      id_manga: target_type === 'manga' ? target_id : 0,
      id_ost: 0,
      id_jeu: 0,
      id_business: 0
    };
    
    await pool.query(`
      INSERT INTO ak_fiche_to_fiche (id_fiche_depart, id_anime, id_manga, id_ost, id_jeu, id_business)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [insertData.id_fiche_depart, insertData.id_anime, insertData.id_manga, insertData.id_ost, insertData.id_jeu, insertData.id_business]);
    
    res.json({ success: true, message: 'Relation added successfully' });
  } catch (error) {
    console.error('Add manga relation error:', error);
    res.status(500).json({ error: 'Failed to add manga relation' });
  }
});

/**
 * @swagger
 * /api/admin/mangas/{id}/relations/{relationId}:
 *   delete:
 *     summary: Supprime une relation d'un manga
 *     description: Supprime une relation entre un manga et un autre anime/manga
 *     tags: [Admin - Relations]
 *     security:
 *       - bearerAuth: []
 */
app.delete('/api/admin/mangas/:id/relations/:relationId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id, relationId } = req.params;
    
    const result = await pool.query(`
      DELETE FROM ak_fiche_to_fiche 
      WHERE id_relation = $1 AND id_fiche_depart = $2
      RETURNING *
    `, [relationId, `manga${id}`]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Relation not found' });
    }
    
    res.json({ success: true, message: 'Relation removed successfully' });
  } catch (error) {
    console.error('Remove manga relation error:', error);
    res.status(500).json({ error: 'Failed to remove manga relation' });
  }
});

// ===== ANIME RELATIONS ROUTES =====

/**
 * @swagger
 * /api/admin/animes/{id}/relations:
 *   get:
 *     summary: Récupère les relations d'un anime
 *     description: Retourne la liste des relations d'un anime vers d'autres animes/mangas
 *     tags: [Admin - Relations]
 *     security:
 *       - bearerAuth: []
 */
app.get('/api/admin/animes/:id/relations', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const relations = await pool.query(`
      SELECT 
        r.id_relation,
        r.id_fiche_depart,
        r.id_anime,
        r.id_manga,
        CASE 
          WHEN r.id_anime > 0 THEN a.titre 
          WHEN r.id_manga > 0 THEN m.titre 
        END as titre,
        CASE 
          WHEN r.id_anime > 0 THEN 'anime'
          WHEN r.id_manga > 0 THEN 'manga'
        END as type,
        CASE 
          WHEN r.id_anime > 0 THEN a.image 
          WHEN r.id_manga > 0 THEN m.image 
        END as image,
        CASE 
          WHEN r.id_anime > 0 THEN a.annee::text 
          WHEN r.id_manga > 0 THEN m.annee::text 
        END as annee
      FROM ak_fiche_to_fiche r
      LEFT JOIN ak_animes a ON r.id_anime = a.id_anime AND a.statut = 1
      LEFT JOIN ak_mangas m ON r.id_manga = m.id_manga AND m.statut = 1
      WHERE r.id_fiche_depart = $1
        AND (r.id_anime > 0 OR r.id_manga > 0)
      ORDER BY titre ASC
    `, [`anime${id}`]);
    
    res.json({ data: relations.rows });
  } catch (error) {
    console.error('Anime relations fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch anime relations' });
  }
});

/**
 * @swagger
 * /api/admin/animes/{id}/relations:
 *   post:
 *     summary: Ajouter une relation anime
 *     description: Crée une nouvelle relation entre un anime et un autre anime/manga
 *     tags: [Admin - Relations]
 *     security:
 *       - bearerAuth: []
 */
app.post('/api/admin/animes/:id/relations', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { target_id, target_type } = req.body;
    
    if (!target_id || !target_type) {
      return res.status(400).json({ error: 'Target ID and type are required' });
    }
    
    if (!['anime', 'manga'].includes(target_type)) {
      return res.status(400).json({ error: 'Target type must be anime or manga' });
    }
    
    // Check if relation already exists
    const existing = await pool.query(`
      SELECT id_relation FROM ak_fiche_to_fiche 
      WHERE id_fiche_depart = $1 AND ${target_type === 'anime' ? 'id_anime' : 'id_manga'} = $2
    `, [`anime${id}`, target_id]);
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Relation already exists' });
    }
    
    // Create the relation
    const result = await pool.query(`
      INSERT INTO ak_fiche_to_fiche (id_fiche_depart, ${target_type === 'anime' ? 'id_anime' : 'id_manga'})
      VALUES ($1, $2)
      RETURNING *
    `, [`anime${id}`, target_id]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Anime relation creation error:', error);
    res.status(500).json({ error: 'Failed to create anime relation' });
  }
});

/**
 * @swagger
 * /api/admin/animes/{id}/relations/{relationId}:
 *   delete:
 *     summary: Supprimer une relation anime
 *     description: Supprime une relation entre un anime et un autre anime/manga
 *     tags: [Admin - Relations]
 *     security:
 *       - bearerAuth: []
 */
app.delete('/api/admin/animes/:id/relations/:relationId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id, relationId } = req.params;
    
    const result = await pool.query(`
      DELETE FROM ak_fiche_to_fiche 
      WHERE id_relation = $1 AND id_fiche_depart = $2
      RETURNING *
    `, [relationId, `anime${id}`]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Relation not found' });
    }
    
    res.json({ message: 'Relation removed successfully' });
  } catch (error) {
    console.error('Anime relation deletion error:', error);
    res.status(500).json({ error: 'Failed to remove anime relation' });
  }
});


/**
 * @swagger
 * /api/admin/mangas/search:
 *   get:
 *     summary: Rechercher des mangas pour les relations
 *     description: Recherche des mangas par titre pour les relations
 *     tags: [Admin - Relations]
 *     security:
 *       - bearerAuth: []
 */
app.get('/api/admin/mangas/search', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ data: [] });
    }
    
    const results = await pool.query(`
      SELECT id_manga, titre, image, annee
      FROM ak_mangas 
      WHERE titre ILIKE $1 AND statut = 1
      ORDER BY titre ASC
      LIMIT 10
    `, [`%${q}%`]);
    
    res.json({ data: results.rows });
  } catch (error) {
    console.error('Manga search error:', error);
    res.status(500).json({ error: 'Failed to search mangas' });
  }
});

// ===== ANIME SCREENSHOTS ROUTES =====

/**
 * @swagger
 * /api/admin/animes/{id}/screenshots:
 *   get:
 *     summary: Récupère les screenshots d'un anime
 *     description: Retourne la liste des screenshots d'un anime
 *     tags: [Admin - Screenshots]
 *     security:
 *       - bearerAuth: []
 */
app.get('/api/admin/animes/:id/screenshots', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const screenshots = await pool.query(`
      SELECT id_screen, id_titre, url_screen as filename, upload_date, type
      FROM ak_screenshots 
      WHERE id_titre = $1 
      ORDER BY id_screen ASC
    `, [id]);
    
    res.json({ data: screenshots.rows });
  } catch (error) {
    console.error('Anime screenshots fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch anime screenshots' });
  }
});

/**
 * @swagger
 * /api/admin/animes/{id}/screenshots:
 *   post:
 *     summary: Upload des screenshots pour un anime
 *     description: Upload multiple screenshots pour un anime
 *     tags: [Admin - Screenshots]
 *     security:
 *       - bearerAuth: []
 */
app.post('/api/admin/animes/:id/screenshots', upload.array('screenshots', 10), authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    // Validate total size (1.6MB max)
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 1.6 * 1024 * 1024) {
      return res.status(400).json({ error: 'Total file size exceeds 1.6MB' });
    }
    
    // Validate individual file sizes (200KB max)
    for (const file of files) {
      if (file.size > 200 * 1024) {
        return res.status(400).json({ error: `File ${file.originalname} exceeds 200KB` });
      }
    }
    
    // Insert screenshot records
    const uploadedScreenshots = [];
    for (const file of files) {
      const result = await pool.query(`
        INSERT INTO ak_screenshots (id_titre, url_screen, type, upload_date)
        VALUES ($1, $2, $3, NOW())
        RETURNING *
      `, [id, `screenshots/${file.filename}`, 1]);
      
      uploadedScreenshots.push(result.rows[0]);
    }
    
    res.status(201).json({ 
      data: uploadedScreenshots,
      message: `${uploadedScreenshots.length} screenshot(s) uploaded successfully`
    });
  } catch (error) {
    console.error('Screenshot upload error:', error);
    res.status(500).json({ error: 'Failed to upload screenshots' });
  }
});

/**
 * @swagger
 * /api/admin/animes/{id}/screenshots/{screenshotId}:
 *   delete:
 *     summary: Supprimer un screenshot
 *     description: Supprime un screenshot spécifique d'un anime
 *     tags: [Admin - Screenshots]
 *     security:
 *       - bearerAuth: []
 */
app.delete('/api/admin/animes/:id/screenshots/:screenshotId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id, screenshotId } = req.params;
    
    // Get screenshot info before deletion
    const screenshotInfo = await pool.query(`
      SELECT url_screen as filename FROM ak_screenshots 
      WHERE id_screen = $1 AND id_titre = $2
    `, [screenshotId, id]);
    
    if (screenshotInfo.rows.length === 0) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }
    
    // Delete from database
    const result = await pool.query(`
      DELETE FROM ak_screenshots 
      WHERE id_screen = $1 AND id_titre = $2
      RETURNING *
    `, [screenshotId, id]);
    
    // Try to delete file from filesystem
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '..', 'frontend', 'public', 'images', screenshotInfo.rows[0].url_screen);
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.warn('Failed to delete screenshot file:', fileError.message);
    }
    
    res.json({ message: 'Screenshot deleted successfully' });
  } catch (error) {
    console.error('Screenshot deletion error:', error);
    res.status(500).json({ error: 'Failed to delete screenshot' });
  }
});

// ===== TAGS MANAGEMENT ROUTES =====

/**
 * @swagger
 * /api/admin/tags:
 *   get:
 *     summary: Récupère tous les tags avec leurs catégories
 *     description: Retourne la liste de tous les tags organisés par catégories
 *     tags: [Admin - Tags]
 *     security:
 *       - bearerAuth: []
 */
app.get('/api/admin/tags', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const tags = await pool.query(`
      SELECT id_tag, tag_name, tag_category
      FROM ak_tags 
      ORDER BY tag_category, tag_name ASC
    `);
    
    // Group tags by category
    const categorizedTags = {};
    tags.rows.forEach(tag => {
      const category = tag.tag_category || 'Divers';
      if (!categorizedTags[category]) {
        categorizedTags[category] = [];
      }
      categorizedTags[category].push(tag);
    });
    
    res.json({ data: categorizedTags });
  } catch (error) {
    console.error('Tags fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

/**
 * @swagger
 * /api/admin/animes/{id}/tags:
 *   get:
 *     summary: Récupère les tags d'un anime
 *     description: Retourne la liste des tags assignés à un anime
 *     tags: [Admin - Tags]
 *     security:
 *       - bearerAuth: []
 */
app.get('/api/admin/animes/:id/tags', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const animeTags = await pool.query(`
      SELECT t.id_tag, t.tag_name, t.tag_category
      FROM ak_tag2fiche t2f
      JOIN ak_tags t ON t2f.id_tag = t.id_tag
      WHERE t2f.id_fiche = $1 AND t2f.type = 'anime'
      ORDER BY t.tag_category, t.tag_name ASC
    `, [id]);
    
    res.json({ data: animeTags.rows });
  } catch (error) {
    console.error('Anime tags fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch anime tags' });
  }
});

/**
 * @swagger
 * /api/admin/animes/{id}/tags:
 *   post:
 *     summary: Ajouter un tag à un anime
 *     description: Associe un tag à un anime
 *     tags: [Admin - Tags]
 *     security:
 *       - bearerAuth: []
 */
app.post('/api/admin/animes/:id/tags', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { tag_id } = req.body;
    
    if (!tag_id) {
      return res.status(400).json({ error: 'Tag ID is required' });
    }
    
    // Check if tag is already assigned
    const existing = await pool.query(`
      SELECT id FROM ak_tag2fiche 
      WHERE id_fiche = $1 AND id_tag = $2 AND type = 'anime'
    `, [id, tag_id]);
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Tag already assigned to this anime' });
    }
    
    // Add the tag
    const result = await pool.query(`
      INSERT INTO ak_tag2fiche (id_fiche, id_tag, type)
      VALUES ($1, $2, 'anime')
      RETURNING *
    `, [id, tag_id]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add anime tag error:', error);
    res.status(500).json({ error: 'Failed to add tag to anime' });
  }
});

/**
 * @swagger
 * /api/admin/animes/{id}/tags/{tagId}:
 *   delete:
 *     summary: Supprimer un tag d'un anime
 *     description: Retire l'association entre un tag et un anime
 *     tags: [Admin - Tags]
 *     security:
 *       - bearerAuth: []
 */
app.delete('/api/admin/animes/:id/tags/:tagId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id, tagId } = req.params;
    
    const result = await pool.query(`
      DELETE FROM ak_tag2fiche 
      WHERE id_fiche = $1 AND id_tag = $2 AND type = 'anime'
      RETURNING *
    `, [id, tagId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tag assignment not found' });
    }
    
    res.json({ message: 'Tag removed from anime successfully' });
  } catch (error) {
    console.error('Remove anime tag error:', error);
    res.status(500).json({ error: 'Failed to remove tag from anime' });
  }
});

/**
 * @swagger
 * /api/admin/animes/{id}/related-tags:
 *   get:
 *     summary: Récupère les tags des animes/mangas en relation
 *     description: Retourne les tags des animes et mangas liés via ak_fiche_to_fiche
 *     tags: [Admin - Tags]
 *     security:
 *       - bearerAuth: []
 */
app.get('/api/admin/animes/:id/related-tags', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get related animes and their tags
    const relatedAnimes = await pool.query(`
      SELECT 
        a.id_anime, 
        a.titre,
        ARRAY_AGG(
          JSON_BUILD_OBJECT(
            'id_tag', t.id_tag,
            'tag_name', t.tag_name,
            'tag_category', t.categorie
          )
        ) FILTER (WHERE t.id_tag IS NOT NULL) as tags
      FROM ak_fiche_to_fiche r
      JOIN ak_animes a ON r.id_anime = a.id_anime AND a.statut = 1
      LEFT JOIN ak_tag2fiche t2f ON a.id_anime = t2f.id_fiche AND t2f.type = 'anime'
      LEFT JOIN ak_tags t ON t2f.id_tag = t.id_tag
      WHERE r.id_fiche_depart = $1
      GROUP BY a.id_anime, a.titre
      ORDER BY a.titre
    `, [`anime${id}`]);
    
    // Get related mangas and their tags
    const relatedMangas = await pool.query(`
      SELECT 
        m.id_manga, 
        m.titre,
        ARRAY_AGG(
          JSON_BUILD_OBJECT(
            'id_tag', t.id_tag,
            'tag_name', t.tag_name,
            'tag_category', t.categorie
          )
        ) FILTER (WHERE t.id_tag IS NOT NULL) as tags
      FROM ak_fiche_to_fiche r
      JOIN ak_mangas m ON r.id_manga = m.id_manga AND m.statut = 1
      LEFT JOIN ak_tag2fiche t2f ON m.id_manga = t2f.id_fiche AND t2f.type = 'manga'
      LEFT JOIN ak_tags t ON t2f.id_tag = t.id_tag
      WHERE r.id_fiche_depart = $1
      GROUP BY m.id_manga, m.titre
      ORDER BY m.titre
    `, [`anime${id}`]);
    
    res.json({ 
      animes: relatedAnimes.rows,
      mangas: relatedMangas.rows
    });
  } catch (error) {
    console.error('Related tags fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch related tags' });
  }
});

/**
 * @swagger
 * /api/admin/mangas/{id}/tags:
 *   get:
 *     summary: Récupère les tags d'un manga (admin)
 *     description: Retourne la liste des tags associés à un manga pour l'administration
 *     tags: [Admin - Tags]
 *     security:
 *       - bearerAuth: []
 */
app.get('/api/admin/mangas/:id/tags', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const mangaTags = await pool.query(`
      SELECT t.id_tag, t.tag_name, t.tag_category
      FROM ak_tag2fiche t2f
      JOIN ak_tags t ON t2f.id_tag = t.id_tag
      WHERE t2f.id_fiche = $1 AND t2f.type = 'manga'
      ORDER BY t.tag_category, t.tag_name ASC
    `, [id]);
    
    res.json({ data: mangaTags.rows });
  } catch (error) {
    console.error('Manga tags fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch manga tags' });
  }
});

/**
 * @swagger
 * /api/admin/mangas/{id}/tags:
 *   post:
 *     summary: Ajouter un tag à un manga
 *     description: Associe un tag à un manga
 *     tags: [Admin - Tags]
 *     security:
 *       - bearerAuth: []
 */
app.post('/api/admin/mangas/:id/tags', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { tag_id } = req.body;
    
    if (!tag_id) {
      return res.status(400).json({ error: 'Tag ID is required' });
    }
    
    // Check if tag is already assigned
    const existing = await pool.query(`
      SELECT id FROM ak_tag2fiche 
      WHERE id_fiche = $1 AND id_tag = $2 AND type = 'manga'
    `, [id, tag_id]);
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Tag already assigned to this manga' });
    }
    
    // Add the tag
    const result = await pool.query(`
      INSERT INTO ak_tag2fiche (id_fiche, id_tag, type)
      VALUES ($1, $2, 'manga')
      RETURNING *
    `, [id, tag_id]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add manga tag error:', error);
    res.status(500).json({ error: 'Failed to add tag to manga' });
  }
});

/**
 * @swagger
 * /api/admin/mangas/{id}/tags/{tagId}:
 *   delete:
 *     summary: Supprimer un tag d'un manga
 *     description: Retire l'association entre un tag et un manga
 *     tags: [Admin - Tags]
 *     security:
 *       - bearerAuth: []
 */
app.delete('/api/admin/mangas/:id/tags/:tagId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id, tagId } = req.params;
    
    const result = await pool.query(`
      DELETE FROM ak_tag2fiche 
      WHERE id_fiche = $1 AND id_tag = $2 AND type = 'manga'
      RETURNING *
    `, [id, tagId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tag assignment not found' });
    }
    
    res.json({ message: 'Tag removed from manga successfully' });
  } catch (error) {
    console.error('Remove manga tag error:', error);
    res.status(500).json({ error: 'Failed to remove tag from manga' });
  }
});

/**
 * @swagger
 * /api/admin/mangas/{id}/related-tags:
 *   get:
 *     summary: Récupère les tags des animes/mangas en relation avec un manga
 *     description: Retourne les tags des animes et mangas liés via ak_fiche_to_fiche
 *     tags: [Admin - Tags]
 *     security:
 *       - bearerAuth: []
 */
app.get('/api/admin/mangas/:id/related-tags', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get related animes and their tags
    const relatedAnimes = await pool.query(`
      SELECT 
        a.id_anime, 
        a.titre,
        ARRAY_AGG(
          JSON_BUILD_OBJECT(
            'id_tag', t.id_tag,
            'tag_name', t.tag_name,
            'tag_category', t.categorie
          )
        ) FILTER (WHERE t.id_tag IS NOT NULL) as tags
      FROM ak_fiche_to_fiche r
      JOIN ak_animes a ON r.id_anime = a.id_anime AND a.statut = 1
      LEFT JOIN ak_tag2fiche t2f ON a.id_anime = t2f.id_fiche AND t2f.type = 'anime'
      LEFT JOIN ak_tags t ON t2f.id_tag = t.id_tag
      WHERE r.id_fiche_depart = $1
      GROUP BY a.id_anime, a.titre
      ORDER BY a.titre
    `, [`manga${id}`]);
    
    // Get related mangas and their tags
    const relatedMangas = await pool.query(`
      SELECT 
        m.id_manga, 
        m.titre,
        ARRAY_AGG(
          JSON_BUILD_OBJECT(
            'id_tag', t.id_tag,
            'tag_name', t.tag_name,
            'tag_category', t.categorie
          )
        ) FILTER (WHERE t.id_tag IS NOT NULL) as tags
      FROM ak_fiche_to_fiche r
      JOIN ak_mangas m ON r.id_manga = m.id_manga AND m.statut = 1
      LEFT JOIN ak_tag2fiche t2f ON m.id_manga = t2f.id_fiche AND t2f.type = 'manga'
      LEFT JOIN ak_tags t ON t2f.id_tag = t.id_tag
      WHERE r.id_fiche_depart = $1
      GROUP BY m.id_manga, m.titre
      ORDER BY m.titre
    `, [`manga${id}`]);
    
    res.json({ 
      animes: relatedAnimes.rows,
      mangas: relatedMangas.rows
    });
  } catch (error) {
    console.error('Related tags fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch related tags' });
  }
});

// ===== ADMIN MANGA ROUTES =====

/**
 * @swagger
 * /api/admin/mangas:
 *   get:
 *     summary: Liste des mangas pour l'administration
 *     description: Récupère la liste complète des mangas avec pagination pour l'interface d'administration
 *     tags: [Admin - Mangas]
 *     security:
 *       - bearerAuth: []
 */
app.get('/api/admin/mangas', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, status = 'all' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = '';
    let params = [];
    let paramCount = 0;
    
    if (status !== 'all') {
      paramCount++;
      whereClause += ` WHERE statut = $${paramCount}`;
      params.push(parseInt(status));
    }
    
    if (search) {
      paramCount++;
      const searchClause = ` ${whereClause ? 'AND' : 'WHERE'} titre ILIKE $${paramCount}`;
      whereClause += searchClause;
      params.push(`%${search}%`);
    }
    
    const query = `
      SELECT id_manga, nice_url, titre, auteur, annee, nb_volumes, 
             image, nb_reviews, moyennenotes, date_ajout, statut
      FROM ak_mangas ${whereClause}
      ORDER BY date_ajout DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    params.push(parseInt(limit), offset);
    
    const [mangas, total] = await Promise.all([
      pool.query(query, params),
      pool.query(`SELECT COUNT(*) FROM ak_mangas ${whereClause}`, params.slice(0, paramCount))
    ]);
    
    res.json({
      data: mangas.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.rows[0].count),
        pages: Math.ceil(total.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Admin mangas fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch mangas' });
  }
});

/**
 * @swagger
 * /api/admin/mangas:
 *   post:
 *     summary: Créer un nouveau manga
 *     description: Ajoute un nouveau manga à la base de données
 *     tags: [Admin - Mangas]
 *     security:
 *       - bearerAuth: []
 */
app.post('/api/admin/mangas', upload.single('image'), authMiddleware, adminMiddleware, [
  body('titre').notEmpty().withMessage('Titre is required'),
  body('origine').notEmpty().withMessage('Origine is required'),
  body('titre_orig').notEmpty().withMessage('Titre original is required'),
  body('annee').isInt({ min: 1900, max: 2030 }).withMessage('Valid year required'),
  body('nb_volumes').notEmpty().withMessage('Number of volumes is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { titre, origine, annee, titre_orig, titres_alternatifs, licence, titre_fr, nb_volumes, synopsis, topic, commentaire, isbn, statut = 1 } = req.body;
    
    // Handle uploaded image
    let imagePath = null;
    if (req.file) {
      imagePath = req.file.filename;
    }
    
    // Generate nice_url
    const niceUrl = titre.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
    
    const result = await pool.query(`
      INSERT INTO ak_mangas (
        nice_url, titre, origine, annee, titre_orig, titres_alternatifs, licence, titre_fr,
        nb_volumes, synopsis, topic, commentaire, isbn, image, date_ajout, statut, nb_reviews, moyennenotes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), $15, 0, 0)
      RETURNING *
    `, [niceUrl, titre, origine, annee || null, titre_orig, titres_alternatifs, licence || 0, titre_fr, nb_volumes, synopsis, topic || 0, commentaire, isbn, imagePath, statut]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Manga creation error:', error);
    res.status(500).json({ error: 'Failed to create manga' });
  }
});

/**
 * @swagger
 * /api/admin/mangas/{id}:
 *   get:
 *     summary: Récupérer un manga par ID
 *     description: Récupère les détails d'un manga spécifique
 *     tags: [Admin - Mangas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du manga
 *     responses:
 *       200:
 *         description: Détails du manga
 *       404:
 *         description: Manga non trouvé
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit
 */
app.get('/api/admin/mangas/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT id_manga, nice_url, titre, auteur, annee, nb_volumes, 
             image, nb_reviews, moyennenotes, date_ajout, statut,
             synopsis, origine, titre_orig, titres_alternatifs, licence, 
             titre_fr, isbn, lienforum, precisions
      FROM ak_mangas 
      WHERE id_manga = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Manga not found' });
    }
    
    // Rename moyenne_notes field to match frontend expectation
    const manga = result.rows[0];
    manga.moyenne_notes = manga.moyennenotes;
    delete manga.moyennenotes;
    
    // Clean up HTML tags from synopsis if present
    if (manga.synopsis) {
      manga.synopsis = manga.synopsis
        .replace(/<br\s*\/?>/gi, '\n')  // Replace <br> tags with newlines
        .replace(/<[^>]*>/g, '')        // Remove any other HTML tags
        .trim();                        // Remove extra whitespace
    }
    
    res.json(manga);
  } catch (error) {
    console.error('Manga fetch error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ 
      error: 'Failed to fetch manga',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /api/admin/mangas/{id}:
 *   put:
 *     summary: Mettre à jour un manga
 *     description: Modifie les informations d'un manga existant
 *     tags: [Admin - Mangas]
 *     security:
 *       - bearerAuth: []
 */
app.put('/api/admin/mangas/:id', upload.single('image'), authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { titre, auteur, annee, nb_volumes, synopsis, image, statut, origine, titre_orig, titres_alternatifs, licence, titre_fr, isbn, topic, commentaire } = req.body;
    
    // Handle image upload
    let finalImage = image; // Use existing image from form if no file uploaded
    if (req.file) {
      // New file uploaded, save it to mangas directory
      const mangaImagePath = path.join(__dirname, '../frontend/public/images/mangas', req.file.filename);
      fs.renameSync(req.file.path, mangaImagePath);
      finalImage = req.file.filename;
    }

    // Update nice_url if titre changed
    let niceUrl;
    if (titre) {
      niceUrl = titre.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
    }
    
    const result = await pool.query(`
      UPDATE ak_mangas 
      SET titre = COALESCE($1, titre),
          auteur = COALESCE($2, auteur),
          annee = COALESCE($3, annee),
          nb_volumes = COALESCE($4, nb_volumes),
          synopsis = COALESCE($5, synopsis),
          image = COALESCE($6, image),
          statut = COALESCE($7, statut),
          nice_url = COALESCE($8, nice_url),
          origine = COALESCE($9, origine),
          titre_orig = COALESCE($10, titre_orig),
          titres_alternatifs = COALESCE($11, titres_alternatifs),
          licence = COALESCE($12, licence),
          titre_fr = COALESCE($13, titre_fr),
          isbn = COALESCE($14, isbn),
          topic = COALESCE($15, topic),
          commentaire = COALESCE($16, commentaire)
      WHERE id_manga = $17
      RETURNING *
    `, [titre, auteur, annee, nb_volumes, synopsis, finalImage, statut, niceUrl, origine, titre_orig, titres_alternatifs, licence, titre_fr, isbn, topic, commentaire, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Manga not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Manga update error:', error);
    res.status(500).json({ error: 'Failed to update manga' });
  }
});

/**
 * @swagger
 * /api/admin/mangas/{id}:
 *   delete:
 *     summary: Supprimer un manga
 *     description: Supprime définitivement un manga et ses données associées
 *     tags: [Admin - Mangas]
 *     security:
 *       - bearerAuth: []
 */
app.delete('/api/admin/mangas/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete associated data first
    await pool.query('DELETE FROM ak_critique WHERE id_manga = $1', [id]);
    await pool.query('DELETE FROM ak_tag2fiche WHERE id_fiche = $1 AND type = $2', [id, 'manga']);
    
    // Delete the manga
    const result = await pool.query('DELETE FROM ak_mangas WHERE id_manga = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Manga not found' });
    }
    
    res.json({ message: 'Manga deleted successfully', deleted: result.rows[0] });
  } catch (error) {
    console.error('Manga deletion error:', error);
    res.status(500).json({ error: 'Failed to delete manga' });
  }
});

// ===== ADMIN MANGA COVERS ROUTES =====

/**
 * @swagger
 * /api/admin/mangas/{id}/covers:
 *   get:
 *     summary: Récupère les couvertures d'un manga
 *     description: Retourne la liste des couvertures d'un manga
 *     tags: [Admin - Manga Covers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du manga
 *     responses:
 *       200:
 *         description: Liste des couvertures récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_screen:
 *                         type: integer
 *                       url_screen:
 *                         type: string
 *                       id_titre:
 *                         type: integer
 *                       type:
 *                         type: integer
 *                       upload_date:
 *                         type: string
 *       401:
 *         description: Authentification requise
 *       403:
 *         description: Accès admin requis
 *       500:
 *         description: Erreur serveur
 */
app.get('/api/admin/mangas/:id/covers', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const covers = await pool.query(`
      SELECT id_screen, id_titre, url_screen, upload_date, type
      FROM ak_screenshots 
      WHERE id_titre = $1 AND type = $2
      ORDER BY id_screen ASC
    `, [id, 2]); // type = 2 for manga covers
    
    res.json({ data: covers.rows });
  } catch (error) {
    console.error('Manga covers fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch manga covers' });
  }
});

/**
 * @swagger
 * /api/admin/mangas/{id}/covers:
 *   post:
 *     summary: Upload des couvertures pour un manga
 *     description: Upload d'une nouvelle couverture pour un manga (par fichier ou URL)
 *     tags: [Admin - Manga Covers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du manga
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               cover:
 *                 type: string
 *                 format: binary
 *                 description: Fichier image de la couverture
 *               url_screen:
 *                 type: string
 *                 description: URL de la couverture (alternative au fichier)
 *               manga_id:
 *                 type: integer
 *                 description: ID du manga
 *               type:
 *                 type: integer
 *                 description: Type de l'image (2 pour les couvertures manga)
 *     responses:
 *       201:
 *         description: Couverture uploadée avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Authentification requise
 *       403:
 *         description: Accès admin requis
 *       500:
 *         description: Erreur serveur
 */
app.post('/api/admin/mangas/:id/covers', upload.single('cover'), authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { url_screen } = req.body;
    const file = req.file;
    
    let coverUrl;
    
    if (file) {
      // File upload
      coverUrl = `screenshots/${file.filename}`;
    } else if (url_screen) {
      // URL upload
      coverUrl = url_screen;
    } else {
      return res.status(400).json({ error: 'Either file or URL must be provided' });
    }
    
    // Insert cover record
    const result = await pool.query(`
      INSERT INTO ak_screenshots (id_titre, url_screen, type, upload_date)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `, [id, coverUrl, 2]); // type = 2 for manga covers
    
    res.status(201).json({ 
      data: result.rows[0],
      message: 'Cover uploaded successfully'
    });
  } catch (error) {
    console.error('Cover upload error:', error);
    res.status(500).json({ error: 'Failed to upload cover' });
  }
});

/**
 * @swagger
 * /api/admin/mangas/{id}/covers/{coverId}:
 *   delete:
 *     summary: Supprimer une couverture
 *     description: Supprime une couverture spécifique d'un manga
 *     tags: [Admin - Manga Covers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du manga
 *       - in: path
 *         name: coverId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la couverture
 *     responses:
 *       200:
 *         description: Couverture supprimée avec succès
 *       404:
 *         description: Couverture non trouvée
 *       401:
 *         description: Authentification requise
 *       403:
 *         description: Accès admin requis
 *       500:
 *         description: Erreur serveur
 */
app.delete('/api/admin/mangas/:id/covers/:coverId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id, coverId } = req.params;
    
    // Get cover info before deletion
    const coverInfo = await pool.query(`
      SELECT url_screen FROM ak_screenshots 
      WHERE id_screen = $1 AND id_titre = $2 AND type = $3
    `, [coverId, id, 2]); // type = 2 for manga covers
    
    if (coverInfo.rows.length === 0) {
      return res.status(404).json({ error: 'Cover not found' });
    }
    
    // Delete from database
    const result = await pool.query(`
      DELETE FROM ak_screenshots 
      WHERE id_screen = $1 AND id_titre = $2 AND type = $3
      RETURNING *
    `, [coverId, id, 2]); // type = 2 for manga covers
    
    // Try to delete file from filesystem if it's a local file
    const fs = require('fs');
    const path = require('path');
    const urlScreen = coverInfo.rows[0].url_screen;
    
    if (urlScreen && urlScreen.startsWith('screenshots/')) {
      const filePath = path.join(__dirname, '..', 'frontend', 'public', 'images', urlScreen);
      
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileError) {
        console.warn('Failed to delete cover file:', fileError.message);
      }
    }
    
    res.json({ message: 'Cover deleted successfully' });
  } catch (error) {
    console.error('Cover deletion error:', error);
    res.status(500).json({ error: 'Failed to delete cover' });
  }
});

// ===== ADMIN BUSINESS ROUTES =====

/**
 * @swagger
 * /api/admin/business:
 *   get:
 *     summary: Liste des fiches business pour l'administration
 *     description: Récupère la liste complète des fiches business avec pagination et filtres
 *     tags: [Admin - Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: denomination
 *         schema:
 *           type: string
 *         description: Filtrer par dénomination (recherche partielle)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Personnalité, Studio, Editeur, Divers, Chaîne TV, Magazine, Evénement, Association]
 *         description: Filtrer par type
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [all, active, inactive, pending]
 *           default: all
 *         description: Filtrer par statut (all=tous, active=1, inactive=0, pending=2)
 *     responses:
 *       200:
 *         description: Liste des fiches business récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_business:
 *                         type: integer
 *                         description: ID de la fiche business
 *                       denomination:
 *                         type: string
 *                         description: Nom de l'entreprise/personne
 *                       type:
 *                         type: string
 *                         description: Type (Studio, Personnalité, etc.)
 *                       origine:
 *                         type: string
 *                         description: Pays d'origine
 *                       statut:
 *                         type: integer
 *                         description: Statut (0=inactif, 1=actif, 2=en attente)
 *                       date_ajout:
 *                         type: string
 *                         format: date-time
 *                         description: Date d'ajout
 *                       nb_relations:
 *                         type: integer
 *                         description: Nombre de relations avec animes/mangas
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 filters:
 *                   type: object
 *                   properties:
 *                     types:
 *                       type: array
 *                       description: Liste des types disponibles
 *                     statuts:
 *                       type: object
 *                       description: Distribution des statuts
 *       401:
 *         description: Authentification requise
 *       403:
 *         description: Accès admin requis
 *       500:
 *         description: Erreur serveur
 */
app.get('/api/admin/business', authMiddleware, adminMiddleware, async (req, res) => {
  console.log('🔧 DEBUG: Business admin route hit! Query params:', req.query);
  try {
    const { 
      page = 1, 
      limit = 50, 
      denomination, 
      type, 
      statut = 'all' 
    } = req.query;
    console.log('🔧 DEBUG: Extracted params - statut:', statut);
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    let params = [];
    let paramCount = 0;
    
    // Filter by denomination (partial search)
    if (denomination) {
      paramCount++;
      whereClause += ` AND denomination ILIKE $${paramCount}`;
      params.push(`%${denomination}%`);
    }
    
    // Filter by type
    if (type) {
      paramCount++;
      whereClause += ` AND type = $${paramCount}`;
      params.push(type);
    }
    
    // Filter by status
    console.log('🔧 DEBUG: statut parameter:', statut, 'type:', typeof statut);
    if (statut !== 'all') {
      paramCount++;
      console.log('🔧 DEBUG: Filtering by status, paramCount:', paramCount);
      switch (statut) {
        case 'active':
          console.log('🔧 DEBUG: Active filter - pushing 1');
          whereClause += ` AND statut = $${paramCount}`;
          params.push(1);
          break;
        case 'inactive':
          console.log('🔧 DEBUG: Inactive filter - pushing 0');
          whereClause += ` AND statut = $${paramCount}`;
          params.push(0);
          break;
        case 'pending':
          console.log('🔧 DEBUG: Pending filter - pushing 2');
          whereClause += ` AND statut = $${paramCount}`;
          params.push(2);
          break;
        default:
          console.log('🔧 DEBUG: Unknown status:', statut);
      }
    }
    console.log('🔧 DEBUG: Final whereClause:', whereClause);
    console.log('🔧 DEBUG: Final params:', params);
    
    // Main query with relation counts
    const query = `
      SELECT 
        b.*,
        (SELECT COUNT(*) FROM ak_business_to_animes WHERE id_business = b.id_business) +
        (SELECT COUNT(*) FROM ak_business_to_mangas WHERE id_business = b.id_business) +
        (SELECT COUNT(*) FROM ak_business_to_jeux WHERE id_business = b.id_business) +
        (SELECT COUNT(*) FROM ak_business_to_ost WHERE id_business = b.id_business) as nb_relations
      FROM ak_business b
      ${whereClause}
      ORDER BY b.date_ajout DESC, b.denomination ASC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    params.push(parseInt(limit), offset);
    
    // Execute main query and count query in parallel
    const [business, total, types, statusDistribution] = await Promise.all([
      pool.query(query, params),
      pool.query(`SELECT COUNT(*) FROM ak_business b ${whereClause}`, params.slice(0, paramCount)),
      pool.query('SELECT type, COUNT(*) as count FROM ak_business GROUP BY type ORDER BY count DESC'),
      pool.query('SELECT statut, COUNT(*) as count FROM ak_business GROUP BY statut ORDER BY statut')
    ]);
    
    res.json({
      data: business.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.rows[0].count),
        pages: Math.ceil(total.rows[0].count / parseInt(limit))
      },
      filters: {
        types: types.rows.map(row => ({ name: row.type, count: parseInt(row.count) })),
        statuts: statusDistribution.rows.reduce((acc, row) => {
          const statusName = row.statut == 1 ? 'active' : row.statut == 0 ? 'inactive' : 'pending';
          acc[statusName] = parseInt(row.count);
          return acc;
        }, {})
      }
    });
    
  } catch (error) {
    console.error('Admin business fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch business data' });
  }
});

/**
 * @swagger
 * /api/admin/business/{id}:
 *   get:
 *     summary: Récupère une fiche business par ID
 *     description: Retourne les détails complets d'une fiche business avec ses relations
 *     tags: [Admin - Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la fiche business
 *     responses:
 *       200:
 *         description: Fiche business récupérée avec succès
 *       404:
 *         description: Fiche business non trouvée
 *       401:
 *         description: Authentification requise
 *       403:
 *         description: Accès admin requis
 */
app.get('/api/admin/business/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get business details
    const business = await pool.query(
      'SELECT * FROM ak_business WHERE id_business = $1',
      [id]
    );
    
    if (business.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    // Get relations
    const [animeRelations, mangaRelations, gameRelations, ostRelations] = await Promise.all([
      pool.query(`
        SELECT a.id_anime, a.titre, bta.precisions
        FROM ak_business_to_animes bta
        JOIN ak_animes a ON bta.id_anime = a.id_anime
        WHERE bta.id_business = $1
        ORDER BY a.titre
      `, [id]),
      pool.query(`
        SELECT m.id_manga, m.titre, btm.precisions
        FROM ak_business_to_mangas btm
        JOIN ak_mangas m ON btm.id_manga = m.id_manga
        WHERE btm.id_business = $1
        ORDER BY m.titre
      `, [id]),
      pool.query(`
        SELECT j.id_jeu, j.nom, btj.precisions
        FROM ak_business_to_jeux btj
        JOIN ak_jeux_video j ON btj.id_jeu = j.id_jeu
        WHERE btj.id_business = $1
        ORDER BY j.nom
      `, [id]),
      pool.query(`
        SELECT o.id_ost, o.nom, bto.precisions
        FROM ak_business_to_ost bto
        JOIN ak_ost o ON bto.id_ost = o.id_ost
        WHERE bto.id_business = $1
        ORDER BY o.nom
      `, [id])
    ]);
    
    res.json({
      data: {
        ...business.rows[0],
        relations: {
          animes: animeRelations.rows,
          mangas: mangaRelations.rows,
          games: gameRelations.rows,
          ost: ostRelations.rows
        }
      }
    });
    
  } catch (error) {
    console.error('Admin business fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch business data' });
  }
});

/**
 * @swagger
 * /api/admin/business/{id}:
 *   put:
 *     summary: Mettre à jour une fiche business
 *     description: Modifie les informations d'une fiche business existante
 *     tags: [Admin - Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la fiche business
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               denomination:
 *                 type: string
 *                 description: Nom de l'entreprise/personne
 *               type:
 *                 type: string
 *                 description: Type de business
 *               origine:
 *                 type: string
 *                 description: Pays d'origine
 *               site_officiel:
 *                 type: string
 *                 description: Site web officiel
 *               statut:
 *                 type: integer
 *                 description: Statut (0=inactif, 1=actif, 2=en attente)
 *               notes:
 *                 type: string
 *                 description: Notes additionnelles
 *     responses:
 *       200:
 *         description: Fiche business mise à jour avec succès
 *       404:
 *         description: Fiche business non trouvée
 *       401:
 *         description: Authentification requise
 *       403:
 *         description: Accès admin requis
 */
app.put('/api/admin/business/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { denomination, type, origine, site_officiel, statut, notes } = req.body;
    
    const result = await pool.query(`
      UPDATE ak_business 
      SET denomination = $1, type = $2, origine = $3, site_officiel = $4, 
          statut = $5, notes = $6, date_modification = extract(epoch from now())::integer
      WHERE id_business = $7
      RETURNING *
    `, [denomination, type, origine, site_officiel, statut, notes, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    res.json({ 
      message: 'Business updated successfully', 
      data: result.rows[0] 
    });
    
  } catch (error) {
    console.error('Admin business update error:', error);
    res.status(500).json({ error: 'Failed to update business' });
  }
});

/**
 * @swagger
 * /api/admin/business:
 *   post:
 *     summary: Créer une nouvelle fiche business
 *     description: Ajoute une nouvelle fiche business à la base de données
 *     tags: [Admin - Business]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [denomination, type]
 *             properties:
 *               denomination:
 *                 type: string
 *                 description: Nom de l'entreprise/personne
 *               type:
 *                 type: string
 *                 description: Type de business
 *               origine:
 *                 type: string
 *                 description: Pays d'origine
 *               site_officiel:
 *                 type: string
 *                 description: Site web officiel
 *               autres_denominations:
 *                 type: string
 *                 description: Autres noms/dénominations
 *               notes:
 *                 type: string
 *                 description: Notes additionnelles
 *               statut:
 *                 type: integer
 *                 default: 1
 *                 description: Statut (0=inactif, 1=actif, 2=en attente)
 *     responses:
 *       201:
 *         description: Fiche business créée avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Authentification requise
 *       403:
 *         description: Accès admin requis
 */
app.post('/api/admin/business', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { denomination, type, origine, site_officiel, autres_denominations, notes, statut = 1 } = req.body;
    
    if (!denomination || !type) {
      return res.status(400).json({ error: 'Denomination and type are required' });
    }
    
    // Generate nice URL
    const nice_url = denomination.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const result = await pool.query(`
      INSERT INTO ak_business (denomination, type, origine, site_officiel, autres_denominations, notes, statut, nice_url, date_ajout)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `, [denomination, type, origine, site_officiel, autres_denominations, notes, statut, nice_url]);
    
    res.status(201).json({ 
      message: 'Business created successfully', 
      data: result.rows[0] 
    });
    
  } catch (error) {
    console.error('Admin business creation error:', error);
    res.status(500).json({ error: 'Failed to create business' });
  }
});

/**
 * @swagger
 * /api/admin/business/{id}:
 *   delete:
 *     summary: Supprimer une fiche business
 *     description: Supprime définitivement une fiche business et ses relations
 *     tags: [Admin - Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la fiche business
 *     responses:
 *       200:
 *         description: Fiche business supprimée avec succès
 *       404:
 *         description: Fiche business non trouvée
 *       401:
 *         description: Authentification requise
 *       403:
 *         description: Accès admin requis
 */
app.delete('/api/admin/business/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete relations first
    await Promise.all([
      pool.query('DELETE FROM ak_business_to_animes WHERE id_business = $1', [id]),
      pool.query('DELETE FROM ak_business_to_mangas WHERE id_business = $1', [id]),
      pool.query('DELETE FROM ak_business_to_jeux WHERE id_business = $1', [id]),
      pool.query('DELETE FROM ak_business_to_ost WHERE id_business = $1', [id])
    ]);
    
    // Delete the business record
    const result = await pool.query(
      'DELETE FROM ak_business WHERE id_business = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    res.json({ message: 'Business deleted successfully' });
    
  } catch (error) {
    console.error('Admin business deletion error:', error);
    res.status(500).json({ error: 'Failed to delete business' });
  }
});

// ===== METRICS AND HEALTH =====

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Métriques Prometheus
 *     description: Retourne les métriques de l'application au format Prometheus
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Métriques Prometheus
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: |
 *                 # HELP http_requests_total Total HTTP requests
 *                 # TYPE http_requests_total counter
 *                 http_requests_total{method="GET",route="/api/animes",status="200"} 42
 */
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Vérification de la santé de l'API
 *     description: Vérifie l'état de l'API et de la connexion à la base de données
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Service en bonne santé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy]
 *                   example: healthy
 *                 database:
 *                   type: string
 *                   enum: [connected]
 *                   example: connected
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-07-24T00:35:40.000Z"
 *       503:
 *         description: Service non disponible
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [unhealthy]
 *                 database:
 *                   type: string
 *                   enum: [disconnected]
 *                 error:
 *                   type: string
 *                   description: Message d'erreur détaillé
 */
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected', error: error.message });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    message: 'The requested API endpoint does not exist',
    available_endpoints: {
      root: '/',
      api_docs: '/api',
      health: '/health',
      metrics: '/metrics'
    }
  });
});

app.listen(port, () => {
  console.log(`🚀 Anime-Kun API v2.0 running on http://localhost:${port}`);
  console.log(`📊 Metrics available at http://localhost:${port}/metrics`);
  console.log(`🔍 API documentation at http://localhost:${port}/api`);
  console.log(`💾 Database: PostgreSQL`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📋 API-only server - Frontend should run separately`);
});

module.exports = app;