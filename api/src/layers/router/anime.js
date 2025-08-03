const express = require('express');
const { authMiddleware, optionalAuth, adminMiddleware } = require('../../middleware/auth');
const controllers = require('../presentation');

const router = express.Router();
const animeController = controllers.anime;

/**
 * @swagger
 * components:
 *   schemas:
 *     Anime:
 *       type: object
 *       properties:
 *         id_anime:
 *           type: integer
 *           description: Unique anime ID
 *         nice_url:
 *           type: string
 *           description: SEO-friendly URL
 *         titre:
 *           type: string
 *           description: Anime title
 *         titre_orig:
 *           type: string
 *           description: Original title
 *         annee:
 *           type: integer
 *           description: Release year
 *         nb_ep:
 *           type: integer
 *           description: Number of episodes
 *         studio:
 *           type: string
 *           description: Animation studio
 *         synopsis:
 *           type: string
 *           description: Anime synopsis
 *         image:
 *           type: string
 *           description: Image URL
 *         moyenne_notes:
 *           type: number
 *           description: Average rating
 *         nb_reviews:
 *           type: integer
 *           description: Number of reviews
 *         statut:
 *           type: integer
 *           description: Status (1=active, 0=inactive)
 */

/**
 * @swagger
 * /api/animes:
 *   get:
 *     summary: Get all animes with pagination and filters
 *     tags: [Animes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for title
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by year
 *       - in: query
 *         name: studio
 *         schema:
 *           type: string
 *         description: Filter by studio
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [titre, annee, moyenne_notes, nb_reviews]
 *         description: Sort field
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: Animes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Anime'
 *                     pagination:
 *                       type: object
 */
router.get('/', animeController.getAnimes);

/**
 * @swagger
 * /api/animes/search:
 *   get:
 *     summary: Search animes by title
 *     tags: [Animes]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 50
 *         description: Maximum results
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', animeController.searchAnimes);

/**
 * @swagger
 * /api/animes/autocomplete:
 *   get:
 *     summary: Autocomplete anime titles
 *     tags: [Animes]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 20
 *         description: Maximum results
 *     responses:
 *       200:
 *         description: Autocomplete suggestions
 */
router.get('/autocomplete', animeController.autocompleteAnimes);

/**
 * @swagger
 * /api/animes/statistics:
 *   get:
 *     summary: Get anime statistics
 *     tags: [Animes]
 *     responses:
 *       200:
 *         description: Anime statistics
 */
router.get('/statistics', animeController.getStatistics);

/**
 * @swagger
 * /api/animes/by-studio/{studio}:
 *   get:
 *     summary: Get animes by studio
 *     tags: [Animes]
 *     parameters:
 *       - in: path
 *         name: studio
 *         required: true
 *         schema:
 *           type: string
 *         description: Studio name
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 50
 *         description: Maximum results
 *     responses:
 *       200:
 *         description: Animes by studio
 */
router.get('/by-studio/:studio', animeController.getAnimesByStudio);

/**
 * @swagger
 * /api/animes/by-year/{year}:
 *   get:
 *     summary: Get animes by year
 *     tags: [Animes]
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Release year
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 100
 *         description: Maximum results
 *     responses:
 *       200:
 *         description: Animes by year
 */
router.get('/by-year/:year', animeController.getAnimesByYear);

/**
 * @swagger
 * /api/animes/by-tags:
 *   get:
 *     summary: Get animes by tags
 *     tags: [Animes]
 *     parameters:
 *       - in: query
 *         name: tags
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated tag IDs
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 100
 *         description: Maximum results
 *     responses:
 *       200:
 *         description: Animes by tags
 */
router.get('/by-tags', animeController.getAnimesByTags);

/**
 * @swagger
 * /api/animes/by-url/{niceUrl}:
 *   get:
 *     summary: Get anime by SEO-friendly URL
 *     tags: [Animes]
 *     parameters:
 *       - in: path
 *         name: niceUrl
 *         required: true
 *         schema:
 *           type: string
 *         description: SEO-friendly URL
 *     responses:
 *       200:
 *         description: Anime details
 *       404:
 *         description: Anime not found
 */
router.get('/by-url/:niceUrl', animeController.getAnimeByNiceUrl);

/**
 * @swagger
 * /api/animes/{id}:
 *   get:
 *     summary: Get anime by ID
 *     tags: [Animes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Anime ID
 *     responses:
 *       200:
 *         description: Anime details
 *       404:
 *         description: Anime not found
 */
router.get('/:id', animeController.getAnimeById);

// Admin routes
/**
 * @swagger
 * /api/admin/animes:
 *   get:
 *     summary: Get all animes (admin only)
 *     tags: [Admin - Animes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Animes retrieved for admin
 *       403:
 *         description: Admin access required
 *   post:
 *     summary: Create new anime (admin only)
 *     tags: [Admin - Animes]
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
 *     responses:
 *       201:
 *         description: Anime created successfully
 *       403:
 *         description: Admin access required
 */
router.get('/admin', authMiddleware, adminMiddleware, animeController.getAnimesAdmin);
router.post('/admin', authMiddleware, adminMiddleware, animeController.createAnime);

/**
 * @swagger
 * /api/admin/animes/{id}:
 *   put:
 *     summary: Update anime (admin only)
 *     tags: [Admin - Animes]
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
 *     responses:
 *       200:
 *         description: Anime updated successfully
 *       404:
 *         description: Anime not found
 *       403:
 *         description: Admin access required
 *   delete:
 *     summary: Delete anime (admin only)
 *     tags: [Admin - Animes]
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
 *       403:
 *         description: Admin access required
 */
router.put('/admin/:id', authMiddleware, adminMiddleware, animeController.updateAnime);
router.delete('/admin/:id', authMiddleware, adminMiddleware, animeController.deleteAnime);

module.exports = router;