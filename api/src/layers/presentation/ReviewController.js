const BaseController = require('./BaseController');
const services = require('../service');

class ReviewController extends BaseController {
  constructor() {
    super(services.review);
  }

  // GET /api/reviews
  getReviews = this.asyncHandler(async (req, res) => {
    try {
      const pagination = this.getPagination(req);
      const filters = this.getFilters(req, ['anime_id', 'manga_id', 'user_id', 'min_rating']);
      const sorting = this.getSorting(req, ['date_creation', 'note', 'titre']);

      const result = await this.service.getReviews(
        { ...filters, ...sorting },
        pagination
      );

      return this.success(res, result, 'Reviews retrieved successfully');
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // GET /api/reviews/:id
  getReviewById = this.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const review = await this.service.getReviewById(parseInt(id));
      
      return this.success(res, review, 'Review retrieved successfully');
    } catch (error) {
      if (error.message.includes('not found')) {
        return this.notFound(res, error.message);
      }
      return this.error(res, error.message);
    }
  });

  // GET /api/:mediaType/:mediaId/reviews
  getMediaReviews = this.asyncHandler(async (req, res) => {
    try {
      const { mediaType, mediaId } = req.params;
      const pagination = this.getPagination(req);

      if (!['anime', 'manga'].includes(mediaType)) {
        return this.validationError(res, ['Media type must be anime or manga']);
      }

      const result = await this.service.getMediaReviews(
        parseInt(mediaId),
        mediaType,
        pagination
      );

      return this.success(res, result, `${mediaType} reviews retrieved successfully`);
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // GET /api/users/:userId/reviews
  getUserReviews = this.asyncHandler(async (req, res) => {
    try {
      const { userId } = req.params;
      const pagination = this.getPagination(req);
      const requestingUser = this.getUser(req);

      // Users can only view their own reviews unless they're admin
      if (!requestingUser || (parseInt(userId) !== requestingUser.id && !requestingUser.isAdmin)) {
        return this.forbidden(res);
      }

      const result = await this.service.getUserReviews(parseInt(userId), pagination);
      
      return this.success(res, result, 'User reviews retrieved successfully');
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // POST /api/reviews
  createReview = this.asyncHandler(async (req, res) => {
    try {
      const user = this.getUser(req);
      if (!user) {
        return this.unauthorized(res);
      }

      const { media_id, media_type, rating, title, content } = req.body;

      const requiredFields = ['media_id', 'media_type', 'rating', 'title', 'content'];
      const errors = this.validateRequired(req, requiredFields);
      if (errors.length > 0) {
        return this.validationError(res, errors);
      }

      const review = await this.service.createReview(user.id, {
        media_id: parseInt(media_id),
        media_type,
        rating: parseFloat(rating),
        title,
        content
      });

      return this.success(res, review, 'Review created successfully', 201);
    } catch (error) {
      if (error.message.includes('already reviewed')) {
        return this.error(res, error.message, 409); // Conflict
      }
      return this.error(res, error.message);
    }
  });

  // PUT /api/reviews/:id
  updateReview = this.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const user = this.getUser(req);
      
      if (!user) {
        return this.unauthorized(res);
      }

      const { rating, title, content } = req.body;
      const updateData = {};
      
      if (rating !== undefined) updateData.rating = parseFloat(rating);
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;

      if (Object.keys(updateData).length === 0) {
        return this.validationError(res, ['At least one field to update is required']);
      }

      const review = await this.service.updateReview(parseInt(id), user.id, updateData);
      
      return this.success(res, review, 'Review updated successfully');
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return this.notFound(res, error.message);
      }
      return this.error(res, error.message);
    }
  });

  // DELETE /api/reviews/:id
  deleteReview = this.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const user = this.getUser(req);
      
      if (!user) {
        return this.unauthorized(res);
      }

      const isAdmin = this.isAdmin(req);
      await this.service.deleteReview(parseInt(id), user.id, isAdmin);
      
      return this.success(res, null, 'Review deleted successfully');
    } catch (error) {
      if (error.message.includes('not found')) {
        return this.notFound(res, error.message);
      }
      if (error.message.includes('access denied')) {
        return this.forbidden(res, error.message);
      }
      return this.error(res, error.message);
    }
  });

  // GET /api/:mediaType/:mediaId/rating
  getMediaRating = this.asyncHandler(async (req, res) => {
    try {
      const { mediaType, mediaId } = req.params;

      if (!['anime', 'manga'].includes(mediaType)) {
        return this.validationError(res, ['Media type must be anime or manga']);
      }

      const rating = await this.service.getMediaRating(parseInt(mediaId), mediaType);
      
      return this.success(res, rating, `${mediaType} rating retrieved successfully`);
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // GET /api/reviews/top-rated/:mediaType
  getTopRatedMedia = this.asyncHandler(async (req, res) => {
    try {
      const { mediaType } = req.params;
      const limit = Math.min(parseInt(req.query.limit) || 10, 50);

      if (!['anime', 'manga'].includes(mediaType)) {
        return this.validationError(res, ['Media type must be anime or manga']);
      }

      const topRated = await this.service.getTopRatedMedia(mediaType, limit);
      
      return this.success(res, topRated, `Top rated ${mediaType} retrieved successfully`);
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // GET /api/reviews/statistics
  getStatistics = this.asyncHandler(async (req, res) => {
    try {
      const stats = await this.service.getReviewStatistics();
      
      return this.success(res, stats, 'Review statistics retrieved successfully');
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // Admin endpoints
  // GET /api/admin/reviews
  getReviewsAdmin = this.asyncHandler(async (req, res) => {
    try {
      if (!this.isAdmin(req)) {
        return this.forbidden(res);
      }

      const pagination = this.getPagination(req);
      const filters = this.getFilters(req, ['anime_id', 'manga_id', 'user_id', 'min_rating', 'status']);
      const sorting = this.getSorting(req, ['date_creation', 'note', 'titre']);

      const result = await this.service.getReviews(
        { ...filters, ...sorting },
        pagination
      );

      return this.success(res, result, 'Reviews retrieved for admin');
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // PUT /api/admin/reviews/:id/status
  updateReviewStatus = this.asyncHandler(async (req, res) => {
    try {
      if (!this.isAdmin(req)) {
        return this.forbidden(res);
      }

      const { id } = req.params;
      const { status } = req.body;

      if (!status || ![0, 1].includes(parseInt(status))) {
        return this.validationError(res, ['Status must be 0 (inactive) or 1 (active)']);
      }

      // This would need to be implemented in the service layer
      return this.error(res, 'Review status update not yet implemented', 501);
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // DELETE /api/admin/reviews/:id
  adminDeleteReview = this.asyncHandler(async (req, res) => {
    try {
      if (!this.isAdmin(req)) {
        return this.forbidden(res);
      }

      const { id } = req.params;
      const user = this.getUser(req);
      
      await this.service.deleteReview(parseInt(id), user.id, true);
      
      return this.success(res, null, 'Review deleted successfully by admin');
    } catch (error) {
      if (error.message.includes('not found')) {
        return this.notFound(res, error.message);
      }
      return this.error(res, error.message);
    }
  });
}

module.exports = ReviewController;