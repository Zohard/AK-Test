const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const pool = require('../config/database');
const { authenticateToken: authMiddleware } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         id_critique:
 *           type: integer
 *           description: ID unique de la critique
 *         titre:
 *           type: string
 *           description: Titre de la critique
 *         critique:
 *           type: string
 *           description: Contenu de la critique
 *         notation:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           description: Note sur 10
 *         id_membre:
 *           type: integer
 *           description: ID de l'auteur
 *         id_anime:
 *           type: integer
 *           description: ID de l'anime (si applicable)
 *         id_manga:
 *           type: integer
 *           description: ID du manga (si applicable)
 *         date_critique:
 *           type: string
 *           format: date-time
 *           description: Date de création
 *         author_name:
 *           type: string
 *           description: Nom de l'auteur
 */

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: Get list of reviews with pagination and filters
 *     tags: [Reviews]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [anime, manga]
 *         description: Filter by content type
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *     responses:
 *       200:
 *         description: List of reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, userId } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = 'WHERE c.statut = 0';
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
    res.status(500).json({ error: 'Erreur lors de la récupération des critiques' });
  }
});

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a new review
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
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 description: Contenu de la critique
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 description: Note sur 10
 *               animeId:
 *                 type: integer
 *                 description: ID de l'anime (requis si pas de mangaId)
 *               mangaId:
 *                 type: integer
 *                 description: ID du manga (requis si pas d'animeId)
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', authMiddleware, [
  body('title').isLength({ min: 3 }).withMessage('Le titre doit contenir au moins 3 caractères'),
  body('content').isLength({ min: 10 }).withMessage('Le contenu doit contenir au moins 10 caractères'),
  body('rating').isInt({ min: 1, max: 10 }).withMessage('La note doit être entre 1 et 10')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, content, rating, animeId, mangaId } = req.body;
    
    if (!animeId && !mangaId) {
      return res.status(400).json({ error: 'Un ID d\'anime ou de manga est requis' });
    }
    
    if (animeId && mangaId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas critiquer un anime et un manga en même temps' });
    }
    
    // Check if content exists
    if (animeId) {
      const animeCheck = await pool.query('SELECT id_anime FROM ak_animes WHERE id_anime = $1 AND statut = 1', [animeId]);
      if (animeCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Anime introuvable' });
      }
    }
    
    if (mangaId) {
      const mangaCheck = await pool.query('SELECT id_manga FROM ak_mangas WHERE id_manga = $1 AND statut = 1', [mangaId]);
      if (mangaCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Manga introuvable' });
      }
    }
    
    // Check if user already reviewed this content
    const existingReview = await pool.query(`
      SELECT id_critique FROM ak_critique 
      WHERE id_membre = $1 AND ((id_anime = $2 AND $2 > 0) OR (id_manga = $3 AND $3 > 0))
    `, [req.user.userId, animeId || 0, mangaId || 0]);
    
    if (existingReview.rows.length > 0) {
      return res.status(400).json({ error: 'Vous avez déjà critiqué ce contenu' });
    }
    
    const result = await pool.query(`
      INSERT INTO ak_critique (titre, critique, notation, id_membre, id_anime, id_manga, date_critique, statut)
      VALUES ($1, $2, $3, $4, $5, $6, EXTRACT(EPOCH FROM NOW())::INTEGER, 0)
      RETURNING *
    `, [title, content, rating, req.user.userId, animeId || 0, mangaId || 0]);
    
    // Update review count and average rating for the content
    if (animeId) {
      await pool.query(`
        UPDATE ak_animes 
        SET nb_reviews = (SELECT COUNT(*) FROM ak_critique WHERE id_anime = $1 AND statut = 0),
            moyenne_notes = (SELECT AVG(notation) FROM ak_critique WHERE id_anime = $1 AND statut = 0)
        WHERE id_anime = $1
      `, [animeId]);
    }
    
    if (mangaId) {
      await pool.query(`
        UPDATE ak_mangas 
        SET nb_reviews = (SELECT COUNT(*) FROM ak_critique WHERE id_manga = $1 AND statut = 0),
            moyenne_notes = (SELECT AVG(notation) FROM ak_critique WHERE id_manga = $1 AND statut = 0)
        WHERE id_manga = $1
      `, [mangaId]);
    }
    
    res.status(201).json({
      ...result.rows[0],
      message: 'Critique créée avec succès'
    });
  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la critique' });
  }
});

module.exports = router;