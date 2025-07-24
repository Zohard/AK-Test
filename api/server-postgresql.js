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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Adresse email de l'utilisateur
 *                 example: "user@anime-kun.com"
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
  body('email').isEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM smf_members WHERE email_address = $1', [email]);
    const user = result.rows[0];
    
    if (!user || !(await bcrypt.compare(password, user.passwd))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    await pool.query('UPDATE smf_members SET last_login = NOW() WHERE id_member = $1', [user.id_member]);
    
    const token = jwt.sign(
      { userId: user.id_member, username: user.member_name, role: user.id_group === 1 ? 'admin' : 'user' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );
    
    res.json({ token, user: { id: user.id_member, username: user.member_name, email: user.email_address } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
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
             image, nb_reviews, moyenne_notes, date_ajout
      FROM ak_animes ${whereClause}
      ORDER BY annee DESC, titre ASC
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
      LEFT JOIN ak_critique c ON a.id_anime = c.id_anime AND c.statut = 1
      WHERE a.id_anime = $1 AND a.statut = 1
      GROUP BY a.id_anime
    `, [id]);
    
    if (anime.rows.length === 0) {
      return res.status(404).json({ error: 'Anime not found' });
    }
    
    // Get episodes
    const episodes = await pool.query(`
      SELECT * FROM ak_animes_episodes 
      WHERE id_anime = $1 
      ORDER BY numero ASC
    `, [id]);
    
    // Get screenshots
    const screenshots = await pool.query(`
      SELECT * FROM ak_screenshots 
      WHERE id_anime = $1 
      ORDER BY id_screenshot ASC
    `, [id]);
    
    // Get reviews
    const reviews = await pool.query(`
      SELECT c.*, u.member_name as author_name
      FROM ak_critique c
      LEFT JOIN smf_members u ON c.id_membre = u.id_member
      WHERE c.id_anime = $1 AND c.statut = 1
      ORDER BY c.date_critique DESC
      LIMIT 5
    `, [id]);
    
    res.json({
      ...anime.rows[0],
      episodes: episodes.rows,
      screenshots: screenshots.rows,
      recent_reviews: reviews.rows
    });
  } catch (error) {
    console.error('Anime fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch anime' });
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
             image, nb_reviews, moyenne_notes, date_ajout
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
      LEFT JOIN ak_critique c ON m.id_manga = c.id_manga AND c.statut = 1
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
      WHERE c.id_manga = $1 AND c.statut = 1
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
app.post('/api/reviews', authenticateToken, [
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
        SELECT 'anime' as type, id_anime as id, titre, image, annee, moyenne_notes
        FROM ak_animes 
        WHERE statut = 1 AND (titre ILIKE $1 OR synopsis ILIKE $1)
        ORDER BY moyenne_notes DESC NULLS LAST
        LIMIT $2
      `, [searchTerm, limit]);
      results = results.concat(animes.rows);
    }
    
    if (type === 'all' || type === 'manga') {
      const mangas = await pool.query(`
        SELECT 'manga' as type, id_manga as id, titre, image, annee, moyenne_notes
        FROM ak_mangas 
        WHERE statut = 1 AND (titre ILIKE $1 OR synopsis ILIKE $1)
        ORDER BY moyenne_notes DESC NULLS LAST
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
app.get('/api/admin/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM ak_animes) as total_animes,
        (SELECT COUNT(*) FROM ak_mangas) as total_mangas,
        (SELECT COUNT(*) FROM ak_critique) as total_reviews,
        (SELECT COUNT(*) FROM smf_members) as total_users,
        (SELECT COUNT(*) FROM ak_webzine_articles) as total_articles
    `);
    
    const recentActivity = await pool.query(`
      SELECT 'review' as type, date_critique as date, titre as title
      FROM ak_critique 
      WHERE statut = 1
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