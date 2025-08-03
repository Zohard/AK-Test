const BaseService = require('./BaseService');
const repositories = require('../data');

class MangaService extends BaseService {
  constructor() {
    super(repositories.manga);
  }

  async getMangas(filters = {}, pagination = {}) {
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
      if (filters.author) {
        cleanFilters.author = this.sanitizeSearchTerm(filters.author);
      }
      if (filters.status && ['En cours', 'Terminé', 'Suspendu', 'Abandonné'].includes(filters.status)) {
        cleanFilters.status = filters.status;
      }
      if (filters.sort && ['titre', 'annee', 'moyenne_notes', 'nb_reviews', 'auteur'].includes(filters.sort)) {
        cleanFilters.sort = filters.sort;
      }
      if (filters.direction && ['ASC', 'DESC'].includes(filters.direction.toUpperCase())) {
        cleanFilters.direction = filters.direction.toUpperCase();
      }

      const mangas = await this.repository.findWithPagination(page, limit, cleanFilters);
      const totalCount = await this.repository.count({ statut: 1 });

      return {
        data: mangas,
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
      throw new Error(`Failed to fetch mangas: ${error.message}`);
    }
  }

  async getMangaById(id) {
    try {
      const manga = await this.repository.findById(id);
      if (!manga || manga.statut !== 1) {
        throw new Error('Manga not found');
      }

      // Get additional data
      const [relations, reviews] = await Promise.all([
        this.repository.findRelated(id),
        repositories.review.findByMediaId(id, 'manga', 5)
      ]);

      return {
        ...manga,
        relations,
        recentReviews: reviews
      };
    } catch (error) {
      throw new Error(`Failed to fetch manga: ${error.message}`);
    }
  }

  async getMangaByNiceUrl(niceUrl) {
    try {
      if (!niceUrl) {
        throw new Error('Nice URL is required');
      }

      const manga = await this.repository.findByNiceUrl(niceUrl);
      if (!manga) {
        throw new Error('Manga not found');
      }

      // Get additional data
      const [relations, reviews, rating] = await Promise.all([
        this.repository.findRelated(manga.id_manga),
        repositories.review.findByMediaId(manga.id_manga, 'manga', 5),
        repositories.review.getAverageRating(manga.id_manga, 'manga')
      ]);

      return {
        ...manga,
        relations,
        recentReviews: reviews,
        rating
      };
    } catch (error) {
      throw new Error(`Failed to fetch manga: ${error.message}`);
    }
  }

  async searchMangas(searchTerm, limit = 10) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new Error('Search term must be at least 2 characters');
      }

      const cleanSearchTerm = this.sanitizeSearchTerm(searchTerm);
      return await this.repository.searchByTitle(cleanSearchTerm, limit);
    } catch (error) {
      throw new Error(`Failed to search mangas: ${error.message}`);
    }
  }

  async getMangasByAuthor(author, limit = 10) {
    try {
      if (!author) {
        throw new Error('Author name is required');
      }

      const cleanAuthor = this.sanitizeSearchTerm(author);
      return await this.repository.findByAuthor(cleanAuthor, limit);
    } catch (error) {
      throw new Error(`Failed to fetch mangas by author: ${error.message}`);
    }
  }

  async getMangasByYear(year, limit = 20) {
    try {
      const yearNum = parseInt(year);
      if (!yearNum || yearNum < 1900 || yearNum > new Date().getFullYear() + 5) {
        throw new Error('Invalid year provided');
      }

      return await this.repository.findByYear(yearNum, limit);
    } catch (error) {
      throw new Error(`Failed to fetch mangas by year: ${error.message}`);
    }
  }

  async getMangasByTags(tagIds, limit = 20) {
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
      throw new Error(`Failed to fetch mangas by tags: ${error.message}`);
    }
  }

  async getMangaStatistics() {
    try {
      return await this.repository.getStatistics();
    } catch (error) {
      throw new Error(`Failed to fetch manga statistics: ${error.message}`);
    }
  }

  // Admin methods
  async createManga(mangaData) {
    try {
      this.validateMangaData(mangaData);
      
      // Generate nice_url if not provided
      if (!mangaData.nice_url && mangaData.titre) {
        mangaData.nice_url = this.generateNiceUrl(mangaData.titre);
      }

      mangaData.statut = 1; // Active by default
      return await this.repository.create(mangaData);
    } catch (error) {
      throw new Error(`Failed to create manga: ${error.message}`);
    }
  }

  async updateManga(id, mangaData) {
    try {
      this.validateMangaData(mangaData, false);
      
      // Generate nice_url if titre is being updated
      if (mangaData.titre && !mangaData.nice_url) {
        mangaData.nice_url = this.generateNiceUrl(mangaData.titre);
      }

      return await this.update(id, mangaData);
    } catch (error) {
      throw new Error(`Failed to update manga: ${error.message}`);
    }
  }

  async deleteManga(id) {
    try {
      // Soft delete by setting statut to 0
      return await this.update(id, { statut: 0 });
    } catch (error) {
      throw new Error(`Failed to delete manga: ${error.message}`);
    }
  }

  // Validation methods
  validateMangaData(data, isCreate = true) {
    if (isCreate) {
      if (!data.titre || data.titre.trim().length === 0) {
        throw new Error('Title is required');
      }
      if (!data.auteur || data.auteur.trim().length === 0) {
        throw new Error('Author is required');
      }
    }

    if (data.annee) {
      const year = parseInt(data.annee);
      if (!year || year < 1900 || year > new Date().getFullYear() + 5) {
        throw new Error('Invalid year provided');
      }
    }

    if (data.nb_volumes) {
      const volumes = parseInt(data.nb_volumes);
      if (!volumes || volumes < 1 || volumes > 1000) {
        throw new Error('Invalid number of volumes');
      }
    }

    if (data.titre && data.titre.length > 255) {
      throw new Error('Title is too long (max 255 characters)');
    }

    if (data.auteur && data.auteur.length > 255) {
      throw new Error('Author name is too long (max 255 characters)');
    }

    if (data.synopsis && data.synopsis.length > 5000) {
      throw new Error('Synopsis is too long (max 5000 characters)');
    }

    if (data.statut_publication && !['En cours', 'Terminé', 'Suspendu', 'Abandonné'].includes(data.statut_publication)) {
      throw new Error('Invalid publication status');
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

module.exports = MangaService;