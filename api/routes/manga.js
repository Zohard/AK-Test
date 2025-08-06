const express = require('express');
const router = express.Router();

const pool = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Manga:
 *       type: object
 *       properties:
 *         id_manga:
 *           type: integer
 *           description: ID unique du manga
 *         nice_url:
 *           type: string
 *           description: URL SEO-friendly
 *         titre:
 *           type: string
 *           description: Titre du manga
 *         auteur:
 *           type: string
 *           description: Auteur/Mangaka
 *         annee:
 *           type: integer
 *           description: Année de publication
 *         nb_volumes:
 *           type: integer
 *           description: Nombre de volumes
 *         synopsis:
 *           type: string
 *           description: Synopsis
 *         image:
 *           type: string
 *           description: URL de l'image
 *         moyenne_notes:
 *           type: number
 *           description: Note moyenne
 *         nb_reviews:
 *           type: integer
 *           description: Nombre de critiques
 */

/**
 * @swagger
 * /api/mangas:
 *   get:
 *     summary: Get list of mangas with pagination and filters
 *     tags: [Mangas]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and synopsis
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by year
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Filter by author
 *     responses:
 *       200:
 *         description: List of mangas
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
 *         description: Server error
 */
router.get('/', async (req, res) => {
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
    res.status(500).json({ error: 'Erreur lors de la récupération des mangas' });
  }
});

/**
 * @swagger
 * /api/mangas/{id}:
 *   get:
 *     summary: Get a specific manga by ID
 *     tags: [Mangas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Manga ID
 *     responses:
 *       200:
 *         description: Manga details
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
 *         description: Manga not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
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
      return res.status(404).json({ error: 'Manga introuvable' });
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
    res.status(500).json({ error: 'Erreur lors de la récupération du manga' });
  }
});

/**
 * @swagger
 * /api/mangas/autocomplete:
 *   get:
 *     summary: Autocomplete search for mangas
 *     tags: [Mangas]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query
 *       - in: query
 *         name: exclude
 *         schema:
 *           type: string
 *         description: Comma-separated list of IDs to exclude
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Autocomplete results
 *       400:
 *         description: Invalid query
 *       500:
 *         description: Server error
 */
router.get('/autocomplete', async (req, res) => {
  try {
    const { q, exclude, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ data: [] });
    }
    
    let whereClause = 'WHERE titre ILIKE $1 AND statut = 1';
    let params = [`%${q}%`];
    
    if (exclude) {
      const excludeIds = exclude.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      if (excludeIds.length > 0) {
        whereClause += ` AND id_manga NOT IN (${excludeIds.map((_, i) => `$${i + 2}`).join(', ')})`;
        params.push(...excludeIds);
      }
    }
    
    const mangas = await pool.query(`
      SELECT id_manga, titre, annee, auteur, image
      FROM ak_mangas 
      ${whereClause}
      ORDER BY titre ASC
      LIMIT $${params.length + 1}
    `, [...params, parseInt(limit)]);
    
    res.json({ data: mangas.rows });
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'autocomplete' });
  }
});

module.exports = router;