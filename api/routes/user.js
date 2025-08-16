const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const router = express.Router();

const pool = require('../config/database');
const { sanitizeUser } = require('../utils/auth');
const { authenticateToken: authMiddleware } = require('../middleware/auth');

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

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id_member, member_name, real_name, email_address, 
             date_registered, last_login, posts, nb_critiques, nb_synopsis, 
             nb_contributions, experience, id_group, avatar, signature,
             personal_text, birthdate, location, website_title, website_url
      FROM smf_members 
      WHERE id_member = $1
    `, [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    
    const user = result.rows[0];
    res.json(sanitizeUser(user));
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               realName:
 *                 type: string
 *                 description: Real name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address
 *               personalText:
 *                 type: string
 *                 description: Personal text/bio
 *               signature:
 *                 type: string
 *                 description: Forum signature
 *               location:
 *                 type: string
 *                 description: User location
 *               websiteTitle:
 *                 type: string
 *                 description: Website title
 *               websiteUrl:
 *                 type: string
 *                 format: url
 *                 description: Website URL
 *               currentPassword:
 *                 type: string
 *                 description: Current password (required for email/password changes)
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: New password (optional)
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or incorrect current password
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/me', authMiddleware, [
  body('email').optional().isEmail().withMessage('Format d\'email invalide'),
  body('newPassword').optional().isLength({ min: 6 }).withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères'),
  body('websiteUrl').optional().isURL().withMessage('URL de site web invalide')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      realName,
      email,
      personalText,
      signature,
      location,
      websiteTitle,
      websiteUrl,
      currentPassword,
      newPassword
    } = req.body;

    // Get current user data
    const currentUser = await pool.query(
      'SELECT * FROM smf_members WHERE id_member = $1',
      [req.user.id]
    );

    if (currentUser.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    const user = currentUser.rows[0];
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    // Handle email change (requires current password)
    if (email && email !== user.email_address) {
      if (!currentPassword) {
        return res.status(400).json({ 
          error: 'Mot de passe actuel requis pour changer l\'email' 
        });
      }
      
      // Verify current password
      const passwordValid = await bcrypt.compare(currentPassword, user.passwd);
      if (!passwordValid) {
        return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
      }
      
      // Check if email is already taken
      const emailCheck = await pool.query(
        'SELECT id_member FROM smf_members WHERE email_address = $1 AND id_member != $2',
        [email, req.user.id]
      );
      
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Cette adresse email est déjà utilisée' });
      }
      
      updates.push(`email_address = $${paramCount++}`);
      values.push(email);
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ 
          error: 'Mot de passe actuel requis pour changer le mot de passe' 
        });
      }
      
      // Verify current password
      const passwordValid = await bcrypt.compare(currentPassword, user.passwd);
      if (!passwordValid) {
        return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      updates.push(`passwd = $${paramCount++}`);
      values.push(hashedPassword);
    }

    // Handle other profile fields
    if (realName !== undefined) {
      updates.push(`real_name = $${paramCount++}`);
      values.push(realName || '');
    }

    if (personalText !== undefined) {
      updates.push(`personal_text = $${paramCount++}`);
      values.push(personalText || '');
    }

    if (signature !== undefined) {
      updates.push(`signature = $${paramCount++}`);
      values.push(signature || '');
    }

    if (location !== undefined) {
      updates.push(`location = $${paramCount++}`);
      values.push(location || '');
    }

    if (websiteTitle !== undefined) {
      updates.push(`website_title = $${paramCount++}`);
      values.push(websiteTitle || '');
    }

    if (websiteUrl !== undefined) {
      updates.push(`website_url = $${paramCount++}`);
      values.push(websiteUrl || '');
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune modification fournie' });
    }

    // Add user ID for WHERE clause
    values.push(req.user.id);

    // Execute update
    await pool.query(`
      UPDATE smf_members 
      SET ${updates.join(', ')} 
      WHERE id_member = $${paramCount}
    `, values);

    // Fetch updated user data
    const updatedUser = await pool.query(`
      SELECT id_member, member_name, real_name, email_address, 
             date_registered, last_login, posts, nb_critiques, nb_synopsis, 
             nb_contributions, experience, id_group, avatar, signature,
             personal_text, birthdate, location, website_title, website_url
      FROM smf_members 
      WHERE id_member = $1
    `, [req.user.id]);

    res.json({
      user: sanitizeUser(updatedUser.rows[0]),
      message: 'Profil mis à jour avec succès'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
});

module.exports = router;