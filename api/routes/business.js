const express = require('express');
const router = express.Router();

const pool = require('../config/database');
const { authenticateToken: authMiddleware, requireAdmin: adminMiddleware } = require('../middleware/auth');

/**
 * @swagger
 * /api/business/search:
 *   get:
 *     summary: Search business entities (no auth required)
 *     tags: [Business]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Business search results
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
 *                       denomination:
 *                         type: string
 *                       type:
 *                         type: string
 *                       origine:
 *                         type: string
 *                       site_officiel:
 *                         type: string
 *       500:
 *         description: Server error
 */
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json({ data: [] });
    }
    
    const searchTerm = `%${q.trim()}%`;
    
    const businesses = await pool.query(`
      SELECT 
        id_business as id,
        denomination,
        type,
        origine,
        site_officiel
      FROM ak_business 
      WHERE statut = 1 
        AND denomination ILIKE $1
      ORDER BY denomination ASC
      LIMIT $2
    `, [searchTerm, parseInt(limit)]);
    
    res.json({ data: businesses.rows });
  } catch (error) {
    console.error('Business search error:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche de fiches business' });
  }
});

// Apply auth middleware to all other business routes (but not search)
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     BusinessData:
 *       type: object
 *       properties:
 *         id_business:
 *           type: integer
 *           description: ID unique des données business
 *         id_anime:
 *           type: integer
 *           description: ID de l'anime
 *         annee:
 *           type: integer
 *           description: Année
 *         prix_total:
 *           type: number
 *           description: Prix total
 *         cout_revient:
 *           type: number
 *           description: Coût de revient
 *         benefice:
 *           type: number
 *           description: Bénéfice
 *         marge_percentage:
 *           type: number
 *           description: Pourcentage de marge
 */

/**
 * @swagger
 * /api/business:
 *   get:
 *     summary: Get all business data
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
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
 *           default: 50
 *         description: Number of items per page
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by year
 *       - in: query
 *         name: anime_id
 *         schema:
 *           type: integer
 *         description: Filter by anime ID
 *     responses:
 *       200:
 *         description: List of business data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BusinessData'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, year, anime_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = '';
    let params = [];
    let paramCount = 0;
    
    if (year) {
      paramCount++;
      whereClause = `WHERE b.annee = $${paramCount}`;
      params.push(year);
    }
    
    if (anime_id) {
      paramCount++;
      whereClause += whereClause ? ` AND b.id_anime = $${paramCount}` : `WHERE b.id_anime = $${paramCount}`;
      params.push(anime_id);
    }
    
    const query = `
      SELECT 
        b.*,
        a.titre as anime_titre,
        COALESCE(b.prix_total, 0) as prix_total,
        COALESCE(b.cout_revient, 0) as cout_revient,
        COALESCE(b.benefice, 0) as benefice,
        CASE 
          WHEN b.cout_revient > 0 THEN 
            ROUND(((b.prix_total - b.cout_revient) / b.cout_revient) * 100, 2)
          ELSE 0 
        END as marge_percentage
      FROM ak_business b
      LEFT JOIN ak_animes a ON b.id_anime = a.id_anime
      ${whereClause}
      ORDER BY b.annee DESC, a.titre ASC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    params.push(parseInt(limit), offset);
    
    const [business, total] = await Promise.all([
      pool.query(query, params),
      pool.query(`SELECT COUNT(*) FROM ak_business b ${whereClause}`, params.slice(0, paramCount))
    ]);
    
    res.json({
      data: business.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.rows[0].count),
        pages: Math.ceil(total.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Business data fetch error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données business' });
  }
});

/**
 * @swagger
 * /api/business/{id}:
 *   get:
 *     summary: Get specific business data by ID
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business data ID
 *     responses:
 *       200:
 *         description: Business data details
 *       404:
 *         description: Business data not found
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const business = await pool.query(`
      SELECT 
        b.*,
        a.titre as anime_titre,
        COALESCE(b.prix_total, 0) as prix_total,
        COALESCE(b.cout_revient, 0) as cout_revient,
        COALESCE(b.benefice, 0) as benefice,
        CASE 
          WHEN b.cout_revient > 0 THEN 
            ROUND(((b.prix_total - b.cout_revient) / b.cout_revient) * 100, 2)
          ELSE 0 
        END as marge_percentage
      FROM ak_business b
      LEFT JOIN ak_animes a ON b.id_anime = a.id_anime
      WHERE b.id_business = $1
    `, [id]);
    
    if (business.rows.length === 0) {
      return res.status(404).json({ error: 'Données business introuvables' });
    }
    
    res.json(business.rows[0]);
  } catch (error) {
    console.error('Business data fetch error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données business' });
  }
});

/**
 * @swagger
 * /api/business:
 *   post:
 *     summary: Create new business data
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_anime
 *               - annee
 *             properties:
 *               id_anime:
 *                 type: integer
 *               annee:
 *                 type: integer
 *               prix_total:
 *                 type: number
 *               cout_revient:
 *                 type: number
 *               benefice:
 *                 type: number
 *     responses:
 *       201:
 *         description: Business data created successfully
 *       400:
 *         description: Invalid data
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
  try {
    const { id_anime, annee, prix_total, cout_revient, benefice } = req.body;
    
    if (!id_anime || !annee) {
      return res.status(400).json({ error: 'L\'ID de l\'anime et l\'année sont obligatoires' });
    }
    
    // Check if anime exists
    const animeCheck = await pool.query(
      'SELECT id_anime FROM ak_animes WHERE id_anime = $1 AND statut = 1',
      [id_anime]
    );
    
    if (animeCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Anime introuvable' });
    }
    
    const result = await pool.query(`
      INSERT INTO ak_business (id_anime, annee, prix_total, cout_revient, benefice)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [id_anime, annee, prix_total || 0, cout_revient || 0, benefice || 0]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Business create error:', error);
    res.status(500).json({ error: 'Erreur lors de la création des données business' });
  }
});

/**
 * @swagger
 * /api/business/{id}:
 *   put:
 *     summary: Update business data
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business data ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_anime:
 *                 type: integer
 *               annee:
 *                 type: integer
 *               prix_total:
 *                 type: number
 *               cout_revient:
 *                 type: number
 *               benefice:
 *                 type: number
 *     responses:
 *       200:
 *         description: Business data updated successfully
 *       404:
 *         description: Business data not found
 *       500:
 *         description: Server error
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { id_anime, annee, prix_total, cout_revient, benefice } = req.body;
    
    const result = await pool.query(`
      UPDATE ak_business 
      SET id_anime = COALESCE($1, id_anime),
          annee = COALESCE($2, annee),
          prix_total = COALESCE($3, prix_total),
          cout_revient = COALESCE($4, cout_revient),
          benefice = COALESCE($5, benefice)
      WHERE id_business = $6
      RETURNING *
    `, [id_anime, annee, prix_total, cout_revient, benefice, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Données business introuvables' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Business update error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des données business' });
  }
});

/**
 * @swagger
 * /api/business/{id}:
 *   delete:
 *     summary: Delete business data
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business data ID
 *     responses:
 *       200:
 *         description: Business data deleted successfully
 *       404:
 *         description: Business data not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM ak_business WHERE id_business = $1 RETURNING id_business',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Données business introuvables' });
    }
    
    res.json({ message: 'Données business supprimées avec succès' });
  } catch (error) {
    console.error('Business delete error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression des données business' });
  }
});

module.exports = router;