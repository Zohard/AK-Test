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
        url: `http://localhost:${port}`,
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
 * /api/animes/{id}/relations:
 *   post:
 *     summary: Ajouter une relation à un anime
 *     description: Ajoute une relation entre un anime et un autre anime/manga
 *     tags: [Admin - Relations]
 *     security:
 *       - bearerAuth: []
 */
app.post('/api/animes/:id/relations', authMiddleware, adminMiddleware, async (req, res) => {
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
      id_fiche_depart: `anime${id}`,
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
    console.error('Anime relation creation error:', error);
    res.status(500).json({ error: 'Failed to create anime relation' });
  }
});

/**
 * @swagger
 * /api/animes/{id}/relations/{relationId}:
 *   delete:
 *     summary: Supprimer une relation anime
 *     description: Supprime une relation entre un anime et un autre anime/manga
 *     tags: [Admin - Relations]
 *     security:
 *       - bearerAuth: []
 */
app.delete('/api/animes/:id/relations/:relationId', authMiddleware, adminMiddleware, async (req, res) => {
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
    
    res.json({ success: true, message: 'Relation removed successfully' });
  } catch (error) {
    console.error('Anime relation deletion error:', error);
    res.status(500).json({ error: 'Failed to remove anime relation' });
  }
});

// Route imports
const authRoutes = require('./routes/auth');
const animeRoutes = require('./routes/animes');
const mangaRoutes = require('./routes/mangas');
const reviewRoutes = require('./routes/reviews');
const searchRoutes = require('./routes/search');
const userRoutes = require('./routes/users');
const webzineRoutes = require('./routes/webzine');
const adminRoutes = require('./routes/admin');
const businessRoutes = require('./routes/business');
const metricsRoutes = require('./routes/metrics');
const healthRoutes = require('./routes/health');

// Mount route modules
app.use(authRoutes);
app.use(animeRoutes);
app.use(mangaRoutes);
app.use(reviewRoutes);
app.use(searchRoutes);
app.use(userRoutes);
app.use(webzineRoutes);
app.use(adminRoutes);
app.use(businessRoutes);
app.use(metricsRoutes);
app.use(healthRoutes);

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