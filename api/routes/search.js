const express = require('express');
const router = express.Router();

const pool = require('../config/database');

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search across animes and mangas
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, anime, manga]
 *           default: all
 *         description: Type of content to search
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
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Search results
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
 *                       type:
 *                         type: string
 *                         enum: [anime, manga]
 *                       id:
 *                         type: integer
 *                       titre:
 *                         type: string
 *                       image:
 *                         type: string
 *                       annee:
 *                         type: integer
 *                       moyenne_notes:
 *                         type: number
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid search query
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const { q, type = 'all', page = 1, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Requête de recherche requise' });
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const searchTerm = `%${q}%`;
    
    let results = [];
    
    if (type === 'all' || type === 'anime') {
      const animes = await pool.query(`
        SELECT 'anime' as type, id_anime as id, titre, image, annee, moyennenotes as moyenne_notes
        FROM ak_animes 
        WHERE statut = 1 AND (titre ILIKE $1 OR synopsis ILIKE $1)
        ORDER BY moyennenotes DESC NULLS LAST
        LIMIT $2
      `, [searchTerm, limit]);
      results = results.concat(animes.rows);
    }
    
    if (type === 'all' || type === 'manga') {
      const mangas = await pool.query(`
        SELECT 'manga' as type, id_manga as id, titre, image, annee, moyennenotes as moyenne_notes
        FROM ak_mangas 
        WHERE statut = 1 AND (titre ILIKE $1 OR synopsis ILIKE $1)
        ORDER BY moyennenotes DESC NULLS LAST
        LIMIT $2
      `, [searchTerm, limit]);
      results = results.concat(mangas.rows);
    }
    
    // Sort by rating and slice for pagination
    results.sort((a, b) => (b.moyenne_notes || 0) - (a.moyenne_notes || 0));
    
    const paginatedResults = results.slice(offset, offset + parseInt(limit));
    
    res.json({
      data: paginatedResults,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: results.length,
        pages: Math.ceil(results.length / limit)
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche' });
  }
});

module.exports = router;