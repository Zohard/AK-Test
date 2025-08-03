const BaseService = require('./BaseService');
const repositories = require('../data');

class ReviewService extends BaseService {
  constructor() {
    super(repositories.review);
  }

  async getReviews(filters = {}, pagination = {}) {
    try {
      const { page, limit } = this.validatePagination(pagination.page, pagination.limit);
      
      // Build conditions
      const conditions = {};
      if (filters.anime_id) {
        const animeId = parseInt(filters.anime_id);
        if (animeId) conditions.id_anime = animeId;
      }
      if (filters.manga_id) {
        const mangaId = parseInt(filters.manga_id);
        if (mangaId) conditions.id_manga = mangaId;
      }
      if (filters.user_id) {
        const userId = parseInt(filters.user_id);
        if (userId) conditions.id_user = userId;
      }
      if (filters.min_rating) {
        const minRating = parseFloat(filters.min_rating);
        if (minRating >= 0 && minRating <= 10) {
          conditions.min_note = minRating;
        }
      }

      const options = {
        limit,
        offset: (page - 1) * limit,
        orderBy: filters.sort || 'date_creation',
        orderDirection: filters.direction?.toUpperCase() || 'DESC'
      };

      const reviews = await this.repository.findWithUserInfo(conditions, options);
      const totalCount = await this.repository.count({ statut: 1, ...conditions });

      return {
        data: reviews,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch reviews: ${error.message}`);
    }
  }

  async getReviewById(reviewId) {
    try {
      const review = await this.repository.findById(reviewId);
      if (!review || review.statut !== 1) {
        throw new Error('Review not found');
      }

      // Get review with user info
      const [reviewWithInfo] = await this.repository.findWithUserInfo({ id_review: reviewId }, { limit: 1 });
      return reviewWithInfo || review;
    } catch (error) {
      throw new Error(`Failed to fetch review: ${error.message}`);
    }
  }

  async getMediaReviews(mediaId, mediaType, pagination = {}) {
    try {
      if (!['anime', 'manga'].includes(mediaType)) {
        throw new Error('Media type must be anime or manga');
      }

      const { page, limit } = this.validatePagination(pagination.page, pagination.limit);
      const reviews = await this.repository.findByMediaId(mediaId, mediaType, limit);

      return {
        data: reviews,
        mediaType,
        mediaId: parseInt(mediaId)
      };
    } catch (error) {
      throw new Error(`Failed to fetch media reviews: ${error.message}`);
    }
  }

  async getUserReviews(userId, pagination = {}) {
    try {
      const { page, limit } = this.validatePagination(pagination.page, pagination.limit);
      const reviews = await this.repository.findByUserId(userId, limit);

      return {
        data: reviews,
        userId: parseInt(userId)
      };
    } catch (error) {
      throw new Error(`Failed to fetch user reviews: ${error.message}`);
    }
  }

  async createReview(userId, reviewData) {
    try {
      this.validateReviewData(reviewData);

      const { media_id, media_type, rating, title, content } = reviewData;

      // Validate media type
      if (!['anime', 'manga'].includes(media_type)) {
        throw new Error('Media type must be anime or manga');
      }

      // Check if user has already reviewed this media
      const existingReview = await this.repository.getUserReviewForMedia(userId, media_id, media_type);
      if (existingReview) {
        throw new Error('You have already reviewed this media');
      }

      // Verify media exists
      const mediaRepository = media_type === 'anime' ? repositories.anime : repositories.manga;
      const media = await mediaRepository.findById(media_id);
      if (!media || media.statut !== 1) {
        throw new Error(`${media_type} not found`);
      }

      // Create review
      const reviewDataToCreate = {
        id_user: userId,
        [media_type === 'anime' ? 'id_anime' : 'id_manga']: media_id,
        note: rating,
        titre: title,
        contenu: content,
        date_creation: Math.floor(Date.now() / 1000)
      };

      const newReview = await this.repository.createReview(reviewDataToCreate);
      
      // Return review with additional info
      const [reviewWithInfo] = await this.repository.findWithUserInfo(
        { id_review: newReview.id_review }, 
        { limit: 1 }
      );

      return reviewWithInfo || newReview;
    } catch (error) {
      throw new Error(`Failed to create review: ${error.message}`);
    }
  }

  async updateReview(reviewId, userId, reviewData) {
    try {
      // Check if review exists and belongs to user
      const existingReview = await this.repository.findById(reviewId);
      if (!existingReview || existingReview.id_user !== userId) {
        throw new Error('Review not found or access denied');
      }

      this.validateReviewData(reviewData, false);

      const updateData = {};
      if (reviewData.rating !== undefined) updateData.note = reviewData.rating;
      if (reviewData.title !== undefined) updateData.titre = reviewData.title;
      if (reviewData.content !== undefined) updateData.contenu = reviewData.content;

      const updatedReview = await this.repository.update(reviewId, updateData);
      
      // Return review with additional info
      const [reviewWithInfo] = await this.repository.findWithUserInfo(
        { id_review: reviewId }, 
        { limit: 1 }
      );

      return reviewWithInfo || updatedReview;
    } catch (error) {
      throw new Error(`Failed to update review: ${error.message}`);
    }
  }

  async deleteReview(reviewId, userId, isAdmin = false) {
    try {
      const existingReview = await this.repository.findById(reviewId);
      if (!existingReview) {
        throw new Error('Review not found');
      }

      // Check permissions
      if (!isAdmin && existingReview.id_user !== userId) {
        throw new Error('Access denied');
      }

      // Soft delete by setting statut to 0
      return await this.repository.update(reviewId, { statut: 0 });
    } catch (error) {
      throw new Error(`Failed to delete review: ${error.message}`);
    }
  }

  async getMediaRating(mediaId, mediaType) {
    try {
      if (!['anime', 'manga'].includes(mediaType)) {
        throw new Error('Media type must be anime or manga');
      }

      return await this.repository.getAverageRating(mediaId, mediaType);
    } catch (error) {
      throw new Error(`Failed to get media rating: ${error.message}`);
    }
  }

  async getTopRatedMedia(mediaType, limit = 10) {
    try {
      if (!['anime', 'manga'].includes(mediaType)) {
        throw new Error('Media type must be anime or manga');
      }

      return await this.repository.getTopRatedMedia(mediaType, limit);
    } catch (error) {
      throw new Error(`Failed to get top rated media: ${error.message}`);
    }
  }

  async getReviewStatistics() {
    try {
      return await this.repository.getReviewStatistics();
    } catch (error) {
      throw new Error(`Failed to fetch review statistics: ${error.message}`);
    }
  }

  // Validation methods
  validateReviewData(data, isCreate = true) {
    if (isCreate) {
      if (!data.media_id || !Number.isInteger(parseInt(data.media_id))) {
        throw new Error('Valid media ID is required');
      }
      if (!data.media_type) {
        throw new Error('Media type is required');
      }
      if (!data.rating || !Number.isFinite(parseFloat(data.rating))) {
        throw new Error('Valid rating is required');
      }
      if (!data.title || data.title.trim().length === 0) {
        throw new Error('Review title is required');
      }
      if (!data.content || data.content.trim().length === 0) {
        throw new Error('Review content is required');
      }
    }

    if (data.rating !== undefined) {
      const rating = parseFloat(data.rating);
      if (isNaN(rating) || rating < 0 || rating > 10) {
        throw new Error('Rating must be between 0 and 10');
      }
    }

    if (data.title && (data.title.length < 3 || data.title.length > 255)) {
      throw new Error('Review title must be between 3 and 255 characters');
    }

    if (data.content && (data.content.length < 10 || data.content.length > 5000)) {
      throw new Error('Review content must be between 10 and 5000 characters');
    }
  }
}

module.exports = ReviewService;