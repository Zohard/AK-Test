require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const { Client } = require('@elastic/elasticsearch');
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
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:3001'],
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

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'anime_kun',
  port: process.env.DB_PORT || 3306,
  connectionLimit: 10,
  charset: 'utf8mb4'
});

// Elasticsearch disabled for now
// const esClient = new Client({ node: 'http://localhost:9200' });

// Search endpoint (basic SQL search)
app.get('/api/search', async (req, res) => {
  const { query, type, page = 1, limit = 10 } = req.query;
  if (!query) return res.status(400).json({ error: 'Requête requise' });
  try {
    let searchQuery = '';
    let countQuery = '';
    
    if (type === 'anime') {
      searchQuery = 'SELECT *, "anime" as type FROM ak_animes WHERE titre LIKE ? OR synopsis LIKE ? LIMIT ? OFFSET ?';
      countQuery = 'SELECT COUNT(*) as count FROM ak_animes WHERE titre LIKE ? OR synopsis LIKE ?';
    } else if (type === 'manga') {
      searchQuery = 'SELECT *, "manga" as type FROM ak_mangas WHERE titre LIKE ? OR synopsis LIKE ? LIMIT ? OFFSET ?';
      countQuery = 'SELECT COUNT(*) as count FROM ak_mangas WHERE titre LIKE ? OR synopsis LIKE ?';
    } else {
      searchQuery = '(SELECT *, "anime" as type FROM ak_animes WHERE titre LIKE ? OR synopsis LIKE ?) UNION (SELECT id_manga as id_anime, nice_url, titre, "" as realisateur, annee, titre_orig, 0 as nb_ep, "" as studio, synopsis, "" as doublage, image, "" as sources, nb_reviews, MoyenneNotes, statut, date_ajout, date_modification, "manga" as type FROM ak_mangas WHERE titre LIKE ? OR synopsis LIKE ?) LIMIT ? OFFSET ?';
      countQuery = 'SELECT (SELECT COUNT(*) FROM ak_animes WHERE titre LIKE ? OR synopsis LIKE ?) + (SELECT COUNT(*) FROM ak_mangas WHERE titre LIKE ? OR synopsis LIKE ?) as count';
    }
    
    const searchTerm = `%${query}%`;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let rows, total;
    if (type === 'anime' || type === 'manga') {
      [rows] = await pool.query(searchQuery, [searchTerm, searchTerm, parseInt(limit), offset]);
      [total] = await pool.query(countQuery, [searchTerm, searchTerm]);
    } else {
      [rows] = await pool.query(searchQuery, [searchTerm, searchTerm, searchTerm, searchTerm, parseInt(limit), offset]);
      [total] = await pool.query(countQuery, [searchTerm, searchTerm, searchTerm, searchTerm]);
    }
    
    res.json({ data: rows, page: parseInt(page), limit: parseInt(limit), total: total[0].count });
  } catch (error) { res.status(500).json({ error: 'Erreur de recherche' }); }
});

// Get all animes
app.get('/api/animes', async (req, res) => {
  const { page = 1, limit = 10, recent } = req.query;
  try {
    let query = '';
    let countQuery = '';
    
    if (recent === 'true') {
      // Get most recent animes by year and date, with good images
      query = `SELECT * FROM ak_animes 
               WHERE statut = 1 AND image IS NOT NULL AND image != '' 
               ORDER BY annee DESC, date_ajout DESC 
               LIMIT ? OFFSET ?`;
      countQuery = `SELECT COUNT(*) as count FROM ak_animes 
                    WHERE statut = 1 AND image IS NOT NULL AND image != ''`;
    } else {
      // Default query (original behavior)
      query = 'SELECT * FROM ak_animes WHERE statut = 1 LIMIT ? OFFSET ?';
      countQuery = 'SELECT COUNT(*) as count FROM ak_animes WHERE statut = 1';
    }
    
    const [rows] = await pool.query(query, [parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);
    const [total] = await pool.query(countQuery);
    res.json({ data: rows, page: parseInt(page), limit: parseInt(limit), total: total[0].count });
  } catch (error) { res.status(500).json({ error: 'Erreur de base de données' }); }
});

// Get all mangas
app.get('/api/mangas', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const [rows] = await pool.query('SELECT * FROM ak_mangas WHERE statut = 1 LIMIT ? OFFSET ?', [parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);
    const [total] = await pool.query('SELECT COUNT(*) as count FROM ak_mangas WHERE statut = 1');
    res.json({ data: rows, page: parseInt(page), limit: parseInt(limit), total: total[0].count });
  } catch (error) { res.status(500).json({ error: 'Erreur de base de données' }); }
});

// Get anime business relationships
app.get('/api/anime-business', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const [rows] = await pool.query('SELECT a.titre, b.denomination AS business_name, b.type AS business_type, ab.type, ab.precisions FROM ak_business_to_animes ab LEFT JOIN ak_animes a ON ab.id_anime = a.id_anime LEFT JOIN ak_business b ON ab.id_business = b.ID_BUSINESS LIMIT ? OFFSET ?', [parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);
    const [total] = await pool.query('SELECT COUNT(*) as count FROM ak_business_to_animes');
    res.json({ data: rows, page: parseInt(page), limit: parseInt(limit), total: total[0].count });
  } catch (error) { res.status(500).json({ error: 'Erreur de base de données' }); }
});

// Get manga business relationships
app.get('/api/manga-business', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const [rows] = await pool.query('SELECT m.titre, b.denomination AS business_name, b.type AS business_type, mb.type, mb.precisions FROM ak_business_to_mangas mb LEFT JOIN ak_mangas m ON mb.id_manga = m.id_manga LEFT JOIN ak_business b ON mb.id_business = b.ID_BUSINESS LIMIT ? OFFSET ?', [parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);
    const [total] = await pool.query('SELECT COUNT(*) as count FROM ak_business_to_mangas');
    res.json({ data: rows, page: parseInt(page), limit: parseInt(limit), total: total[0].count });
  } catch (error) { res.status(500).json({ error: 'Erreur de base de données' }); }
});

// Get critiques
app.get('/api/critiques', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const [rows] = await pool.query(`
      SELECT c.*, u.username,
             a.titre as anime_titre, a.image as anime_image,
             m.titre as manga_titre, m.image as manga_image
      FROM ak_critique c 
      LEFT JOIN ak_users u ON c.id_membre = u.id 
      LEFT JOIN ak_animes a ON c.id_anime = a.id_anime 
      LEFT JOIN ak_mangas m ON c.id_manga = m.id_manga 
      WHERE (c.id_anime != 0 OR c.id_manga != 0)
      ORDER BY c.date_critique DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);
    
    const [total] = await pool.query('SELECT COUNT(*) as count FROM ak_critique WHERE (id_anime != 0 OR id_manga != 0)');
    res.json({ data: rows, page: parseInt(page), limit: parseInt(limit), total: total[0].count });
  } catch (error) { res.status(500).json({ error: 'Erreur de base de données' }); }
});

// Get articles (placeholder - no articles table found)
app.get('/api/articles', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    // Return empty result since no articles table exists yet
    res.json({ data: [], page: parseInt(page), limit: parseInt(limit), total: 0 });
  } catch (error) { res.status(500).json({ error: 'Erreur de base de données' }); }
});

app.listen(port, () => {
  console.log(`🚀 API Server running on http://localhost:${port}`);
  console.log(`📊 Metrics available at http://localhost:${port}/metrics`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});