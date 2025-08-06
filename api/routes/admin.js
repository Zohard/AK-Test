const express = require('express');
const router = express.Router();

const pool = require('../config/database');
const { authenticateToken: authMiddleware, requireAdmin: adminMiddleware } = require('../middleware/auth');

// Apply admin middleware to all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
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
 *                     total_mangas:
 *                       type: integer
 *                     total_reviews:
 *                       type: integer
 *                     total_users:
 *                       type: integer
 *                 recent_activity:
 *                   type: array
 *                   items:
 *                     type: object
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM ak_animes WHERE statut = 1) as total_animes,
        (SELECT COUNT(*) FROM ak_mangas WHERE statut = 1) as total_mangas,
        (SELECT COUNT(*) FROM ak_critique WHERE statut = 0) as total_reviews,
        (SELECT COUNT(*) FROM smf_members) as total_users
    `);
    
    const recentActivity = await pool.query(`
      SELECT 'review' as type, date_critique as date, titre as title
      FROM ak_critique 
      WHERE statut = 0
      UNION ALL
      SELECT 'anime' as type, date_ajout as date, titre as title
      FROM ak_animes
      WHERE statut = 1
      UNION ALL
      SELECT 'manga' as type, date_ajout as date, titre as title
      FROM ak_mangas
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
    res.status(500).json({ error: 'Erreur lors de la récupération des données du dashboard' });
  }
});

/**
 * @swagger
 * /api/admin/animes:
 *   get:
 *     summary: Get all animes for admin management
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of animes for admin
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/animes', async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = '';
    let params = [];
    
    if (status !== undefined) {
      whereClause = 'WHERE statut = $1';
      params.push(status);
    }
    
    const query = `
      SELECT id_anime, titre, annee, studio, statut, date_ajout, 
             nb_reviews, moyenne_notes
      FROM ak_animes ${whereClause}
      ORDER BY date_ajout DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    params.push(parseInt(limit), offset);
    
    const [animes, total] = await Promise.all([
      pool.query(query, params),
      pool.query(`SELECT COUNT(*) FROM ak_animes ${whereClause}`, params.slice(0, status !== undefined ? 1 : 0))
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
    console.error('Admin animes fetch error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des animes' });
  }
});

/**
 * @swagger
 * /api/admin/mangas:
 *   get:
 *     summary: Get all mangas for admin management
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of mangas for admin
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/mangas', async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = '';
    let params = [];
    
    if (status !== undefined) {
      whereClause = 'WHERE statut = $1';
      params.push(status);
    }
    
    const query = `
      SELECT id_manga, titre, auteur, annee, statut, date_ajout, 
             nb_reviews, moyenne_notes
      FROM ak_mangas ${whereClause}
      ORDER BY date_ajout DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    params.push(parseInt(limit), offset);
    
    const [mangas, total] = await Promise.all([
      pool.query(query, params),
      pool.query(`SELECT COUNT(*) FROM ak_mangas ${whereClause}`, params.slice(0, status !== undefined ? 1 : 0))
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
    console.error('Admin mangas fetch error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des mangas' });
  }
});

/**
 * @swagger
 * /api/admin/reviews:
 *   get:
 *     summary: Get all reviews for admin management
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: Filter by status (0=active, 1=pending)
 *     responses:
 *       200:
 *         description: List of reviews for admin
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/reviews', async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = '';
    let params = [];
    
    if (status !== undefined) {
      whereClause = 'WHERE c.statut = $1';
      params.push(status);
    }
    
    const query = `
      SELECT c.*, u.member_name as author_name,
             a.titre as anime_titre, m.titre as manga_titre
      FROM ak_critique c
      LEFT JOIN smf_members u ON c.id_membre = u.id_member
      LEFT JOIN ak_animes a ON c.id_anime = a.id_anime
      LEFT JOIN ak_mangas m ON c.id_manga = m.id_manga
      ${whereClause}
      ORDER BY c.date_critique DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    params.push(parseInt(limit), offset);
    
    const [reviews, total] = await Promise.all([
      pool.query(query, params),
      pool.query(`SELECT COUNT(*) FROM ak_critique c ${whereClause}`, params.slice(0, status !== undefined ? 1 : 0))
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
    console.error('Admin reviews fetch error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des critiques' });
  }
});

/**
 * @swagger
 * /api/admin/animes/{id}/relations:
 *   post:
 *     summary: Add a new relation to an anime
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Anime ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_anime:
 *                 type: integer
 *                 description: ID of related anime (if relation is to anime)
 *               id_manga:
 *                 type: integer
 *                 description: ID of related manga (if relation is to manga)
 *             oneOf:
 *               - required: [id_anime]
 *               - required: [id_manga]
 *     responses:
 *       201:
 *         description: Relation created successfully
 *       400:
 *         description: Bad request - invalid data
 *       404:
 *         description: Anime not found
 *       409:
 *         description: Relation already exists
 *       500:
 *         description: Server error
 */
router.post('/animes/:id/relations', async (req, res) => {
  try {
    const { id } = req.params;
    const { id_anime, id_manga } = req.body;
    
    // Validate input
    if ((!id_anime && !id_manga) || (id_anime && id_manga)) {
      return res.status(400).json({ 
        error: 'Vous devez spécifier soit id_anime soit id_manga, mais pas les deux' 
      });
    }
    
    // Check if source anime exists
    const sourceAnime = await pool.query(
      'SELECT id_anime FROM ak_animes WHERE id_anime = $1',
      [id]
    );
    
    if (sourceAnime.rows.length === 0) {
      return res.status(404).json({ error: 'Anime source introuvable' });
    }
    
    // Check if target exists
    if (id_anime) {
      const targetAnime = await pool.query(
        'SELECT id_anime FROM ak_animes WHERE id_anime = $1 AND statut = 1',
        [id_anime]
      );
      if (targetAnime.rows.length === 0) {
        return res.status(404).json({ error: 'Anime cible introuvable' });
      }
    }
    
    if (id_manga) {
      const targetManga = await pool.query(
        'SELECT id_manga FROM ak_mangas WHERE id_manga = $1 AND statut = 1',
        [id_manga]
      );
      if (targetManga.rows.length === 0) {
        return res.status(404).json({ error: 'Manga cible introuvable' });
      }
    }
    
    // Generate the id_fiche_depart using the special syntax: anime|manga+{id}
    const id_fiche_depart = `anime+${id}`;
    
    // Check if relation already exists
    const existingRelation = await pool.query(`
      SELECT id_relation FROM ak_relations 
      WHERE id_fiche_depart = $1 
      AND (
        (id_anime = $2 AND $2 IS NOT NULL) OR 
        (id_manga = $3 AND $3 IS NOT NULL)
      )
    `, [id_fiche_depart, id_anime || null, id_manga || null]);
    
    if (existingRelation.rows.length > 0) {
      return res.status(409).json({ error: 'Cette relation existe déjà' });
    }
    
    // Insert the new relation
    const result = await pool.query(`
      INSERT INTO ak_relations (id_fiche_depart, id_anime, id_manga)
      VALUES ($1, $2, $3)
      RETURNING id_relation
    `, [id_fiche_depart, id_anime || null, id_manga || null]);
    
    res.status(201).json({
      message: 'Relation ajoutée avec succès',
      id_relation: result.rows[0].id_relation,
      id_fiche_depart: id_fiche_depart,
      id_anime: id_anime || null,
      id_manga: id_manga || null
    });
    
  } catch (error) {
    console.error('Add relation error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de la relation' });
  }
});

/**
 * @swagger
 * /api/admin/animes/autocomplete:
 *   get:
 *     summary: Autocomplete search for animes (admin - compact results)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: Compact autocomplete results (max 3)
 *       500:
 *         description: Server error
 */
router.get('/animes/autocomplete', async (req, res) => {
  try {
    const { q, exclude } = req.query;
    
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
      LIMIT 3
    `, params);
    
    res.json({ data: animes.rows });
  } catch (error) {
    console.error('Admin anime autocomplete error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'autocomplete des animes' });
  }
});

/**
 * @swagger
 * /api/admin/mangas/autocomplete:
 *   get:
 *     summary: Autocomplete search for mangas (admin - compact results)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: Compact autocomplete results (max 3)
 *       500:
 *         description: Server error
 */
router.get('/mangas/autocomplete', async (req, res) => {
  try {
    const { q, exclude } = req.query;
    
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
      SELECT id_manga, titre, annee, image
      FROM ak_mangas 
      ${whereClause}
      ORDER BY titre ASC
      LIMIT 3
    `, params);
    
    res.json({ data: mangas.rows });
  } catch (error) {
    console.error('Admin manga autocomplete error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'autocomplete des mangas' });
  }
});

// TODO: Add more admin routes like:
// - POST /animes (create anime)
// - PUT /animes/:id (update anime)
// - DELETE /animes/:id (delete anime)
// - POST /mangas (create manga)
// - PUT /mangas/:id (update manga)
// - DELETE /mangas/:id (delete manga)
// - PUT /reviews/:id/approve (approve review)
// - DELETE /reviews/:id (delete review)
// - Screenshot management routes
// - Tag management routes
// - Business management routes
// - User management routes

module.exports = router;