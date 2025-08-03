const express = require('express');
const { authMiddleware, adminMiddleware } = require('../../middleware/auth');
const controllers = require('../presentation');

const router = express.Router();
const mangaController = controllers.manga;

/**
 * @swagger
 * components:
 *   schemas:
 *     Manga:
 *       type: object
 *       properties:
 *         id_manga:
 *           type: integer
 *           description: Unique manga ID
 *         nice_url:
 *           type: string
 *           description: SEO-friendly URL
 *         titre:
 *           type: string
 *           description: Manga title
 *         auteur:
 *           type: string
 *           description: Author/Mangaka
 *         annee:
 *           type: integer
 *           description: Publication year
 *         nb_volumes:
 *           type: integer
 *           description: Number of volumes
 *         synopsis:
 *           type: string
 *           description: Manga synopsis
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
 *         statut_publication:
 *           type: string
 *           enum: [En cours, Terminé, Suspendu, Abandonné]
 *           description: Publication status
 */

/**
 * @swagger
 * /api/mangas:
 *   get:
 *     summary: Get all mangas with pagination and filters
 *     tags: [Mangas]
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
 *         description: Search term for title or author
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by year
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Filter by author
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [En cours, Terminé, Suspendu, Abandonné]
 *         description: Filter by publication status
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [titre, annee, moyenne_notes, nb_reviews, auteur]
 *         description: Sort field
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: Mangas retrieved successfully
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
 *                         $ref: '#/components/schemas/Manga'
 *                     pagination:
 *                       type: object
 */
router.get('/', mangaController.getMangas);

/**
 * @swagger
 * /api/mangas/search:
 *   get:
 *     summary: Search mangas by title
 *     tags: [Mangas]
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
router.get('/search', mangaController.searchMangas);

/**
 * @swagger
 * /api/mangas/autocomplete:
 *   get:
 *     summary: Autocomplete manga titles
 *     tags: [Mangas]
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
router.get('/autocomplete', mangaController.autocompleteMangas);

/**
 * @swagger
 * /api/mangas/statistics:
 *   get:
 *     summary: Get manga statistics
 *     tags: [Mangas]
 *     responses:
 *       200:
 *         description: Manga statistics
 */
router.get('/statistics', mangaController.getStatistics);

/**
 * @swagger
 * /api/mangas/by-author/{author}:
 *   get:
 *     summary: Get mangas by author
 *     tags: [Mangas]
 *     parameters:
 *       - in: path
 *         name: author
 *         required: true
 *         schema:
 *           type: string
 *         description: Author name
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 50
 *         description: Maximum results
 *     responses:
 *       200:
 *         description: Mangas by author
 */
router.get('/by-author/:author', mangaController.getMangasByAuthor);

/**
 * @swagger
 * /api/mangas/by-year/{year}:
 *   get:
 *     summary: Get mangas by year
 *     tags: [Mangas]
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Publication year
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 100
 *         description: Maximum results
 *     responses:
 *       200:
 *         description: Mangas by year
 */
router.get('/by-year/:year', mangaController.getMangasByYear);

/**
 * @swagger
 * /api/mangas/by-tags:
 *   get:
 *     summary: Get mangas by tags
 *     tags: [Mangas]
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
 *         description: Mangas by tags
 */
router.get('/by-tags', mangaController.getMangasByTags);

/**
 * @swagger
 * /api/mangas/by-url/{niceUrl}:
 *   get:
 *     summary: Get manga by SEO-friendly URL
 *     tags: [Mangas]
 *     parameters:
 *       - in: path
 *         name: niceUrl
 *         required: true
 *         schema:
 *           type: string
 *         description: SEO-friendly URL
 *     responses:
 *       200:
 *         description: Manga details
 *       404:
 *         description: Manga not found
 */
router.get('/by-url/:niceUrl', mangaController.getMangaByNiceUrl);

/**
 * @swagger
 * /api/mangas/{id}:
 *   get:
 *     summary: Get manga by ID
 *     tags: [Mangas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Manga ID
 *     responses:
 *       200:
 *         description: Manga details
 *       404:
 *         description: Manga not found
 */
router.get('/:id', mangaController.getMangaById);

// Admin routes
/**
 * @swagger
 * /api/admin/mangas:
 *   get:
 *     summary: Get all mangas (admin only)
 *     tags: [Admin - Mangas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mangas retrieved for admin
 *       403:
 *         description: Admin access required
 *   post:
 *     summary: Create new manga (admin only)
 *     tags: [Admin - Mangas]
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
 *               statut_publication:
 *                 type: string
 *                 enum: [En cours, Terminé, Suspendu, Abandonné]
 *     responses:
 *       201:
 *         description: Manga created successfully
 *       403:
 *         description: Admin access required
 */
router.get('/admin', authMiddleware, adminMiddleware, mangaController.getMangasAdmin);
router.post('/admin', authMiddleware, adminMiddleware, mangaController.createManga);

/**
 * @swagger
 * /api/admin/mangas/search:
 *   get:
 *     summary: Search mangas (admin only)
 *     tags: [Admin - Mangas]
 *     security:
 *       - bearerAuth: []
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
 *           maximum: 100
 *         description: Maximum results
 *     responses:
 *       200:
 *         description: Admin search results
 *       403:
 *         description: Admin access required
 */
router.get('/admin/search', authMiddleware, adminMiddleware, mangaController.searchMangasAdmin);

/**
 * @swagger
 * /api/admin/mangas/{id}:
 *   put:
 *     summary: Update manga (admin only)
 *     tags: [Admin - Mangas]
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
 *               statut_publication:
 *                 type: string
 *                 enum: [En cours, Terminé, Suspendu, Abandonné]
 *     responses:
 *       200:
 *         description: Manga updated successfully
 *       404:
 *         description: Manga not found
 *       403:
 *         description: Admin access required
 *   delete:
 *     summary: Delete manga (admin only)
 *     tags: [Admin - Mangas]
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
 *       403:
 *         description: Admin access required
 */
router.put('/admin/:id', authMiddleware, adminMiddleware, mangaController.updateManga);
router.delete('/admin/:id', authMiddleware, adminMiddleware, mangaController.deleteManga);

module.exports = router;