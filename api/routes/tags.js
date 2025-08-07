const express = require('express');
const router = express.Router();

const pool = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Tag:
 *       type: object
 *       properties:
 *         id_tag:
 *           type: integer
 *           description: ID unique du tag
 *         tag_name:
 *           type: string
 *           description: Nom du tag
 *         tag_nice_url:
 *           type: string
 *           description: URL SEO-friendly du tag
 *         description:
 *           type: string
 *           description: Description du tag
 *         categorie:
 *           type: string
 *           description: Catégorie du tag
 */

/**
 * @swagger
 * /api/tags:
 *   get:
 *     summary: Get all tag categories and tags
 *     tags: [Tags]
 *     responses:
 *       200:
 *         description: List of tag categories with their tags
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       categorie:
 *                         type: string
 *                       tags:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/Tag'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const tags = await pool.query(`
      SELECT 
        id_tag,
        tag_name,
        tag_nice_url,
        description,
        categorie
      FROM ak_tags
      ORDER BY categorie, tag_name
    `);
    
    // Group tags by category
    const categoriesMap = {};
    tags.rows.forEach(tag => {
      if (!categoriesMap[tag.categorie]) {
        categoriesMap[tag.categorie] = {
          categorie: tag.categorie,
          tags: []
        };
      }
      categoriesMap[tag.categorie].tags.push(tag);
    });
    
    const categories = Object.values(categoriesMap);
    
    res.json({
      categories
    });
  } catch (error) {
    console.error('Tags fetch error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des tags' });
  }
});

/**
 * @swagger
 * /api/tags/{id}:
 *   get:
 *     summary: Get a specific tag by ID
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tag ID
 *     responses:
 *       200:
 *         description: Tag details with associated animes/mangas
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Tag'
 *                 - type: object
 *                   properties:
 *                     animes:
 *                       type: array
 *                       items:
 *                         type: object
 *                     mangas:
 *                       type: array
 *                       items:
 *                         type: object
 *       404:
 *         description: Tag not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const tag = await pool.query(`
      SELECT * FROM ak_tags WHERE id_tag = $1
    `, [id]);
    
    if (tag.rows.length === 0) {
      return res.status(404).json({ error: 'Tag introuvable' });
    }
    
    // Get associated animes
    const animes = await pool.query(`
      SELECT a.id_anime, a.titre, a.annee, a.image, a.nice_url
      FROM ak_animes a
      INNER JOIN ak_tags_anime ta ON a.id_anime = ta.id_anime
      WHERE ta.id_tag = $1 AND a.statut = 1
      ORDER BY a.titre
    `, [id]);
    
    // Get associated mangas
    const mangas = await pool.query(`
      SELECT m.id_manga, m.titre, m.annee, m.image
      FROM ak_mangas m
      INNER JOIN ak_tags_manga tm ON m.id_manga = tm.id_manga
      WHERE tm.id_tag = $1 AND m.statut = 1
      ORDER BY m.titre
    `, [id]);
    
    res.json({
      ...tag.rows[0],
      animes: animes.rows,
      mangas: mangas.rows
    });
  } catch (error) {
    console.error('Tag fetch error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du tag' });
  }
});

module.exports = router;