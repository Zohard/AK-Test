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
    
    if (status !== undefined && status !== 'all') {
      whereClause = 'WHERE statut = $1';
      params.push(status);
    }
    
    const query = `
      SELECT id_anime, nice_url, titre, annee, studio, statut, date_ajout
      FROM ak_animes ${whereClause}
      ORDER BY date_ajout DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    params.push(parseInt(limit), offset);
    
    const [animes, total] = await Promise.all([
      pool.query(query, params),
      pool.query(`SELECT COUNT(*) FROM ak_animes ${whereClause}`, params.slice(0, status !== undefined && status !== 'all' ? 1 : 0))
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
    
    if (status !== undefined && status !== 'all') {
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
      pool.query(`SELECT COUNT(*) FROM ak_mangas ${whereClause}`, params.slice(0, status !== undefined && status !== 'all' ? 1 : 0))
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
 * /api/admin/animes/{id}:
 *   get:
 *     summary: Get a specific anime for admin editing
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
 *     responses:
 *       200:
 *         description: Anime details for admin
 *       404:
 *         description: Anime not found
 *       500:
 *         description: Server error
 */
router.get('/animes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const anime = await pool.query(`
      SELECT * FROM ak_animes WHERE id_anime = $1
    `, [id]);
    
    if (anime.rows.length === 0) {
      return res.status(404).json({ error: 'Anime introuvable' });
    }
    
    res.json(anime.rows[0]);
  } catch (error) {
    console.error('Admin anime fetch error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'anime' });
  }
});

/**
 * @swagger
 * /api/admin/animes/{id}/staff:
 *   get:
 *     summary: Get staff list for a specific anime
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
 *     responses:
 *       200:
 *         description: Staff list
 *       404:
 *         description: Anime not found
 *       500:
 *         description: Server error
 */
router.get('/animes/:id/staff', async (req, res) => {
  try {
    const { id } = req.params;
    
    const staff = await pool.query(`
      SELECT 
        bta.id_business as business_id,
        b.denomination as business_name,
        bta.type as fonction,
        bta.precisions,
        b.type as business_type,
        b.site_officiel
      FROM ak_business_to_animes bta
      JOIN ak_business b ON bta.id_business = b.id_business
      WHERE bta.id_anime = $1 AND b.statut = 1
      ORDER BY bta.type, b.denomination
    `, [id]);
    
    res.json({
      anime_id: parseInt(id),
      staff: staff.rows
    });
  } catch (error) {
    console.error('Staff fetch error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du staff' });
  }
});

/**
 * @swagger
 * /api/admin/animes/{id}/staff:
 *   post:
 *     summary: Add staff member to an anime
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
 *             required:
 *               - business_id
 *               - fonction
 *             properties:
 *               business_id:
 *                 type: integer
 *                 description: Business ID
 *               fonction:
 *                 type: string
 *                 description: Staff function/role
 *               precisions:
 *                 type: string
 *                 description: Optional precisions
 *     responses:
 *       201:
 *         description: Staff member added successfully
 *       400:
 *         description: Bad request
 *       409:
 *         description: Staff member already exists
 *       500:
 *         description: Server error
 */
router.post('/animes/:id/staff', async (req, res) => {
  try {
    const { id } = req.params;
    const { business_id, fonction, precisions } = req.body;
    
    if (!business_id || !fonction) {
      return res.status(400).json({ error: 'Business ID et fonction sont requis' });
    }
    
    // Check if anime exists
    const anime = await pool.query(
      'SELECT id_anime FROM ak_animes WHERE id_anime = $1',
      [id]
    );
    
    if (anime.rows.length === 0) {
      return res.status(404).json({ error: 'Anime introuvable' });
    }
    
    // Check if business exists and is active
    const business = await pool.query(
      'SELECT id_business, denomination FROM ak_business WHERE id_business = $1 AND statut = 1',
      [business_id]
    );
    
    if (business.rows.length === 0) {
      return res.status(404).json({ error: 'Fiche business introuvable' });
    }
    
    // Check if this combination already exists
    const existing = await pool.query(
      'SELECT id_business FROM ak_business_to_animes WHERE id_anime = $1 AND id_business = $2 AND type = $3',
      [id, business_id, fonction]
    );
    
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Cette combinaison business/fonction existe déjà' });
    }
    
    // Insert the staff relationship
    await pool.query(
      'INSERT INTO ak_business_to_animes (id_anime, id_business, type, precisions) VALUES ($1, $2, $3, $4)',
      [id, business_id, fonction, precisions || null]
    );
    
    res.status(201).json({
      message: 'Staff ajouté avec succès',
      anime_id: parseInt(id),
      business_id: parseInt(business_id),
      fonction: fonction,
      precisions: precisions || null,
      business_name: business.rows[0].denomination
    });
    
  } catch (error) {
    console.error('Add staff error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout du staff' });
  }
});

/**
 * @swagger
 * /api/admin/animes/{id}/staff:
 *   delete:
 *     summary: Remove staff member from an anime
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
 *             required:
 *               - business_id
 *               - fonction
 *             properties:
 *               business_id:
 *                 type: integer
 *                 description: Business ID
 *               fonction:
 *                 type: string
 *                 description: Staff function/role
 *     responses:
 *       200:
 *         description: Staff member removed successfully
 *       404:
 *         description: Staff member not found
 *       500:
 *         description: Server error
 */
router.delete('/animes/:id/staff', async (req, res) => {
  try {
    const { id } = req.params;
    const { business_id, fonction } = req.body;
    
    if (!business_id || !fonction) {
      return res.status(400).json({ error: 'Business ID et fonction sont requis' });
    }
    
    // Delete the staff relationship
    const result = await pool.query(
      'DELETE FROM ak_business_to_animes WHERE id_anime = $1 AND id_business = $2 AND type = $3 RETURNING *',
      [id, business_id, fonction]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Relation staff introuvable' });
    }
    
    res.json({
      message: 'Staff supprimé avec succès',
      anime_id: parseInt(id),
      business_id: parseInt(business_id),
      fonction: fonction
    });
    
  } catch (error) {
    console.error('Remove staff error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du staff' });
  }
});

/**
 * @swagger
 * /api/admin/animes/{id}/relations:
 *   get:
 *     summary: Get relations for a specific anime (admin)
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
 *     responses:
 *       200:
 *         description: Relations list
 *       500:
 *         description: Server error
 */
router.get('/animes/:id/relations', async (req, res) => {
  try {
    const { id } = req.params;
    
    const relations = await pool.query(`
      SELECT 
        r.*,
        a.titre as anime_titre,
        m.titre as manga_titre
      FROM ak_fiche_to_fiche r
      LEFT JOIN ak_animes a ON r.id_anime = a.id_anime AND r.id_anime > 0
      LEFT JOIN ak_mangas m ON r.id_manga = m.id_manga AND r.id_manga > 0
      WHERE r.id_fiche_depart = $1
      ORDER BY r.id_relation ASC
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

/**
 * @swagger
 * /api/admin/animes/{id}/screenshots:
 *   get:
 *     summary: Get screenshots for a specific anime
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
 *     responses:
 *       200:
 *         description: Screenshots list
 *       500:
 *         description: Server error
 */
router.get('/animes/:id/screenshots', async (req, res) => {
  try {
    const { id } = req.params;
    
    const screenshots = await pool.query(`
      SELECT * FROM ak_screenshots 
      WHERE id_titre = $1 AND type = 1
      ORDER BY id_screen ASC
    `, [id]);
    
    res.json({
      anime_id: parseInt(id),
      screenshots: screenshots.rows
    });
  } catch (error) {
    console.error('Screenshots fetch error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des screenshots' });
  }
});

/**
 * @swagger
 * /api/admin/animes/{id}/related-tags:
 *   get:
 *     summary: Get related tags for a specific anime
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
 *     responses:
 *       200:
 *         description: Related tags list
 *       500:
 *         description: Server error
 */
router.get('/animes/:id/related-tags', async (req, res) => {
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
    console.error('Related tags fetch error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des tags associés' });
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
    
    // Generate the id_fiche_depart
    const id_fiche_depart = `anime${id}`;
    
    // Check if relation already exists
    const existingRelation = await pool.query(`
      SELECT id_relation FROM ak_fiche_to_fiche 
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
      INSERT INTO ak_fiche_to_fiche (id_fiche_depart, id_anime, id_manga, id_ost, id_jeu)
      VALUES ($1, $2, $3, 0, 0)
      RETURNING id_relation, id_fiche_depart
    `, [id_fiche_depart, id_anime || 0, id_manga || 0]);
    
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
 * /api/admin/mangas/{id}/relations:
 *   post:
 *     summary: Add a new relation to a manga
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Manga ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_anime:
 *                 type: integer
 *                 description: Target anime ID (required if id_manga is not provided)
 *               id_manga:
 *                 type: integer
 *                 description: Target manga ID (required if id_anime is not provided)
 *     responses:
 *       201:
 *         description: Relation added successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Manga not found
 *       409:
 *         description: Relation already exists
 *       500:
 *         description: Server error
 */
router.post('/mangas/:id/relations', async (req, res) => {
  try {
    const { id } = req.params;
    const { id_anime, id_manga } = req.body;
    
    // Validate input
    if ((!id_anime && !id_manga) || (id_anime && id_manga)) {
      return res.status(400).json({ 
        error: 'Vous devez spécifier soit id_anime soit id_manga, mais pas les deux' 
      });
    }
    
    // Check if source manga exists
    const sourceManga = await pool.query(
      'SELECT id_manga FROM ak_mangas WHERE id_manga = $1',
      [id]
    );
    
    if (sourceManga.rows.length === 0) {
      return res.status(404).json({ error: 'Manga source introuvable' });
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
    
    // Generate the id_fiche_depart
    const id_fiche_depart = `manga${id}`;
    
    // Check if relation already exists
    const existingRelation = await pool.query(`
      SELECT id_relation FROM ak_fiche_to_fiche 
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
      INSERT INTO ak_fiche_to_fiche (id_fiche_depart, id_anime, id_manga, id_ost, id_jeu)
      VALUES ($1, $2, $3, 0, 0)
      RETURNING id_relation, id_fiche_depart
    `, [id_fiche_depart, id_anime || 0, id_manga || 0]);
    
    res.status(201).json({
      message: 'Relation ajoutée avec succès',
      id_relation: result.rows[0].id_relation,
      id_fiche_depart: id_fiche_depart,
      id_anime: id_anime || null,
      id_manga: id_manga || null
    });
    
  } catch (error) {
    console.error('Add manga relation error:', error);
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

/**
 * @swagger
 * /api/admin/animes:
 *   post:
 *     summary: Create a new anime
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titre
 *               - annee
 *             properties:
 *               titre:
 *                 type: string
 *               titre_orig:
 *                 type: string
 *               annee:
 *                 type: integer
 *               nb_ep:
 *                 type: integer
 *               studio:
 *                 type: string
 *               synopsis:
 *                 type: string
 *               image:
 *                 type: string
 *               statut:
 *                 type: integer
 *                 default: 1
 *     responses:
 *       201:
 *         description: Anime created successfully
 *       400:
 *         description: Invalid data
 *       500:
 *         description: Server error
 */
router.post('/animes', (req, res, next) => {
  // Access upload middleware from app.locals
  const upload = req.app.locals.upload;
  upload.single('image')(req, res, next);
}, async (req, res) => {
  try {
    const { titre, titre_orig, annee, nb_ep, studio, synopsis, image, statut = 1 } = req.body;
    
    if (!titre || !annee) {
      return res.status(400).json({ error: 'Le titre et l\'année sont obligatoires' });
    }
    
    // Handle image - either uploaded file or URL
    let finalImage = image; // Use existing image URL from form if no file uploaded
    if (req.file) {
      // New file uploaded, use the filename
      finalImage = req.file.filename;
    }
    
    // Generate nice_url
    const niceUrl = titre.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
    
    const result = await pool.query(`
      INSERT INTO ak_animes (
        titre, titre_orig, annee, nb_ep, studio, synopsis, image, statut, 
        nice_url, date_ajout, moyenne_notes, nb_reviews
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), 0, 0)
      RETURNING *
    `, [titre, titre_orig, annee, nb_ep, studio, synopsis, finalImage, statut, niceUrl]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Anime create error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'anime' });
  }
});

/**
 * @swagger
 * /api/admin/animes/{id}:
 *   put:
 *     summary: Update an anime
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
 *               titre:
 *                 type: string
 *               titre_orig:
 *                 type: string
 *               annee:
 *                 type: integer
 *               nb_ep:
 *                 type: integer
 *               studio:
 *                 type: string
 *               synopsis:
 *                 type: string
 *               statut:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Anime updated successfully
 *       404:
 *         description: Anime not found
 *       500:
 *         description: Server error
 */
router.put('/animes/:id', (req, res, next) => {
  // Access upload middleware from app.locals
  const upload = req.app.locals.upload;
  upload.single('image')(req, res, next);
}, async (req, res) => {
  try {
    const { id } = req.params;
    const { titre, titre_orig, annee, nb_ep, studio, synopsis, image, statut } = req.body;
    
    // Handle image - either uploaded file or URL
    let finalImage = image; // Use existing image URL from form if no file uploaded
    if (req.file) {
      // New file uploaded, use the filename
      finalImage = req.file.filename;
    }
    
    // Update nice_url if titre changed
    let niceUrl;
    if (titre) {
      niceUrl = titre.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
    }
    
    const result = await pool.query(`
      UPDATE ak_animes 
      SET titre = COALESCE($1, titre),
          titre_orig = COALESCE($2, titre_orig),
          annee = COALESCE($3, annee),
          nb_ep = COALESCE($4, nb_ep),
          studio = COALESCE($5, studio),
          synopsis = COALESCE($6, synopsis),
          image = COALESCE($7, image),
          statut = COALESCE($8, statut),
          nice_url = COALESCE($9, nice_url)
      WHERE id_anime = $10
      RETURNING *
    `, [titre, titre_orig, annee, nb_ep, studio, synopsis, finalImage, statut, niceUrl, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anime introuvable' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Anime update error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'anime' });
  }
});

/**
 * @swagger
 * /api/admin/animes/{id}:
 *   delete:
 *     summary: Delete an anime
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
 *     responses:
 *       200:
 *         description: Anime deleted successfully
 *       404:
 *         description: Anime not found
 *       500:
 *         description: Server error
 */
router.delete('/animes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM ak_animes WHERE id_anime = $1 RETURNING id_anime',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anime introuvable' });
    }
    
    res.json({ message: 'Anime supprimé avec succès' });
  } catch (error) {
    console.error('Anime delete error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'anime' });
  }
});

/**
 * @swagger
 * /api/admin/mangas:
 *   post:
 *     summary: Create a new manga
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titre
 *               - annee
 *               - auteur
 *             properties:
 *               titre:
 *                 type: string
 *               auteur:
 *                 type: string
 *               annee:
 *                 type: integer
 *               nb_volumes:
 *                 type: integer
 *               synopsis:
 *                 type: string
 *               image:
 *                 type: string
 *               statut:
 *                 type: integer
 *                 default: 1
 *     responses:
 *       201:
 *         description: Manga created successfully
 *       400:
 *         description: Invalid data
 *       500:
 *         description: Server error
 */
router.post('/mangas', async (req, res) => {
  try {
    const { titre, auteur, annee, nb_volumes, synopsis, image, statut = 1 } = req.body;
    
    if (!titre || !auteur || !annee) {
      return res.status(400).json({ error: 'Le titre, l\'auteur et l\'année sont obligatoires' });
    }
    
    // Generate nice_url
    const niceUrl = titre.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
    
    const result = await pool.query(`
      INSERT INTO ak_mangas (
        titre, auteur, annee, nb_volumes, synopsis, image, statut, 
        nice_url, date_ajout, moyenne_notes, nb_reviews
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), 0, 0)
      RETURNING *
    `, [titre, auteur, annee, nb_volumes, synopsis, image, statut, niceUrl]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Manga create error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du manga' });
  }
});

/**
 * @swagger
 * /api/admin/mangas/{id}:
 *   put:
 *     summary: Update a manga
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Manga ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titre:
 *                 type: string
 *               auteur:
 *                 type: string
 *               annee:
 *                 type: integer
 *               nb_volumes:
 *                 type: integer
 *               synopsis:
 *                 type: string
 *               statut:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Manga updated successfully
 *       404:
 *         description: Manga not found
 *       500:
 *         description: Server error
 */
router.put('/mangas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { titre, auteur, annee, synopsis, statut } = req.body;
    
    // Update nice_url if titre changed
    let niceUrl;
    if (titre) {
      niceUrl = titre.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
    }
    
    const result = await pool.query(`
      UPDATE ak_mangas 
      SET titre = COALESCE($1, titre),
          auteur = COALESCE($2, auteur),
          annee = COALESCE($3, annee),
          synopsis = COALESCE($4, synopsis),
          statut = COALESCE($5, statut),
          nice_url = COALESCE($6, nice_url)
      WHERE id_manga = $7
      RETURNING *
    `, [titre, auteur, annee, synopsis, statut, niceUrl, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Manga introuvable' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Manga update error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du manga' });
  }
});

/**
 * @swagger
 * /api/admin/mangas/{id}:
 *   delete:
 *     summary: Delete a manga
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Manga ID
 *     responses:
 *       200:
 *         description: Manga deleted successfully
 *       404:
 *         description: Manga not found
 *       500:
 *         description: Server error
 */
router.delete('/mangas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM ak_mangas WHERE id_manga = $1 RETURNING id_manga',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Manga introuvable' });
    }
    
    res.json({ message: 'Manga supprimé avec succès' });
  } catch (error) {
    console.error('Manga delete error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du manga' });
  }
});

// TODO: Add more admin routes like:
// - PUT /reviews/:id/approve (approve review)
// - DELETE /reviews/:id (delete review)
// - Screenshot management routes
// - Tag management routes
// - User management routes

module.exports = router;