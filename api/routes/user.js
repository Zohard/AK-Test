const express = require('express');
const router = express.Router();

const pool = require('../config/database');
const { sanitizeUser } = require('../utils/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id_member:
 *           type: integer
 *           description: ID unique de l'utilisateur
 *         member_name:
 *           type: string
 *           description: Nom d'utilisateur
 *         real_name:
 *           type: string
 *           description: Nom réel
 *         email_address:
 *           type: string
 *           format: email
 *           description: Adresse email
 *         date_registered:
 *           type: integer
 *           description: Date d'inscription (timestamp)
 *         posts:
 *           type: integer
 *           description: Nombre de posts
 *         nb_critiques:
 *           type: integer
 *           description: Nombre de critiques écrites
 *         nb_synopsis:
 *           type: integer
 *           description: Nombre de synopsis écrits
 *         nb_contributions:
 *           type: integer
 *           description: Nombre de contributions
 *         experience:
 *           type: integer
 *           description: Points d'expérience
 */

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await pool.query(`
      SELECT id_member, member_name, real_name, date_registered, posts,
             nb_critiques, nb_synopsis, nb_contributions, experience
      FROM smf_members 
      WHERE id_member = $1
    `, [id]);
    
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    
    res.json(sanitizeUser(user.rows[0]));
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur' });
  }
});

/**
 * @swagger
 * /api/users/{id}/reviews:
 *   get:
 *     summary: Get reviews by user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
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
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: User's reviews
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Check if user exists
    const userCheck = await pool.query('SELECT id_member FROM smf_members WHERE id_member = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    
    const [reviews, total] = await Promise.all([
      pool.query(`
        SELECT c.*, 
               a.titre as anime_titre, a.image as anime_image,
               m.titre as manga_titre, m.image as manga_image
        FROM ak_critique c
        LEFT JOIN ak_animes a ON c.id_anime = a.id_anime
        LEFT JOIN ak_mangas m ON c.id_manga = m.id_manga
        WHERE c.id_membre = $1 AND c.statut = 0
        ORDER BY c.date_critique DESC
        LIMIT $2 OFFSET $3
      `, [id, parseInt(limit), offset]),
      pool.query('SELECT COUNT(*) FROM ak_critique WHERE id_membre = $1 AND statut = 0', [id])
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
    console.error('User reviews fetch error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des critiques' });
  }
});

module.exports = router;