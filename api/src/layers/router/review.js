const express = require('express');
const { authenticateToken: authMiddleware, optionalAuth, requireAdmin: adminMiddleware } = require('../../../middleware/auth');
const controllers = require('../presentation');

const router = express.Router();
const reviewController = controllers.review;

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         id_review:
 *           type: integer
 *           description: Unique review ID
 *         id_user:
 *           type: integer
 *           description: User ID who wrote the review
 *         id_anime:
 *           type: integer
 *           description: Anime ID (null if manga review)
 *         id_manga:
 *           type: integer
 *           description: Manga ID (null if anime review)
 *         note:
 *           type: number
 *           minimum: 0
 *           maximum: 10
 *           description: Rating (0-10)
 *         titre:
 *           type: string
 *           description: Review title
 *         contenu:
 *           type: string
 *           description: Review content
 *         date_creation:
 *           type: integer
 *           description: Creation timestamp
 *         statut:
 *           type: integer
 *           description: Status (1=active, 0=inactive)
 *         username:
 *           type: string
 *           description: Username of reviewer
 *         avatar:
 *           type: string
 *           description: Reviewer avatar URL
 *         media_title:
 *           type: string
 *           description: Title of reviewed media
 *         media_url:
 *           type: string
 *           description: SEO-friendly URL of media
 *         media_type:
 *           type: string
 *           enum: [anime, manga]
 *           description: Type of media reviewed
 *     ReviewRequest:
 *       type: object
 *       required:
 *         - media_id
 *         - media_type
 *         - rating
 *         - title
 *         - content
 *       properties:
 *         media_id:
 *           type: integer
 *           description: ID of the media being reviewed
 *         media_type:
 *           type: string
 *           enum: [anime, manga]
 *           description: Type of media
 *         rating:
 *           type: number
 *           minimum: 0
 *           maximum: 10
 *           description: Rating (0-10)
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 255
 *           description: Review title
 *         content:
 *           type: string
 *           minLength: 10
 *           maxLength: 5000
 *           description: Review content
 */

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: Get all reviews with pagination and filters
 *     tags: [Reviews]
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
 *         name: anime_id
 *         schema:
 *           type: integer
 *         description: Filter by anime ID
 *       - in: query
 *         name: manga_id
 *         schema:
 *           type: integer
 *         description: Filter by manga ID
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: min_rating
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 10
 *         description: Minimum rating filter
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [date_creation, note, titre]
 *         description: Sort field
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *   post:
 *     summary: Create a new review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewRequest'
 *     responses:
 *       201:
 *         description: Review created successfully
 *       401:
 *         description: Authentication required
 *       409:
 *         description: User has already reviewed this media
 *       400:
 *         description: Validation error
 */
router.get('/', reviewController.getReviews);
router.post('/', authMiddleware, reviewController.createReview);

/**
 * @swagger
 * /api/reviews/statistics:
 *   get:
 *     summary: Get review statistics
 *     tags: [Reviews]
 *     responses:
 *       200:
 *         description: Review statistics
 */
router.get('/statistics', reviewController.getStatistics);

/**
 * @swagger
 * /api/reviews/top-rated/{mediaType}:
 *   get:
 *     summary: Get top rated media by type
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: mediaType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [anime, manga]
 *         description: Media type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 50
 *         description: Maximum results
 *     responses:
 *       200:
 *         description: Top rated media retrieved
 */
router.get('/top-rated/:mediaType', reviewController.getTopRatedMedia);

/**
 * @swagger
 * /api/reviews/{id}:
 *   get:
 *     summary: Get review by ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review retrieved successfully
 *       404:
 *         description: Review not found
 *   put:
 *     summary: Update review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 10
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 5000
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Review not found or access denied
 *   delete:
 *     summary: Delete review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Review not found
 */
router.get('/:id', reviewController.getReviewById);
router.put('/:id', authMiddleware, reviewController.updateReview);
router.delete('/:id', authMiddleware, reviewController.deleteReview);

// Media-specific review routes
/**
 * @swagger
 * /api/{mediaType}/{mediaId}/reviews:
 *   get:
 *     summary: Get reviews for specific media
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: mediaType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [anime, manga]
 *         description: Media type
 *       - in: path
 *         name: mediaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Media ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Media reviews retrieved
 */
router.get('/:mediaType/:mediaId/reviews', reviewController.getMediaReviews);

/**
 * @swagger
 * /api/{mediaType}/{mediaId}/rating:
 *   get:
 *     summary: Get average rating for media
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: mediaType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [anime, manga]
 *         description: Media type
 *       - in: path
 *         name: mediaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Media ID
 *     responses:
 *       200:
 *         description: Media rating retrieved
 */
router.get('/:mediaType/:mediaId/rating', reviewController.getMediaRating);

// User-specific review routes
/**
 * @swagger
 * /api/users/{userId}/reviews:
 *   get:
 *     summary: Get reviews by user
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: User reviews retrieved
 *       403:
 *         description: Access denied
 */
router.get('/users/:userId/reviews', authMiddleware, reviewController.getUserReviews);

// Admin routes
/**
 * @swagger
 * /api/admin/reviews:
 *   get:
 *     summary: Get all reviews (admin only)
 *     tags: [Admin - Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Reviews retrieved for admin
 *       403:
 *         description: Admin access required
 */
router.get('/admin/reviews', authMiddleware, adminMiddleware, reviewController.getReviewsAdmin);

/**
 * @swagger
 * /api/admin/reviews/{id}/status:
 *   put:
 *     summary: Update review status (admin only)
 *     tags: [Admin - Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: integer
 *                 enum: [0, 1]
 *                 description: Status (0=inactive, 1=active)
 *     responses:
 *       200:
 *         description: Review status updated
 *       403:
 *         description: Admin access required
 *       501:
 *         description: Not implemented
 */
router.put('/admin/reviews/:id/status', authMiddleware, adminMiddleware, reviewController.updateReviewStatus);

/**
 * @swagger
 * /api/admin/reviews/{id}:
 *   delete:
 *     summary: Delete review (admin only)
 *     tags: [Admin - Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review deleted by admin
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Review not found
 */
router.delete('/admin/reviews/:id', authMiddleware, adminMiddleware, reviewController.adminDeleteReview);

module.exports = router;