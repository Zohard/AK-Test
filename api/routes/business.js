const express = require('express');
const router = express.Router();

const pool = require('../config/database');
const { authenticateToken: authMiddleware, requireAdmin: adminMiddleware } = require('../middleware/auth');

// Apply auth middleware to all business routes
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

// TODO: Add CRUD operations for business data:
// - POST / (create business data)
// - PUT /:id (update business data)
// - DELETE /:id (delete business data)

module.exports = router;