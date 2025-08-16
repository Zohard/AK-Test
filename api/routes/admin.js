const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter by title
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
    const { page = 1, limit = 50, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = '';
    let params = [];
    
    // Handle status filter
    if (status !== undefined && status !== 'all') {
      whereClause = 'WHERE a.statut = $1';
      params.push(parseInt(status));
    }
    
    // Handle search filter
    if (search && search.trim()) {
      const searchCondition = `a.titre ILIKE $${params.length + 1}`;
      if (whereClause) {
        whereClause += ` AND ${searchCondition}`;
      } else {
        whereClause = `WHERE ${searchCondition}`;
      }
      params.push(`%${search.trim()}%`);
    }
    
    const query = `
      SELECT 
        a.id_anime, 
        a.nice_url, 
        a.titre, 
        a.titre_orig, 
        a.annee, 
        a.nb_ep, 
        a.studio, 
        a.image, 
        a.statut, 
        a.date_ajout,
        ROUND(AVG(c.notation), 1) as moyennenotes,
        COUNT(c.id_critique) as nb_reviews
      FROM ak_animes a
      LEFT JOIN ak_critique c ON a.id_anime = c.id_anime AND c.statut = 0
      ${whereClause}
      GROUP BY a.id_anime, a.nice_url, a.titre, a.titre_orig, a.annee, a.nb_ep, a.studio, a.image, a.statut, a.date_ajout
      ORDER BY a.date_ajout DESC NULLS LAST
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    params.push(parseInt(limit), offset);
    
    const [animes, total] = await Promise.all([
      pool.query(query, params),
      pool.query(`SELECT COUNT(*) FROM ak_animes a ${whereClause}`, params.slice(0, -2))
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
    console.error('Query params:', params);
    console.error('Where clause:', whereClause);
    res.status(500).json({ error: 'Erreur lors de la récupération des animes', details: error.message });
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter by title
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
    const { page = 1, limit = 50, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = '';
    let countWhereClause = '';
    let params = [];
    
    // Handle status filter
    if (status !== undefined && status !== 'all') {
      whereClause = 'WHERE m.statut = $1';
      countWhereClause = 'WHERE statut = $1';
      params.push(parseInt(status));
    }
    
    // Handle search filter
    if (search && search.trim()) {
      const searchCondition = `m.titre ILIKE $${params.length + 1}`;
      if (whereClause) {
        whereClause += ` AND ${searchCondition}`;
        countWhereClause += ` AND titre ILIKE $${params.length + 1}`;
      } else {
        whereClause = `WHERE ${searchCondition}`;
        countWhereClause = `WHERE titre ILIKE $${params.length + 1}`;
      }
      params.push(`%${search.trim()}%`);
    }
    
    const query = `
      SELECT 
        m.id_manga, 
        m.titre, 
        m.auteur, 
        m.annee, 
        m.image, 
        m.statut, 
        m.date_ajout,
        ROUND(AVG(c.notation), 1) as moyennenotes,
        COUNT(c.id_critique) as nb_reviews
      FROM ak_mangas m
      LEFT JOIN ak_critique c ON m.id_manga = c.id_manga AND c.statut = 0
      ${whereClause}
      GROUP BY m.id_manga, m.titre, m.auteur, m.annee, m.image, m.statut, m.date_ajout
      ORDER BY m.date_ajout DESC NULLS LAST
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    params.push(parseInt(limit), offset);
    
    const [mangas, total] = await Promise.all([
      pool.query(query, params),
      pool.query(`SELECT COUNT(*) FROM ak_mangas ${countWhereClause}`, params.slice(0, -2))
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
    console.error('Query params:', params);
    console.error('Where clause:', whereClause);
    console.error('Status value:', status);
    res.status(500).json({ error: 'Erreur lors de la récupération des mangas', details: error.message });
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
    
    // Get related animes and their tags
    const relatedAnimes = await pool.query(`
      SELECT 
        a.id_anime,
        a.titre,
        a.annee,
        a.image,
        COALESCE(
          json_agg(
            json_build_object(
              'id_tag', t.id_tag,
              'tag_name', t.tag_name,
              'tag_category', t.categorie
            )
          ) FILTER (WHERE t.id_tag IS NOT NULL), 
          '[]'
        ) as tags
      FROM ak_fiche_to_fiche r
      JOIN ak_animes a ON r.id_anime = a.id_anime AND a.statut = 1
      LEFT JOIN ak_tag2fiche t2f ON a.id_anime = t2f.id_fiche AND t2f.type = 'anime'
      LEFT JOIN ak_tags t ON t2f.id_tag = t.id_tag
      WHERE r.id_fiche_depart = $1
      GROUP BY a.id_anime, a.titre, a.annee, a.image
      ORDER BY a.titre
    `, [`anime${id}`]);
    
    // Get related mangas and their tags
    const relatedMangas = await pool.query(`
      SELECT 
        m.id_manga,
        m.titre,
        m.annee,
        m.image,
        COALESCE(
          json_agg(
            json_build_object(
              'id_tag', t.id_tag,
              'tag_name', t.tag_name,
              'tag_category', t.categorie
            )
          ) FILTER (WHERE t.id_tag IS NOT NULL), 
          '[]'
        ) as tags
      FROM ak_fiche_to_fiche r
      JOIN ak_mangas m ON r.id_manga = m.id_manga AND m.statut = 1
      LEFT JOIN ak_tag2fiche t2f ON m.id_manga = t2f.id_fiche AND t2f.type = 'manga'
      LEFT JOIN ak_tags t ON t2f.id_tag = t.id_tag
      WHERE r.id_fiche_depart = $1
      GROUP BY m.id_manga, m.titre, m.annee, m.image
      ORDER BY m.titre
    `, [`anime${id}`]);
    
    res.json({
      anime_id: parseInt(id),
      animes: relatedAnimes.rows,
      mangas: relatedMangas.rows
    });
  } catch (error) {
    console.error('Related tags fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch related tags' });
  }
});

/**
 * @swagger
 * /api/admin/mangas/{id}/related-tags:
 *   get:
 *     summary: Get related content for a specific manga
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
 *         description: Related content list
 *       500:
 *         description: Server error
 */
router.get('/mangas/:id/related-tags', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get related animes and their tags
    const relatedAnimes = await pool.query(`
      SELECT 
        a.id_anime,
        a.titre,
        a.annee,
        a.image,
        COALESCE(
          json_agg(
            json_build_object(
              'id_tag', t.id_tag,
              'tag_name', t.tag_name,
              'tag_category', t.categorie
            )
          ) FILTER (WHERE t.id_tag IS NOT NULL), 
          '[]'
        ) as tags
      FROM ak_fiche_to_fiche r
      JOIN ak_animes a ON r.id_anime = a.id_anime AND a.statut = 1
      LEFT JOIN ak_tag2fiche t2f ON a.id_anime = t2f.id_fiche AND t2f.type = 'anime'
      LEFT JOIN ak_tags t ON t2f.id_tag = t.id_tag
      WHERE r.id_fiche_depart = $1
      GROUP BY a.id_anime, a.titre, a.annee, a.image
      ORDER BY a.titre
    `, [`manga${id}`]);
    
    // Get related mangas and their tags
    const relatedMangas = await pool.query(`
      SELECT 
        m.id_manga,
        m.titre,
        m.annee,
        m.image,
        COALESCE(
          json_agg(
            json_build_object(
              'id_tag', t.id_tag,
              'tag_name', t.tag_name,
              'tag_category', t.categorie
            )
          ) FILTER (WHERE t.id_tag IS NOT NULL), 
          '[]'
        ) as tags
      FROM ak_fiche_to_fiche r
      JOIN ak_mangas m ON r.id_manga = m.id_manga AND m.statut = 1
      LEFT JOIN ak_tag2fiche t2f ON m.id_manga = t2f.id_fiche AND t2f.type = 'manga'
      LEFT JOIN ak_tags t ON t2f.id_tag = t.id_tag
      WHERE r.id_fiche_depart = $1
      GROUP BY m.id_manga, m.titre, m.annee, m.image
      ORDER BY m.titre
    `, [`manga${id}`]);
    
    res.json({
      manga_id: parseInt(id),
      animes: relatedAnimes.rows,
      mangas: relatedMangas.rows
    });
  } catch (error) {
    console.error('Related tags fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch related tags' });
  }
});

/**
 * @swagger
 * /api/admin/animes/{id}/tags:
 *   post:
 *     summary: Add a tag to an anime
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
 *               - tag_id
 *             properties:
 *               tag_id:
 *                 type: integer
 *                 description: Tag ID to add
 *     responses:
 *       201:
 *         description: Tag added successfully
 *       400:
 *         description: Bad request or tag already assigned
 *       404:
 *         description: Anime or tag not found
 *       500:
 *         description: Server error
 */
router.post('/animes/:id/tags', async (req, res) => {
  try {
    const { id } = req.params;
    const { tag_id } = req.body;
    
    if (!tag_id) {
      return res.status(400).json({ error: 'Tag ID est requis' });
    }
    
    // Check if anime exists
    const anime = await pool.query(
      'SELECT id_anime FROM ak_animes WHERE id_anime = $1',
      [id]
    );
    
    if (anime.rows.length === 0) {
      return res.status(404).json({ error: 'Anime introuvable' });
    }
    
    // Check if tag exists
    const tag = await pool.query(
      'SELECT id_tag, tag_name FROM ak_tags WHERE id_tag = $1',
      [tag_id]
    );
    
    if (tag.rows.length === 0) {
      return res.status(404).json({ error: 'Tag introuvable' });
    }
    
    // Check if tag is already assigned
    const existing = await pool.query(
      'SELECT id FROM ak_tag2fiche WHERE id_fiche = $1 AND id_tag = $2 AND type = $3',
      [id, tag_id, 'anime']
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Ce tag est déjà assigné à cet anime' });
    }
    
    // Add the tag
    await pool.query(
      'INSERT INTO ak_tag2fiche (id_fiche, id_tag, type) VALUES ($1, $2, $3)',
      [id, tag_id, 'anime']
    );
    
    res.status(201).json({
      message: 'Tag ajouté avec succès',
      anime_id: parseInt(id),
      tag_id: parseInt(tag_id),
      tag_name: tag.rows[0].tag_name
    });
    
  } catch (error) {
    console.error('Add tag error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout du tag' });
  }
});

/**
 * @swagger
 * /api/admin/animes/{id}/tags:
 *   delete:
 *     summary: Remove a tag from an anime
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
 *               - tag_id
 *             properties:
 *               tag_id:
 *                 type: integer
 *                 description: Tag ID to remove
 *     responses:
 *       200:
 *         description: Tag removed successfully
 *       404:
 *         description: Tag assignment not found
 *       500:
 *         description: Server error
 */
router.delete('/animes/:id/tags', async (req, res) => {
  try {
    const { id } = req.params;
    const { tag_id } = req.body;
    
    if (!tag_id) {
      return res.status(400).json({ error: 'Tag ID est requis' });
    }
    
    // Remove the tag assignment
    const result = await pool.query(
      'DELETE FROM ak_tag2fiche WHERE id_fiche = $1 AND id_tag = $2 AND type = $3 RETURNING *',
      [id, tag_id, 'anime']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Association tag introuvable' });
    }
    
    res.json({
      message: 'Tag supprimé avec succès',
      anime_id: parseInt(id),
      tag_id: parseInt(tag_id)
    });
    
  } catch (error) {
    console.error('Remove tag error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du tag' });
  }
});

/**
 * @swagger
 * /api/admin/mangas/{id}/tags:
 *   post:
 *     summary: Add a tag to a manga
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
 *             required:
 *               - tag_id
 *             properties:
 *               tag_id:
 *                 type: integer
 *                 description: Tag ID to add
 *     responses:
 *       201:
 *         description: Tag added successfully
 *       400:
 *         description: Bad request or tag already assigned
 *       404:
 *         description: Manga or tag not found
 *       500:
 *         description: Server error
 */
router.post('/mangas/:id/tags', async (req, res) => {
  try {
    const { id } = req.params;
    const { tag_id } = req.body;
    
    if (!tag_id) {
      return res.status(400).json({ error: 'Tag ID est requis' });
    }
    
    // Check if manga exists
    const manga = await pool.query(
      'SELECT id_manga FROM ak_mangas WHERE id_manga = $1',
      [id]
    );
    
    if (manga.rows.length === 0) {
      return res.status(404).json({ error: 'Manga introuvable' });
    }
    
    // Check if tag exists
    const tag = await pool.query(
      'SELECT id_tag, tag_name FROM ak_tags WHERE id_tag = $1',
      [tag_id]
    );
    
    if (tag.rows.length === 0) {
      return res.status(404).json({ error: 'Tag introuvable' });
    }
    
    // Check if tag is already assigned
    const existing = await pool.query(
      'SELECT id FROM ak_tag2fiche WHERE id_fiche = $1 AND id_tag = $2 AND type = $3',
      [id, tag_id, 'manga']
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Ce tag est déjà assigné à ce manga' });
    }
    
    // Add the tag
    await pool.query(
      'INSERT INTO ak_tag2fiche (id_fiche, id_tag, type) VALUES ($1, $2, $3)',
      [id, tag_id, 'manga']
    );
    
    res.status(201).json({
      message: 'Tag ajouté avec succès',
      manga_id: parseInt(id),
      tag_id: parseInt(tag_id),
      tag_name: tag.rows[0].tag_name
    });
    
  } catch (error) {
    console.error('Add manga tag error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout du tag' });
  }
});

/**
 * @swagger
 * /api/admin/mangas/{id}/tags:
 *   delete:
 *     summary: Remove a tag from a manga
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
 *             required:
 *               - tag_id
 *             properties:
 *               tag_id:
 *                 type: integer
 *                 description: Tag ID to remove
 *     responses:
 *       200:
 *         description: Tag removed successfully
 *       404:
 *         description: Tag assignment not found
 *       500:
 *         description: Server error
 */
router.delete('/mangas/:id/tags', async (req, res) => {
  try {
    const { id } = req.params;
    const { tag_id } = req.body;
    
    if (!tag_id) {
      return res.status(400).json({ error: 'Tag ID est requis' });
    }
    
    // Remove the tag assignment
    const result = await pool.query(
      'DELETE FROM ak_tag2fiche WHERE id_fiche = $1 AND id_tag = $2 AND type = $3 RETURNING *',
      [id, tag_id, 'manga']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Association tag introuvable' });
    }
    
    res.json({
      message: 'Tag supprimé avec succès',
      manga_id: parseInt(id),
      tag_id: parseInt(tag_id)
    });
    
  } catch (error) {
    console.error('Remove manga tag error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du tag' });
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
 *   get:
 *     summary: Get relations for a specific manga
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
 *         description: Relations list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 manga_id:
 *                   type: integer
 *                 relations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_relation:
 *                         type: integer
 *                       anime_titre:
 *                         type: string
 *                       manga_titre:
 *                         type: string
 *       500:
 *         description: Server error
 */
router.get('/mangas/:id/relations', async (req, res) => {
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
    `, [`manga${id}`]);
    
    res.json({
      manga_id: parseInt(id),
      relations: relations.rows
    });
  } catch (error) {
    console.error('Relations fetch error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des relations' });
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
 * /api/admin/mangas/{id}/relations/{relationId}:
 *   delete:
 *     summary: Remove a relation from a manga
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
 *       - in: path
 *         name: relationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Relation ID
 *     responses:
 *       200:
 *         description: Relation deleted successfully
 *       404:
 *         description: Relation not found
 *       500:
 *         description: Server error
 */
router.delete('/mangas/:id/relations/:relationId', async (req, res) => {
  try {
    const { id, relationId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM ak_fiche_to_fiche WHERE id_relation = $1 AND id_fiche_depart = $2 RETURNING *',
      [relationId, `manga${id}`]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Relation introuvable' });
    }
    
    res.json({
      message: 'Relation supprimée avec succès',
      id_relation: parseInt(relationId),
      manga_id: parseInt(id)
    });
    
  } catch (error) {
    console.error('Delete manga relation error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la relation' });
  }
});

/**
 * @swagger
 * /api/admin/mangas/{id}/covers:
 *   get:
 *     summary: Get covers for a specific manga
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
 *         description: Covers list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 manga_id:
 *                   type: integer
 *                 covers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_screen:
 *                         type: integer
 *                       url_screen:
 *                         type: string
 *       500:
 *         description: Server error
 */
router.get('/mangas/:id/covers', async (req, res) => {
  try {
    const { id } = req.params;
    
    const covers = await pool.query(`
      SELECT * FROM ak_screenshots 
      WHERE id_titre = $1 AND type = 2
      ORDER BY id_screen ASC
    `, [id]);
    
    res.json({
      manga_id: parseInt(id),
      covers: covers.rows
    });
  } catch (error) {
    console.error('Covers fetch error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des covers' });
  }
});

/**
 * @swagger
 * /api/admin/mangas/{id}/covers:
 *   post:
 *     summary: Upload new covers for a manga
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               covers:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Covers uploaded successfully
 *       400:
 *         description: No files provided
 *       404:
 *         description: Manga not found
 *       500:
 *         description: Server error
 */
router.post('/mangas/:id/covers', (req, res, next) => {
  console.log('=== Manga Cover Upload Route Debug ===');
  console.log('Request URL:', req.originalUrl);
  console.log('Route path:', req.route?.path);
  console.log('Method:', req.method);
  console.log('Params:', req.params);
  
  // Use memory upload for better debugging
  const memoryUpload = req.app.locals.memoryUpload;
  memoryUpload.array('covers', 10)(req, res, next); // Allow up to 10 covers
}, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('=== After Multer Processing ===');
    console.log('Files received:', req.files?.length || 0);
    console.log('Files details:', req.files?.map(f => ({ filename: f.filename, originalname: f.originalname, path: f.path, size: f.size })));
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier reçu' });
    }
    
    // Check if manga exists
    const manga = await pool.query(
      'SELECT id_manga FROM ak_mangas WHERE id_manga = $1',
      [id]
    );
    
    if (manga.rows.length === 0) {
      return res.status(404).json({ error: 'Manga introuvable' });
    }
    
    const uploadedCovers = [];
    const errors = [];
    
    for (const file of req.files) {
      try {
        // Generate unique filename
        const timestamp = Date.now();
        const randomSuffix = Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname) || '.jpg';
        const filename = `manga-cover-${id}-${timestamp}-${randomSuffix}${extension}`;
        
        // Save file to disk
        const isDocker = fs.existsSync('/.dockerenv');
        const uploadsRoot = isDocker ? '/app/uploads' : path.resolve(__dirname, '../uploads');
        const screenshotsDir = path.join(uploadsRoot, 'screenshots');
        
        // Ensure directory exists
        if (!fs.existsSync(screenshotsDir)) {
          fs.mkdirSync(screenshotsDir, { recursive: true });
        }
        
        const filePath = path.join(screenshotsDir, filename);
        fs.writeFileSync(filePath, file.buffer);
        
        console.log('File saved to:', filePath);
        
        // Insert into database
        const result = await pool.query(
          'INSERT INTO ak_screenshots (id_titre, url_screen, type) VALUES ($1, $2, 2) RETURNING *',
          [id, filename]
        );
        
        uploadedCovers.push({
          id_screen: result.rows[0].id_screen,
          url_screen: filename,
          original_name: file.originalname
        });
        
      } catch (fileError) {
        console.error('Error processing file:', file.originalname, fileError);
        errors.push({
          filename: file.originalname,
          error: fileError.message
        });
      }
    }
    
    res.status(201).json({
      message: `${uploadedCovers.length} cover(s) uploadé(s) avec succès`,
      covers: uploadedCovers,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Manga cover upload error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload des covers' });
  }
});

/**
 * @swagger
 * /api/admin/mangas/{id}/covers/{coverId}:
 *   delete:
 *     summary: Delete a cover from a manga
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
 *       - in: path
 *         name: coverId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cover ID
 *     responses:
 *       200:
 *         description: Cover deleted successfully
 *       404:
 *         description: Cover not found
 *       500:
 *         description: Server error
 */
router.delete('/mangas/:id/covers/:coverId', async (req, res) => {
  try {
    const { id, coverId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM ak_screenshots WHERE id_screen = $1 AND id_titre = $2 AND type = 2 RETURNING *',
      [coverId, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cover introuvable' });
    }
    
    res.json({
      message: 'Cover supprimé avec succès',
      cover: result.rows[0]
    });
    
  } catch (error) {
    console.error('Cover delete error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du cover' });
  }
});

/**
 * @swagger
 * /api/admin/business:
 *   get:
 *     summary: Get paginated list of business entities
 *     tags: [Admin]
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
 *         description: Items per page
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [all, active, inactive]
 *           default: all
 *         description: Filter by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: Business entities list
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
 *                       id_business:
 *                         type: integer
 *                       denomination:
 *                         type: string
 *                       type:
 *                         type: string
 *                       origine:
 *                         type: string
 *                       site_officiel:
 *                         type: string
 *                       statut:
 *                         type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get('/business', async (req, res) => {
  try {
    const { page = 1, limit = 50, statut = 'all', search, type } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = '';
    let params = [];
    let paramCount = 0;
    
    // Filter by status
    if (statut !== 'all') {
      paramCount++;
      const statutValue = statut === 'active' ? 1 : (statut === 'pending' ? 2 : 0);
      whereClause = `WHERE statut = $${paramCount}`;
      params.push(statutValue);
    }
    
    // Add type filter
    if (type && type.trim()) {
      paramCount++;
      const typeCondition = `type = $${paramCount}`;
      whereClause = whereClause 
        ? `${whereClause} AND ${typeCondition}`
        : `WHERE ${typeCondition}`;
      params.push(type.trim());
    }
    
    // Add search filter
    if (search && search.trim()) {
      paramCount++;
      const searchCondition = `denomination ILIKE $${paramCount}`;
      whereClause = whereClause 
        ? `${whereClause} AND ${searchCondition}`
        : `WHERE ${searchCondition}`;
      params.push(`%${search.trim()}%`);
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM ak_business ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    // Get paginated data
    paramCount++;
    params.push(parseInt(limit));
    paramCount++;
    params.push(offset);
    
    const dataQuery = `
      SELECT 
        id_business,
        denomination,
        type,
        origine,
        site_officiel,
        image,
        statut,
        date_ajout,
        date_modification
      FROM ak_business 
      ${whereClause}
      ORDER BY denomination ASC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;
    
    const dataResult = await pool.query(dataQuery, params);
    
    // Get filter metadata
    const [typesResult, statusResult] = await Promise.all([
      // Get available types with counts
      pool.query(`
        SELECT type, COUNT(*) as count 
        FROM ak_business 
        WHERE type IS NOT NULL AND type != ''
        GROUP BY type 
        ORDER BY type ASC
      `),
      // Get status counts
      pool.query(`
        SELECT 
          SUM(CASE WHEN statut = 1 THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN statut = 0 THEN 1 ELSE 0 END) as inactive,
          SUM(CASE WHEN statut = 2 THEN 1 ELSE 0 END) as pending
        FROM ak_business
      `)
    ]);
    
    // Format types for frontend
    const availableTypes = typesResult.rows.map(row => ({
      name: row.type,
      count: parseInt(row.count)
    }));
    
    // Format status counts for frontend
    const statusCounts = {
      active: parseInt(statusResult.rows[0].active || 0),
      inactive: parseInt(statusResult.rows[0].inactive || 0),
      pending: parseInt(statusResult.rows[0].pending || 0)
    };
    
    res.json({
      data: dataResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / parseInt(limit))
      },
      filters: {
        types: availableTypes,
        statuts: statusCounts
      }
    });
    
  } catch (error) {
    console.error('Admin business list error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des business' });
  }
});

/**
 * @swagger
 * /api/admin/business/{id}:
 *   get:
 *     summary: Get specific business by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business ID
 *     responses:
 *       200:
 *         description: Business details
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.get('/business/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const business = await pool.query(`
      SELECT *
      FROM ak_business 
      WHERE id_business = $1
    `, [id]);
    
    if (business.rows.length === 0) {
      return res.status(404).json({ error: 'Fiche business introuvable' });
    }
    
    res.json(business.rows[0]);
    
  } catch (error) {
    console.error('Business fetch error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la fiche business' });
  }
});

/**
 * @swagger
 * /api/admin/business:
 *   post:
 *     summary: Create new business
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
 *               - denomination
 *               - type
 *             properties:
 *               denomination:
 *                 type: string
 *               type:
 *                 type: string
 *               origine:
 *                 type: string
 *               site_officiel:
 *                 type: string
 *               image:
 *                 type: string
 *               autres_denominations:
 *                 type: string
 *               notes:
 *                 type: string
 *               statut:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Business created successfully
 *       400:
 *         description: Invalid data
 *       500:
 *         description: Server error
 */
router.post('/business', async (req, res) => {
  try {
    const { 
      denomination, 
      type, 
      origine, 
      site_officiel, 
      image, 
      autres_denominations, 
      notes, 
      statut = 1 
    } = req.body;
    
    if (!denomination?.trim() || !type?.trim()) {
      return res.status(400).json({ error: 'La dénomination et le type sont obligatoires' });
    }
    
    const result = await pool.query(`
      INSERT INTO ak_business (
        denomination, type, origine, site_officiel, image, 
        autres_denominations, notes, statut, date_ajout
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) 
      RETURNING *
    `, [
      denomination.trim(), 
      type.trim(), 
      origine?.trim() || null, 
      site_officiel?.trim() || null, 
      image?.trim() || null,
      autres_denominations?.trim() || null,
      notes?.trim() || null,
      parseInt(statut) || 1
    ]);
    
    res.status(201).json(result.rows[0]);
    
  } catch (error) {
    console.error('Business create error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la fiche business' });
  }
});

/**
 * @swagger
 * /api/admin/business/{id}:
 *   put:
 *     summary: Update business
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               denomination:
 *                 type: string
 *               type:
 *                 type: string
 *               origine:
 *                 type: string
 *               site_officiel:
 *                 type: string
 *               image:
 *                 type: string
 *               autres_denominations:
 *                 type: string
 *               notes:
 *                 type: string
 *               statut:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Business updated successfully
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.put('/business/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      denomination, 
      type, 
      origine, 
      site_officiel, 
      image, 
      autres_denominations, 
      notes, 
      statut 
    } = req.body;
    
    if (!denomination?.trim() || !type?.trim()) {
      return res.status(400).json({ error: 'La dénomination et le type sont obligatoires' });
    }
    
    const result = await pool.query(`
      UPDATE ak_business 
      SET denomination = $1, type = $2, origine = $3, site_officiel = $4, 
          image = $5, autres_denominations = $6, notes = $7, statut = $8,
          date_modification = NOW()
      WHERE id_business = $9 
      RETURNING *
    `, [
      denomination.trim(), 
      type.trim(), 
      origine?.trim() || null, 
      site_officiel?.trim() || null, 
      image?.trim() || null,
      autres_denominations?.trim() || null,
      notes?.trim() || null,
      parseInt(statut) || 1,
      id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fiche business introuvable' });
    }
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('Business update error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la fiche business' });
  }
});

/**
 * @swagger
 * /api/admin/business/{id}:
 *   delete:
 *     summary: Delete business
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business ID
 *     responses:
 *       200:
 *         description: Business deleted successfully
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.delete('/business/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM ak_business WHERE id_business = $1 RETURNING id_business',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fiche business introuvable' });
    }
    
    res.json({ message: 'Fiche business supprimée avec succès' });
    
  } catch (error) {
    console.error('Business delete error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la fiche business' });
  }
});

/**
 * @swagger
 * /api/admin/business/{id}/upload-image:
 *   post:
 *     summary: Upload image for business entity
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload
 *             required:
 *               - image
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 filename:
 *                   type: string
 *       400:
 *         description: No file uploaded or invalid file
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.post('/business/:id/upload-image', (req, res, next) => {
  // Access upload middleware from app.locals
  const upload = req.app.locals.upload;
  upload.single('image')(req, res, next);
}, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if business exists
    const business = await pool.query(
      'SELECT id_business, denomination FROM ak_business WHERE id_business = $1',
      [id]
    );

    if (business.rows.length === 0) {
      return res.status(404).json({ error: 'Fiche business introuvable' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    // Update business with new image filename
    await pool.query(
      'UPDATE ak_business SET image = $1, date_modification = NOW() WHERE id_business = $2',
      [req.file.filename, id]
    );

    res.json({
      message: 'Image téléchargée avec succès',
      filename: req.file.filename
    });

  } catch (error) {
    console.error('Business image upload error:', error);
    res.status(500).json({ error: 'Erreur lors du téléchargement de l\'image' });
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
 * /api/admin/mangas/{id}:
 *   get:
 *     summary: Get a single manga for editing
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
 *         description: Manga data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_manga:
 *                   type: integer
 *                 titre:
 *                   type: string
 *                 auteur:
 *                   type: string
 *                 annee:
 *                   type: string
 *                 origine:
 *                   type: string
 *                 synopsis:
 *                   type: string
 *                 image:
 *                   type: string
 *                 nb_volumes:
 *                   type: string
 *                 statut:
 *                   type: integer
 *       404:
 *         description: Manga not found
 *       500:
 *         description: Server error
 */
router.get('/mangas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM ak_mangas WHERE id_manga = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Manga introuvable' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get manga error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du manga' });
  }
});

/**
 * @swagger
 * /api/admin/mangas/{id}/staff:
 *   get:
 *     summary: Get staff members for a manga
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
 *         description: Staff list
 *       404:
 *         description: Manga not found
 *       500:
 *         description: Server error
 */
router.get('/mangas/:id/staff', async (req, res) => {
  try {
    const { id } = req.params;
    
    const staff = await pool.query(`
      SELECT 
        btm.id_business as business_id,
        b.denomination as business_name,
        btm.type as fonction,
        btm.precisions,
        b.type as business_type,
        b.site_officiel
      FROM ak_business_to_mangas btm
      JOIN ak_business b ON btm.id_business = b.id_business
      WHERE btm.id_manga = $1 AND b.statut = 1
      ORDER BY btm.type, b.denomination
    `, [id]);
    
    res.json({
      manga_id: parseInt(id),
      staff: staff.rows
    });
  } catch (error) {
    console.error('Staff fetch error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du staff' });
  }
});

/**
 * @swagger
 * /api/admin/mangas/{id}/staff:
 *   post:
 *     summary: Add staff member to a manga
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
router.post('/mangas/:id/staff', async (req, res) => {
  try {
    const { id } = req.params;
    const { business_id, fonction, precisions } = req.body;
    
    if (!business_id || !fonction) {
      return res.status(400).json({ error: 'Business ID et fonction sont requis' });
    }
    
    // Check if manga exists
    const manga = await pool.query(
      'SELECT id_manga FROM ak_mangas WHERE id_manga = $1',
      [id]
    );
    
    if (manga.rows.length === 0) {
      return res.status(404).json({ error: 'Manga introuvable' });
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
      'SELECT id_business FROM ak_business_to_mangas WHERE id_manga = $1 AND id_business = $2 AND type = $3',
      [id, business_id, fonction]
    );
    
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Cette combinaison business/fonction existe déjà' });
    }
    
    // Insert the staff relationship
    await pool.query(
      'INSERT INTO ak_business_to_mangas (id_manga, id_business, type, precisions) VALUES ($1, $2, $3, $4)',
      [id, business_id, fonction, precisions || null]
    );
    
    res.status(201).json({
      message: 'Staff ajouté avec succès',
      manga_id: parseInt(id),
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
 * /api/admin/mangas/{id}/staff:
 *   delete:
 *     summary: Remove staff member from a manga
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
router.delete('/mangas/:id/staff', async (req, res) => {
  try {
    const { id } = req.params;
    const { business_id, fonction } = req.body;
    
    if (!business_id || !fonction) {
      return res.status(400).json({ error: 'Business ID et fonction sont requis' });
    }
    
    // Delete the staff relationship
    const result = await pool.query(
      'DELETE FROM ak_business_to_mangas WHERE id_manga = $1 AND id_business = $2 AND type = $3 RETURNING *',
      [id, business_id, fonction]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Relation staff introuvable' });
    }
    
    res.json({
      message: 'Staff supprimé avec succès',
      manga_id: parseInt(id),
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

/**
 * @swagger
 * /api/admin/animes/{id}/screenshots:
 *   post:
 *     summary: Upload screenshots for a specific anime
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               screenshots:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Screenshot files (max 200KB each, JPG/JPEG/GIF/PNG)
 *     responses:
 *       201:
 *         description: Screenshots uploaded successfully
 *       400:
 *         description: Invalid file format or size
 *       404:
 *         description: Anime not found
 *       500:
 *         description: Server error
 */
router.post('/animes/:id/screenshots', (req, res, next) => {
  console.log('=== Screenshot Upload Route Debug ===');
  console.log('Request URL:', req.originalUrl);
  console.log('Route path:', req.route?.path);
  console.log('Method:', req.method);
  console.log('Params:', req.params);
  
  // Use memory upload for better debugging
  const memoryUpload = req.app.locals.memoryUpload;
  memoryUpload.array('screenshots', 10)(req, res, next); // Allow up to 10 screenshots
}, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('=== After Multer Processing ===');
    console.log('Files received:', req.files?.length || 0);
    console.log('Files details:', req.files?.map(f => ({ filename: f.filename, originalname: f.originalname, path: f.path, size: f.size })));
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier reçu' });
    }
    
    // Check if anime exists
    const anime = await pool.query(
      'SELECT id_anime FROM ak_animes WHERE id_anime = $1',
      [id]
    );
    
    if (anime.rows.length === 0) {
      return res.status(404).json({ error: 'Anime introuvable' });
    }
    
    // Validate file types and sizes
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/gif', 'image/png', 'image/webp'];
    const maxSize = 3 * 1024 * 1024; // 3MB
    
    for (const file of req.files) {
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ 
          error: `Format non supporté: ${file.originalname}. Formats acceptés: JPG, JPEG, GIF, PNG, WebP` 
        });
      }
      if (file.size > maxSize) {
        return res.status(400).json({ 
          error: `Fichier trop lourd: ${file.originalname}. Taille max: 3Mo` 
        });
      }
    }
    
    // Save files manually from memory storage
    const fs = require('fs');
    const path = require('path');
    
    for (const file of req.files) {
      console.log('Processing file:', {
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        hasBuffer: !!file.buffer,
        path: file.path
      });
      
      // Generate filename if not present (memory storage doesn't auto-generate)
      if (!file.filename) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        file.filename = 'screenshots-' + uniqueSuffix + extension;
        console.log('Generated filename:', file.filename);
      }
      
      // Save the file manually to the screenshots directory
      // Use frontend/public/images/screenshots directory to match database URLs
      const isDocker = fs.existsSync('/.dockerenv');
      const uploadsRoot = isDocker 
        ? '/app/uploads' 
        : path.resolve(__dirname, '../uploads');
      const screenshotsDir = path.join(uploadsRoot, 'screenshots');
      const filePath = path.join(screenshotsDir, file.filename);
      
      if (file.buffer) {
        try {
          // Ensure directory exists
          if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir, { recursive: true });
          }
          
          fs.writeFileSync(filePath, file.buffer);
          console.log('File successfully saved to:', filePath);
          console.log('File size on disk:', fs.statSync(filePath).size, 'bytes');
        } catch (error) {
          console.error('Error saving file:', error);
          throw error;
        }
      } else {
        console.log('ERROR: No file buffer available');
        throw new Error('File buffer not available');
      }
    }

    // Insert screenshots into database
    const insertedScreenshots = [];
    for (const file of req.files) {
      const result = await pool.query(
        'INSERT INTO ak_screenshots (id_titre, type, url_screen) VALUES ($1, $2, $3) RETURNING *',
        [id, 1, `screenshots/${file.filename}`] // type 1 = anime
      );
      insertedScreenshots.push(result.rows[0]);
    }
    
    res.status(201).json({
      message: 'Screenshots uploadés avec succès',
      data: insertedScreenshots,
      count: insertedScreenshots.length
    });
    
  } catch (error) {
    console.error('Screenshot upload error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload des screenshots' });
  }
});

/**
 * @swagger
 * /api/admin/animes/{id}/screenshots/{screenshotId}:
 *   delete:
 *     summary: Delete a screenshot for a specific anime
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
 *       - in: path
 *         name: screenshotId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Screenshot ID
 *     responses:
 *       200:
 *         description: Screenshot deleted successfully
 *       404:
 *         description: Screenshot not found
 *       500:
 *         description: Server error
 */
router.delete('/animes/:id/screenshots/:screenshotId', async (req, res) => {
  try {
    const { id, screenshotId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM ak_screenshots WHERE id_screen = $1 AND id_titre = $2 AND type = 1 RETURNING *',
      [screenshotId, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Screenshot introuvable' });
    }
    
    res.json({
      message: 'Screenshot supprimé avec succès',
      screenshot: result.rows[0]
    });
    
  } catch (error) {
    console.error('Screenshot delete error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du screenshot' });
  }
});

/**
 * @swagger
 * /api/admin/animes/{id}/relations/{relationId}:
 *   delete:
 *     summary: Delete a relation for a specific anime
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
 *       - in: path
 *         name: relationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Relation ID
 *     responses:
 *       200:
 *         description: Relation deleted successfully
 *       404:
 *         description: Relation not found
 *       500:
 *         description: Server error
 */
router.delete('/animes/:id/relations/:relationId', async (req, res) => {
  try {
    const { id, relationId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM ak_fiche_to_fiche WHERE id_relation = $1 AND id_fiche_depart = $2 RETURNING *',
      [relationId, `anime${id}`]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Relation introuvable' });
    }
    
    res.json({
      message: 'Relation supprimée avec succès',
      relation: result.rows[0]
    });
    
  } catch (error) {
    console.error('Relation delete error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la relation' });
  }
});


/**
 * @swagger
 * /api/admin/articles:
 *   get:
 *     summary: Get all articles for admin management
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
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title or content
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of articles
 *       500:
 *         description: Server error
 */
router.get('/articles', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status !== undefined ? parseInt(req.query.status) : null;

    let whereClause = '';
    let params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += `WHERE (titre ILIKE $${paramCount} OR texte ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (status !== null) {
      paramCount++;
      if (whereClause) {
        whereClause += ` AND statut = $${paramCount}`;
      } else {
        whereClause += `WHERE statut = $${paramCount}`;
      }
      params.push(status);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM ak_webzine_articles ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get articles
    params.push(limit, offset);
    const articlesQuery = `
      SELECT 
        id_art,
        titre,
        nice_url,
        date,
        img,
        auteur,
        auteurs_multiples,
        meta_description,
        tags,
        nb_com,
        nb_clics,
        onindex,
        statut,
        SUBSTRING(texte, 1, 200) as excerpt
      FROM ak_webzine_articles 
      ${whereClause}
      ORDER BY date DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    const articles = await pool.query(articlesQuery, params);

    res.json({
      articles: articles.rows,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit
      }
    });
  } catch (error) {
    console.error('Articles list error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des articles' });
  }
});

/**
 * @swagger
 * /api/admin/articles/{id}:
 *   get:
 *     summary: Get a specific article for editing
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Article ID
 *     responses:
 *       200:
 *         description: Article details
 *       404:
 *         description: Article not found
 *       500:
 *         description: Server error
 */
router.get('/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM ak_webzine_articles WHERE id_art = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article introuvable' });
    }
    
    res.json({ article: result.rows[0] });
  } catch (error) {
    console.error('Article get error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'article' });
  }
});

/**
 * @swagger
 * /api/admin/articles:
 *   post:
 *     summary: Create a new article
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
 *               - texte
 *               - auteur
 *             properties:
 *               titre:
 *                 type: string
 *               nice_url:
 *                 type: string
 *               img:
 *                 type: string
 *               imgunebig:
 *                 type: string
 *               imgunebig2:
 *                 type: string
 *               texte:
 *                 type: string
 *               auteur:
 *                 type: integer
 *               auteurs_multiples:
 *                 type: string
 *               meta_description:
 *                 type: string
 *               tags:
 *                 type: string
 *               videos:
 *                 type: string
 *               onindex:
 *                 type: integer
 *               nl2br:
 *                 type: integer
 *               statut:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Article created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/articles', async (req, res) => {
  try {
    const {
      titre,
      nice_url,
      img,
      imgunebig,
      imgunebig2,
      texte,
      auteur,
      auteurs_multiples,
      meta_description,
      tags,
      videos,
      onindex = 0,
      nl2br = 1,
      statut = 0
    } = req.body;

    if (!titre || !texte || !auteur) {
      return res.status(400).json({ error: 'Titre, texte et auteur sont requis' });
    }

    const result = await pool.query(`
      INSERT INTO ak_webzine_articles (
        titre, nice_url, date, img, imgunebig, imgunebig2, texte, auteur,
        auteurs_multiples, meta_description, tags, videos, nb_com, nb_clics,
        trackbacks_open, onindex, nl2br, already_ping, statut
      ) VALUES (
        $1, $2, NOW(), $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, 0, 1, $12, $13, 0, $14
      ) RETURNING *
    `, [
      titre, nice_url, img, imgunebig, imgunebig2, texte, auteur,
      auteurs_multiples, meta_description, tags, videos, onindex, nl2br, statut
    ]);

    res.status(201).json({
      message: 'Article créé avec succès',
      article: result.rows[0]
    });
  } catch (error) {
    console.error('Article creation error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'article' });
  }
});

/**
 * @swagger
 * /api/admin/articles/{id}:
 *   put:
 *     summary: Update an existing article
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Article ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titre:
 *                 type: string
 *               nice_url:
 *                 type: string
 *               img:
 *                 type: string
 *               imgunebig:
 *                 type: string
 *               imgunebig2:
 *                 type: string
 *               texte:
 *                 type: string
 *               auteur:
 *                 type: integer
 *               auteurs_multiples:
 *                 type: string
 *               meta_description:
 *                 type: string
 *               tags:
 *                 type: string
 *               videos:
 *                 type: string
 *               onindex:
 *                 type: integer
 *               nl2br:
 *                 type: integer
 *               statut:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Article updated successfully
 *       404:
 *         description: Article not found
 *       500:
 *         description: Server error
 */
router.put('/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titre,
      nice_url,
      img,
      imgunebig,
      imgunebig2,
      texte,
      auteur,
      auteurs_multiples,
      meta_description,
      tags,
      videos,
      onindex,
      nl2br,
      statut
    } = req.body;

    const result = await pool.query(`
      UPDATE ak_webzine_articles SET
        titre = COALESCE($1, titre),
        nice_url = COALESCE($2, nice_url),
        img = COALESCE($3, img),
        imgunebig = COALESCE($4, imgunebig),
        imgunebig2 = COALESCE($5, imgunebig2),
        texte = COALESCE($6, texte),
        auteur = COALESCE($7, auteur),
        auteurs_multiples = COALESCE($8, auteurs_multiples),
        meta_description = COALESCE($9, meta_description),
        tags = COALESCE($10, tags),
        videos = COALESCE($11, videos),
        onindex = COALESCE($12, onindex),
        nl2br = COALESCE($13, nl2br),
        statut = COALESCE($14, statut)
      WHERE id_art = $15
      RETURNING *
    `, [
      titre, nice_url, img, imgunebig, imgunebig2, texte, auteur,
      auteurs_multiples, meta_description, tags, videos, onindex, nl2br, statut, id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article introuvable' });
    }

    res.json({
      message: 'Article mis à jour avec succès',
      article: result.rows[0]
    });
  } catch (error) {
    console.error('Article update error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'article' });
  }
});

/**
 * @swagger
 * /api/admin/articles/{id}:
 *   delete:
 *     summary: Delete an article
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Article ID
 *     responses:
 *       200:
 *         description: Article deleted successfully
 *       404:
 *         description: Article not found
 *       500:
 *         description: Server error
 */
router.delete('/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM ak_webzine_articles WHERE id_art = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article introuvable' });
    }
    
    res.json({
      message: 'Article supprimé avec succès',
      article: result.rows[0]
    });
  } catch (error) {
    console.error('Article delete error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'article' });
  }
});

/**
 * @swagger
 * /api/admin/articles/{id}/publish:
 *   put:
 *     summary: Publish/unpublish an article
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Article ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - statut
 *             properties:
 *               statut:
 *                 type: integer
 *                 description: 0 for draft, 1 for published
 *     responses:
 *       200:
 *         description: Article status updated
 *       404:
 *         description: Article not found
 *       500:
 *         description: Server error
 */
router.put('/articles/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    
    const result = await pool.query(
      'UPDATE ak_webzine_articles SET statut = $1 WHERE id_art = $2 RETURNING *',
      [statut, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article introuvable' });
    }
    
    res.json({
      message: `Article ${statut ? 'publié' : 'mis en brouillon'} avec succès`,
      article: result.rows[0]
    });
  } catch (error) {
    console.error('Article publish error:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du statut' });
  }
});

// TODO: Add more admin routes like:
// - PUT /reviews/:id/approve (approve review)
// - DELETE /reviews/:id (delete review)
// - User management routes

module.exports = router;