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
const exphbs = require('express-handlebars');
const morgan = require('morgan');
const NodeCache = require('node-cache');
const promClient = require('prom-client');

const app = express();
const port = process.env.PORT || 3000;

// Security and middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000'],
  credentials: true
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

// Handlebars setup for web interface
app.engine('handlebars', exphbs.engine({
  defaultLayout: 'main',
  layoutsDir: __dirname + '/views/layouts/',
  partialsDir: __dirname + '/views/partials/'
}));
app.set('view engine', 'handlebars');
app.set('views', __dirname + '/views');

// Static files
app.use('/static', express.static(__dirname + '/public'));

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

// ===== WEB INTERFACE ROUTES =====

// Homepage
app.get('/', async (req, res) => {
  try {
    // Get recent animes
    const recentAnimes = await pool.query(`
      SELECT * FROM ak_animes 
      WHERE statut = 1 AND image IS NOT NULL 
      ORDER BY date_ajout DESC 
      LIMIT 6
    `);
    
    // Get recent reviews
    const recentReviews = await pool.query(`
      SELECT c.*, a.titre as anime_titre, m.titre as manga_titre,
             u.member_name as author_name
      FROM ak_critique c
      LEFT JOIN ak_animes a ON c.id_anime = a.id_anime
      LEFT JOIN ak_mangas m ON c.id_manga = m.id_manga
      LEFT JOIN smf_members u ON c.id_membre = u.id_member
      WHERE c.statut = 1
      ORDER BY c.date_critique DESC
      LIMIT 5
    `);
    
    // Get statistics
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM ak_animes WHERE statut = 1) as anime_count,
        (SELECT COUNT(*) FROM ak_mangas WHERE statut = 1) as manga_count,
        (SELECT COUNT(*) FROM ak_critique WHERE statut = 1) as review_count,
        (SELECT COUNT(*) FROM smf_members) as user_count
    `);
    
    res.render('home', {
      title: 'Anime-Kun - Accueil',
      animes: recentAnimes.rows,
      reviews: recentReviews.rows,
      stats: stats.rows[0],
      user: req.user
    });
  } catch (error) {
    console.error('Homepage error:', error);
    res.status(500).render('error', { message: 'Erreur de chargement' });
  }
});

// Animes page
app.get('/animes', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    
    const animes = await pool.query(`
      SELECT * FROM ak_animes 
      WHERE statut = 1 
      ORDER BY annee DESC, titre ASC 
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    const totalResult = await pool.query('SELECT COUNT(*) FROM ak_animes WHERE statut = 1');
    const total = parseInt(totalResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);
    
    res.render('animes', {
      title: 'Animes - Anime-Kun',
      animes: animes.rows,
      pagination: {
        current: page,
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        next: page + 1,
        prev: page - 1
      },
      user: req.user
    });
  } catch (error) {
    console.error('Animes page error:', error);
    res.status(500).render('error', { message: 'Erreur de chargement' });
  }
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

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

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
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'Endpoint not found' });
  } else {
    res.status(404).render('error', { message: 'Page not found' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Anime-Kun API v2.0 running on http://localhost:${port}`);
  console.log(`📊 Metrics available at http://localhost:${port}/metrics`);
  console.log(`🔍 API documentation at http://localhost:${port}/api`);
  console.log(`🎌 Web interface at http://localhost:${port}`);
  console.log(`💾 Database: PostgreSQL`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;