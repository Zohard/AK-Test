const BaseController = require('./BaseController');
const services = require('../service');

class MangaController extends BaseController {
  constructor() {
    super(services.manga);
  }

  // GET /api/mangas
  getMangas = this.asyncHandler(async (req, res) => {
    try {
      const pagination = this.getPagination(req);
      const filters = this.getFilters(req, ['search', 'year', 'author', 'status']);
      const sorting = this.getSorting(req, ['titre', 'annee', 'moyenne_notes', 'nb_reviews', 'auteur']);

      const result = await this.service.getMangas(
        { ...filters, ...sorting },
        pagination
      );

      return this.success(res, result, 'Mangas retrieved successfully');
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // GET /api/mangas/:id
  getMangaById = this.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const manga = await this.service.getMangaById(parseInt(id));
      
      return this.success(res, manga, 'Manga retrieved successfully');
    } catch (error) {
      if (error.message.includes('not found')) {
        return this.notFound(res, error.message);
      }
      return this.error(res, error.message);
    }
  });

  // GET /api/mangas/by-url/:niceUrl
  getMangaByNiceUrl = this.asyncHandler(async (req, res) => {
    try {
      const { niceUrl } = req.params;
      const manga = await this.service.getMangaByNiceUrl(niceUrl);
      
      return this.success(res, manga, 'Manga retrieved successfully');
    } catch (error) {
      if (error.message.includes('not found')) {
        return this.notFound(res, error.message);
      }
      return this.error(res, error.message);
    }
  });

  // GET /api/mangas/search
  searchMangas = this.asyncHandler(async (req, res) => {
    try {
      const { q: searchTerm } = req.query;
      const limit = Math.min(parseInt(req.query.limit) || 10, 50);

      if (!searchTerm) {
        return this.validationError(res, ['Search term (q) is required']);
      }

      const mangas = await this.service.searchMangas(searchTerm, limit);
      
      return this.success(res, mangas, 'Search completed successfully');
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // GET /api/mangas/autocomplete
  autocompleteMangas = this.asyncHandler(async (req, res) => {
    try {
      const { q: searchTerm } = req.query;
      const limit = Math.min(parseInt(req.query.limit) || 10, 20);

      if (!searchTerm || searchTerm.length < 2) {
        return this.success(res, [], 'Search term too short');
      }

      const mangas = await this.service.searchMangas(searchTerm, limit);
      
      // Return minimal data for autocomplete
      const autocompleteData = mangas.map(manga => ({
        id: manga.id_manga,
        title: manga.titre,
        author: manga.auteur,
        url: manga.nice_url,
        year: manga.annee,
        image: manga.image
      }));

      return this.success(res, autocompleteData, 'Autocomplete data retrieved');
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // GET /api/mangas/by-author/:author
  getMangasByAuthor = this.asyncHandler(async (req, res) => {
    try {
      const { author } = req.params;
      const limit = Math.min(parseInt(req.query.limit) || 10, 50);

      const mangas = await this.service.getMangasByAuthor(author, limit);
      
      return this.success(res, mangas, `Mangas by author "${author}" retrieved`);
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // GET /api/mangas/by-year/:year
  getMangasByYear = this.asyncHandler(async (req, res) => {
    try {
      const { year } = req.params;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);

      const mangas = await this.service.getMangasByYear(year, limit);
      
      return this.success(res, mangas, `Mangas from year ${year} retrieved`);
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // GET /api/mangas/by-tags
  getMangasByTags = this.asyncHandler(async (req, res) => {
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

      const mangas = await this.service.getMangasByTags(tagIds, limit);
      
      return this.success(res, mangas, 'Mangas by tags retrieved');
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // GET /api/mangas/statistics
  getStatistics = this.asyncHandler(async (req, res) => {
    try {
      const stats = await this.service.getMangaStatistics();
      
      return this.success(res, stats, 'Manga statistics retrieved');
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // Admin endpoints
  // POST /api/admin/mangas
  createManga = this.asyncHandler(async (req, res) => {
    try {
      if (!this.isAdmin(req)) {
        return this.forbidden(res);
      }

      const requiredFields = ['titre', 'auteur'];
      const errors = this.validateRequired(req, requiredFields);
      if (errors.length > 0) {
        return this.validationError(res, errors);
      }

      const manga = await this.service.createManga(req.body);
      
      return this.success(res, manga, 'Manga created successfully', 201);
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // PUT /api/admin/mangas/:id
  updateManga = this.asyncHandler(async (req, res) => {
    try {
      if (!this.isAdmin(req)) {
        return this.forbidden(res);
      }

      const { id } = req.params;
      const manga = await this.service.updateManga(parseInt(id), req.body);
      
      return this.success(res, manga, 'Manga updated successfully');
    } catch (error) {
      if (error.message.includes('not found')) {
        return this.notFound(res, error.message);
      }
      return this.error(res, error.message);
    }
  });

  // DELETE /api/admin/mangas/:id
  deleteManga = this.asyncHandler(async (req, res) => {
    try {
      if (!this.isAdmin(req)) {
        return this.forbidden(res);
      }

      const { id } = req.params;
      await this.service.deleteManga(parseInt(id));
      
      return this.success(res, null, 'Manga deleted successfully');
    } catch (error) {
      if (error.message.includes('not found')) {
        return this.notFound(res, error.message);
      }
      return this.error(res, error.message);
    }
  });

  // GET /api/admin/mangas
  getMangasAdmin = this.asyncHandler(async (req, res) => {
    try {
      if (!this.isAdmin(req)) {
        return this.forbidden(res);
      }

      // Similar to getMangas but may include inactive mangas
      const pagination = this.getPagination(req);
      const filters = this.getFilters(req, ['search', 'year', 'author', 'status']);
      const sorting = this.getSorting(req, ['titre', 'annee', 'moyenne_notes', 'nb_reviews', 'auteur']);

      const result = await this.service.getMangas(
        { ...filters, ...sorting },
        pagination
      );

      return this.success(res, result, 'Mangas retrieved for admin');
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // GET /api/admin/mangas/search
  searchMangasAdmin = this.asyncHandler(async (req, res) => {
    try {
      if (!this.isAdmin(req)) {
        return this.forbidden(res);
      }

      const { q: searchTerm } = req.query;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);

      if (!searchTerm) {
        return this.validationError(res, ['Search term (q) is required']);
      }

      const mangas = await this.service.searchMangas(searchTerm, limit);
      
      return this.success(res, mangas, 'Admin search completed successfully');
    } catch (error) {
      return this.error(res, error.message);
    }
  });
}

module.exports = MangaController;