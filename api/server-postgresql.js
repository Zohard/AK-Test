require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const { formatCritiqueText } = require('./utils/formatCritiqueText');
const promClient = require('prom-client');
const NodeCache = require('node-cache');
const app = express();
const port = process.env.PORT || 3000;

// Prometheus metrics
const register = promClient.register;
const counter = new promClient.Counter({ name: 'http_requests_total', help: 'Total HTTP requests', labelNames: ['method', 'route', 'status'] });
const histogram = new promClient.Histogram({ name: 'http_request_duration_seconds', help: 'Duration of HTTP requests', labelNames: ['method', 'route'], buckets: [0.1, 0.5, 1, 2, 5] });

// Cache
const cache = new NodeCache({ stdTTL: 600 });

app.use((err, req, res, next) => { console.error(err.stack); res.status(500).json({ error: 'Erreur interne du serveur' }); });
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    counter.inc({ method: req.method, route: req.path, status: res.statusCode });
    histogram.observe({ method: req.method, route: req.path }, duration);
  });
  next();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'anime_kun',
  port: process.env.DB_PORT || 5432,
  max: 10, // maximum number of connections in pool
  idleTimeoutMillis: 30000, // close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // return error after 2 seconds if connection could not be established
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Search endpoint with PostgreSQL full-text search
app.get('/api/search', async (req, res) => {
  const { query, type, page = 1, limit = 10 } = req.query;
  if (!query) return res.status(400).json({ error: 'Requête requise' });
  
  try {
    let searchQuery = '';
    let countQuery = '';
    const searchTerm = `%${query}%`;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    if (type === 'anime') {
      searchQuery = `
        SELECT *, 'anime' as type, 
               ts_rank(to_tsvector('french', coalesce(titre,'') || ' ' || coalesce(synopsis,'')), plainto_tsquery('french', $1)) as rank
        FROM ak_animes 
        WHERE statut = 1 AND (
          titre ILIKE $2 OR 
          synopsis ILIKE $2 OR
          to_tsvector('french', coalesce(titre,'') || ' ' || coalesce(synopsis,'')) @@ plainto_tsquery('french', $1)
        )
        ORDER BY rank DESC, moyennenotes DESC
        LIMIT $3 OFFSET $4`;
      countQuery = `
        SELECT COUNT(*) as count 
        FROM ak_animes 
        WHERE statut = 1 AND (
          titre ILIKE $1 OR 
          synopsis ILIKE $1 OR
          to_tsvector('french', coalesce(titre,'') || ' ' || coalesce(synopsis,'')) @@ plainto_tsquery('french', $2)
        )`;
    } else if (type === 'manga') {
      searchQuery = `
        SELECT *, 'manga' as type,
               ts_rank(to_tsvector('french', coalesce(titre,'') || ' ' || coalesce(synopsis,'')), plainto_tsquery('french', $1)) as rank
        FROM ak_mangas 
        WHERE statut = 1 AND (
          titre ILIKE $2 OR 
          synopsis ILIKE $2 OR
          to_tsvector('french', coalesce(titre,'') || ' ' || coalesce(synopsis,'')) @@ plainto_tsquery('french', $1)
        )
        ORDER BY rank DESC, moyennenotes DESC
        LIMIT $3 OFFSET $4`;
      countQuery = `
        SELECT COUNT(*) as count 
        FROM ak_mangas 
        WHERE statut = 1 AND (
          titre ILIKE $1 OR 
          synopsis ILIKE $1 OR
          to_tsvector('french', coalesce(titre,'') || ' ' || coalesce(synopsis,'')) @@ plainto_tsquery('french', $2)
        )`;
    } else {
      // Search both anime and manga
      searchQuery = `
        (SELECT id_anime, nice_url, titre, realisateur, annee, titre_orig, nb_ep, studio, synopsis, doublage, image, sources, nb_reviews, moyennenotes as MoyenneNotes, statut, date_ajout, date_modification, 'anime' as type,
                ts_rank(to_tsvector('french', coalesce(titre,'') || ' ' || coalesce(synopsis,'')), plainto_tsquery('french', $1)) as rank
         FROM ak_animes 
         WHERE statut = 1 AND (titre ILIKE $2 OR synopsis ILIKE $2 OR to_tsvector('french', coalesce(titre,'') || ' ' || coalesce(synopsis,'')) @@ plainto_tsquery('french', $1)))
        UNION
        (SELECT id_manga as id_anime, nice_url, titre, '' as realisateur, CAST(annee AS INTEGER), titre_orig, 0 as nb_ep, '' as studio, synopsis, '' as doublage, image, '' as sources, nb_reviews, moyennenotes as MoyenneNotes, statut, date_ajout, date_modification, 'manga' as type,
                ts_rank(to_tsvector('french', coalesce(titre,'') || ' ' || coalesce(synopsis,'')), plainto_tsquery('french', $1)) as rank
         FROM ak_mangas 
         WHERE statut = 1 AND (titre ILIKE $2 OR synopsis ILIKE $2 OR to_tsvector('french', coalesce(titre,'') || ' ' || coalesce(synopsis,'')) @@ plainto_tsquery('french', $1)))
        ORDER BY rank DESC, MoyenneNotes DESC
        LIMIT $3 OFFSET $4`;
      countQuery = `
        SELECT (
          (SELECT COUNT(*) FROM ak_animes WHERE statut = 1 AND (titre ILIKE $1 OR synopsis ILIKE $1 OR to_tsvector('french', coalesce(titre,'') || ' ' || coalesce(synopsis,'')) @@ plainto_tsquery('french', $2))) +
          (SELECT COUNT(*) FROM ak_mangas WHERE statut = 1 AND (titre ILIKE $1 OR synopsis ILIKE $1 OR to_tsvector('french', coalesce(titre,'') || ' ' || coalesce(synopsis,'')) @@ plainto_tsquery('french', $2)))
        ) as count`;
    }
    
    const client = await pool.connect();
    try {
      let rows, total;
      if (type === 'anime' || type === 'manga') {
        const result = await client.query(searchQuery, [query, searchTerm, parseInt(limit), offset]);
        const countResult = await client.query(countQuery, [searchTerm, query]);
        rows = result.rows;
        total = countResult.rows[0].count;
      } else {
        const result = await client.query(searchQuery, [query, searchTerm, parseInt(limit), offset]);
        const countResult = await client.query(countQuery, [searchTerm, query]);
        rows = result.rows;
        total = countResult.rows[0].count;
      }
      
      res.json({ data: rows, page: parseInt(page), limit: parseInt(limit), total: parseInt(total) });
    } finally {
      client.release();
    }
  } catch (error) { 
    console.error('Search error:', error);
    res.status(500).json({ error: 'Erreur de recherche' }); 
  }
});

// Get all animes
app.get('/api/animes', async (req, res) => {
  const { page = 1, limit = 10, recent } = req.query;
  const cacheKey = `animes:${page}:${limit}:${recent}`;
  
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }
  
  try {
    let query = '';
    let countQuery = '';
    
    if (recent === 'true') {
      query = `
        SELECT * FROM ak_animes 
        WHERE statut = 1 AND image IS NOT NULL AND image != '' 
        ORDER BY annee DESC, date_ajout DESC 
        LIMIT $1 OFFSET $2`;
      countQuery = `
        SELECT COUNT(*) as count FROM ak_animes 
        WHERE statut = 1 AND image IS NOT NULL AND image != ''`;
    } else {
      query = 'SELECT * FROM ak_animes WHERE statut = 1 ORDER BY moyennenotes DESC, nb_reviews DESC LIMIT $1 OFFSET $2';
      countQuery = 'SELECT COUNT(*) as count FROM ak_animes WHERE statut = 1';
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query(query, [parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);
      const countResult = await client.query(countQuery);
      
      const response = { 
        data: result.rows, 
        page: parseInt(page), 
        limit: parseInt(limit), 
        total: parseInt(countResult.rows[0].count) 
      };
      
      // Cache the response
      cache.set(cacheKey, response);
      res.json(response);
    } finally {
      client.release();
    }
  } catch (error) { 
    console.error('Animes error:', error);
    res.status(500).json({ error: 'Erreur de base de données' }); 
  }
});

// Get all mangas
app.get('/api/mangas', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const cacheKey = `mangas:${page}:${limit}`;
  
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }
  
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM ak_mangas WHERE statut = 1 ORDER BY moyennenotes DESC, nb_reviews DESC LIMIT $1 OFFSET $2', 
        [parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
      );
      const countResult = await client.query('SELECT COUNT(*) as count FROM ak_mangas WHERE statut = 1');
      
      const response = { 
        data: result.rows, 
        page: parseInt(page), 
        limit: parseInt(limit), 
        total: parseInt(countResult.rows[0].count) 
      };
      
      cache.set(cacheKey, response);
      res.json(response);
    } finally {
      client.release();
    }
  } catch (error) { 
    console.error('Mangas error:', error);
    res.status(500).json({ error: 'Erreur de base de données' }); 
  }
});

// Get anime business relationships
app.get('/api/anime-business', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT a.titre, b.denomination AS business_name, b.type AS business_type, ab.type, ab.precisions 
        FROM ak_business_to_animes ab 
        LEFT JOIN ak_animes a ON ab.id_anime = a.id_anime 
        LEFT JOIN ak_business b ON ab.id_business = b.id_business 
        ORDER BY a.titre
        LIMIT $1 OFFSET $2
      `, [parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);
      
      const countResult = await client.query('SELECT COUNT(*) as count FROM ak_business_to_animes');
      
      res.json({ 
        data: result.rows, 
        page: parseInt(page), 
        limit: parseInt(limit), 
        total: parseInt(countResult.rows[0].count) 
      });
    } finally {
      client.release();
    }
  } catch (error) { 
    console.error('Anime business error:', error);
    res.status(500).json({ error: 'Erreur de base de données' }); 
  }
});

// Get manga business relationships
app.get('/api/manga-business', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT m.titre, b.denomination AS business_name, b.type AS business_type, mb.type, mb.precisions 
        FROM ak_business_to_mangas mb 
        LEFT JOIN ak_mangas m ON mb.id_manga = m.id_manga 
        LEFT JOIN ak_business b ON mb.id_business = b.id_business 
        ORDER BY m.titre
        LIMIT $1 OFFSET $2
      `, [parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);
      
      const countResult = await client.query('SELECT COUNT(*) as count FROM ak_business_to_mangas');
      
      res.json({ 
        data: result.rows, 
        page: parseInt(page), 
        limit: parseInt(limit), 
        total: parseInt(countResult.rows[0].count) 
      });
    } finally {
      client.release();
    }
  } catch (error) { 
    console.error('Manga business error:', error);
    res.status(500).json({ error: 'Erreur de base de données' }); 
  }
});

// Get critiques
app.get('/api/critiques', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT c.*, 
               COALESCE(u.smfRealName, u.username) as username,
               a.titre as anime_titre, a.image as anime_image,
               m.titre as manga_titre, m.image as manga_image
        FROM ak_critique c 
        LEFT JOIN ak_users u ON c.id_membre = u.id 
        LEFT JOIN ak_animes a ON c.id_anime = a.id_anime 
        LEFT JOIN ak_mangas m ON c.id_manga = m.id_manga 
        WHERE c.statut = 1
        ORDER BY c.date_critique DESC
        LIMIT $1 OFFSET $2
      `, [parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);
      
      const countResult = await client.query(
        'SELECT COUNT(*) as count FROM ak_critique WHERE statut = 1'
      );
      
      // Format critique text for display
      const formattedCritiques = result.rows.map(critique => ({
        ...critique,
        critique: formatCritiqueText(critique.critique)
      }));

      res.json({ 
        data: formattedCritiques, 
        page: parseInt(page), 
        limit: parseInt(limit), 
        total: parseInt(countResult.rows[0].count) 
      });
    } finally {
      client.release();
    }
  } catch (error) { 
    console.error('Critiques error:', error);
    res.status(500).json({ error: 'Erreur de base de données' }); 
  }
});

// Get articles
app.get('/api/articles', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT a.*, u.pseudo as author_name
        FROM ak_webzine_articles a
        LEFT JOIN ak_users u ON a.id_membre = u.id_membre
        WHERE a.statut = 1
        ORDER BY a.date_creation DESC
        LIMIT $1 OFFSET $2
      `, [parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);
      
      const countResult = await client.query('SELECT COUNT(*) as count FROM ak_webzine_articles WHERE statut = 1');
      
      res.json({ 
        data: result.rows, 
        page: parseInt(page), 
        limit: parseInt(limit), 
        total: parseInt(countResult.rows[0].count) 
      });
    } finally {
      client.release();
    }
  } catch (error) { 
    console.error('Articles error:', error);
    res.status(500).json({ error: 'Erreur de base de données' }); 
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      res.json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ status: 'unhealthy', database: 'disconnected', error: error.message });
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('⚡ SIGTERM received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('⚡ SIGINT received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`🚀 API Server running on http://localhost:${port}`);
  console.log(`📊 Metrics available at http://localhost:${port}/metrics`);
  console.log(`🏥 Health check at http://localhost:${port}/api/health`);
  console.log(`🐘 Using PostgreSQL database`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});