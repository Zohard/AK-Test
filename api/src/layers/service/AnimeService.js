const BaseService = require('./BaseService');
const repositories = require('../data');

class AnimeService extends BaseService {
  constructor() {
    super(repositories.anime);
  }

  async getAnimes(filters = {}, pagination = {}) {
    try {
      const { page, limit } = this.validatePagination(pagination.page, pagination.limit);
      
      // Sanitize search filters
      const cleanFilters = {};
      if (filters.search) {
        cleanFilters.search = this.sanitizeSearchTerm(filters.search);
      }
      if (filters.year) {
        const year = parseInt(filters.year);
        if (year && year > 1900 && year <= new Date().getFullYear() + 5) {
          cleanFilters.year = year;
        }
      }
      if (filters.studio) {
        cleanFilters.studio = this.sanitizeSearchTerm(filters.studio);
      }
      if (filters.sort && ['titre', 'annee', 'moyenne_notes', 'nb_reviews'].includes(filters.sort)) {
        cleanFilters.sort = filters.sort;
      }
      if (filters.direction && ['ASC', 'DESC'].includes(filters.direction.toUpperCase())) {
        cleanFilters.direction = filters.direction.toUpperCase();
      }

      const animes = await this.repository.findWithPagination(page, limit, cleanFilters);
      const totalCount = await this.repository.count({ statut: 1 });

      return {
        data: animes,
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
      throw new Error(`Failed to fetch animes: ${error.message}`);
    }
  }

  async getAnimeById(id) {
    try {
      const anime = await this.repository.findById(id);
      if (!anime || anime.statut !== 1) {
        throw new Error('Anime not found');
      }

      // Get additional data
      const [relations, reviews] = await Promise.all([
        this.repository.findRelated(id),
        repositories.review.findByMediaId(id, 'anime', 5)
      ]);

      return {
        ...anime,
        relations,
        recentReviews: reviews
      };
    } catch (error) {
      throw new Error(`Failed to fetch anime: ${error.message}`);
    }
  }

  async getAnimeByNiceUrl(niceUrl) {
    try {
      if (!niceUrl) {
        throw new Error('Nice URL is required');
      }

      const anime = await this.repository.findByNiceUrl(niceUrl);
      if (!anime) {
        throw new Error('Anime not found');
      }

      // Get additional data
      const [relations, reviews, rating] = await Promise.all([
        this.repository.findRelated(anime.id_anime),
        repositories.review.findByMediaId(anime.id_anime, 'anime', 5),
        repositories.review.getAverageRating(anime.id_anime, 'anime')
      ]);

      return {
        ...anime,
        relations,
        recentReviews: reviews,
        rating
      };
    } catch (error) {
      throw new Error(`Failed to fetch anime: ${error.message}`);
    }
  }

  async searchAnimes(searchTerm, limit = 10) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new Error('Search term must be at least 2 characters');
      }

      const cleanSearchTerm = this.sanitizeSearchTerm(searchTerm);
      return await this.repository.searchByTitle(cleanSearchTerm, limit);
    } catch (error) {
      throw new Error(`Failed to search animes: ${error.message}`);
    }
  }

  async getAnimesByStudio(studio, limit = 10) {
    try {
      if (!studio) {
        throw new Error('Studio name is required');
      }

      const cleanStudio = this.sanitizeSearchTerm(studio);
      return await this.repository.findByStudio(cleanStudio, limit);
    } catch (error) {
      throw new Error(`Failed to fetch animes by studio: ${error.message}`);
    }
  }

  async getAnimesByYear(year, limit = 20) {
    try {
      const yearNum = parseInt(year);
      if (!yearNum || yearNum < 1900 || yearNum > new Date().getFullYear() + 5) {
        throw new Error('Invalid year provided');
      }

      return await this.repository.findByYear(yearNum, limit);
    } catch (error) {
      throw new Error(`Failed to fetch animes by year: ${error.message}`);
    }
  }

  async getAnimesByTags(tagIds, limit = 20) {
    try {
      if (!Array.isArray(tagIds) || tagIds.length === 0) {
        throw new Error('Tag IDs array is required');
      }

      // Validate tag IDs are numbers
      const validTagIds = tagIds.filter(id => Number.isInteger(parseInt(id))).map(id => parseInt(id));
      if (validTagIds.length === 0) {
        throw new Error('No valid tag IDs provided');
      }

      return await this.repository.findByTags(validTagIds, limit);
    } catch (error) {
      throw new Error(`Failed to fetch animes by tags: ${error.message}`);
    }
  }

  async getAnimeStatistics() {
    try {
      return await this.repository.getStatistics();
    } catch (error) {
      throw new Error(`Failed to fetch anime statistics: ${error.message}`);
    }
  }

  // Admin methods
  async createAnime(animeData) {
    try {
      this.validateAnimeData(animeData);
      
      // Generate nice_url if not provided
      if (!animeData.nice_url && animeData.titre) {
        animeData.nice_url = this.generateNiceUrl(animeData.titre);
      }

      animeData.statut = 1; // Active by default
      return await this.repository.create(animeData);
    } catch (error) {
      throw new Error(`Failed to create anime: ${error.message}`);
    }
  }

  async updateAnime(id, animeData) {
    try {
      this.validateAnimeData(animeData, false);
      
      // Generate nice_url if titre is being updated
      if (animeData.titre && !animeData.nice_url) {
        animeData.nice_url = this.generateNiceUrl(animeData.titre);
      }

      return await this.update(id, animeData);
    } catch (error) {
      throw new Error(`Failed to update anime: ${error.message}`);
    }
  }

  async deleteAnime(id) {
    try {
      // Soft delete by setting statut to 0
      return await this.update(id, { statut: 0 });
    } catch (error) {
      throw new Error(`Failed to delete anime: ${error.message}`);
    }
  }

  // Validation methods
  validateAnimeData(data, isCreate = true) {
    if (isCreate) {
      if (!data.titre || data.titre.trim().length === 0) {
        throw new Error('Title is required');
      }
    }

    if (data.annee) {
      const year = parseInt(data.annee);
      if (!year || year < 1900 || year > new Date().getFullYear() + 5) {
        throw new Error('Invalid year provided');
      }
    }

    if (data.nb_ep) {
      const episodes = parseInt(data.nb_ep);
      if (!episodes || episodes < 1 || episodes > 10000) {
        throw new Error('Invalid number of episodes');
      }
    }

    if (data.titre && data.titre.length > 255) {
      throw new Error('Title is too long (max 255 characters)');
    }

    if (data.synopsis && data.synopsis.length > 5000) {
      throw new Error('Synopsis is too long (max 5000 characters)');
    }
  }

  generateNiceUrl(title) {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim('-'); // Remove leading/trailing hyphens
  }
}

module.exports = AnimeService;