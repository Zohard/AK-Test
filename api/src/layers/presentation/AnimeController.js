const BaseController = require('./BaseController');
const services = require('../service');

class AnimeController extends BaseController {
  constructor() {
    super(services.anime);
  }

  // GET /api/animes
  getAnimes = this.asyncHandler(async (req, res) => {
    try {
      const pagination = this.getPagination(req);
      const filters = this.getFilters(req, ['search', 'year', 'studio']);
      const sorting = this.getSorting(req, ['titre', 'annee', 'moyenne_notes', 'nb_reviews']);

      const result = await this.service.getAnimes(
        { ...filters, ...sorting },
        pagination
      );

      return this.success(res, result, 'Animes retrieved successfully');
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // GET /api/animes/:id
  getAnimeById = this.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const anime = await this.service.getAnimeById(parseInt(id));
      
      return this.success(res, anime, 'Anime retrieved successfully');
    } catch (error) {
      if (error.message.includes('not found')) {
        return this.notFound(res, error.message);
      }
      return this.error(res, error.message);
    }
  });

  // GET /api/animes/by-url/:niceUrl
  getAnimeByNiceUrl = this.asyncHandler(async (req, res) => {
    try {
      const { niceUrl } = req.params;
      const anime = await this.service.getAnimeByNiceUrl(niceUrl);
      
      return this.success(res, anime, 'Anime retrieved successfully');
    } catch (error) {
      if (error.message.includes('not found')) {
        return this.notFound(res, error.message);
      }
      return this.error(res, error.message);
    }
  });

  // GET /api/animes/search
  searchAnimes = this.asyncHandler(async (req, res) => {
    try {
      const { q: searchTerm } = req.query;
      const limit = Math.min(parseInt(req.query.limit) || 10, 50);

      if (!searchTerm) {
        return this.validationError(res, ['Search term (q) is required']);
      }

      const animes = await this.service.searchAnimes(searchTerm, limit);
      
      return this.success(res, animes, 'Search completed successfully');
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // GET /api/animes/autocomplete
  autocompleteAnimes = this.asyncHandler(async (req, res) => {
    try {
      const { q: searchTerm } = req.query;
      const limit = Math.min(parseInt(req.query.limit) || 10, 20);

      if (!searchTerm || searchTerm.length < 2) {
        return this.success(res, [], 'Search term too short');
      }

      const animes = await this.service.searchAnimes(searchTerm, limit);
      
      // Return minimal data for autocomplete
      const autocompleteData = animes.map(anime => ({
        id: anime.id_anime,
        title: anime.titre,
        originalTitle: anime.titre_orig,
        url: anime.nice_url,
        year: anime.annee,
        image: anime.image
      }));

      return this.success(res, autocompleteData, 'Autocomplete data retrieved');
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // GET /api/animes/by-studio/:studio
  getAnimesByStudio = this.asyncHandler(async (req, res) => {
    try {
      const { studio } = req.params;
      const limit = Math.min(parseInt(req.query.limit) || 10, 50);

      const animes = await this.service.getAnimesByStudio(studio, limit);
      
      return this.success(res, animes, `Animes by studio "${studio}" retrieved`);
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // GET /api/animes/by-year/:year
  getAnimesByYear = this.asyncHandler(async (req, res) => {
    try {
      const { year } = req.params;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);

      const animes = await this.service.getAnimesByYear(year, limit);
      
      return this.success(res, animes, `Animes from year ${year} retrieved`);
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // GET /api/animes/by-tags
  getAnimesByTags = this.asyncHandler(async (req, res) => {
    try {
      const { tags } = req.query;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);

      if (!tags) {
        return this.validationError(res, ['Tags parameter is required']);
      }

      const tagIds = tags.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      
      if (tagIds.length === 0) {
        return this.validationError(res, ['Valid tag IDs are required']);
      }

      const animes = await this.service.getAnimesByTags(tagIds, limit);
      
      return this.success(res, animes, 'Animes by tags retrieved');
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // GET /api/animes/statistics
  getStatistics = this.asyncHandler(async (req, res) => {
    try {
      const stats = await this.service.getAnimeStatistics();
      
      return this.success(res, stats, 'Anime statistics retrieved');
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // Admin endpoints
  // POST /api/admin/animes
  createAnime = this.asyncHandler(async (req, res) => {
    try {
      if (!this.isAdmin(req)) {
        return this.forbidden(res);
      }

      const requiredFields = ['titre'];
      const errors = this.validateRequired(req, requiredFields);
      if (errors.length > 0) {
        return this.validationError(res, errors);
      }

      const anime = await this.service.createAnime(req.body);
      
      return this.success(res, anime, 'Anime created successfully', 201);
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // PUT /api/admin/animes/:id
  updateAnime = this.asyncHandler(async (req, res) => {
    try {
      if (!this.isAdmin(req)) {
        return this.forbidden(res);
      }

      const { id } = req.params;
      const anime = await this.service.updateAnime(parseInt(id), req.body);
      
      return this.success(res, anime, 'Anime updated successfully');
    } catch (error) {
      if (error.message.includes('not found')) {
        return this.notFound(res, error.message);
      }
      return this.error(res, error.message);
    }
  });

  // DELETE /api/admin/animes/:id
  deleteAnime = this.asyncHandler(async (req, res) => {
    try {
      if (!this.isAdmin(req)) {
        return this.forbidden(res);
      }

      const { id } = req.params;
      await this.service.deleteAnime(parseInt(id));
      
      return this.success(res, null, 'Anime deleted successfully');
    } catch (error) {
      if (error.message.includes('not found')) {
        return this.notFound(res, error.message);
      }
      return this.error(res, error.message);
    }
  });

  // GET /api/admin/animes
  getAnimesAdmin = this.asyncHandler(async (req, res) => {
    try {
      if (!this.isAdmin(req)) {
        return this.forbidden(res);
      }

      // Similar to getAnimes but may include inactive animes
      const pagination = this.getPagination(req);
      const filters = this.getFilters(req, ['search', 'year', 'studio', 'status']);
      const sorting = this.getSorting(req, ['titre', 'annee', 'moyenne_notes', 'nb_reviews']);

      const result = await this.service.getAnimes(
        { ...filters, ...sorting },
        pagination
      );

      return this.success(res, result, 'Animes retrieved for admin');
    } catch (error) {
      return this.error(res, error.message);
    }
  });
}

module.exports = AnimeController;