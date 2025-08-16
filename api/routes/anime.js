const express = require('express');
const router = express.Router();

const pool = require('../config/database');
const { authenticateToken: authMiddleware, optionalAuth } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Anime:
 *       type: object
 *       properties:
 *         id_anime:
 *           type: integer
 *           description: ID unique de l'anime
 *         nice_url:
 *           type: string
 *           description: URL SEO-friendly
 *         titre:
 *           type: string
 *           description: Titre de l'anime
 *         titre_orig:
 *           type: string
 *           description: Titre original
 *         annee:
 *           type: integer
 *           description: Année de sortie
 *         nb_ep:
 *           type: integer
 *           description: Nombre d'épisodes
 *         studio:
 *           type: string
 *           description: Studio d'animation
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
 *         statut:
 *           type: integer
 *           description: Statut (1=actif, 0=inactif)
 */

/**
 * @swagger
 * /api/animes:
 *   get:
 *     summary: Get list of animes with pagination and filters
 *     tags: [Animes]
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
 *         name: studio
 *         schema:
 *           type: string
 *         description: Filter by studio
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter by genre
 *     responses:
 *       200:
 *         description: List of animes
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
 *         description: Server error
 */
router.get('/', async (req, res) => {
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
      SELECT id_anime, nice_url, titre, image, titre_orig, annee, nb_ep, studio, date_ajout
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
    res.status(500).json({ error: 'Erreur lors de la récupération des animes' });
  }
});

/**
 * @swagger
 * /api/animes/{id}:
 *   get:
 *     summary: Get a specific anime by ID
 *     tags: [Animes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Anime ID
 *     responses:
 *       200:
 *         description: Anime details
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
 *         description: Anime not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const anime = await pool.query(`
      SELECT a.*, 
             COUNT(c.id_critique) as review_count,
             AVG(c.notation) as avg_rating
      FROM ak_animes a
      LEFT JOIN ak_critique c ON a.id_anime = c.id_anime AND c.statut = 0
      WHERE a.id_anime = $1 AND a.statut = 1
      GROUP BY a.id_anime
    `, [id]);
    
    if (anime.rows.length === 0) {
      return res.status(404).json({ error: 'Anime introuvable' });
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
      WHERE c.id_anime = $1 AND c.statut = 0
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
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'anime' });
  }
});

/**
 * @swagger
 * /api/animes/{id}/business:
 *   get:
 *     summary: Get business information for an anime
 *     tags: [Animes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Anime ID
 *     responses:
 *       200:
 *         description: Business information
 *       404:
 *         description: Anime not found
 *       500:
 *         description: Server error
 */
router.get('/:id/business', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if anime exists
    const animeCheck = await pool.query(`
      SELECT id_anime FROM ak_animes WHERE id_anime = $1 AND statut = 1
    `, [id]);
    
    if (animeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Anime introuvable' });
    }
    
    // Get business information
    const businessInfo = await pool.query(`
      SELECT 
        b.*,
        COALESCE(b.prix_total, 0) as prix_total,
        COALESCE(b.cout_revient, 0) as cout_revient,
        COALESCE(b.benefice, 0) as benefice,
        CASE 
          WHEN b.cout_revient > 0 THEN 
            ROUND(((b.prix_total - b.cout_revient) / b.cout_revient) * 100, 2)
          ELSE 0 
        END as marge_percentage
      FROM ak_business b
      WHERE b.id_anime = $1
      ORDER BY b.annee DESC
    `, [id]);
    
    res.json({
      anime_id: parseInt(id),
      business_data: businessInfo.rows
    });
  } catch (error) {
    console.error('Business fetch error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données business' });
  }
});

/**
 * @swagger
 * /api/animes/{id}/tags:
 *   get:
 *     summary: Get tags for a specific anime
 *     tags: [Animes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Anime ID
 *     responses:
 *       200:
 *         description: List of tags
 *       404:
 *         description: Anime not found
 *       500:
 *         description: Server error
 */
router.get('/:id/tags', async (req, res) => {
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
      INNER JOIN ak_tag2fiche tf ON t.id_tag = tf.id_tag
      WHERE tf.id_fiche = $1 AND tf.type = 'anime'
      ORDER BY t.categorie, t.tag_name
    `, [id]);
    
    res.json({
      anime_id: parseInt(id),
      tags: tags.rows
    });
  } catch (error) {
    console.error('Tags fetch error:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des tags',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/animes/autocomplete:
 *   get:
 *     summary: Autocomplete search for animes
 *     tags: [Animes]
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
        whereClause += ` AND id_anime NOT IN (${excludeIds.map((_, i) => `$${i + 2}`).join(', ')})`;
        params.push(...excludeIds);
      }
    }
    
    const animes = await pool.query(`
      SELECT id_anime, titre, annee, image
      FROM ak_animes 
      ${whereClause}
      ORDER BY titre ASC
      LIMIT $${params.length + 1}
    `, [...params, parseInt(limit)]);
    
    res.json({ data: animes.rows });
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'autocomplete' });
  }
});

/**
 * @swagger
 * /api/animes/{id}/relations:
 *   get:
 *     summary: Get relations for a specific anime
 *     tags: [Animes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Anime ID
 *     responses:
 *       200:
 *         description: List of relations
 *       500:
 *         description: Server error
 */
router.get('/:id/relations', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Test basic query first
    const relations = await pool.query(`
      SELECT COUNT(*) as count, id_fiche_depart
      FROM ak_fiche_to_fiche 
      WHERE id_fiche_depart = $1
      GROUP BY id_fiche_depart
    `, [`anime${id}`]);
    
    res.json({
      anime_id: parseInt(id),
      relations: relations.rows
    });
  } catch (error) {
    console.error('Relations fetch error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des relations' });
  }
});

module.exports = router;